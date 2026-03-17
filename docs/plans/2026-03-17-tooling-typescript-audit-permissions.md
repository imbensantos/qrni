# Tooling, TypeScript, Audit Logging & Permissions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add ESLint/Prettier/git hooks, incrementally migrate to TypeScript, add audit logging, enforce role-based permissions, and document homograph protection.

**Architecture:** Five independent workstreams that can be parallelized in pairs. Tooling (Tasks 1-2) comes first since it establishes formatting standards. TypeScript migration (Tasks 3-8) builds on tooling. Backend features (Tasks 9-11) are independent of frontend work.

**Tech Stack:** ESLint 9 (flat config), Prettier, Husky, lint-staged, TypeScript 5, Convex

---

### Task 1: Set up Prettier + root ESLint

**Files:**
- Create: `.prettierrc`
- Create: `eslint.config.js` (root)
- Modify: `package.json` (add devDeps + scripts)
- Modify: `apps/app/eslint.config.js` (add TS support for later)

**Step 1: Install dependencies**

```bash
npm install -D prettier eslint prettier-plugin-organize-imports --workspace=.
```

**Step 2: Create root `.prettierrc`**

```json
{}
```

Prettier defaults: 2 spaces, double quotes, semicolons, 80 chars — no overrides needed.

**Step 3: Create root `eslint.config.js`**

```js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["**/dist", "**/node_modules", "convex/_generated"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
]);
```

**Step 4: Add scripts to root `package.json`**

```json
"scripts": {
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "lint": "eslint ."
}
```

**Step 5: Run Prettier across entire codebase**

```bash
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"
```

**Step 6: Verify ESLint passes**

```bash
npx eslint .
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Prettier + root ESLint, format entire codebase"
```

---

### Task 2: Set up Husky + lint-staged

**Files:**
- Modify: `package.json` (add devDeps + lint-staged config)
- Create: `.husky/pre-commit`

**Step 1: Install dependencies**

```bash
npm install -D husky lint-staged --workspace=.
```

**Step 2: Initialize Husky**

```bash
npx husky init
```

**Step 3: Configure pre-commit hook**

Write `.husky/pre-commit`:

```bash
npx lint-staged
```

**Step 4: Add lint-staged config to root `package.json`**

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,css,md}": ["prettier --write"]
}
```

**Step 5: Test the hook**

```bash
echo "const x = 1" > /tmp/test-lint.js
cp /tmp/test-lint.js apps/app/src/utils/test-lint.js
git add apps/app/src/utils/test-lint.js
git commit -m "test: verify pre-commit hook"
# Should see Prettier + ESLint run
git reset HEAD~1
rm apps/app/src/utils/test-lint.js
```

**Step 6: Commit**

```bash
git add package.json .husky/
git commit -m "chore: add Husky + lint-staged pre-commit hook"
```

---

### Task 3: Add TypeScript config to apps/app

**Files:**
- Create: `apps/app/tsconfig.json`
- Create: `apps/app/tsconfig.app.json`
- Modify: `apps/app/package.json` (add typescript devDep)
- Modify: `apps/app/eslint.config.js` (add TS ESLint support)

**Step 1: Install TypeScript**

```bash
npm install -D typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser --workspace=apps/app
```

**Step 2: Create `apps/app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Update ESLint config for TS support**

Update `apps/app/eslint.config.js` to include `**/*.{ts,tsx}` in files pattern and add `@typescript-eslint` plugin.

**Step 4: Verify build still works**

```bash
cd apps/app && npx vite build
```

**Step 5: Commit**

```bash
git add apps/app/tsconfig.json apps/app/package.json apps/app/eslint.config.js
git commit -m "chore: add TypeScript config with allowJs for incremental migration"
```

---

### Task 4: Migrate utils to TypeScript

