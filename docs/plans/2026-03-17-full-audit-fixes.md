# Full Codebase Audit Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix all security, performance, code quality, and test coverage issues found in the full codebase audit.

**Architecture:** Backend-first security/perf fixes, then frontend fixes, then tests, then cleanup. Each task is atomic and independently committable.

**Tech Stack:** Convex (backend), React 19 + Vite 7 (frontend), Vitest (unit tests), Playwright (e2e)

---

### Task 1: Fix permission error messages to prevent enumeration

**Files:**

- Modify: `convex/lib/permissions.ts:19,32,36`
- Modify: `convex/lib/constants.ts` (add new error constant)
- Test: `convex/lib/permissions.test.ts` (create)

**Step 1: Write the failing test**

Create `convex/lib/permissions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// We can't easily unit-test Convex server functions without the Convex test
// harness, but we CAN verify the error messages are generic by importing
// the constants and checking the permissions module behavior contract.
// For now, test that the ERR constants used in permissions are generic.

import { ERR } from "./constants";

describe("permission error messages", () => {
  it("should use a generic NOT_AUTHORIZED message", () => {
    // The key point: error messages must NOT leak namespace existence
    expect(ERR.NOT_AUTHORIZED).toBe("Not authorized");
    // These messages should NOT contain "namespace" or "member"
    expect(ERR.NOT_AUTHORIZED.toLowerCase()).not.toContain("namespace");
    expect(ERR.NOT_AUTHORIZED.toLowerCase()).not.toContain("member");
  });
});
```

**Step 2: Fix permissions.ts to use generic errors**

In `convex/lib/permissions.ts`, replace all three specific error messages with `ERR.NOT_AUTHORIZED`:

```typescript
import { ERR } from "./constants";

// Line 19: "Namespace not found" → ERR.NOT_AUTHORIZED
if (!namespace) throw new Error(ERR.NOT_AUTHORIZED);

// Line 32: "Not a member of this namespace" → ERR.NOT_AUTHORIZED
if (!membership) throw new Error(ERR.NOT_AUTHORIZED);

// Line 36: `Requires ${requiredRole} role or higher` → ERR.NOT_AUTHORIZED
throw new Error(ERR.NOT_AUTHORIZED);
```

**Step 3: Run tests**

Run: `npm run test:convex`

**Step 4: Commit**

```bash
git add convex/lib/permissions.ts convex/lib/permissions.test.ts
git commit -m "fix: use generic error messages in permission checks to prevent enumeration"
```

---

### Task 2: Remove creatorIp from public action, sanitize HTTP errors

**Files:**

- Modify: `convex/links.ts:66-79` (remove creatorIp from action args)
- Modify: `convex/http.ts:77-82` (sanitize error messages)

**Step 1: Remove creatorIp from createAnonymousLink action**

The `createAnonymousLink` action (line 66-79) accepts `creatorIp` as a client parameter, but it should only be called from the HTTP handler which extracts IP server-side. The action is still useful as a wrapper for Safe Browsing, but `creatorIp` should not be in its public args.

However — looking at the code, `createAnonymousLink` is called from the frontend via `useAction` in `ControlsPanel.tsx:127-129`, passing `getSessionId()` as `creatorIp`. The HTTP handler at `http.ts:69-72` calls the internal mutation directly, not the action.

The frontend uses the action for authenticated-like anonymous link creation. The `creatorIp` here is actually a session ID, not a real IP — it's used for dedup/rate-limiting of unauthenticated users. The HTTP handler extracts real IP for server-side calls.

**Fix:** Rename the parameter to `sessionId` to clarify it's NOT a real IP, and add a comment. The HTTP handler already bypasses this action entirely.

In `convex/links.ts`:

```typescript
export const createAnonymousLink = action({
  args: {
    destinationUrl: v.string(),
    sessionId: v.string(), // Client-generated session ID for dedup/rate-limiting
  },
  handler: async (ctx, args): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);
    return await ctx.runMutation(internal.links.createAnonymousLinkInternal, {
      destinationUrl: args.destinationUrl,
      creatorIp: args.sessionId,
    });
  },
});
```

Update `ControlsPanel.tsx:127-129`:

