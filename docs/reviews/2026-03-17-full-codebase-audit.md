# Code Review: Full Codebase Audit

**Date:** 2026-03-17
**Scope:** All source files — apps/app (React frontend), convex (backend), config/infra
**Mode:** full

## Summary

The QRni codebase is functional but has significant DRY violations across the frontend (duplicated drag/color/logo/dot-style logic between ControlsPanel and BulkPanel), large SRP-violating components (ProfilePage manages 8 modals, ControlsPanel is 892 lines), security gaps in the backend (weak email validation, missing auth rate limits, cascade delete can timeout), and infrastructure issues (21 PNGs in git, hardcoded Convex deployment ID in vercel.json).

---

## Critical

- [ ] **Cascade delete can timeout/fail silently** — `convex/namespaces.ts:261-280` uses `.take(500)` without looping; namespaces with >500 links lose data silently. (Systems Thinking — incomplete operations)
- [ ] **Weak email validation** — `convex/collaboration.ts:12-14` only checks `email.includes("@") && email.includes(".")`. Accepts `@@.com`, `a@.com`. (Security — input validation)
- [ ] **getUserStats caps at 500 links** — `convex/users.ts:63-69` uses `.take(500)` for count; stats are silently wrong for power users. (Systems Thinking — data integrity)
- [ ] **Hardcoded Convex deployment ID in vercel.json** — `apps/app/vercel.json:9,13` has `keen-akita-913.convex.site` hardcoded. Breaks if deployment changes. (Practical Engineering — environment config)

## Important

### Backend

- [ ] **N+1 queries in listMembers** — `convex/collaboration.ts:261-278` loads each user with individual `.get()` calls. O(n) queries for n members. (Practical Engineering — performance)
- [ ] **N+1 queries in listMine** — `convex/namespaces.ts:236-241` same pattern for namespace lookups. (Practical Engineering — performance)
- [ ] **4 duplicate link creation functions** — `convex/links.ts:43-437` has near-identical duplicate guard, short code generation, and validation logic across `createAnonymousLink`, `createAutoSlugLink`, `createCustomSlugLink`, `createNamespacedLinkInternal`. (Foundational — DRY)
- [ ] **No rate limiting for authenticated users** — `convex/links.ts:45-72` only rate-limits anonymous links. Auth users can create unlimited links/hour. (Security — abuse prevention)
- [ ] **Rate limit records never cleaned up** — `convex/links.ts` rate_limits table grows indefinitely. (Practical Engineering — scalability)
- [ ] **Namespace rename is not atomic** — `convex/namespaces.ts:168-201` updates slug first, then loops over links. Partial failure leaves inconsistent state. (Systems Thinking — data consistency)
- [ ] **Editors can invite members** — `convex/collaboration.ts:29,81` only requires "editor" role. Should require "owner" for invite creation. (Security — least privilege)
- [ ] **Missing indexes** — `convex/schema.ts` lacks composite index on `rate_limits(ip, windowStart)` and `audit_log(timestamp)`. (Practical Engineering — performance)
- [ ] **Redundant data: shortCode vs namespaceSlug** — `convex/schema.ts:61-75` stores both computed and component slugs, risking inconsistency. (Design Principles — data modeling)

### Frontend

