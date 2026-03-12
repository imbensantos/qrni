# Bulk QR Code Generation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add a Bulk mode to QRni that generates multiple QR codes from CSV/JSON input, exporting as ZIP or PDF.

**Architecture:** New `single`/`bulk` mode toggle in App. Bulk mode renders BulkPanel (left: upload + global controls) and BulkPreview (right: entries table + export). Parsing/generation/export logic lives in `bulk-utils.js`. Uses PapaParse for CSV, JSZip for ZIP bundling, jsPDF (already installed) for PDF export, and qr-code-styling (already installed) for QR generation.

**Tech Stack:** React 19, qr-code-styling, PapaParse, JSZip, jsPDF, Vite 7

---

### Task 0: Install dependencies

**Files:**
- Modify: `apps/app/package.json`

**Step 1: Install jszip and papaparse**

Run: `npm install jszip papaparse --workspace=apps/app`

**Step 2: Verify installation**

Run: `npm ls jszip papaparse --workspace=apps/app`
Expected: Both packages listed without errors.

**Step 3: Commit**

```bash
git add apps/app/package.json package-lock.json
git commit -m "chore: add jszip and papaparse dependencies for bulk QR generation"
```

---

### Task 1: Implement bulk-utils.js (parsing, validation, sanitization)

**Files:**
- Create: `apps/app/src/utils/bulk-utils.js`

**Step 1: Create the utility module**

```js
import Papa from 'papaparse'

const MAX_ENTRIES = 500

export function isValidUrl(url) {
  return typeof url === 'string' &&
    (url.startsWith('http://') || url.startsWith('https://'))
}

export function sanitizeLabel(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .slice(0, 80) || 'qr-code'
}

export function deduplicateLabels(entries) {
  const counts = {}
  return entries.map((entry) => {
    const base = entry.filename
    counts[base] = (counts[base] || 0) + 1
    const filename = counts[base] > 1 ? `${base}-${counts[base]}` : base
    return { ...entry, filename }
  })
}

export function parseCSV(text) {
  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  const entries = result.data.slice(0, MAX_ENTRIES).map((row, i) => {
    const label = row.label || row.Label || row.name || row.Name || ''
    const url = row.url || row.URL || row.link || row.Link || ''
    const valid = isValidUrl(url)
    const error = !label.trim()
      ? 'Missing label'
      : !url.trim()
        ? 'Missing URL'
        : !valid
          ? 'Invalid URL (must start with http:// or https://)'
          : null
    return {
      index: i + 1,
      label: label.trim(),
      url: url.trim(),
      filename: sanitizeLabel(label),
      valid: !!label.trim() && valid,
      error,
    }
  })

  return deduplicateLabels(entries)
}

export function parseJSON(text) {
  let data
  try {
    data = JSON.parse(text.trim())
  } catch {
    return [{ index: 1, label: '', url: '', filename: '', valid: false, error: 'Invalid JSON' }]
  }

  if (!Array.isArray(data)) {
    return [{ index: 1, label: '', url: '', filename: '', valid: false, error: 'JSON must be an array' }]
  }

  const entries = data.slice(0, MAX_ENTRIES).map((item, i) => {
    const label = item.label || item.name || ''
    const url = item.url || item.link || ''
    const valid = isValidUrl(url)
    const error = !label.trim()
      ? 'Missing label'
      : !url.trim()
        ? 'Missing URL'
        : !valid
          ? 'Invalid URL (must start with http:// or https://)'
          : null
    return {
      index: i + 1,
      label: label.trim(),
      url: url.trim(),
      filename: sanitizeLabel(label),
      valid: !!label.trim() && valid,
      error,
    }
  })

  return deduplicateLabels(entries)
}

export function parseFile(text, filename) {
  if (filename.endsWith('.json')) return parseJSON(text)
  return parseCSV(text)
}
```

**Step 2: Verify it builds**

Run: `npm run build --workspace=apps/app`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/app/src/utils/bulk-utils.js
git commit -m "feat: add bulk-utils with CSV/JSON parsing, validation, and label sanitization"
```

---

### Task 2: Implement bulk export logic (ZIP + PDF generation)

**Files:**
- Create: `apps/app/src/utils/bulk-export.js`

**Step 1: Create the export module**

```js
import QRCodeStyling from 'qr-code-styling'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