**Files:**
- Rename: `apps/app/src/utils/bulk-utils.js` → `.ts`
- Rename: `apps/app/src/utils/bulk-export.js` → `.ts`
- Rename: `apps/app/src/utils/session-id.js` → `.ts`
- Rename: `apps/app/src/utils/ui-utils.js` → `.ts`
- Rename: `apps/app/src/utils/url-utils.js` → `.ts`
- Rename: `apps/app/src/utils/url-validation.js` → `.ts`
- Rename: `apps/app/src/utils/errors.js` → `.ts`
- Rename: `apps/app/src/utils/constants.js` → `.ts`
- Rename: `apps/app/src/utils/cached-user.js` → `.ts`

**Step 1: Rename all util files**

```bash
cd apps/app/src/utils
for f in *.js; do git mv "$f" "${f%.js}.ts"; done
```

**Step 2: Add types to each file**

For each file, add parameter types, return types, and interfaces. Key types to define:

```typescript
// url-utils.ts
export function getAppOrigin(): string { ... }
export function buildShortLinkUrl(slug: string, namespace?: string): string { ... }

// ui-utils.ts
export function formatDate(timestamp: number): string { ... }
export function formatDateShort(timestamp: number): string { ... }
export function formatMemberSince(timestamp: number): string { ... }
export function getColorFromHash(key: string | number, colors: string[]): string { ... }
export const NAMESPACE_COLORS: string[] = [...]
export const NAMESPACE_BG_COLORS: string[] = [...]

// session-id.ts
export function getSessionId(): string { ... }

// bulk-utils.ts
export interface BulkEntry { url: string; label: string; }
export function isValidUrl(url: string): boolean { ... }
export function sanitizeLabel(label: string): string { ... }
export function parseBulkInput(text: string): BulkEntry[] { ... }
// ... etc
```

**Step 3: Fix any import paths in consumers** (they may reference `.js`)

**Step 4: Verify build**

```bash
cd apps/app && npx vite build && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add apps/app/src/utils/
git commit -m "refactor: migrate utils to TypeScript"
```

---

### Task 5: Migrate hooks to TypeScript

**Files:**
- Rename: `apps/app/src/hooks/useClickOutside.js` → `.ts`
- Rename: `apps/app/src/hooks/useAuth.js` → `.ts`

**Step 1: Rename**

```bash
cd apps/app/src/hooks
for f in *.js; do git mv "$f" "${f%.js}.ts"; done
```

**Step 2: Add types**

```typescript
// useClickOutside.ts
import { useEffect, RefObject } from "react";
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  isOpen: boolean
): void { ... }
```

**Step 3: Verify build**

```bash
cd apps/app && npx vite build && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add apps/app/src/hooks/
git commit -m "refactor: migrate hooks to TypeScript"
```

---

### Task 6: Migrate shared components to TypeScript

**Files:**
- Rename all `.jsx` files in `apps/app/src/components/` (top-level only, not modals/ or profile/) to `.tsx`
- Files: `Icons.jsx`, `ErrorBoundary.jsx`, `ProfileDropdown.jsx`, `PreviewPanel.jsx`, `BulkPreview.jsx`, `BulkPanel.jsx`, `ControlsPanel.jsx`, `Doodles.jsx`

**Step 1: Rename**

```bash
cd apps/app/src/components
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
```

**Step 2: Add prop interfaces to each component**

Example pattern:

```typescript
// PreviewPanel.tsx
interface PreviewPanelProps {
  qrData: string;
  dotColor: string;
  bgColor: string;
  cornerColor: string;
  dotStyle: string;
  cornerDotStyle: string;
  cornerSquareStyle: string;
  logoFile: File | null;
}

export default function PreviewPanel({ qrData, dotColor, ... }: PreviewPanelProps) { ... }
```

**Step 3: Fix import paths in consumers**

**Step 4: Verify build**

```bash
cd apps/app && npx vite build && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add apps/app/src/components/*.tsx
git commit -m "refactor: migrate shared components to TypeScript"
```

