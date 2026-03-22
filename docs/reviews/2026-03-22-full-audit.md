# Code Review: Full Codebase Audit

**Date:** 2026-03-22
**Scope:** All 158 source files across apps/app, convex/, e2e/
**Mode:** full

## Summary

The codebase is well-structured with strong security posture, consistent patterns, and good test coverage. The main areas for improvement are: validation logic divergence between frontend/backend, duplicated constants requiring manual sync, and several accessibility gaps in modals.

---

## Critical

### Backend

- [ ] **C1. Modulo bias in short code generation** (`convex/lib/shortCode.ts:9`) — `array[i] % ALPHABET.length` creates 25% relative bias. For 32-char invite tokens this reduces effective entropy from ~190 to ~184 bits. Fix with rejection sampling. _Principle: Defensive Programming_

- [ ] **C2. `checkUrl` action exposes Safe Browsing as a public oracle** (`convex/safeBrowsing.ts:44-49`) — Unauthenticated action lets attackers test if their malicious domains are flagged. Should require auth or use `internalAction`. _Principle: Encapsulation, Fail Fast_

- [ ] **C3. Contact form rate limit uses flat `anonymous` key** (`convex/contact.ts:31`) — All unauthenticated users share one rate-limit bucket. One abuser burns the limit for everyone; no IP-based keying. _Principle: Defensive Programming_

### Frontend

- [ ] **C4. Clipboard copy fails silently in PreviewPanel** (`apps/app/src/components/qr/panels/PreviewPanel.tsx:164`) — `navigator.clipboard?.writeText()` silently fails in non-HTTPS/older browsers unlike `CopyButton.tsx` which has a `legacyCopy` fallback. Shows success feedback regardless. _Principle: Fail Fast_

- [ ] **C5. Duplicated `RefreshPreviewButton` component** — Byte-for-byte identical in `AllNamespaceLinksView.tsx:13-38` and `MyLinksSection.tsx:21-46`. _Principle: DRY_

### Architecture

- [ ] **C6. Duplicated RESERVED_SLUGS** (`apps/app/vite.config.js:9-52` and `convex/lib/constants.ts:132-183`) — Full copy with "keep in sync" comment. Will inevitably drift causing dev/prod behavior differences. _Principle: SSOT_

- [ ] **C7. `ExportFormat` type defined in 3 places** (`types.ts:14`, `PreviewPanel.tsx:13`, `BulkPanel.tsx:11`) — Local re-derivations can diverge from canonical type. _Principle: SSOT_

- [ ] **C8. Divergent URL validation between frontend and backend** (`apps/app/src/utils/bulk-utils.ts:14-21` vs `convex/lib/validation.ts:15-21`) — Frontend has no length limit; backend has no URL parsing. Bulk export bypasses backend validation entirely. _Principle: SSOT, Defensive Programming_

---

## Important

### Backend

- [ ] **I1. `refreshOgData` skips namespace collaborator permissions** (`convex/ogScraper.ts:68`) — Only checks `link.owner`, unlike `deleteLink`/`updateLinkInternal` which fall through to `checkPermission`. _Principle: Least Astonishment_

- [ ] **I2. `refreshOgData` uses hardcoded error strings** (`convex/ogScraper.ts:63,69`) — Every other file uses centralized `ERR` constants. _Principle: SSOT_

- [ ] **I3. Duplicated ownership/permission check** (`convex/links.ts:383-393` and `422-432`) — Identical block in `deleteLink` and `updateLinkInternal`. Extract to `assertLinkAccess()`. _Principle: DRY_

- [ ] **I4. `listMyLinks` returns up to 5000 links with no pagination** (`convex/links.ts:367`) — Large payload risk for power users. _Principle: KISS_

- [ ] **I5. `listNamespaceLinks` also 5000 with no pagination** (`convex/links.ts:533`) — Same as I4. _Principle: KISS_

- [ ] **I6. OG scraper fetches entire response into memory** (`convex/ogScraper.ts:33`) — No `Content-Length` check. Malicious URL could serve gigabytes. Read only first ~50KB. _Principle: Defensive Programming_

- [ ] **I7. Cleanup cron only deletes 100 records per run** (`convex/cleanup.ts:12,26`) — Won't keep up with high-traffic rate limit records. _Principle: Practical Engineering_

- [ ] **I8. `avatarUrl` validation only checks protocol** (`convex/users.ts:37-38`) — Allows any HTTPS URL. Consider allowlisting known avatar providers. _Principle: Defensive Programming_

- [ ] **I9. Namespace rename doesn't check shortCode collision with top-level links** (`convex/namespaces.ts:142-155`) — Recomposed `newSlug/linkSlug` could conflict with existing links. _Principle: Fail Fast_

### Frontend

- [ ] **I10. Inconsistent slug validation regex** — `AddLinkModal.tsx:51` allows underscores + max 60; `EditLinkModal.tsx:63` disallows underscores + no max. _Principle: SSOT_

- [ ] **I11. `ModalBackdrop` lacks focus trapping** (`ModalBackdrop.tsx`) — Keyboard users can Tab out of modal into background content. WCAG 2.4.3 violation. _Principle: Defensive Programming_

- [ ] **I12. Missing `titleId` on 3 modals** — `DeleteNamespaceModal.tsx:49`, `LeaveNamespaceModal.tsx:60`, `EditProfileModal.tsx:61` have no `aria-labelledby`. _Principle: Clean Code_

