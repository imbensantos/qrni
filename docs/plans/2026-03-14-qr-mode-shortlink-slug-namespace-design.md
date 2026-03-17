# QR Mode: Custom Slug + Namespace for Short Links

## Problem

When a user generates a QR code with the "Also create short link" toggle enabled, the short link always gets an auto-generated slug (e.g., `qrni.to/bR7mQ`). Signed-in users should be able to customize the slug and assign a namespace, just like they can in Shorten mode.

## Design

### Approach: Expandable section inline below toggle

When the "Also create short link" toggle is ON **and** the user is signed in, two fields appear directly below the toggle row:

1. **Custom slug** -- Label row ("Custom slug" + "2 of 5 used" counter) + input with placeholder "e.g., my-link"
2. **Namespace** -- Label "Namespace" + dropdown showing "None (flat link)" with chevron

The fields use the same spacing (`gap: 20`) and styling as the rest of the sidebar. No special card or indent treatment -- they sit as natural siblings in the vertical flow.

### Behavior

- **Anonymous users**: Toggle is visible but no slug/namespace fields appear when ON
- **Signed-in users**: Toggle ON reveals slug + namespace; toggle OFF hides them
- **Result**: Short link card in preview shows the custom slug if provided (e.g., `qrni.to/my-link` or `qrni.to/benandmaria/my-link`)

### Screens affected

| Screen     | ID      | Change                                                              |
| ---------- | ------- | ------------------------------------------------------------------- |
| S9 Desktop | `OXUT4` | Add slug + namespace below toggle, update header to signed-in state |
| M9 Mobile  | `0zMb7` | Add slug + namespace below toggle, update header to signed-in state |

### What stays the same

- All other QR controls (Colors, Logo, Dot Style, Size)
- The preview area and short link result card layout
- Anonymous user experience (toggle only, no extra fields)

## Design patterns reused

All field patterns copied directly from S3 (Shorten Signed In):

- Slug label with usage counter
- Slug input field
- Namespace dropdown with "None (flat link)" default
