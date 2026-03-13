# Merge Shorten into QR Mode (Two-Tab Layout)

## Problem

The Shorten tab duplicates functionality that naturally belongs in QR Mode. When a user shortens a URL, the preview panel sits empty — wasted space that could show a QR code of the short link. Meanwhile, QR Mode already has an "Also create short link" toggle. The two modes are converging; merging them simplifies the app and improves the UX.

## Design

### Tab structure

Remove the Shorten tab. The mode toggle becomes two tabs:

```
[ Single ]  [ Bulk ]
```

QR generation is now the default and only single-URL experience. Short links are opt-in.

### Controls Panel (Single tab)

Top-to-bottom flow:

1. **URL input** — unchanged from current QR Mode
2. **"Also create short link" toggle** — OFF by default
   - Anonymous users: toggle visible, no extra fields when ON (auto-generated slug)
   - Signed-in users: toggle ON reveals Custom slug + Namespace fields (same as current S9 behavior)
3. **Divider**
4. **Colors** — foreground/background pickers
5. **Logo** — upload zone
6. **Dot Style** — square / rounded / dots / diamond
7. **Size** — slider (128-2048)
8. **"Generate" button** — primary CTA, always generates a QR code. When short link toggle is ON, also creates the short link.

### Preview Panel

**Before generating (empty state):**
- Current empty state with decorative doodles, centered card with QR icon + hint text

**After generating (short link toggle OFF):**
- QR code preview (large, centered)
- Download format options (PNG / SVG / PDF)
- Download button
- Footer ("Powered by imBento")

**After generating (short link toggle ON):**
- QR code preview (large, centered) — encodes the short link URL
- Download format options (PNG / SVG / PDF)
- Download button
- Short link result card: success indicator + short URL (e.g., `qrni.to/a3Xk9`) + Copy button
- Footer ("Powered by imBento")

### Screens affected

| Action | Screen IDs | Description |
|--------|-----------|-------------|
| Remove | `Ty57P` (S1), `1LQxm` (S2), `j302o` (S3), `DIihb` (S4) | Desktop Shorten screens |
| Remove | M1, M2, M3, M4 (if they exist) | Mobile Shorten screens |
| Update | `OXUT4` (S9) | Update mode toggle from 3 tabs to 2 tabs |
| Update | `lxa5G`, `9dTUQ` | QRni App empty/active states — update mode toggle to 2 tabs |
| Update | All remaining screens with mode toggle | Remove Shorten tab from toggle |

### What stays the same

- S5/S6 namespace management screens
- S7 namespace editor/viewer
- S8 accept invite screen
- Bulk tab — unaffected
- All QR customization controls — unchanged
- Short link toggle behavior for signed-in users — unchanged

## Future considerations

- **Link management screen**: A dedicated screen to view/manage all generated short links. To be designed separately.

## Design patterns reused

- Two-tab toggle: same pill-shaped toggle component, just with 2 items instead of 3
- Short link toggle + slug/namespace fields: identical to current S9 pattern
- Result card with Copy button: identical to current S2 result card
- QR preview with download options: identical to current QR Mode active state