---

### Task 7: Migrate profile components + modals to TypeScript

**Files:**
- Rename all `.jsx` in `apps/app/src/components/profile/` → `.tsx`
- Rename all `.jsx` in `apps/app/src/components/modals/` → `.tsx`

**Step 1: Rename profile components**

```bash
cd apps/app/src/components/profile
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
```

**Step 2: Rename modal components**

```bash
cd apps/app/src/components/modals
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
```

**Step 3: Add prop interfaces to all components**

Key interfaces:

```typescript
// ModalBackdrop.tsx
interface ModalBackdropProps {
  children: React.ReactNode;
  onClose: () => void;
  titleId?: string;
}

// AddLinkModal.tsx
interface AddLinkModalProps {
  onClose: () => void;
  namespaceId?: string;
  namespaceSlug?: string;
}

// CopyButton.tsx
interface CopyButtonProps {
  text: string;
}

// MyLinksSection.tsx — define the Link type
interface Link {
  _id: string;
  shortCode: string;
  destinationUrl: string;
  clickCount: number;
  createdAt: number;
  namespace?: string;
  namespaceSlug?: string;
  owner?: string;
}
```

**Step 4: Verify build**

```bash
cd apps/app && npx vite build && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add apps/app/src/components/profile/ apps/app/src/components/modals/
git commit -m "refactor: migrate profile + modal components to TypeScript"
```

---

### Task 8: Migrate pages + App + router to TypeScript

**Files:**
- Rename: `apps/app/src/pages/QRGeneratorPage.jsx` → `.tsx`
- Rename: `apps/app/src/pages/ProfilePage.jsx` → `.tsx`
- Rename: `apps/app/src/App.jsx` → `.tsx`
- Rename: `apps/app/src/main.jsx` → `.tsx`
- Rename: `apps/app/src/router.jsx` → `.tsx`
- Modify: `apps/app/index.html` (update script src from `main.jsx` to `main.tsx`)

**Step 1: Rename all page/app files**

```bash
cd apps/app/src
git mv App.jsx App.tsx
git mv main.jsx main.tsx
git mv router.jsx router.tsx
cd pages
for f in *.jsx; do git mv "$f" "${f%.jsx}.tsx"; done
```

**Step 2: Update `index.html` script src**

Change `<script type="module" src="/src/main.jsx">` to `src="/src/main.tsx"`.

**Step 3: Add types to pages and App**

**Step 4: Run full build + typecheck**

```bash
cd apps/app && npx vite build && npx tsc --noEmit
```

**Step 5: Verify no `.jsx` or `.js` files remain in `apps/app/src/`**

```bash
find apps/app/src -name "*.jsx" -o -name "*.js" | head -20
# Expected: empty
```

**Step 6: Commit**

```bash
git add apps/app/src/ apps/app/index.html
git commit -m "refactor: complete TypeScript migration for apps/app"
```

---

### Task 9: Add audit logging

**Files:**
- Modify: `convex/schema.ts` (add `audit_log` table)
- Create: `convex/lib/auditLog.ts` (helper function)
- Modify: `convex/links.ts` (add audit calls)
- Modify: `convex/namespaces.ts` (add audit calls)
- Modify: `convex/collaboration.ts` (add audit calls)
- Modify: `convex/users.ts` (add audit calls)

**Step 1: Add audit_log table to schema**

In `convex/schema.ts`, add:

```typescript
audit_log: defineTable({
  userId: v.id("users"),
  action: v.string(),
  resourceType: v.string(),
  resourceId: v.string(),
  metadata: v.optional(v.any()),
  timestamp: v.float64(),
})
  .index("by_user_timestamp", ["userId", "timestamp"])
  .index("by_resource", ["resourceType", "resourceId"]),
```

**Step 2: Create audit log helper**

Create `convex/lib/auditLog.ts`:

