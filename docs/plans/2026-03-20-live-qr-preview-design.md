# Live QR Preview + Relocated Short Link Button

**Date:** 2026-03-20

## Problem

The QR preview is gated behind a "Generate QR" button click. Users must click Generate every time they change the URL, which also creates a short link (if toggled on). This couples two distinct actions — previewing the QR design and creating a short link — into one button, making it costly to iterate on QR customization.

## Design

### 1. Remove the `qrGenerated` gate

- Remove `qrGenerated` / `setQrGenerated` state from `useQROptions`.
- `PreviewPanel` receives `isValidUrl` based solely on URL validity.
- QR preview renders reactively as the user types or changes design options.

### 2. Remove "Generate QR" button

- Delete the `generate-btn` from `ControlsPanel`.
- When the short link toggle is off, the controls panel is purely configuration with no action button.

### 3. Move "Create Short Link" inside `.shortlink-options`

- Place at the bottom of the short link options container, after the namespace nudge.
- Uses the existing `.create-shortlink-btn` ghost style (outlined, sage green).
- Add a link/chain icon inline before the text.
- Button text: "Create Short Link" / "Creating..." when loading.
- Disabled when URL is invalid or request is in-flight.

### 4. Button differentiation (mobile)

| Property | Create Short Link                   | Download                        |
| -------- | ----------------------------------- | ------------------------------- |
| Style    | Ghost/outlined                      | Filled                          |
| Color    | Sage green (`--accent-secondary`)   | Terracotta (`--accent-primary`) |
| Icon     | Link/chain icon                     | Download arrow icon             |
| Location | Controls panel (short link section) | Preview panel (export bar)      |

### 5. Component changes

- **`useQROptions`** — remove `qrGenerated` / `setQrGenerated`.
- **`QRGeneratorPage`** — pass `urlIsValid` directly (no `&& qr.qrGenerated`), remove `onGenerate` prop.
- **`ControlsPanel`** — remove `onGenerate` prop, remove generate button, move short link creation trigger inside `.shortlink-options`.
- **`PreviewPanel`** — no changes needed (already reactive).

### 6. Unchanged

- All short link creation logic (`useShortLink`), rate limiting, dedup.
- Download button styling and behavior.
- Bulk mode.
- Short link result card in preview panel.
