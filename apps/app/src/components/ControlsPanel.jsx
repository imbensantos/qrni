import { useRef } from 'react'
import './ControlsPanel.css'

const DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy-rounded', label: 'Classy' },
]

function ControlsPanel({
  url, onUrlChange,
  fgColor, onFgColorChange,
  bgColor, onBgColorChange,
  logo, onLogoChange,
  dotStyle, onDotStyleChange,
  size, onSizeChange,
}) {
  const fileInputRef = useRef(null)

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onLogoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <aside className="controls-panel">
      {/* URL */}
      <section className="control-section">
        <label className="control-label">URL</label>
        <input
          type="url"
          className="url-input"
          placeholder="Paste a URL to get started"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          autoFocus
        />
      </section>

      <hr className="divider" />

      {/* Colors */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Colors</span>
        </div>
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
        <div className="control-header">
          <span className="control-label">Logo</span>
        </div>
        {logo ? (
          <div className="logo-preview">
            <img src={logo} alt="Logo" className="logo-thumb" />
            <button className="logo-remove" onClick={() => onLogoChange(null)}>Remove</button>
          </div>
        ) : (
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            <span>Add logo</span>
          </div>
        )}
      </section>

      <hr className="divider" />

      {/* Dot Style */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Dot Style</span>
        </div>
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

export default ControlsPanel