```typescript
res = await createAnonymousLink({
  destinationUrl: targetUrl,
  sessionId: getSessionId(),
});
```

**Step 2: Sanitize HTTP error responses**

In `convex/http.ts:77-82`, replace raw error message with a generic message in production:

```typescript
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error";
  // Only expose known application errors; hide internal details
  const safeMessages = [
    ERR.ANONYMOUS_RATE_LIMITED,
    ERR.INVALID_URL,
    ERR.URL_TOO_LONG,
    ERR.UNSAFE_URL,
  ];
  const safeMessage = safeMessages.includes(message) ? message : "Something went wrong";
  return new Response(JSON.stringify({ error: safeMessage }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

Add import for ERR at top of http.ts.

**Step 3: Run tests**

Run: `npm run test`

**Step 4: Commit**

```bash
git add convex/links.ts convex/http.ts apps/app/src/components/ControlsPanel.tsx
git commit -m "fix: rename creatorIp to sessionId and sanitize HTTP error responses"
```

---

### Task 3: Optimize custom link limit check (eliminate .collect())

**Files:**

- Modify: `convex/links.ts:172-179, 467-474`
- Modify: `convex/schema.ts` (add composite index)

**Step 1: Add a composite index for efficient counting**

The current code loads ALL user links then filters in-memory. Instead, we can count using the existing `by_owner` index and filter server-side. Convex doesn't support `count()` natively, but we can use a more targeted approach.

Actually, Convex `filter()` after `withIndex` still scans, so the best approach is to extract the counting into a helper that uses `.take(MAX + 1)` with a filter, rather than `.collect()`.

In `convex/links.ts`, extract a helper and use it in both places:

```typescript
/** Count custom (non-auto, non-namespaced) links for a user, up to limit. */
async function countCustomLinks(
  ctx: { db: MutationCtx["db"] },
  userId: Id<"users">,
): Promise<number> {
  // Only need to know if count >= MAX, so take MAX + 1 at most
  const links = await ctx.db
    .query("links")
    .withIndex("by_owner", (q) => q.eq("owner", userId))
    .filter((q) =>
      q.and(
        q.eq(q.field("namespace"), undefined),
        q.or(q.eq(q.field("autoSlug"), undefined), q.eq(q.field("autoSlug"), false)),
      ),
    )
    .take(MAX_CUSTOM_LINKS_PER_USER + 1);
  return links.length;
}
```

Replace both `.collect()` + `.filter()` blocks (lines 172-179 and 467-474) with:

```typescript
const customCount = await countCustomLinks(ctx, user._id);
if (customCount >= MAX_CUSTOM_LINKS_PER_USER) {
  throw new Error(ERR.CUSTOM_LINK_LIMIT);
}
```

**Step 2: Run tests**

Run: `npm run test`

**Step 3: Commit**

```bash
git add convex/links.ts
git commit -m "perf: optimize custom link limit check to avoid loading all user links"
```

---

### Task 4: Guard localStorage access and extract constants

**Files:**

- Modify: `apps/app/src/pages/QRGeneratorPage.tsx:28-29`
- Modify: `apps/app/src/utils/constants.ts` (add MAX_CUSTOM_LINKS_PER_USER)
- Modify: `apps/app/src/components/profile/MyLinksSection.tsx:44`
- Modify: `apps/app/src/components/ControlsPanel.tsx:251`

**Step 1: Guard localStorage**

In `QRGeneratorPage.tsx:28-29`, wrap in try-catch:

```typescript
const [shortenLink, setShortenLink] = useState(() => {
  try {
    return localStorage.getItem("qrni-shorten-link") === "true";
  } catch {
    return false;
  }
});
```

Also guard the setter in line 88:

```typescript
onShortenLinkChange={(v) => {
  setShortenLink(v);
  try { localStorage.setItem("qrni-shorten-link", String(v)); } catch { /* private browsing */ }
}}
```

**Step 2: Extract magic number constant**

In `apps/app/src/utils/constants.ts`, add:

```typescript
/** Maximum custom (non-auto, non-namespaced) short links per user */
export const MAX_CUSTOM_LINKS = 5;
```

Then update `MyLinksSection.tsx:44`:

```typescript
import { MAX_CUSTOM_LINKS } from "../../utils/constants";
// ...
{customSlugCount} of {MAX_CUSTOM_LINKS} custom slugs used
```

And `ControlsPanel.tsx:251`:

```typescript
import { MAX_CUSTOM_LINKS } from "../utils/constants";
// ...
<span className="slug-counter">{flatCustomCount} of {MAX_CUSTOM_LINKS} used</span>
```

**Step 3: Run tests**

Run: `npm run test:app`

**Step 4: Commit**

```bash
git add apps/app/src/pages/QRGeneratorPage.tsx apps/app/src/utils/constants.ts apps/app/src/components/profile/MyLinksSection.tsx apps/app/src/components/ControlsPanel.tsx
git commit -m "fix: guard localStorage for private browsing and extract magic numbers to constants"
```

---

### Task 5: Use url-utils helpers in profile components (centralize domain)

**Files:**

- Modify: `apps/app/src/components/profile/MyLinksSection.tsx:77-78,86,97`
- Modify: `apps/app/src/components/profile/NamespaceSection.tsx:210`
- Modify: `apps/app/src/components/profile/AllNamespaceLinksView.tsx:99,106`
- Modify: `apps/app/src/components/modals/AddLinkModal.tsx:43-45`

**Step 1: Update MyLinksSection.tsx**

```typescript
import { getAppOrigin, buildShortLinkUrl } from "../../utils/url-utils";
// ...
// Line 77-78: replace window.location.host usage
const shortUrl = link.namespaceSlug
  ? buildShortLinkUrl(link.shortCode, link.namespaceSlug).replace(getAppOrigin() + "/", "")
  : `${window.location.host}/${link.shortCode}`;
