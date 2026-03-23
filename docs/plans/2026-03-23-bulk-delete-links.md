# Bulk Delete Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to select multiple links and delete them in a single action, in both MyLinksSection and AllNamespaceLinksView.

**Architecture:** New `deleteLinks` batch mutation in Convex with all-or-nothing semantics. Selection mode toggled by a button in each section component, managed via local `useState<Set>`. New `BulkDeleteLinksModal` based on existing `DeleteLinkConfirmModal`.

**Tech Stack:** Convex mutations, React, CSS

**Design doc:** `docs/plans/2026-03-23-bulk-delete-design.md`

---

### Task 1: Add `deleteLinks` batch mutation

**Files:**

- Modify: `convex/links.ts:371-404` (add after existing `deleteLink`)

**Step 1: Add the `deleteLinks` mutation after the existing `deleteLink` (line 404)**

```typescript
export const deleteLinks = mutation({
  args: { linkIds: v.array(v.id("links")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    // Fetch all links and check permissions before deleting any
    const links = await Promise.all(
      args.linkIds.map(async (linkId) => {
        const link = await ctx.db.get(linkId);
        if (!link) throw new Error(`Link not found: ${String(linkId)}`);

        if (link.owner !== user._id) {
          if (link.namespace) {
            try {
              await checkPermission(ctx, link.namespace, user._id, "editor");
            } catch {
              const slug = link.namespaceSlug ? `${link.namespaceSlug}` : link.shortCode;
              throw new Error(`Permission denied for link: ${slug}`);
            }
          } else {
            throw new Error(`Permission denied for link: ${link.shortCode}`);
          }
        }
        return { linkId, link };
      }),
    );

    // All checks passed — delete all links and log audit entries
    for (const { linkId } of links) {
      await ctx.db.delete(linkId);
      await logAudit(ctx, {
        userId: user._id,
        action: "link.delete",
        resourceType: "link",
        resourceId: String(linkId),
      });
    }
  },
});
```

**Step 2: Verify Convex types**

Run: `npx convex dev --once` or check that `api.links.deleteLinks` is generated.

**Step 3: Commit**

```bash
git add convex/links.ts
git commit -m "feat: add deleteLinks batch mutation"
```

---

### Task 2: Add bulk delete modal state to `useProfileModals`

**Files:**

- Modify: `apps/app/src/hooks/useProfileModals.ts`

**Step 1: Add the interface after `DeleteLinkModalState` (line 20)**

```typescript
export interface BulkDeleteLinksModalState {
  open: boolean;
  links: ShortLink[];
}
```

**Step 2: Add state declaration after `deleteLinkModal` (line 66)**

```typescript
const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState<BulkDeleteLinksModalState>({
  open: false,
  links: [],
});
```

**Step 3: Add handler functions after `closeDeleteLink` (line 108)**

```typescript
const openBulkDeleteLinks = (links: ShortLink[]) => setBulkDeleteLinksModal({ open: true, links });

const closeBulkDeleteLinks = () => setBulkDeleteLinksModal({ open: false, links: [] });
```

**Step 4: Add to return object**

In the States section (after line 159 `deleteLinkModal,`):

```typescript
bulkDeleteLinksModal,
```

In the Handlers section (after line 174 `closeDeleteLink,`):

```typescript
openBulkDeleteLinks,
closeBulkDeleteLinks,
```

**Step 5: Commit**

```bash
git add apps/app/src/hooks/useProfileModals.ts
git commit -m "feat: add bulk delete modal state to useProfileModals"
```

---

### Task 3: Create `BulkDeleteLinksModal` component

**Files:**

- Create: `apps/app/src/components/profile/modals/links/BulkDeleteLinksModal.tsx`
- Create: `apps/app/src/components/profile/modals/links/BulkDeleteLinksModal.css`

**Step 1: Create the modal component**

Base it on `DeleteLinkConfirmModal.tsx` (same directory). Key differences:

- Props accept `links: Link[]` instead of `link: Link | null`
- Uses `useMutation(api.links.deleteLinks)` with `{ linkIds: links.map(l => l._id) }`
- Title: `Delete ${links.length} link${links.length > 1 ? "s" : ""}?`
- Body: scrollable list of short URLs being deleted (max-height ~200px)
- Warning: "This action is permanent. Anyone with these links will get a 404."
- Confirm button: `Delete ${links.length} link${links.length > 1 ? "s" : ""}`
- `onClose` does NOT call `onExitSelectionMode` — preserves selections
- `onSuccess` callback for the parent to exit selection mode after successful delete

