# Remove Member / Leave Namespace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Allow namespace owners to remove members via the UI, and allow members to leave namespaces on their own.

**Architecture:** Extend the existing `removeMember` mutation to support self-removal (if the caller is the member being removed, skip the owner check). Add a "Leave namespace" option in the kebab menu for non-owner members, and wire the existing remove button in `InviteMemberModal` for owner-initiated removal. Both actions use a confirmation modal.

**Tech Stack:** Convex (backend mutations), React 19 + Vite 7 (frontend)

---

### Task 1: Backend — Allow self-removal in `removeMember`

**Files:**

- Modify: `convex/collaboration.ts:228-259` (the `removeMember` mutation)

**Step 1: Write the failing test**

Create a test file `convex/collaboration.test.ts` that tests the `removeMember` mutation logic. Since Convex mutations can't be unit-tested directly without a Convex test harness, extract the permission logic into a testable helper or test at the integration level. However, given the existing test patterns (mocked `ctx`), write a focused logic test:

The key behavioral change: if the caller's `userId` matches `membership.user`, allow the removal without owner permission.

Since we can't easily unit-test Convex mutations in isolation, the test should verify the behavior through the mutation by mocking the Convex context, following the pattern in `convex/lib/permissions.test.ts`.

Skip creating a separate test file for the mutation itself — this is a simple conditional change. Verify manually that:

- Owner can still remove any member (existing)
- Member can remove themselves (new)
- Non-owner cannot remove another member (existing guard still works)

**Step 2: Modify `removeMember` mutation**

In `convex/collaboration.ts`, replace the strict `checkPermission(ctx, args.namespaceId, user._id, "owner")` call with conditional logic:

```typescript
export const removeMember = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    membershipId: v.id("namespace_members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error(ERR.MEMBERSHIP_NOT_FOUND);
    if (membership.namespace !== args.namespaceId) throw new Error(ERR.MEMBERSHIP_NOT_IN_NAMESPACE);

    const isSelfRemoval = membership.user === user._id;

    if (!isSelfRemoval) {
      // Only owners can remove other members
      await checkPermission(ctx, args.namespaceId, user._id, "owner");
    }

    await ctx.db.delete(args.membershipId);

    await logAudit(ctx, {
      userId: user._id,
      action: isSelfRemoval ? "member.leave" : "member.remove",
      resourceType: "member",
      resourceId: String(args.membershipId),
      metadata: { namespace: String(args.namespaceId) },
    });
  },
});
```

Key changes:

- Fetch the membership **before** the permission check (moved up)
- Check if `membership.user === user._id` (self-removal)
- If self-removal: skip owner check
- Use `member.leave` audit action for self-removal, `member.remove` for owner kick

**Step 3: Commit**

```bash
git add convex/collaboration.ts
git commit -m "feat: allow members to leave namespaces via self-removal in removeMember"
```

---

### Task 2: Frontend — Wire remove button in InviteMemberModal (owner removes member)

**Files:**

- Modify: `apps/app/src/components/modals/InviteMemberModal.tsx`

**Step 1: Add the `removeMember` mutation hook and confirmation state**

In `InviteMemberModal.tsx`, add:

```typescript
const removeMember = useMutation(api.collaboration.removeMember);
const [confirmRemove, setConfirmRemove] = useState<{
  membershipId: Id<"namespace_members">;
  memberName: string;
} | null>(null);
```

Reset `confirmRemove` in the `useEffect` on `isOpen`.

**Step 2: Add `handleRemoveMember` function**

```typescript
async function handleRemoveMember(membershipId: Id<"namespace_members">) {
  if (!namespaceId) return;
  try {
    await removeMember({ namespaceId, membershipId });
    setConfirmRemove(null);
  } catch (err) {
    setError((err as Error).message || "Failed to remove member");
    setConfirmRemove(null);
  }
}
```

**Step 3: Wire the existing remove button's `onClick`**

Replace the existing button (lines 226-232) with:

```tsx
<button
  type="button"
  className="imm-revoke-btn"
  aria-label={`Remove ${member.user?.name || member.user?.email}`}
  onClick={() => {
    trigger("nudge");
    setConfirmRemove({
      membershipId: member._id,
      memberName: member.user?.name || member.user?.email || "this member",
    });
  }}
>
  <IconClose size={14} />
</button>
```