```

Actually, simplify — the display shows host (no protocol), but links need full origin. Let's add a `getAppHost()` helper:

In `apps/app/src/utils/url-utils.ts`, add:

```typescript
export function getAppHost(): string {
  return window.location.host;
}
```

Then replace all `window.location.host` with `getAppHost()` and all `window.location.origin` with `getAppOrigin()` in the profile components.

**Step 2: Update AddLinkModal.tsx**

```typescript
import { getAppHost } from "../../utils/url-utils";
// Line 43-45:
const prefix = namespaceId ? `${getAppHost()}/${namespaceSlug}/` : `${getAppHost()}/`;
```

**Step 3: Update AllNamespaceLinksView.tsx and NamespaceSection.tsx similarly**

**Step 4: Run tests**

Run: `npm run test:app`

**Step 5: Commit**

```bash
git add apps/app/src/utils/url-utils.ts apps/app/src/components/profile/MyLinksSection.tsx apps/app/src/components/profile/NamespaceSection.tsx apps/app/src/components/profile/AllNamespaceLinksView.tsx apps/app/src/components/modals/AddLinkModal.tsx
git commit -m "refactor: centralize domain references through url-utils helpers"
```

---

### Task 6: Extract error categorization helper

**Files:**

- Modify: `apps/app/src/utils/errors.ts` (add categorizeConvexError)
- Modify: `apps/app/src/components/ControlsPanel.tsx:151-155` (use helper)
- Modify: `apps/app/src/components/modals/AddLinkModal.tsx:89-107` (use helper)
- Test: `apps/app/src/utils/errors.test.ts` (add tests)

**Step 1: Write failing test**

In `apps/app/src/utils/errors.test.ts`, add tests for the new function:

```typescript
describe("categorizeConvexError", () => {
  it("categorizes slug errors", () => {
    expect(categorizeConvexError("That short link name is already taken")).toBe("slug");
    expect(categorizeConvexError("You've reached the limit of 5 custom short links")).toBe("slug");
  });

  it("categorizes url errors", () => {
    expect(categorizeConvexError("URL must start with http://")).toBe("url");
    expect(categorizeConvexError("This URL was flagged as potentially harmful")).toBe("url");
  });

  it("defaults to slug for unknown errors", () => {
    expect(categorizeConvexError("Something went wrong")).toBe("slug");
  });
});
```

**Step 2: Implement categorizeConvexError**

In `apps/app/src/utils/errors.ts`:

```typescript
export type ErrorCategory = "slug" | "url";

