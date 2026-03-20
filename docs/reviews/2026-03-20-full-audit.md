# Code Review: Full Codebase Audit

**Date:** 2026-03-20
**Scope:** Entire codebase — backend (convex/), frontend (apps/app/), tests, e2e
**Mode:** full

## Summary

The codebase is well-structured with strong security foundations, consistent accessibility practices, and good Convex idiom usage. The audit uncovered 7 critical issues, 24 important issues, and 26 suggestions across backend, frontend, and test quality. Findings were verified against actual source code to eliminate false positives.

---

## Critical

### Backend

- [x] **C-BE1. No rate limit on invite creation** — `convex/collaboration.ts:14-120` — `createEmailInvite` and `createInviteLink` have no rate limiting. Invite _acceptance_ is rate-limited but creation is not. Enables spam/cost abuse via Resend API. _(Practical Engineering — Defensive Programming)_

### Frontend

- [x] **C-FE1. `NamespaceDropdown` doesn't close on outside click** — `apps/app/src/components/NamespaceDropdown.tsx` — Missing `useClickOutside` hook. Both `ProfileDropdown` and `NamespaceSection` correctly use it. _(Design Principles — Least Astonishment)_

- [x] **C-FE2. Division by zero in progress bar** — `apps/app/src/components/BulkPreview.tsx:254` — `progress.current / progress.total` when total=0 produces `NaN%`. _(Systems Thinking — Fail Fast)_

- [x] **C-FE3. `INVITE_RETURN_KEY` defined twice** — `apps/app/src/router.tsx:8` and `apps/app/src/pages/InviteAcceptPage.tsx:8` — Same session storage key independently defined. Changing one silently breaks the invite-return flow. _(Foundational — DRY/SSOT)_

- [x] **C-FE4. `renderToBlob` relies on arbitrary 100ms timeout** — `apps/app/src/utils/bulk-export.ts:35,131` — Race condition. On slow devices, canvas/SVG may not be ready. Should poll or use library's promise API. _(Systems Thinking — Fail Fast)_

### Tests

- [x] **C-T1. `security.test.ts` is exact duplicate of `validation.test.ts`** — `convex/lib/security.test.ts` — Every describe block duplicated line-for-line. Creates maintenance drift risk. Remove one. _(Foundational — DRY)_

- [x] **C-T2. No tests for backend mutation handlers** — `convex/links.ts`, `convex/namespaces.ts`, `convex/collaboration.ts`, `convex/redirects.ts` — Authorization and business logic with zero test coverage. _(Practical Engineering)_

---

## Important

### Backend

- [x] **I-BE1. DRY violation in rate limit functions** — `convex/lib/linkHelpers.ts:135-243` — Three nearly identical rate limit functions. Extract to single `checkRateLimit(ctx, key, limit)`. _(Foundational — DRY)_

- [x] **I-BE2. `getUserStats` loads all links with `.collect()`** — `convex/users.ts:68-71` — Unbounded memory for users with thousands of links. Only needs count + sum. _(Design Principles — KISS)_

- [x] **I-BE3. Namespace fetched twice in permission checks** — `convex/links.ts:271-273`, `convex/collaboration.ts:28-30`, `convex/namespaces.ts:144-146` — `checkPermission` fetches namespace internally, then caller fetches again. Return namespace from permission check. _(Foundational — DRY)_

- [x] **I-BE4. `RESERVED_SLUGS` is array, not Set, and misplaced** — `convex/namespaces.ts:10-60` — Should be `Set` for O(1) lookup and live in `lib/constants.ts`. _(Clean Code — Formatting)_

- [x] **I-BE5. Hardcoded `.take(500)` with no pagination** — `convex/links.ts:370,538` — Users with >500 links silently lose visibility. _(Systems Thinking — SSOT)_

- [x] **I-BE6. `sanitizeText` doesn't escape `&`** — `convex/lib/validation.ts:7-9` — Missing ampersand escape. Email template has its own `escapeHtml` that covers it, but general sanitizer has the gap. _(Systems Thinking — Defensive Programming)_

- [x] **I-BE7. `audit_log.metadata` uses `v.any()`** — `convex/schema.ts:99` — No type safety on metadata field. _(SOLID — ISP)_

- [x] **I-BE8. Namespace rename collects all links for sequential patch** — `convex/namespaces.ts:192-202` — Could exceed Convex mutation limits for large namespaces. _(Systems Thinking — Fail Fast)_

### Frontend

- [x] **I-FE1. All SVG icons missing `aria-hidden="true"`** — `apps/app/src/components/Icons.tsx` (all 14 icons) — Decorative SVGs should have `aria-hidden` for consistency. These SVGs lack text content so screen readers typically skip them, but best practice and consistency with every other SVG in the codebase warrants adding it. _(Clean Code — Consistency)_

