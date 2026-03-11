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
  mode, onModeChange,
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
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => onModeChange('single')}
        >
          Single
        </button>
        <button
          className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
          onClick={() => onModeChange('bulk')}
        >
          Bulk
        </button>
      </div>

      <hr className="divider" />

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