- [ ] **ProfilePage SRP violation** — `apps/app/src/pages/ProfilePage.tsx:65-370` manages 8 modal states + all rendering. Extract to `useProfileModals` hook. (SOLID — SRP)
- [ ] **ControlsPanel is 892 lines** — `apps/app/src/components/ControlsPanel.tsx` handles URL input, color picker, logo upload, dot style, short link creation, namespace dropdown, namespace creation form. (SOLID — SRP)
- [ ] **Duplicated drag-to-scroll logic** — `ControlsPanel.tsx:220-265` and `BulkPanel.tsx:60-95` have identical DragState + handlers. Extract `useDragScroll(ref)` hook. (Foundational — DRY)
- [ ] **Duplicated color picker UI** — `ControlsPanel.tsx:614-661` and `BulkPanel.tsx:281-328`. Extract `<ColorPicker>` component. (Foundational — DRY)
- [ ] **Duplicated logo upload logic** — `ControlsPanel.tsx:298-304` and `BulkPanel.tsx:140-146`. Extract `handleFileAsDataUrl()` util. (Foundational — DRY)
- [ ] **Duplicated dot style selector** — `ControlsPanel.tsx:773-805` and `BulkPanel.tsx:389-418`. Extract `<DotStyleSelector>`. (Foundational — DRY)
- [ ] **9 callback props on NamespaceSection** — `apps/app/src/components/profile/NamespaceSection.tsx:32-42`. Excessive prop drilling. (Design Principles — composition)
- [ ] **Race condition in short link creation** — `ControlsPanel.tsx:150-202` no cancellation on unmount. (Systems Thinking — race conditions)
- [ ] **allNamespaces recomputed every render** — `ControlsPanel.tsx:128-138` missing useMemo. (Practical Engineering — performance)
- [ ] **Silent clipboard failure** — `CopyButton.tsx:11-18` catches errors with no fallback or user feedback. (Systems Thinking — error handling)
- [ ] **Missing error handling in bulk export** — `BulkPreview.tsx:89-115` no error state shown to user on zip/pdf failure. (Systems Thinking — error handling)
- [ ] **Client-side pagination fetches all links** — `AllNamespaceLinksView.tsx:32-42` fetches all then slices. Should paginate on backend. (Practical Engineering — performance)

### Infrastructure

- [ ] **21 PNG screenshots committed to repo root** — ~1MB+ of screenshots in git history. Add `*.png` removal and ensure .gitignore covers them. (Practical Engineering — repo hygiene)
- [ ] **Hardcoded domain fallbacks** — `apps/landing/src/pages/index.astro:4` and `astro.config.mjs:4` hardcode `qrni.co`/`qrni.imbento.co`. Violates env/config principle. (Practical Engineering — config)
- [ ] **ESLint version mismatch** — Root has `@eslint/js@^10` but apps/app has `@eslint/js@^9`. (Practical Engineering — dependencies)

## Suggestions

- [ ] Extract magic numbers to constants file — limits (5 namespaces, 500 links, 10/hr rate limit, 7-day invite TTL) scattered across backend files
- [ ] Rename `dragState` ref to `dragStateRef` in ControlsPanel for clarity
- [ ] Extract scroll magic number `80` to constant in ControlsPanel:289
- [ ] Add loading skeleton instead of "Loading..." text in ProfilePage:109-115
- [ ] Standardize error message strings — create centralized error constants for backend
- [ ] Add `v.number()` consistently for timestamps — `audit_log` uses `v.float64()` while others use `v.number()`
- [ ] Consider soft deletes for links/namespaces — currently all hard deletes with no undo
- [ ] Add explicit Prettier rules in `.prettierrc` (currently empty `{}`)
- [ ] Add tsconfig.json and eslint config for apps/landing
- [ ] Consider idempotency tokens instead of 5-second duplicate window
- [ ] Add anonymous link expiration to prevent unbounded growth
- [ ] Centralize download filename constants ("qrni-code", "qrni-bulk")

## Coverage

- Clean Code: checked — naming inconsistencies (dragState, shortCode vs slug), magic numbers, long functions (ControlsPanel 892 lines, link creation 98 lines)
- SOLID: checked — SRP violations in ProfilePage (8 modals) and ControlsPanel (6+ responsibilities), excessive prop drilling in NamespaceSection
- Foundational: checked — major DRY violations (drag logic, color picker, logo upload, dot style selector all duplicated between ControlsPanel/BulkPanel), 4 duplicate link creation functions in backend
- Design Principles: checked — prop drilling, missing modal abstraction, redundant data modeling (shortCode + namespaceSlug), client-side pagination anti-pattern
- Systems Thinking: checked — race conditions (unmount during async), cascade delete truncation, namespace rename non-atomicity, silent error handling (clipboard, bulk export)
- Practical Engineering: checked — N+1 queries, missing indexes, no auth rate limiting, rate limit table growth, 21 PNGs in git, hardcoded deployment IDs, ESLint version mismatch