- [x] **I-FE2. Footer duplicated 6 times** — `BulkPanel.tsx:266`, `ControlsPanel.tsx:366`, `PreviewPanel.tsx:214`, `BulkPreview.tsx:151`, `ProfilePage.tsx:299`, `PrivacyPage.tsx:270` — Extract to `<AppFooter />`. _(Foundational — DRY)_

- [x] **I-FE3. Type definitions duplicated** — `Namespace` (2x), `ShortLinkResult` (3x), `ExportFormat` (3x) defined independently across files. _(Foundational — DRY/SSOT)_

- [x] **I-FE4. `window.location.host` used instead of `getAppHost()`** — `CreateNamespaceModal.tsx:107`, `EditLinkModal.tsx:49`, `RenameNamespaceModal.tsx:126` — Violates SSOT and project rule against hardcoded domain. _(Systems Thinking — SSOT)_

- [x] **I-FE5. `ControlsPanel.tsx` — SRP violation** — 390 lines, 16 props, manages URL input + short link creation + namespace selection + QR controls + footer. _(SOLID — SRP)_

- [x] **I-FE6. `InviteMemberModal.tsx` — SRP violation** — 337 lines, handles invite form + member list + member removal + invite revocation. _(SOLID — SRP)_

- [x] **I-FE7. Inline SVGs instead of Icons barrel** — `EditProfileModal.tsx:73-86`, `InviteMemberModal.tsx:111-125,148-161`, `InviteAcceptPage.tsx` (5 inline SVGs) — Should use shared Icons. _(Foundational — DRY)_

- [x] **I-FE8. Missing `role="alert"` on error messages** — `DeleteLinkConfirmModal.tsx:65`, `DeleteNamespaceModal.tsx:61`, `EditLinkModal.tsx:175`, `EditProfileModal.tsx:134`, `InviteMemberModal.tsx:220` — Screen readers won't announce dynamic errors. _(Clean Code — Consistency)_

- [x] **I-FE9. `CreateNamespaceModal` description field never sent to API** — `apps/app/src/components/modals/CreateNamespaceModal.tsx:18,49` — State captured but silently discarded in `handleSubmit`. _(Clean Code — Dead Code / YAGNI)_

- [x] **I-FE10. `AllNamespaceLinksView` reads wrong member's role** — `apps/app/src/components/profile/AllNamespaceLinksView.tsx:51` — Uses `members?.[0]?.role` (first member, typically the owner) instead of current user's role. Displays incorrect role label for non-owner members. _(Design Principles — Least Astonishment)_

- [x] **I-FE11. `MAX_CUSTOM_LINKS` duplicates backend constant** — `apps/app/src/utils/constants.ts:23` vs `convex/lib/constants.ts:7` — Different names, independently maintained. Import from backend. _(Systems Thinking — SSOT)_

- [x] **I-FE12. `QRGeneratorPage` manages 10+ state variables** — `apps/app/src/pages/QRGeneratorPage.tsx:20-37` — Extract QR options into `useQROptions` hook. _(SOLID — SRP)_

- [x] **I-FE13. `parseJSON` reimplements `buildEntry` validation** — `apps/app/src/utils/bulk-utils.ts:138-167` — Should delegate to `buildEntry` like `parseCSV` does. _(Foundational — DRY)_

- [x] **I-FE14. Router `sessionStorage` access has no try/catch** — `apps/app/src/router.tsx:18-21` — Every other storage access is wrapped. Unvalidated `returnPath` used in redirect. _(Systems Thinking — Defensive Programming)_