function createQRCode(url, { fgColor, bgColor, dotStyle, logo, size }) {
  return new QRCodeStyling({
    width: size,
    height: size,
    type: 'canvas',
    data: url,
    dotsOptions: { color: fgColor, type: dotStyle },
    backgroundOptions: { color: bgColor },
    cornersSquareOptions: { type: 'extra-rounded' },
    imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
    image: logo || undefined,
    qrOptions: { errorCorrectionLevel: 'H' },
  })
}

async function renderToBlob(qr, format) {
  const container = document.createElement('div')
  qr.append(container)

  // Wait for rendering
  await new Promise((r) => setTimeout(r, 100))

  if (format === 'svg') {
    const svgEl = container.querySelector('svg')
    if (!svgEl) throw new Error('SVG not found')
    const svgData = new XMLSerializer().serializeToString(svgEl)
    return new Blob([svgData], { type: 'image/svg+xml' })
  }

  const canvas = container.querySelector('canvas')
  if (!canvas) throw new Error('Canvas not found')

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      format === 'webp' ? 'image/webp' : 'image/png'
    )
  })
}

const CHUNK_SIZE = 10

export async function generateZip(entries, options, format, onProgress) {
  const zip = new JSZip()
  const validEntries = entries.filter((e) => e.valid)
  const ext = format === 'svg' ? 'svg' : format === 'webp' ? 'webp' : 'png'

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE)
    const promises = chunk.map(async (entry) => {
      const qr = createQRCode(entry.url, options)
      const blob = await renderToBlob(qr, format)
      zip.file(`${entry.filename}.${ext}`, blob)
    })
    await Promise.all(promises)
    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length)

    // Yield to UI between chunks
    await new Promise((r) => setTimeout(r, 0))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'qrni-bulk.zip')
}

export async function generatePdf(entries, options, onProgress) {
  const validEntries = entries.filter((e) => e.valid)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = 210
  const pageH = 297
  const margin = 15
  const cols = 3
  const cellW = (pageW - margin * 2) / cols
  const qrSize = cellW - 10
  const cellH = qrSize + 16 // QR + label space
  const rows = Math.floor((pageH - margin * 2) / cellH)
  const perPage = cols * rows

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE)

    for (const entry of chunk) {
      const idx = validEntries.indexOf(entry)
      const pageIdx = Math.floor(idx / perPage)
      const posOnPage = idx % perPage
      const col = posOnPage % cols
      const row = Math.floor(posOnPage / cols)

      if (posOnPage === 0 && pageIdx > 0) pdf.addPage()

      const x = margin + col * cellW + (cellW - qrSize) / 2
      const y = margin + row * cellH

      const qr = createQRCode(entry.url, { ...options, size: 512 })
      const container = document.createElement('div')
      qr.append(container)
      await new Promise((r) => setTimeout(r, 100))

      const canvas = container.querySelector('canvas')
      if (canvas) {
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize)
      }

      pdf.setFontSize(8)
      pdf.setTextColor(100)
      const labelText = entry.label.length > 25
        ? entry.label.slice(0, 22) + '...'
        : entry.label
      pdf.text(labelText, x + qrSize / 2, y + qrSize + 6, { align: 'center' })
    }

    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length)
    await new Promise((r) => setTimeout(r, 0))
  }

  pdf.save('qrni-bulk.pdf')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

**Step 2: Verify it builds**

Run: `npm run build --workspace=apps/app`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/app/src/utils/bulk-export.js
git commit -m "feat: add bulk export with chunked ZIP and PDF generation"
```

---

### Task 3: Implement BulkPanel component

**Files:**
- Create: `apps/app/src/components/BulkPanel.jsx`
- Create: `apps/app/src/components/BulkPanel.css`

**Step 1: Create BulkPanel.jsx**

```jsx
import { useRef, useState } from 'react'
import { parseFile } from '../utils/bulk-utils'
import './BulkPanel.css'

const DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy-rounded', label: 'Classy' },
]

const FORMATS = ['png', 'svg', 'webp']

