import { useState } from 'react'
import ControlsPanel from './components/ControlsPanel'
import PreviewPanel from './components/PreviewPanel'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [fgColor, setFgColor] = useState('#1A1918')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [logo, setLogo] = useState(null)
  const [dotStyle, setDotStyle] = useState('square')
  const [size, setSize] = useState(512)
  const [format, setFormat] = useState('png')

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni</h1>
        <p className="tagline">Your free QR code maker</p>
      </header>
      <main className="body">
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
      </main>
    </div>
  )
}

export default App
