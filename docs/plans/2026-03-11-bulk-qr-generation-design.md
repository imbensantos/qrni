# Bulk QR Code Generation — Design

## Overview

Add a "Bulk" mode to QRni that lets users upload a CSV or JSON file (or paste data) to generate multiple QR codes at once. Output as ZIP or PDF.

## Data Format

**CSV** (header row required, column order flexible):
```
label,url
Homepage,https://example.com
```

**JSON** (array of objects):
```json
[{ "label": "Homepage", "url": "https://example.com" }]
```

**Rules:**
- URLs must start with `http://` or `https://`
- Invalid rows are flagged, not blocking
- Labels sanitized for filenames (spaces to hyphens, special chars stripped)
- Duplicate labels get numeric suffix (`homepage`, `homepage-2`)
- Max 500 entries per upload

## UI Layout

Header gets a **Single | Bulk** toggle. Bulk mode replaces both panels:

**Left panel (BulkPanel):**
- File upload dropzone (.csv, .json)
- Expandable "paste data" textarea
- Global customization controls (colors, dot style, size)
- Format selector (PNG/SVG/WEBP)

**Right panel (BulkPreview):**
- Scrollable table: #, Label, URL, Status (valid/invalid)
- Invalid rows highlighted with error tooltip
- Summary bar: "142 valid, 3 invalid"
- Download ZIP + Download PDF buttons
- Progress bar during generation

Single mode is unchanged.

## Generation & Export

**ZIP:**
- Chunked generation (10 at a time) with progress bar
- Files: `{sanitized-label}.{format}`
- Bundled with JSZip, downloaded as `qrni-bulk.zip`

**PDF:**
- Same chunked generation
- A4 pages, 3-column grid, label below each QR
- Uses jsPDF + canvas rendering
- Downloaded as `qrni-bulk.pdf`

**Error handling:**
- Invalid URLs skipped during export
- Buttons disabled when no valid entries
- Partial results offered if generation fails mid-way

## Component Architecture

**New files:**
- `bulk-utils.js` — parsing, validation, sanitization, chunked generation
- `BulkPanel.jsx` + `BulkPanel.css`
- `BulkPreview.jsx` + `BulkPreview.css`

**Modified files:**
- `App.jsx` — mode state, toggle, conditional rendering
- `App.css` — toggle styles

**Dependencies to add:**
- `jszip`
- `papaparse`

## Task IDs

- #4: bulk-utils.js (parsing/validation)
- #5: BulkPanel component (blocked by #4)
- #6: BulkPreview component (blocked by #4)
- #7: ZIP and PDF export (blocked by #4)
- #8: App.jsx mode toggle (blocked by #5, #6)