```typescript
import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function logAudit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }
) {
  await ctx.db.insert("audit_log", {
    userId: args.userId,
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    metadata: args.metadata,
    timestamp: Date.now(),
  });
}
```

**Step 3: Add audit calls to link mutations**

In `convex/links.ts`, after successful operations:
- `createCustomSlugLink`: `logAudit(ctx, { userId: user._id, action: "link.create", resourceType: "link", resourceId: linkId, metadata: { slug: args.customSlug } })`
- `createNamespacedLink`: `logAudit(ctx, { ..., action: "link.create", resourceId: linkId, metadata: { namespace: namespace.slug, slug: args.slug } })`
- `deleteLink`: `logAudit(ctx, { ..., action: "link.delete", resourceId: args.linkId })`
- `updateLink`: `logAudit(ctx, { ..., action: "link.update", resourceId: args.linkId, metadata: { updates } })`

**Step 4: Add audit calls to namespace mutations**

In `convex/namespaces.ts`:
- `create`: `logAudit(ctx, { ..., action: "namespace.create", resourceId: nsId, metadata: { slug } })`
- `update`: `logAudit(ctx, { ..., action: "namespace.update", resourceId: args.namespaceId, metadata: updates })`
- `remove`: `logAudit(ctx, { ..., action: "namespace.delete", resourceId: args.namespaceId })`

**Step 5: Add audit calls to collaboration mutations**

In `convex/collaboration.ts`:
- `createEmailInvite`: `logAudit(ctx, { ..., action: "member.invite", resourceType: "invite" })`
- `acceptInvite`: `logAudit(ctx, { ..., action: "member.invite", resourceType: "member" })`
- `revokeInvite`: `logAudit(ctx, { ..., action: "member.invite", resourceType: "invite" })`
- `removeMember`: `logAudit(ctx, { ..., action: "member.remove", resourceType: "member" })`

**Step 6: Add audit call to user mutations**

In `convex/users.ts`:
- `updateProfile`: `logAudit(ctx, { ..., action: "user.update", resourceType: "user" })`

**Step 7: Verify typecheck**

```bash
npx convex typecheck
```

**Step 8: Commit**

```bash
git add convex/
git commit -m "feat: add audit logging for all mutations"
```

---

### Task 10: Enforce role-based permissions

**Files:**
- Create: `convex/lib/permissions.ts` (helper)
- Modify: `convex/namespaces.ts` (enforce owner-only on edit/delete)
- Modify: `convex/collaboration.ts` (enforce owner-only on member management, editor+ on invites)
- Modify: `convex/links.ts` (enforce editor+ on link CRUD, viewer read-only)
- Modify: `convex/collaboration.ts` (add `transferOwnership` mutation)

**Step 1: Create permissions helper**

Create `convex/lib/permissions.ts`:

```typescript
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type Role = "owner" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export async function checkPermission(
  ctx: QueryCtx,
  namespaceId: Id<"namespaces">,
  userId: Id<"users">,
  requiredRole: Role
): Promise<{ role: Role; isOwner: boolean }> {
  const namespace = await ctx.db.get(namespaceId);
  if (!namespace) throw new Error("Namespace not found");

  if (namespace.owner === userId) {
    return { role: "owner", isOwner: true };
  }

  const membership = await ctx.db
    .query("namespace_members")
    .withIndex("by_namespace_user", (q) =>
      q.eq("namespace", namespaceId).eq("user", userId)
    )
    .first();

  if (!membership) throw new Error("Not a member of this namespace");

  const userRole: Role = membership.role as Role;
  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }

  return { role: userRole, isOwner: false };
}
```

**Step 2: Update namespace mutations**

In `convex/namespaces.ts`:
- `update`: Already checks `namespace.owner !== user._id` — replace with `checkPermission(ctx, args.namespaceId, user._id, "owner")`
- `remove`: Same — replace with `checkPermission(ctx, args.namespaceId, user._id, "owner")`

