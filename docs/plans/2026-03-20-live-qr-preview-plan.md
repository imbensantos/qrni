# Implementation Plan: Live QR Preview + Relocated Short Link Button

**Design doc:** `docs/plans/2026-03-20-live-qr-preview-design.md`
**Date:** 2026-03-20

---

## Step 1: Remove `qrGenerated` gate from `useQROptions`

**File:** `apps/app/src/hooks/useQROptions.ts`

- Remove `qrGenerated` and `setQrGenerated` state declarations
- Remove `setQrGenerated(false)` from `handleUrlChange`
- Remove `qrGenerated` and `setQrGenerated` from the return object

**Verify:** TypeScript compilation fails in `QRGeneratorPage.tsx` and `ControlsPanel.tsx` (expected — fixed in next steps).

---

## Step 2: Update `QRGeneratorPage` to remove gate and `onGenerate` prop

**File:** `apps/app/src/pages/qr/QRGeneratorPage.tsx`

- Change `isValidUrl={urlIsValid && qr.qrGenerated}` → `isValidUrl={urlIsValid}`
- Remove `onGenerate={() => qr.setQrGenerated(true)}` from `ControlsPanel` props

**Verify:** TypeScript compilation fails in `ControlsPanel.tsx` (expected — fixed in next step).

---

## Step 3: Refactor `ControlsPanel` — remove generate button, relocate short link creation

**File:** `apps/app/src/components/qr/panels/ControlsPanel.tsx`

### 3a. Remove `onGenerate` from props

- Remove `onGenerate` from `ControlsPanelProps` interface
- Remove `onGenerate` from destructured props

### 3b. Remove `handleGenerate` callback and generate button

- Delete the `handleGenerate` useCallback
- Delete the `<button className="generate-btn">` element

### 3c. Add "Create Short Link" button inside `.shortlink-options`

- Add a new button at the bottom of the `.shortlink-options` container (after the namespace nudge / sign-in hint)
- The button:
  - Uses class `create-shortlink-btn`
  - Contains an inline SVG link/chain icon + text "Create Short Link" (or "Creating..." when loading)
  - `onClick` calls `createShortLink(url)` (already available from `useShortLink`)
  - `disabled` when `!isValidUrl(url) || shortLinkLoading`
- The button needs `url` from props to pass to `createShortLink`

### 3d. Add `url` prop usage for short link creation

- `url` is already a prop on `ControlsPanel` — no new prop needed
- Import `isValidUrl` is already present

**Verify:** App compiles. QR preview renders live on valid URL input. "Create Short Link" button appears inside the short link toggle section.

---

## Step 4: Clean up unused CSS

**File:** `apps/app/src/components/qr/panels/ControlsPanel.css`

- Remove `.generate-btn` styles (lines ~401-448) — the button no longer exists
- Keep `.create-shortlink-btn` styles (lines ~721-746) — these are now actively used

**Verify:** No visual regressions. The create-shortlink-btn ghost style renders correctly.

---

## Step 5: Visual verification on mobile

- Launch dev server and test on mobile viewport (375x3000)
- Verify: QR preview renders immediately when a valid URL is entered
- Verify: "Create Short Link" button (ghost, green, link icon) appears only when toggle is on
- Verify: "Download" button (filled, terracotta, download icon) in preview panel is visually distinct
- Verify: Short link result card still appears in preview panel after creation
- Take full-page screenshot to confirm

---

## Files touched

| File                                                  | Change                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/app/src/hooks/useQROptions.ts`                  | Remove `qrGenerated` state                                         |
| `apps/app/src/pages/qr/QRGeneratorPage.tsx`           | Remove gate, remove `onGenerate` prop                              |
| `apps/app/src/components/qr/panels/ControlsPanel.tsx` | Remove generate button, add Create Short Link in shortlink-options |
| `apps/app/src/components/qr/panels/ControlsPanel.css` | Remove `.generate-btn` styles                                      |

## Files NOT touched

| File                                | Reason                               |
| ----------------------------------- | ------------------------------------ |
| `PreviewPanel.tsx`                  | Already reactive — no changes needed |
| `useShortLink.ts`                   | Creation logic unchanged             |
| `BulkPanel.tsx` / `BulkPreview.tsx` | Bulk mode unaffected                 |
| Backend (`convex/*`)                | No backend changes                   |
