import { useRef } from 'react'
import { useWebHaptics } from 'web-haptics/react'
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
  const { trigger } = useWebHaptics()

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

  const handleDotRowKeyDown = (e) => {
    const row = dotRowRef.current
    if (!row) return
    if (e.key === 'ArrowRight') { row.scrollLeft += 80; e.preventDefault() }
    if (e.key === 'ArrowLeft') { row.scrollLeft -= 80; e.preventDefault() }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onLogoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* URL */}
      <section className="control-section" role="group" aria-labelledby="url-label">
        <label id="url-label" className="control-label" htmlFor="url-input">URL</label>
        <input
          id="url-input"
          type="url"
          className="url-input"
          placeholder="Paste a URL to get started"
          value={url}
          onKeyDown={() => trigger(8)}
          onBeforeInput={() => trigger(8)}
          onChange={(e) => onUrlChange(e.target.value)}
          autoFocus
        />
      </section>

      <hr className="divider" />

      {/* Colors */}
      <section className="control-section" role="group" aria-labelledby="colors-label">
        <div className="control-header">
          <span id="colors-label" className="control-label">Colors</span>
        </div>
        <div className="color-row">
          <div className="color-group">
            <span className="color-sublabel">Foreground</span>
            <label className="color-picker">
              <input type="color" aria-label="Foreground color" value={fgColor} onClick={() => trigger('nudge')} onInput={(e) => { onFgColorChange(e.target.value); trigger(30) }} onChange={(e) => { onFgColorChange(e.target.value); trigger('success') }} />
              <span className="color-swatch" style={{ background: fgColor }} aria-hidden="true" />
              <span className="color-value">{fgColor.toUpperCase()}</span>
            </label>
          </div>
          <div className="color-group">
            <span className="color-sublabel">Background</span>
            <label className="color-picker">
              <input type="color" aria-label="Background color" value={bgColor} onClick={() => trigger('nudge')} onInput={(e) => { onBgColorChange(e.target.value); trigger(30) }} onChange={(e) => { onBgColorChange(e.target.value); trigger('success') }} />
              <span className="color-swatch" style={{ background: bgColor }} aria-hidden="true" />
              <span className="color-value">{bgColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Logo */}
      <section className="control-section" role="group" aria-labelledby="logo-label">
        <div className="control-header">
          <span id="logo-label" className="control-label">Logo</span>
        </div>
        {logo ? (
          <div className="logo-preview">
            <img src={logo} alt="Custom QR code logo" className="logo-thumb" />
            <button className="logo-remove" onClick={() => { onLogoChange(null); trigger('nudge') }}>Remove</button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-zone"
            onClick={() => { fileInputRef.current?.click(); trigger('nudge') }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden aria-label="Upload logo image" />
            <span>Add logo</span>
          </button>
        )}
      </section>

      <hr className="divider" />

      {/* Dot Style */}
      <section className="control-section" role="group" aria-labelledby="dotstyle-label">
        <div className="control-header">
          <span id="dotstyle-label" className="control-label">Dot Style</span>
        </div>
        <div
          className="dot-row"
          ref={dotRowRef}
          role="radiogroup"
          aria-label="Dot style"
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onDragMove}
          onKeyDown={handleDotRowKeyDown}
        >
          {DOT_STYLES.map((ds) => (
            <button
              key={ds.id}
              role="radio"
              aria-checked={dotStyle === ds.id}
              className={`dot-option ${dotStyle === ds.id ? 'active' : ''}`}
              onClick={() => { onDotStyleChange(ds.id); trigger('success') }}
            >
              <span className={`dot-icon dot-icon-${ds.id}`} aria-hidden="true" />
              <span className="dot-option-label">{ds.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Size */}
      <section className="control-section" role="group" aria-labelledby="size-label">
        <div className="control-header">
          <span id="size-label" className="control-label">Size</span>
          <span className="size-value" aria-live="polite">{size} px</span>
        </div>
        <input
          type="range"
          min={128}
          max={2048}
          step={64}
          value={size}
          onChange={(e) => { onSizeChange(Number(e.target.value)); trigger(15) }}
          className="size-slider"
          aria-label="QR code size in pixels"
          aria-valuemin={128}
          aria-valuemax={2048}
          aria-valuenow={size}
          aria-valuetext={`${size} pixels`}
        />
        <div className="size-range" aria-hidden="true">
          <span>128</span>
          <span>2048</span>
        </div>
      </section>
      <div className="panel-spacer" />

      <footer className="panel-footer panel-footer-desktop">
        <span>Powered by</span>
        <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer" aria-label="Visit imBento website">
          <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
        </a>
      </footer>
    </>
  )
}

export default ControlsPanel