- [ ] **I13. `EditProfileModal` uses inline SVG instead of `IconClose`** (`EditProfileModal.tsx:73-86`) — Every other modal uses the shared icon. _Principle: DRY_

- [ ] **I14. `BulkPanel` duplicates `SizeSlider` internals** (`BulkPanel.tsx:229-260`) — Copy-pasted instead of reusing `<SizeSlider>` component. _Principle: DRY_

### Architecture

- [ ] **I15. Short code regex mismatch in Vite proxy** (`apps/app/vite.config.js:5-6`) — Namespace slug minimum is 1 char in proxy but 3 in backend `isValidSlug`. Dev proxy routes paths the backend would never create. _Principle: SSOT_

- [ ] **I16. `renderToBlob` swallows null blob** (`apps/app/src/utils/bulk-export.ts:58`) — Non-null assertion `blob!` hides failures from `canvas.toBlob()`. _Principle: Fail Fast_

- [ ] **I17. No unit tests for `bulk-export.ts`** — Only utility file without test coverage. Contains significant logic (ZIP generation, PDF layout). _Principle: Practical Engineering_

- [ ] **I18. E2E test duplication** (`e2e/auth.spec.ts` and `e2e/authenticated.spec.ts`) — Multiple overlapping scenarios testing the same auth flows. _Principle: DRY_

---

## Suggestions

### Backend

- [ ] S1. Use `as const` union type for audit action strings (`convex/lib/auditLog.ts:8`)
- [ ] S2. `contact.ts:11` has its own `EMAIL_REGEX` — should import `isValidEmail` from `validation.ts`
- [ ] S3. HTTP handler returns 302 for unknown short codes (`convex/http.ts:167`) — consider 404 for SEO
- [ ] S4. Missing Twitter Card meta tags in bot HTML (`convex/lib/ogScraper.ts:130-142`)
- [ ] S5. `ALREADY_OWNER` error message misleading for self-removal case (`convex/collaboration.ts:246`)

### Frontend

- [ ] S6. `ControlsPanel` accepts 13 props — consider grouping or context
- [ ] S7. Haptic trigger magic numbers (`8`, `15`, `30`) — define named constants
- [ ] S8. `PrivacyPage` service data duplicated between table and mobile cards (lines 201-306)
- [ ] S9. `ShortLinkResult` type redefined in `PreviewPanel.tsx:15-18` instead of importing from `types.ts`
- [ ] S10. `useShortLink` queries (`listMyLinks`, `listMine`) run for anonymous users (`useShortLink.ts:54-55`) — returns `[]` gracefully but creates unnecessary subscriptions
- [ ] S11. `ErrorBoundary` only logs in dev — no production error tracking
- [ ] S12. Hardcoded `contact@qrni.to` on ContactPage — should use env/config per project rules
- [ ] S13. `ProfileDropdown` uses inline SVGs instead of shared icons (lines 52-68, 94-107)

### Architecture

- [ ] S14. `bulk-export.ts` uses `any` for QRCodeStyling — define minimal interface
- [ ] S15. PDF layout has magic numbers (`10`, `16`) in `bulk-export.ts:106-113`
- [ ] S16. `sanitizeLabel` strips all non-ASCII — problematic for Filipino/international users
- [ ] S17. Date formatting reimplements `Intl.DateTimeFormat` in `ui-utils.ts:1-52`
- [ ] S18. Playwright config only tests Chromium — no Firefox/WebKit

---

## Coverage

- Clean Code: checked — naming generally good; dead code issues with duplicated components (C5, I15, I16); inline SVGs instead of shared icons (I15, S12)
- SOLID: checked — SRP mostly upheld; `useProfileModals` hook has 30 symbols suggesting it may be doing too much; OCP/LSP/ISP/DIP not problematic in this functional React codebase
- Foundational: checked — DRY violations across validation logic (C8, I10), components (C5, I16), and constants (C6, C7); KISS upheld; YAGNI upheld
- Design Principles: checked — Law of Demeter respected; encapsulation good; separation of concerns good across the module structure; least astonishment violated by I11 (wrong slug initialization)
- Systems Thinking: checked — fail fast gaps in clipboard (C4), blob rendering (I18); SSOT violations across validation (C8), types (C7), constants (C6, I17); defensive programming gaps in avatar validation (I8), OG scraper memory (I6)
- Practical Engineering: checked — test coverage gap for bulk-export (I19); cleanup cron scaling (I7); strong accessibility test foundation; good page object pattern in E2E

---

## Positive Observations

1. **Security posture is strong** — consistent generic error messages, rate limiting, Safe Browsing integration, input validation at boundaries, audit logging on all mutations
2. **Centralized ERR constants** — excellent SSOT pattern used almost everywhere
3. **Permission model is clean** — role hierarchy with `checkPermission` returning useful context
4. **Accessibility foundation** — ARIA attributes, roles, keyboard nav, skip-link, comprehensive a11y E2E tests
5. **Page Object Pattern** — well-implemented in E2E tests with clear separation
6. **Feature flags** — avatar upload gated behind `VITE_FEATURE_AVATAR_UPLOAD`
7. **Cached user pattern** — instant UI on page load while auth resolves
8. **Schema design** — thoughtful denormalization with inline documentation