```typescript
// BulkDeleteLinksModal.tsx
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconTrash } from "../../../common/Icons";
import { buildShortLinkUrl } from "../../../../utils/url-utils";
import { Doc } from "../../../../../../../convex/_generated/dataModel";
import "./BulkDeleteLinksModal.css";

type Link = Doc<"links">;

interface BulkDeleteLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  links: Link[];
}

function BulkDeleteLinksModal({ isOpen, onClose, onSuccess, links }: BulkDeleteLinksModalProps) {
  const { trigger } = useWebHaptics();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const deleteLinks = useMutation(api.links.deleteLinks);

  if (links.length === 0) return null;

  const count = links.length;
  const plural = count > 1 ? "s" : "";

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteLinks({ linkIds: links.map((l) => l._id) });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "Failed to delete links");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="bulk-delete-modal-title">
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <IconTrash size={28} />
        </div>

        <div className="delete-modal-body">
          <h2 id="bulk-delete-modal-title" className="delete-modal-title">
            Delete {count} link{plural}?
          </h2>

          <p className="delete-modal-warning">
            This action is permanent. Anyone with these links will get a 404.
          </p>
        </div>

        <div className="bulk-delete-link-list">
          {links.map((link) => (
            <div key={String(link._id)} className="bulk-delete-link-item">
              <span className="bulk-delete-link-short">
                {buildShortLinkUrl(link.shortCode, link.namespaceSlug)}
              </span>
              <span className="bulk-delete-link-dest">{link.destinationUrl}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="delete-modal-error" role="alert">
            {error}
          </div>
        )}

        <div className="delete-modal-actions">
          <button
            className="delete-modal-cancel"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="delete-modal-confirm"
            onClick={() => {
              trigger("nudge");
              handleDelete();
            }}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : `Delete ${count} link${plural}`}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default BulkDeleteLinksModal;
```

**Step 2: Create the CSS file**

Reuse existing `delete-modal` classes. Only add styles for the scrollable link list:

```css
/* BulkDeleteLinksModal.css */
.bulk-delete-link-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-muted);
  margin-bottom: 12px;
}

.bulk-delete-link-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

.bulk-delete-link-item:last-child {
  border-bottom: none;
}

.bulk-delete-link-short {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.bulk-delete-link-dest {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Step 3: Commit**

```bash
git add apps/app/src/components/profile/modals/links/BulkDeleteLinksModal.tsx \
      apps/app/src/components/profile/modals/links/BulkDeleteLinksModal.css
git commit -m "feat: add BulkDeleteLinksModal component"
```

---

### Task 4: Wire up bulk delete modal in ProfilePage

**Files:**

- Modify: `apps/app/src/pages/profile/ProfilePage.tsx`

**Step 1: Import the new modal**

Add alongside the existing `DeleteLinkConfirmModal` import:

```typescript
import BulkDeleteLinksModal from "../../components/profile/modals/links/BulkDeleteLinksModal";
```

**Step 2: Render the modal alongside the existing `DeleteLinkConfirmModal`**

```typescript
<BulkDeleteLinksModal
  isOpen={modals.bulkDeleteLinksModal.open}
  onClose={modals.closeBulkDeleteLinks}
  onSuccess={modals.closeBulkDeleteLinks}
  links={modals.bulkDeleteLinksModal.links}
/>
```

**Step 3: Add `onBulkDelete` to `modalHandlers` object**

```typescript
onBulkDelete: modals.openBulkDeleteLinks,
```

**Step 4: Pass `onBulkDelete` to `MyLinksSection` and `AllNamespaceLinksView`**

```typescript
<MyLinksSection
  ...existing props...
  onBulkDelete={modalHandlers.onBulkDelete}
/>

<AllNamespaceLinksView
  ...existing props...
  onBulkDelete={modalHandlers.onBulkDelete}
/>
```

**Step 5: Commit**

```bash
git add apps/app/src/pages/profile/ProfilePage.tsx
git commit -m "feat: wire up BulkDeleteLinksModal in ProfilePage"
```

---

### Task 5: Add selection mode to MyLinksSection

**Files:**

- Modify: `apps/app/src/components/profile/MyLinksSection.tsx`
- Modify: CSS file for MyLinksSection (or ProfilePage.css — check where styles live)

**Step 1: Add new prop and state**

Add `onBulkDelete` to props interface:

```typescript
onBulkDelete: (links: Link[]) => void;
```

Add selection state inside the component:

```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

Add toggle helpers:

