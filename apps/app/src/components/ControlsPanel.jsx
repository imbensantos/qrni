import { useRef } from 'react'
import './ControlsPanel.css'

const DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Leaf' },
  { id: 'extra-rounded', label: 'Blob' },
]

function ControlsPanel({
  mode, onModeChange,
  url, onUrlChange,
  fgColor, onFgColorChange,
  bgColor, onBgColorChange,
  logo, onLogoChange,
  dotStyle, onDotStyleChange,
  size, onSizeChange,
}) {
  const fileInputRef = useRef(null)
  const dotRowRef = useRef(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onDragStart = (e) => {
    const row = dotRowRef.current
    dragState.current = { isDown: true, startX: e.pageX - row.offsetLeft, scrollLeft: row.scrollLeft }
    row.classList.add('dragging')
  }
  const onDragEnd = () => {
    dragState.current.isDown = false
    dotRowRef.current?.classList.remove('dragging')
  }
  const onDragMove = (e) => {
    if (!dragState.current.isDown) return
    e.preventDefault()
    const row = dotRowRef.current
    const x = e.pageX - row.offsetLeft
    row.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onLogoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <aside className="controls-panel">
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
        <div
          className="dot-row"
          ref={dotRowRef}
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onDragMove}
        >
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
      <div className="panel-spacer" />

      <footer className="panel-footer">
        <span>Powered by</span>
        <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">
          <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
        </a>
      </footer>
    </aside>
  )
}

export default ControlsPanel
