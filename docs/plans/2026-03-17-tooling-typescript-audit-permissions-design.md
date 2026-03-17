# Tooling, TypeScript Migration, Audit Logging & Permissions Design

**Date:** 2026-03-17

## 1. ESLint + Prettier + Git Hooks

### Prettier

- Root-level `.prettierrc` with Prettier defaults (2 spaces, double quotes, semicolons)
- Shared across all workspaces
- One-time format commit across entire codebase before enabling hooks

### ESLint

- Extend existing `apps/app/eslint.config.js` to root level
- Add ESLint config to `apps/landing` workspace
- Add TypeScript ESLint support once TS migration begins

### Git Hooks (Husky + lint-staged)

- `husky` for pre-commit hook management
- `lint-staged` runs Prettier (write) + ESLint (fix) on staged files only
- Enforce `.ts`/`.tsx` extensions for new files in `apps/app/src/`

## 2. TypeScript Migration (Incremental)

### Strategy

- Add `tsconfig.json` to `apps/app` with `strict: true`, `allowJs: true`
- Migrate files in dependency order to minimize type errors at each step

### Migration Order

1. **Utils** (6 files) — `bulk-utils.js`, `bulk-export.js`, `session-id.js`, `ui-utils.js`, `url-utils.js`, `url-validation.js`
2. **Hooks** (1 file) — `useClickOutside.js`
3. **Components - shared** (7 files) — `Icons.jsx`, `ErrorBoundary.jsx`, `ProfileDropdown.jsx`, `PreviewPanel.jsx`, `BulkPreview.jsx`, `BulkPanel.jsx`, `ControlsPanel.jsx`
4. **Components - profile** (4 files) — `CopyButton.jsx`, `MyLinksSection.jsx`, `AllNamespaceLinksView.jsx`, `NamespaceSection.jsx`
5. **Components - modals** (8 files) — All modal components
6. **Pages + App** (3 files) — `QRGeneratorPage.jsx`, `ProfilePage.jsx`, `App.jsx`

### Per-File Process

- Rename `.js`/`.jsx` → `.ts`/`.tsx`
- Add prop interfaces/types
- Add return types to functions
- Fix any type errors that surface

## 3. Audit Logging

### Schema

```
audit_log {
  userId: v.id("users"),
  action: v.string(),        // e.g. "link.create", "namespace.delete"
  resourceType: v.string(),  // "link", "namespace", "member", "invite"
  resourceId: v.string(),    // ID of affected resource
  metadata: v.optional(v.any()),  // extra context (old values, etc.)
  timestamp: v.float64()
}
```

### Actions Tracked

- `link.create`, `link.update`, `link.delete`
- `namespace.create`, `namespace.update`, `namespace.delete`, `namespace.transfer`
- `member.invite`, `member.remove`, `member.role_change`

### Implementation

- Helper: `logAudit(ctx, { action, resourceType, resourceId, metadata? })` inserts a row
- Called at end of each mutation after the primary operation succeeds
- No UI — queryable from Convex dashboard
- Index on `(userId, timestamp)` for efficient lookups

## 4. Permission Enforcement

### Permission Matrix

| Action               | Owner | Editor | Viewer |
| -------------------- | ----- | ------ | ------ |
| View links/members   | yes   | yes    | yes    |
| Create links         | yes   | yes    | no     |
| Edit/delete links    | yes   | yes    | no     |
| Invite members       | yes   | yes    | no     |
| Manage members/roles | yes   | no     | no     |
| Edit namespace       | yes   | no     | no     |
| Delete namespace     | yes   | no     | no     |
| Transfer ownership   | yes   | no     | no     |

### Implementation

- New helper: `checkPermission(ctx, namespaceId, requiredRole)` returns `{ role, isOwner }`
- Role hierarchy: owner > editor > viewer
- Enforce on every namespace-scoped mutation
- New `transferOwnership` mutation: owner-only, target must be existing member, swaps roles

### Transfer Ownership Flow

1. Owner calls `transferOwnership(namespaceId, targetUserId)`
2. Validate target is an existing member
3. Set target as new owner, demote current owner to editor
4. Log audit event

## 5. Homograph Protection

- Add comments to `isValidSlug` and `isValidCustomSlug` in `convex/lib/shortCode.ts` documenting that the ASCII-only regex `[a-zA-Z0-9_-]` intentionally prevents Unicode homograph attacks