**Step 3: Update link mutations**

In `convex/links.ts`:
- `createNamespacedLink`: Already checks owner/editor — replace with `checkPermission(ctx, args.namespaceId, user._id, "editor")`
- `deleteLink`: If link has a namespace, check `checkPermission(ctx, link.namespace, user._id, "editor")`
- `updateLink`: Same as deleteLink
- `listNamespaceLinks`: Replace manual check with `checkPermission(ctx, args.namespaceId, user._id, "viewer")`

**Step 4: Update collaboration mutations**

In `convex/collaboration.ts`:
- `createEmailInvite`: Replace owner check with `checkPermission(ctx, args.namespaceId, user._id, "editor")`
- `createInviteLink`: Same — `checkPermission(ctx, args.namespaceId, user._id, "editor")`
- `revokeInvite`: Keep owner-only — `checkPermission(ctx, args.namespaceId, user._id, "owner")`
- `removeMember`: Keep owner-only — `checkPermission(ctx, args.namespaceId, user._id, "owner")`
- `listMembers`: Replace manual check with `checkPermission(ctx, args.namespaceId, user._id, "viewer")`
- `listInvites`: Same — `checkPermission(ctx, args.namespaceId, user._id, "viewer")`

**Step 5: Add `transferOwnership` mutation**

In `convex/collaboration.ts`:

```typescript
export const transferOwnership = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== userId) throw new Error("Only the owner can transfer ownership");

    if (args.newOwnerId === userId) throw new Error("You already own this namespace");

    // Verify target is an existing member
    const membership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", args.namespaceId).eq("user", args.newOwnerId)
      )
      .first();
    if (!membership) throw new Error("Target user must be a member of this namespace");

    // Transfer: set new owner on namespace
    await ctx.db.patch(args.namespaceId, { owner: args.newOwnerId });

    // Remove new owner from members table (owners aren't in members)
    await ctx.db.delete(membership._id);

    // Add old owner as editor member
    await ctx.db.insert("namespace_members", {
      namespace: args.namespaceId,
      user: userId,
      role: "editor",
      invitedBy: args.newOwnerId,
      joinedAt: Date.now(),
    });

    // Audit log
    await logAudit(ctx, {
      userId,
      action: "namespace.transfer",
      resourceType: "namespace",
      resourceId: args.namespaceId,
      metadata: { newOwner: args.newOwnerId },
    });
  },
});
```

**Step 6: Verify typecheck**

```bash
npx convex typecheck
```

**Step 7: Commit**

```bash
git add convex/
git commit -m "feat: enforce role-based permissions with ownership transfer"
```

---

### Task 11: Document homograph protection

**Files:**
- Modify: `convex/lib/shortCode.ts`

**Step 1: Add comments**

```typescript
/**
 * Validates namespace slugs.
 * ASCII-only regex [a-z0-9-] intentionally prevents Unicode homograph attacks
 * (e.g., Cyrillic 'а' vs Latin 'a'). Do not expand to allow Unicode without
 * adding confusable character detection.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(slug);
}

/**
 * Validates custom link slugs.
 * ASCII-only regex [a-zA-Z0-9_-] intentionally prevents Unicode homograph
 * attacks. See isValidSlug comment above.
 */
export function isValidCustomSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{1,60}$/.test(slug);
}
```

**Step 2: Commit**

```bash
git add convex/lib/shortCode.ts
git commit -m "docs: document homograph protection in slug validators"
```

---

## Dependency Graph

```
Task 1 (Prettier + ESLint) → Task 2 (Husky) → Task 3 (TS config)
Task 3 → Task 4 (utils) → Task 5 (hooks) → Task 6 (components) → Task 7 (modals) → Task 8 (pages)
Task 9 (audit log) — independent, can run in parallel with Tasks 1-8
Task 10 (permissions) — depends on Task 9 (uses logAudit)
Task 11 (homograph comment) — independent, can run anytime
```