export function categorizeConvexError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes("url") || lower.includes("destination") || lower.includes("harmful")) {
    return "url";
  }
  return "slug";
}
```

**Step 3: Update ControlsPanel.tsx and AddLinkModal.tsx to use it**

**Step 4: Run tests**

Run: `npm run test:app`

**Step 5: Commit**

```bash
git add apps/app/src/utils/errors.ts apps/app/src/utils/errors.test.ts apps/app/src/components/ControlsPanel.tsx apps/app/src/components/modals/AddLinkModal.tsx
git commit -m "refactor: extract error categorization into shared helper"
```

---

### Task 7: Remove dead CSS files and hardcoded colors in ErrorBoundary

**Files:**

- Delete: `apps/app/src/components/ShortenPanel.css`
- Delete: `apps/app/src/components/ShortenPreview.css`
- Modify: `apps/app/src/components/ErrorBoundary.tsx` (use CSS vars)

**Step 1: Delete unused CSS files**

Verified: no imports of `ShortenPanel.css` or `ShortenPreview.css` exist anywhere.

```bash
rm apps/app/src/components/ShortenPanel.css apps/app/src/components/ShortenPreview.css
```

**Step 2: Replace hardcoded colors in ErrorBoundary with CSS variables**

Replace inline style hex values with `var(--color-*)` references that match the design system.

Replace `#F5F4F1` → `var(--color-bg, #F5F4F1)`
Replace `#D89575` → `var(--color-accent, #D89575)`
Replace `#E8E5DF` → `var(--color-border, #E8E5DF)`
etc.

**Step 3: Run tests**

Run: `npm run test:app`

**Step 4: Commit**

```bash
git add -u apps/app/src/components/
git commit -m "cleanup: remove dead CSS files and use CSS variables in ErrorBoundary"
```

---

### Task 8: Add unit tests for convex/lib modules (permissions, auditLog, validation)

**Files:**

- Create: `convex/lib/permissions.test.ts`
- Create: `convex/lib/auditLog.test.ts`
- Modify: `convex/lib/validation.test.ts` (add sanitizeText tests for quotes)

**Step 1: Write tests for permissions module**

Already partially done in Task 1. Expand with error message contract tests.

**Step 2: Write tests for auditLog**

```typescript
import { describe, it, expect } from "vitest";

describe("auditLog", () => {
  it("exports logAudit function", async () => {
    const mod = await import("./auditLog");
    expect(typeof mod.logAudit).toBe("function");
  });
});
```

**Step 3: Expand validation tests**

Add tests for `sanitizeText` to verify it escapes angle brackets:

```typescript
describe("sanitizeText", () => {
  it("escapes angle brackets", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;",
    );
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("passes through safe text unchanged", () => {
    expect(sanitizeText("Hello World 123")).toBe("Hello World 123");
  });
});
```

**Step 4: Run tests**

Run: `npm run test:convex`

**Step 5: Commit**

```bash
git add convex/lib/permissions.test.ts convex/lib/auditLog.test.ts convex/lib/validation.test.ts
git commit -m "test: add unit tests for permissions, auditLog, and sanitizeText"
```

---

### Task 9: Add unit tests for frontend components — ErrorBoundary, modals, profile sections

**Files:**

- Modify: `apps/app/src/components/ErrorBoundary.test.tsx` (expand)
- Create: `apps/app/src/components/modals/AddLinkModal.test.tsx`
- Create: `apps/app/src/components/profile/MyLinksSection.test.tsx`
- Create: `apps/app/src/components/profile/CopyButton.test.tsx`