**Step 4: Add confirmation inline (below the members list)**

Add a simple confirmation UI when `confirmRemove` is set:

```tsx
{
  confirmRemove && (
    <div className="imm-confirm-remove">
      <p>
        Remove <strong>{confirmRemove.memberName}</strong> from this namespace?
      </p>
      <div className="imm-confirm-actions">
        <button type="button" className="imm-confirm-cancel" onClick={() => setConfirmRemove(null)}>
          Cancel
        </button>
        <button
          type="button"
          className="imm-confirm-remove-btn"
          onClick={() => handleRemoveMember(confirmRemove.membershipId)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
```

**Step 5: Add CSS for the confirmation UI**

In `apps/app/src/components/modals/InviteMemberModal.css`, add styles for `.imm-confirm-remove`, `.imm-confirm-actions`, `.imm-confirm-cancel`, and `.imm-confirm-remove-btn`. Follow the existing modal styling patterns (cream backgrounds, warm colors, Outfit font).

**Step 6: Commit**

```bash
git add apps/app/src/components/modals/InviteMemberModal.tsx apps/app/src/components/modals/InviteMemberModal.css
git commit -m "feat: wire remove member button with confirmation in InviteMemberModal"
```

---

### Task 3: Frontend — Add "Leave namespace" to kebab menu for non-owner members

**Files:**

- Modify: `apps/app/src/components/profile/NamespaceSection.tsx`
- Modify: `apps/app/src/pages/ProfilePage.tsx`
- Modify: `apps/app/src/hooks/useProfileModals.ts`

**Step 1: Add `onLeave` callback to `NamespaceSection`**

In `NamespaceSection.tsx`:

1. Add `onLeave: (namespaceId: Id<"namespaces">, namespaceName: string) => void` to `NamespaceSectionProps`.

2. Show the kebab menu for non-owners too. Change the kebab menu guard from `{isOwner && (` to always render, but with different items:
   - Owner: "Invite members", "Edit namespace", "Delete namespace" (existing)
   - Non-owner member: "Leave namespace" only

```tsx
{
  /* Kebab menu — available for all roles */
}
<div className="pp-kebab" ref={kebabRef}>
  <button
    className="pp-icon-btn"
    title="More options"
    onClick={() => {
      trigger(8);
      setKebabOpen((o) => !o);
    }}
  >
    <IconEllipsis size={16} />
  </button>
  {kebabOpen && (
    <div className="pp-kebab-menu">
      {isOwner ? (
        <>
          <button
            className="pp-kebab-item"
            onClick={() => {
              trigger("nudge");
              setKebabOpen(false);
              onInvite(namespace._id, namespace.slug);
            }}
          >
            <IconUserPlus size={16} /> Invite members
          </button>
          <div className="pp-kebab-divider" />
          <button
            className="pp-kebab-item"
            onClick={() => {
              trigger("nudge");
              handleEditNamespace();
            }}
          >
            <IconPencil size={16} /> Edit namespace
          </button>
          <div className="pp-kebab-divider" />
          <button
            className="pp-kebab-item pp-kebab-item--danger"
            onClick={() => {
              trigger("nudge");
              handleDeleteNamespace();
            }}
          >
            <IconTrash size={16} /> Delete namespace
          </button>
        </>
      ) : (
        <button
          className="pp-kebab-item pp-kebab-item--danger"
          onClick={() => {
            trigger("nudge");
            setKebabOpen(false);
            onLeave(namespace._id, namespace.slug);
          }}
        >
          <IconArrowRight size={16} /> Leave namespace
        </button>
      )}
    </div>
  )}
</div>;
```

Note: Reuse `IconArrowRight` (already imported) or use a door/exit icon. `IconArrowRight` works since it implies "going away."

**Step 2: Add leave modal state to `useProfileModals`**

In `apps/app/src/hooks/useProfileModals.ts`:

```typescript
export interface LeaveNsModalState {
  open: boolean;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | null;
}
```

Add state and handlers:

```typescript
const [leaveNsModal, setLeaveNsModal] = useState<LeaveNsModalState>({
  open: false,
  namespaceId: null,
  namespaceName: null,
});

const openLeaveNs = (nsId: Id<"namespaces">, nsName: string) =>
  setLeaveNsModal({ open: true, namespaceId: nsId, namespaceName: nsName });

const closeLeaveNs = () => setLeaveNsModal({ open: false, namespaceId: null, namespaceName: null });
```

