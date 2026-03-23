# Bulk Delete Links — Design

## Overview

Add the ability to select and delete multiple links at once, in both MyLinksSection (personal links) and AllNamespaceLinksView (namespace links).

## Backend

### `deleteLinks` batch mutation (`convex/links.ts`)

- Accepts `{ linkIds: Id<"links">[] }`
- Iterates each link: fetches it, checks ownership or namespace editor permission (reusing existing `checkPermission` logic)
- If any link fails a permission check, throws with the offending link's short URL in the error message (e.g., "Permission denied for link: qrni.co/abc123")
- On success, deletes all links and logs an audit entry per link
- All-or-nothing: Convex transaction semantics mean if one fails, none are deleted

## UI

### Selection mode toggle

- A "Select" button appears at the top of both MyLinksSection and AllNamespaceLinksView
- Clicking it enters selection mode: checkboxes appear on each link row, "Select" button changes to "Cancel"
- A "Select all" checkbox appears in the toolbar header
- Selection state managed via `useState<Set<Id<"links">>>` in each section component

### Selection behavior

- Checkboxes toggle individual link IDs in/out of the set
- "Select all" toggles all visible links
- Clicking "Cancel" (selection mode toggle) exits selection mode and **clears all selections**
- Selections are preserved when the delete confirmation modal is dismissed via its own "Cancel" button

### Bulk action toolbar

- Appears when at least 1 link is selected
- Shows count: "{N} selected"
- Contains a destructive "Delete" button (red/terracotta styling)
- Clicking "Delete" opens the bulk delete confirmation modal

### Delete confirmation modal

- Reuses the same visual style as the existing `DeleteLinkConfirmModal`
- Title: "Delete {N} links?"
- Body lists the short URLs that will be deleted (scrollable if many)
- Warning: "This action is permanent. Anyone with these links will get a 404."
- "Cancel" button: closes modal, preserves selections (back to selection mode)
- "Delete {N} links" destructive button
- Loading state while mutation runs
- Error state shows which link caused the failure
- Successful delete exits selection mode and clears selections

## Files involved

- `convex/links.ts` — new `deleteLinks` mutation
- `apps/app/src/components/profile/MyLinksSection.tsx` — selection mode + bulk toolbar
- `apps/app/src/components/profile/AllNamespaceLinksView.tsx` — selection mode + bulk toolbar
- `apps/app/src/components/profile/modals/links/BulkDeleteLinksModal.tsx` — new modal
- `apps/app/src/hooks/useProfileModals.ts` — new modal state
- `apps/app/src/pages/profile/ProfilePage.tsx` — wire up new modal
- CSS files for selection mode styling and bulk toolbar