**Step 1: Write ErrorBoundary test for error rendering**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function ThrowingChild() {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("renders fallback UI when child throws", () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Try again")).toBeDefined();
    spy.mockRestore();
  });
});
```

**Step 2: Write MyLinksSection tests**

Test rendering with empty links, with links, click handlers.

**Step 3: Write CopyButton tests**

Test clipboard interaction with mocked navigator.clipboard.

**Step 4: Write AddLinkModal basic render tests**

Test modal opens/closes, form validation.

**Step 5: Run tests**

Run: `npm run test:app`

**Step 6: Commit**

```bash
git add apps/app/src/components/ErrorBoundary.test.tsx apps/app/src/components/modals/AddLinkModal.test.tsx apps/app/src/components/profile/MyLinksSection.test.tsx apps/app/src/components/profile/CopyButton.test.tsx
git commit -m "test: add unit tests for ErrorBoundary, AddLinkModal, MyLinksSection, CopyButton"
```

---

### Task 10: Add unit tests for url-utils, cached-user, session-id edge cases

**Files:**

- Modify: `apps/app/src/utils/url-utils.test.ts` (add tests for new helpers)
- Create: `apps/app/src/utils/cached-user.test.ts`

**Step 1: Write url-utils tests for getAppOrigin, getAppHost, buildShortLinkUrl**

```typescript
describe("getAppOrigin", () => {
  it("returns window.location.origin", () => {
    expect(getAppOrigin()).toBe(window.location.origin);
  });
});

describe("getAppHost", () => {
  it("returns window.location.host", () => {
    expect(getAppHost()).toBe(window.location.host);
  });
});

describe("buildShortLinkUrl", () => {
  it("builds URL without namespace", () => {
    expect(buildShortLinkUrl("abc123")).toContain("/abc123");
  });

  it("builds URL with namespace", () => {
    expect(buildShortLinkUrl("page", "myns")).toContain("/myns/page");
  });
});
```

**Step 2: Write cached-user tests**

Test get/set/clear with mocked sessionStorage, test behavior when storage throws.

**Step 3: Run tests**

Run: `npm run test:app`

**Step 4: Commit**

```bash
git add apps/app/src/utils/url-utils.test.ts apps/app/src/utils/cached-user.test.ts
git commit -m "test: add unit tests for url-utils and cached-user"
```

---

### Task 11: Add skip-to-main-content link for accessibility

**Files:**

- Modify: `apps/app/src/App.tsx` (add skip link)
- Modify: `apps/app/src/App.css` (add skip link styles)
- Modify: `apps/app/src/pages/QRGeneratorPage.tsx` (add id="main-content" to main)

**Step 1: Add skip link to App.tsx**

In `App.tsx`, inside the `<ErrorBoundary>`, before `<div className="app">`:

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

**Step 2: Add CSS**

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: #fff;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
```

**Step 3: Add id to main element**

In `QRGeneratorPage.tsx:39`:

```tsx
<main className="body" id="main-content">
```

**Step 4: Run tests**

Run: `npm run test:app`

**Step 5: Commit**

```bash
git add apps/app/src/App.tsx apps/app/src/App.css apps/app/src/pages/QRGeneratorPage.tsx
git commit -m "a11y: add skip-to-main-content link"
```

---

### Task 12: Add th scope attributes to table headers

**Files:**

- Modify: `apps/app/src/components/profile/AllNamespaceLinksView.tsx:86-89`

**Step 1: Add scope="col" to th elements**

```tsx
<thead>
  <tr>
    <th scope="col">Link</th>
    <th scope="col">Clicks</th>
    <th scope="col">Created</th>
    <th scope="col">Actions</th>
  </tr>
</thead>
```

**Step 2: Run tests**

Run: `npm run test:app`

**Step 3: Commit**

```bash
git add apps/app/src/components/profile/AllNamespaceLinksView.tsx
git commit -m "a11y: add scope attributes to table headers"
```

---

### Summary of changes by category

| Category      | Tasks      | Key Changes                                                                        |
| ------------- | ---------- | ---------------------------------------------------------------------------------- |
| Security      | 1, 2       | Generic permission errors, sanitized HTTP responses, renamed creatorIp             |
| Performance   | 3          | Eliminated .collect() in custom link limit check                                   |
| Code Quality  | 4, 5, 6, 7 | localStorage guard, centralized domain, extracted error helper, removed dead files |
| Testing       | 8, 9, 10   | Tests for permissions, validation, ErrorBoundary, modals, profile, url-utils       |
| Accessibility | 11, 12     | Skip link, table scope attributes                                                  |