Return `leaveNsModal`, `openLeaveNs`, `closeLeaveNs` from the hook.

**Step 3: Wire in ProfilePage**

In `apps/app/src/pages/ProfilePage.tsx`:

1. Add `onLeave: modals.openLeaveNs` to `modalHandlers`
2. Pass `onLeave` to each `NamespaceSection`
3. Render the `LeaveNamespaceModal` (created in Task 4)

**Step 4: Commit**

```bash
git add apps/app/src/components/profile/NamespaceSection.tsx apps/app/src/hooks/useProfileModals.ts apps/app/src/pages/ProfilePage.tsx
git commit -m "feat: add Leave namespace option in kebab menu for non-owner members"
```

---

### Task 4: Frontend — Create LeaveNamespaceModal confirmation

**Files:**

- Create: `apps/app/src/components/modals/LeaveNamespaceModal.tsx`
- Modify: `apps/app/src/pages/ProfilePage.tsx` (render the modal)

**Step 1: Check the existing `DeleteNamespaceModal` for the pattern**

Read `apps/app/src/components/modals/DeleteNamespaceModal.tsx` to follow the same pattern for the confirmation modal.

**Step 2: Create `LeaveNamespaceModal.tsx`**

Follow the `DeleteNamespaceModal` pattern. The modal should:

- Accept `isOpen`, `onClose`, `namespaceId`, `namespaceName` props
- Show a warning message: "You will lose access to all links in **{namespaceName}**. You'll need a new invite to rejoin."
- Have "Cancel" and "Leave namespace" buttons
- Call `removeMember` with the current user's membership ID
- To find the membership ID: query `listMembers`, find the entry where `member.user._id` matches the current user, use that `member._id`
- Close modal + show success on completion

```tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import ModalBackdrop from "./ModalBackdrop";
import { IconClose } from "../Icons";
import { Id } from "../../../../../convex/_generated/dataModel";

interface LeaveNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string;
}

export default function LeaveNamespaceModal({
  isOpen,
  onClose,
  namespaceId,
  namespaceName,
}: LeaveNamespaceModalProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState("");

  const members = useQuery(api.collaboration.listMembers, namespaceId ? { namespaceId } : "skip");
  const currentUser = useQuery(api.users.currentUser);
  const removeMember = useMutation(api.collaboration.removeMember);

  const myMembership = members?.find((m) => m.user?._id === currentUser?._id);

  async function handleLeave() {
    if (!namespaceId || !myMembership) return;
    setIsLeaving(true);
    setError("");
    try {
      await removeMember({ namespaceId, membershipId: myMembership._id });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to leave namespace");
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      {/* Modal content — follow DeleteNamespaceModal's structure and CSS classes */}
    </ModalBackdrop>
  );
}
```

**Step 3: Render in ProfilePage**

```tsx
<LeaveNamespaceModal
  isOpen={modals.leaveNsModal.open}
  onClose={modals.closeLeaveNs}
  namespaceId={modals.leaveNsModal.namespaceId}
  namespaceName={modals.leaveNsModal.namespaceName ?? ""}
/>
```

**Step 4: Commit**

```bash
git add apps/app/src/components/modals/LeaveNamespaceModal.tsx apps/app/src/pages/ProfilePage.tsx
git commit -m "feat: add LeaveNamespaceModal confirmation dialog"
```

---

### Task 5: Manual QA — Verify all flows

**Step 1: Test owner removes member**

- Open a namespace as owner
- Click "Invite members" in kebab menu
- Click X on a member row → confirmation appears
- Confirm → member is removed from list

**Step 2: Test member leaves namespace**

- Log in as a non-owner member
- See kebab menu on namespace card with "Leave namespace" option
- Click → confirmation modal appears
- Confirm → namespace disappears from profile

**Step 3: Test guards**

- Owner should NOT see "Leave namespace" in their kebab
- Non-owner should NOT see "Invite members", "Edit", or "Delete" in their kebab
- Non-owner should NOT see remove (X) buttons on other members in the invite modal

**Step 4: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: cleanup after remove member / leave namespace QA"
```