```typescript
const toggleSelect = (id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const toggleSelectAll = () => {
  if (selectedIds.size === personalLinks.length) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(personalLinks.map((l) => String(l._id))));
  }
};

const exitSelectionMode = () => {
  setSelectionMode(false);
  setSelectedIds(new Set());
};

const handleBulkDelete = () => {
  const selected = personalLinks.filter((l) => selectedIds.has(String(l._id)));
  onBulkDelete(selected);
};
```

**Step 2: Add "Select" / "Cancel" toggle button in the section header**

Near the existing add button, add:

```typescript
{personalLinks.length > 0 && (
  <button
    className="pp-icon-btn"
    onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
    title={selectionMode ? "Cancel selection" : "Select links"}
  >
    {selectionMode ? "Cancel" : "Select"}
  </button>
)}
```

**Step 3: Add "Select all" checkbox and bulk action toolbar**

When `selectionMode` is true and links exist, render above the link list:

```typescript
{selectionMode && (
  <div className="bulk-toolbar">
    <label className="bulk-select-all">
      <input
        type="checkbox"
        checked={selectedIds.size === personalLinks.length && personalLinks.length > 0}
        onChange={toggleSelectAll}
      />
      Select all
    </label>
    {selectedIds.size > 0 && (
      <>
        <span className="bulk-count">{selectedIds.size} selected</span>
        <button className="bulk-delete-btn" onClick={handleBulkDelete}>
          Delete
        </button>
      </>
    )}
  </div>
)}
```

**Step 4: Add checkboxes to each link row**

Inside the link row map, prepend a checkbox when in selection mode:

```typescript
{selectionMode && (
  <input
    type="checkbox"
    className="link-select-checkbox"
    checked={selectedIds.has(String(link._id))}
    onChange={() => toggleSelect(String(link._id))}
  />
)}
```

**Step 5: Add CSS for bulk toolbar and checkboxes**

```css
.bulk-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  font-size: 13px;
}

.bulk-select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 500;
}

.bulk-count {
  color: var(--text-muted);
  font-size: 12px;
}

.bulk-delete-btn {
  margin-left: auto;
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--danger, #d64545);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.bulk-delete-btn:hover {
  opacity: 0.85;
}

.link-select-checkbox {
  accent-color: var(--accent-primary, #d89575);
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}
```

**Step 6: Commit**

```bash
git add apps/app/src/components/profile/MyLinksSection.tsx <css-file>
git commit -m "feat: add selection mode and bulk delete to MyLinksSection"
```

---

### Task 6: Add selection mode to AllNamespaceLinksView

**Files:**

- Modify: `apps/app/src/components/profile/AllNamespaceLinksView.tsx`

**Step 1: Add new prop and state**

Same pattern as Task 5 — add `onBulkDelete` prop, `selectionMode` state, `selectedIds` state, toggle helpers. Use the paginated `pageLinks` for "select all" scope (only visible page).

**Step 2: Add "Select" / "Cancel" button in the header action area**

Near the existing "Invite" and "Add link" buttons.

**Step 3: Add "Select all" checkbox + bulk toolbar above the table**

Same toolbar pattern as Task 5.

**Step 4: Add checkbox column to the table**

Add a `<th>` checkbox header for select-all and `<td>` checkbox in each row when in selection mode.

**Step 5: Add CSS (reuse classes from Task 5)**

The `.bulk-toolbar`, `.bulk-delete-btn`, `.link-select-checkbox` classes are shared.

**Step 6: Commit**

```bash
git add apps/app/src/components/profile/AllNamespaceLinksView.tsx
git commit -m "feat: add selection mode and bulk delete to AllNamespaceLinksView"
```

---

### Task 7: Integration testing and final verification

**Step 1: Type-check the full project**

Run: `npx tsc --noEmit --project apps/app/tsconfig.json`
Expected: no errors

**Step 2: Verify Convex generates correctly**

Run: `npx convex dev --once` (or equivalent check)
Expected: `api.links.deleteLinks` exists

**Step 3: Manual test checklist**

- [ ] MyLinksSection: "Select" button appears, toggles selection mode
- [ ] Checkboxes appear on each link row in selection mode
- [ ] "Select all" selects/deselects all visible links
- [ ] Bulk toolbar shows count and "Delete" button
- [ ] "Cancel" exits selection mode and clears selections
- [ ] "Delete" opens BulkDeleteLinksModal with correct links listed
- [ ] Modal "Cancel" preserves selections
- [ ] Modal "Delete N links" calls mutation and clears on success
- [ ] Same flow works in AllNamespaceLinksView
- [ ] Error message shows which link caused a failure

**Step 4: Commit any fixes**

```bash
git commit -m "fix: address integration issues in bulk delete"
```
