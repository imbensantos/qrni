import { useState } from 'react'
import { useWebHaptics } from 'web-haptics/react'
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
  const { trigger } = useWebHaptics()

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni ✨</h1>
      </header>
      <main className="body">
        <div className="sidebar-panel">
          <div className={`mode-toggle ${mode}`} role="group" aria-label="Generation mode">
            <button
              className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
              aria-pressed={mode === 'single'}
              onClick={() => { setMode('single'); trigger('nudge') }}
            >
              Single
            </button>
            <button
              className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
              aria-pressed={mode === 'bulk'}
              onClick={() => { setMode('bulk'); trigger('nudge') }}
            >
              Bulk
            </button>
            <button
              className={`mode-btn ${mode === 'shorten' ? 'active' : ''}`}
              aria-pressed={mode === 'shorten'}
              onClick={() => { setMode('shorten'); trigger('nudge') }}
            >
              Shorten
            </button>
          </div>
          <hr className="divider" />
          {mode === 'single' ? (
            <ControlsPanel
              url={url} onUrlChange={setUrl}
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
            />
          ) : mode === 'bulk' ? (
            <BulkPanel
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
              format={format} onFormatChange={setFormat}
              onEntriesParsed={setBulkEntries}
            />
          ) : (
            <div style={{ padding: 20, color: '#9C9B99' }}>URL shortener coming soon</div>
          )}
        </div>
        {mode === 'single' ? (
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
        ) : mode === 'bulk' ? (
          <BulkPreview
            entries={bulkEntries}
            onEntriesChange={setBulkEntries}
            fgColor={fgColor}
            bgColor={bgColor}
            logo={logo}
            dotStyle={dotStyle}
            size={size}
            format={format}
          />
        ) : (
          <div className="preview-placeholder" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9C9B99' }}>
            Shortened links will appear here
          </div>
        )}
      </main>
    </div>
  )
}

export default App