- [x] **I-FE15. Error handling relies on string matching** — `apps/app/src/pages/InviteAcceptPage.tsx:34-39` — Matches backend errors by substring instead of using error codes/constants. _(Practical Engineering — Postel's Law)_

### Tests

- [x] **I-T1. `auditLog.test.ts` is placeholder** — Only tests module export, not behavior. _(Practical Engineering)_

- [x] **I-T2. No E2E tests for authenticated flows** — Profile page, namespace management, invite acceptance entirely untested at E2E level. _(Practical Engineering)_

- [x] **I-T3. `useDragScroll.test.ts` tests interface shape only** — Zero behavioral assertions for scrolling. _(Practical Engineering)_

- [x] **I-T4. Duplicated mock helpers across 3 test files** — `chainableQuery`/`createMockCtx` copy-pasted in `linkHelpers.test.ts`, `security.test.ts`. Extract to shared helpers. _(Foundational — DRY)_

- [x] **I-T5. Convex vitest config scoped to `lib/**`** — `convex/vitest.config.ts` — Prevents testing top-level mutation files without config change. _(Practical Engineering)_

---

## Suggestions

### Backend

- [ ] **S-BE1.** Short code modulo bias — `convex/lib/shortCode.ts:9` — `Uint8Array[i] % 62` introduces minor modulo bias. For 32-char invite tokens, entropy drops from ~190.5 to ~189.8 bits — negligible for security but technically imperfect. Fix: rejection sampling (discard bytes >= 248). _(Systems Thinking — Defensive Programming)_
- [ ] **S-BE2.** `autoSlug: isAutoSlug || undefined` stores undefined instead of false — `convex/links.ts:319`
- [ ] **S-BE3.** Unused error constants `ERR.INVITE_NOT_FOUND`, etc. — `convex/lib/constants.ts:83-86`
- [ ] **S-BE4.** Custom slug case sensitivity mismatch with namespace slugs — `convex/links.ts:206-217`
- [ ] **S-BE5.** `createAnonymousLink` action accepts client-supplied `sessionId` as `creatorIp` — `convex/links.ts:85-98`
- [ ] **S-BE6.** `checkUrl` public action lacks authentication — `convex/safeBrowsing.ts:44-49`
- [ ] **S-BE7.** Redirect handler blocks on click count increment — `convex/http.ts:148-151`
- [ ] **S-BE8.** Leading/trailing/consecutive hyphens allowed in slugs — `convex/lib/shortCode.ts:25`
- [ ] **S-BE9.** Cleanup crons only process 100 records per run — `convex/cleanup.ts:12,28`
- [ ] **S-BE10.** `listMine` silently filters null namespace docs — `convex/namespaces.ts:240-247`
- [x] **S-BE11.** Duplicated test mock infrastructure — `security.test.ts:11-42`, `linkHelpers.test.ts:21-52`

### Frontend

- [ ] **S-FE1.** Extract `capitalize()` utility — pattern repeated 9+ times across components
- [ ] **S-FE2.** `AVATAR_COLORS` overlaps with `NAMESPACE_COLORS` — `InviteMemberModal.tsx:12` vs `ui-utils.ts`
- [ ] **S-FE3.** Modal pattern could use shared `useModalForm` hook for reset/submitting boilerplate
- [ ] **S-FE4.** `CopyButton` setTimeout not cleaned up on unmount — `CopyButton.tsx:62,69,73`
- [ ] **S-FE5.** `Doodles.tsx` should use `React.memo` — 238 lines static SVG, no props
- [ ] **S-FE6.** `ErrorBoundary.tsx` inline styles vs CSS classes
- [ ] **S-FE7.** `NamespaceDropdown` keyboard nav doesn't move visual focus — `NamespaceDropdown.tsx:68-84`
- [ ] **S-FE8.** `PreviewPanel` clipboard copy lacks fallback — `PreviewPanel.tsx:159` vs `CopyButton`'s try/catch
- [ ] **S-FE9.** Non-null assertion on `namespaceId` — `RenameNamespaceModal.tsx:62`
- [ ] **S-FE10.** Unsafe `as any` cast on `dotStyle` — `PreviewPanel.tsx:79`
- [ ] **S-FE11.** `useAuth` is trivial wrapper used inconsistently — `hooks/useAuth.ts`
- [ ] **S-FE12.** `getCachedUser` re-parsed from sessionStorage every render — `App.tsx:18`
- [ ] **S-FE13.** `indexOf` in PDF generation — `apps/app/src/utils/bulk-export.ts:114` — `validEntries.indexOf(entry)` inside loop is O(n^2), but with MAX_ENTRIES=500 this is sub-millisecond in practice. Use loop counter for clarity.
- [ ] **S-FE14.** `buildShortLinkUrl` does not encode path segments — `apps/app/src/utils/url-utils.ts:9-15` — Raw string concatenation without `encodeURIComponent`. Not exploitable in practice because all inputs are backend-validated against strict regexes (`/^[a-z0-9-]{3,30}$/`, `/^[a-zA-Z0-9_-]{1,60}$/`), but `encodeURIComponent` would add defense-in-depth.

---

## Removed Findings (False Positives)

- ~~**C-BE2. `safeBrowsing.ts` missing `"use node"` directive**~~ — False positive. Convex provides `process.env` and `fetch` to all server functions natively. `"use node"` is only needed for Node.js-specific modules (fs, crypto, etc.). The code works correctly as-is.

---

## Coverage

- **Clean Code:** checked — Dead code (I-FE9), naming (I-FE3), consistency (I-FE1, I-FE8), formatting (I-BE4)
- **SOLID:** checked — SRP violations (I-FE5, I-FE6, I-FE12), ISP (I-BE7)
- **Foundational:** checked — DRY (I-BE1, I-BE3, I-FE2, I-FE3, I-FE7, I-FE13, C-T1), KISS (I-BE2), YAGNI (I-FE9)
- **Design Principles:** checked — Least Astonishment (C-FE1, I-FE10), SSOT (I-FE4, I-FE11, C-FE3), Separation of Concerns (I-FE5)
- **Systems Thinking:** checked — Fail Fast (C-FE2, C-FE4, I-BE8), SSOT (I-BE5), Defensive Programming (I-BE6, I-FE14)
- **Practical Engineering:** checked — Postel's Law (I-FE15), Conway's Law (no issues), Boy Scout Rule (I-T1, I-T2)
