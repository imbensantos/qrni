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