function BulkPanel({
  fgColor, onFgColorChange,
  bgColor, onBgColorChange,
  logo, onLogoChange,
  dotStyle, onDotStyleChange,
  size, onSizeChange,
  format, onFormatChange,
  onEntriesParsed,
}) {
  const fileInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [fileName, setFileName] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const entries = parseFile(e.target.result, file.name)
      setFileName(file.name)
      onEntriesParsed(entries)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handlePaste = () => {
    if (!pasteText.trim()) return
    const isJson = pasteText.trim().startsWith('[')
    const entries = parseFile(pasteText, isJson ? 'data.json' : 'data.csv')
    setFileName('pasted data')
    onEntriesParsed(entries)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onLogoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <aside className="bulk-panel">
      {/* File Upload */}
      <section className="control-section">
        <span className="control-label">Data Source</span>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={(e) => handleFile(e.target.files[0])}
            hidden
          />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>{fileName ? `Loaded: ${fileName}` : 'Drop CSV or JSON file here'}</span>
          <span className="dropzone-hint">or click to browse</span>
        </div>
        <button className="paste-toggle" onClick={() => setShowPaste(!showPaste)}>
          {showPaste ? 'Hide paste' : 'Or paste data'}
        </button>
        {showPaste && (
          <div className="paste-area">
            <textarea
              className="paste-input"
              placeholder={'label,url\nHomepage,https://example.com'}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
            />
            <button className="paste-btn" onClick={handlePaste} disabled={!pasteText.trim()}>
              Parse Data
            </button>
          </div>
        )}
      </section>

      <hr className="divider" />

      {/* Format */}
      <section className="control-section">
        <span className="control-label">Export Format</span>
        <div className="format-selector">
          {FORMATS.map((f) => (
            <button
              key={f}
              className={`format-option ${format === f ? 'active' : ''}`}
              onClick={() => onFormatChange(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Colors */}
      <section className="control-section">
        <span className="control-label">Colors</span>
        <div className="color-row">
          <div className="color-group">
            <span className="color-sublabel">Foreground</span>
            <label className="color-picker">
              <input type="color" value={fgColor} onChange={(e) => onFgColorChange(e.target.value)} />
              <span className="color-swatch" style={{ background: fgColor }} />
              <span className="color-value">{fgColor.toUpperCase()}</span>
            </label>
          </div>
          <div className="color-group">
            <span className="color-sublabel">Background</span>
            <label className="color-picker">
              <input type="color" value={bgColor} onChange={(e) => onBgColorChange(e.target.value)} />
              <span className="color-swatch" style={{ background: bgColor }} />
              <span className="color-value">{bgColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Logo */}
      <section className="control-section">
        <span className="control-label">Logo</span>
        {logo ? (
          <div className="logo-preview">
            <img src={logo} alt="Logo" className="logo-thumb" />
            <button className="logo-remove" onClick={() => onLogoChange(null)}>Remove</button>
          </div>
        ) : (
          <div className="upload-zone" onClick={() => logoInputRef.current?.click()}>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            <span>Add logo</span>
          </div>
        )}
      </section>

      <hr className="divider" />

      {/* Dot Style */}
      <section className="control-section">
        <span className="control-label">Dot Style</span>
        <div className="dot-row">
          {DOT_STYLES.map((ds) => (
            <button
              key={ds.id}
              className={`dot-option ${dotStyle === ds.id ? 'active' : ''}`}
              onClick={() => onDotStyleChange(ds.id)}
            >
              <span className={`dot-icon dot-icon-${ds.id}`} />
              <span className="dot-option-label">{ds.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Size */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Size</span>
          <span className="size-value">{size} px</span>
        </div>
        <input
          type="range"
          min={128}
          max={2048}
          step={64}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="size-slider"
        />
        <div className="size-range">
          <span>128</span>
          <span>2048</span>
        </div>
      </section>
    </aside>
  )
}

export default BulkPanel
```

**Step 2: Create BulkPanel.css**

```css
.bulk-panel {
  width: 380px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-card);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 1px 0 8px rgba(26, 25, 24, 0.03);
}

/* Dropzone */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.dropzone:hover {
  border-color: var(--accent-primary);
  background: var(--accent-warm);
}

.dropzone-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Paste area */
.paste-toggle {
  background: none;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-primary);
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.paste-toggle:hover {
  color: var(--accent-primary-hover);
}

.paste-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paste-input {
  width: 100%;
  padding: 12px;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}

.paste-input:focus {
  border-color: var(--accent-primary);
}

.paste-input::placeholder {
  color: var(--text-tertiary);
}

.paste-btn {
  align-self: flex-end;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent-primary);
  color: white;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.paste-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.paste-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 768px) {
  .bulk-panel {
    width: 100%;
    height: auto;
    max-height: none;
    overflow-y: visible;
  }
}
```

**Step 3: Verify it builds**

Run: `npm run build --workspace=apps/app`
Expected: Build succeeds (component not mounted yet, but module resolution works).

**Step 4: Commit**

```bash
git add apps/app/src/components/BulkPanel.jsx apps/app/src/components/BulkPanel.css
git commit -m "feat: add BulkPanel component with file upload and paste input"
```

---

### Task 4: Implement BulkPreview component

**Files:**
- Create: `apps/app/src/components/BulkPreview.jsx`
- Create: `apps/app/src/components/BulkPreview.css`

**Step 1: Create BulkPreview.jsx**

```jsx
import { useState } from 'react'
import { generateZip, generatePdf } from '../utils/bulk-export'
import './BulkPreview.css'

function BulkPreview({
  entries,
  fgColor, bgColor, logo, dotStyle, size, format,
}) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const validCount = entries.filter((e) => e.valid).length
  const invalidCount = entries.length - validCount

  const styleOptions = { fgColor, bgColor, dotStyle, logo, size }

  const handleZip = async () => {
    setGenerating(true)
    try {
      await generateZip(entries, styleOptions, format, (current, total) => {
        setProgress({ current, total })
      })
    } finally {
      setGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handlePdf = async () => {
    setGenerating(true)
    try {
      await generatePdf(entries, styleOptions, (current, total) => {
        setProgress({ current, total })
      })
    } finally {
      setGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  if (entries.length === 0) {
    return (
      <section className="bulk-preview">
        <div className="bulk-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>Upload a CSV or JSON file to get started</p>
          <p className="bulk-empty-hint">
            Format: each row needs a <strong>label</strong> and a <strong>url</strong>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bulk-preview">
      <div className="bulk-preview-content">
        {/* Summary */}
        <div className="bulk-summary">
          <span className="bulk-summary-valid">{validCount} valid</span>
          {invalidCount > 0 && (
            <span className="bulk-summary-invalid">{invalidCount} invalid</span>
          )}
          <span className="bulk-summary-total">{entries.length} total</span>
        </div>

        {/* Table */}
        <div className="bulk-table-wrapper">
          <table className="bulk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Label</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.index} className={entry.valid ? '' : 'bulk-row-invalid'}>
                  <td>{entry.index}</td>
                  <td className="bulk-cell-label">{entry.label || '—'}</td>
                  <td className="bulk-cell-url">{entry.url || '—'}</td>
                  <td>
                    {entry.valid ? (
                      <span className="bulk-status-valid">Valid</span>
                    ) : (
                      <span className="bulk-status-invalid" title={entry.error}>
                        {entry.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Progress */}
        {generating && (
          <div className="bulk-progress">
            <div className="bulk-progress-bar">
              <div
                className="bulk-progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span className="bulk-progress-text">
              Generating {progress.current} of {progress.total}...
            </span>
          </div>
        )}

        {/* Export buttons */}
        {!generating && (
          <div className="bulk-export-bar">
            <button
              className="download-btn"
              onClick={handleZip}
              disabled={validCount === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download ZIP
            </button>
            <button
              className="download-btn bulk-btn-secondary"
              onClick={handlePdf}
              disabled={validCount === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Download PDF
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default BulkPreview
```

**Step 2: Create BulkPreview.css**

```css
.bulk-preview {
  flex: 1;
  background: var(--bg-preview);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bulk-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--border-strong);
  padding: 32px;
}

.bulk-empty p {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-align: center;
}

.bulk-empty-hint {
  font-size: 12px !important;
  color: var(--text-tertiary);
}

.bulk-preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
  overflow: hidden;
}

/* Summary */
.bulk-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
}

.bulk-summary-valid {
  color: var(--accent-secondary);
}

.bulk-summary-invalid {
  color: #D86B6B;
}

.bulk-summary-total {
  color: var(--text-tertiary);
  margin-left: auto;
}

/* Table */
.bulk-table-wrapper {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-card);
}

.bulk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.bulk-table th {
  position: sticky;
  top: 0;
  background: var(--bg-muted);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.bulk-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.bulk-table th:first-child,
.bulk-table td:first-child {
  width: 40px;
  text-align: center;
  color: var(--text-tertiary);
}

.bulk-cell-label {
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bulk-cell-url {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  font-size: 12px;
}

.bulk-row-invalid {
  background: #FFF5F5;
}

.bulk-status-valid {
  color: var(--accent-secondary);
  font-weight: 500;
}

.bulk-status-invalid {
  color: #D86B6B;
  font-size: 12px;
  font-weight: 500;
  cursor: help;
}

/* Progress */
.bulk-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bulk-progress-bar {
  height: 8px;
  background: var(--bg-muted);
  border-radius: 4px;
  overflow: hidden;
}

.bulk-progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bulk-progress-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-align: center;
}

/* Export */
.bulk-export-bar {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.bulk-btn-secondary {
  background: var(--text-secondary) !important;
  box-shadow: 0 4px 16px rgba(109, 108, 106, 0.2) !important;
}

.bulk-btn-secondary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(109, 108, 106, 0.3) !important;
}

/* Mobile */
@media (max-width: 768px) {
  .bulk-preview-content {
    padding: 16px;
  }

  .bulk-export-bar {
    flex-direction: column;
  }

  .bulk-export-bar .download-btn {
    width: 100%;
  }
}
```

**Step 3: Verify it builds**

Run: `npm run build --workspace=apps/app`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/app/src/components/BulkPreview.jsx apps/app/src/components/BulkPreview.css
git commit -m "feat: add BulkPreview component with entries table and export buttons"
```

---

### Task 5: Wire up App.jsx with mode toggle

**Files:**
- Modify: `apps/app/src/App.jsx`
- Modify: `apps/app/src/App.css`

**Step 1: Update App.jsx**

Replace the entire content of `apps/app/src/App.jsx` with:

```jsx
import { useState } from 'react'
import ControlsPanel from './components/ControlsPanel'
import PreviewPanel from './components/PreviewPanel'
import BulkPanel from './components/BulkPanel'
import BulkPreview from './components/BulkPreview'
import './App.css'

function App() {
  const [mode, setMode] = useState('single')
  const [url, setUrl] = useState('')
  const [fgColor, setFgColor] = useState('#1A1918')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [logo, setLogo] = useState(null)
  const [dotStyle, setDotStyle] = useState('square')
  const [size, setSize] = useState(512)
  const [format, setFormat] = useState('png')
  const [bulkEntries, setBulkEntries] = useState([])

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni ✨</h1>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            Single
          </button>
          <button
            className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
          >
            Bulk
          </button>
        </div>
      </header>
      <main className="body">
        {mode === 'single' ? (
          <>
            <ControlsPanel
              url={url} onUrlChange={setUrl}
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
            />
            <PreviewPanel
              url={url}
              isValidUrl={isValidUrl}
              fgColor={fgColor}
              bgColor={bgColor}
              logo={logo}
              dotStyle={dotStyle}
              size={size}
              format={format}
              onFormatChange={setFormat}
            />
          </>
        ) : (
          <>
            <BulkPanel
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
              format={format} onFormatChange={setFormat}
              onEntriesParsed={setBulkEntries}
            />
            <BulkPreview
              entries={bulkEntries}
              fgColor={fgColor}
              bgColor={bgColor}
              logo={logo}
              dotStyle={dotStyle}
              size={size}
              format={format}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
```

**Step 2: Add mode toggle styles to App.css**

Add the following after the `.tagline` block (replace the `.tagline` rule):

```css
/* Replace .tagline with .mode-toggle */
.mode-toggle {
  display: flex;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  padding: 3px;
}

.mode-btn {
  padding: 6px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(26, 25, 24, 0.06);
}
```

**Step 3: Run lint and build**

Run: `npm run lint --workspace=apps/app && npm run build --workspace=apps/app`
Expected: No errors.

**Step 4: Test manually in browser**

1. Open http://localhost:5173
2. Verify Single mode works as before
3. Click "Bulk" toggle
4. Verify BulkPanel shows with dropzone and controls
5. Verify BulkPreview shows empty state
6. Upload a test CSV — verify table populates
7. Click Download ZIP — verify download works
8. Click Download PDF — verify download works

**Step 5: Commit**

```bash
git add apps/app/src/App.jsx apps/app/src/App.css
git commit -m "feat: add Single/Bulk mode toggle and wire up bulk generation flow"
```

---

### Task 6: Final integration test and deploy

**Step 1: Run full lint and build**

Run: `npm run lint --workspace=apps/app && npm run build --workspace=apps/app`
Expected: No errors.

**Step 2: Test edge cases in browser**

- Upload file with 0 valid URLs — export buttons should be disabled
- Upload file with > 500 rows — only first 500 processed
- Upload malformed JSON — error row shown
- Upload CSV with columns in different order — still works
- Test paste input with JSON array
- Toggle between Single and Bulk — state preserved

**Step 3: Commit any fixes, then deploy**

```bash
git push
npx vercel --prod --cwd apps/app
```
