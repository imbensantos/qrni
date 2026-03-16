import { useState } from 'react'
import { useWebHaptics } from 'web-haptics/react'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../../convex/_generated/api'
import ControlsPanel from './components/ControlsPanel'
import PreviewPanel from './components/PreviewPanel'
import BulkPanel from './components/BulkPanel'
import BulkPreview from './components/BulkPreview'
import ProfileDropdown from './components/ProfileDropdown'
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
  const [shortenLink, setShortenLink] = useState(() => localStorage.getItem('qrni-shorten-link') === 'true')
  const [shortLinkResult, setShortLinkResult] = useState(null)
  const [qrGenerated, setQrGenerated] = useState(false)
  const { trigger } = useWebHaptics()
  const { signIn } = useAuthActions()
  const user = useQuery(api.users.currentUser)

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni ✨</h1>
        {user ? (
          <ProfileDropdown user={user} />
        ) : (
          <button className="signin-btn" onClick={() => signIn("google")}>
            Sign in
          </button>
        )}
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
          </div>
          <hr className="divider" />
          {mode === 'single' ? (
            <ControlsPanel
              url={url} onUrlChange={(v) => { setUrl(v); setQrGenerated(false) }}
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
              shortenLink={shortenLink} onShortenLinkChange={(v) => { setShortenLink(v); localStorage.setItem('qrni-shorten-link', String(v)) }}
              onShortLinkCreated={setShortLinkResult}
              onGenerate={() => setQrGenerated(true)}
              qrGenerated={qrGenerated}
            />
          ) : (
            <BulkPanel
              fgColor={fgColor} onFgColorChange={setFgColor}
              bgColor={bgColor} onBgColorChange={setBgColor}
              logo={logo} onLogoChange={setLogo}
              dotStyle={dotStyle} onDotStyleChange={setDotStyle}
              size={size} onSizeChange={setSize}
              format={format} onFormatChange={setFormat}
              onEntriesParsed={setBulkEntries}
            />
          )}
        </div>
        {mode === 'single' ? (
          <PreviewPanel
            url={url}
            isValidUrl={isValidUrl && qrGenerated}
            fgColor={fgColor}
            bgColor={bgColor}
            logo={logo}
            dotStyle={dotStyle}
            size={size}
            format={format}
            onFormatChange={setFormat}
            shortenLink={shortenLink}
            shortLinkResult={shortLinkResult}
          />
        ) : (
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
        )}
      </main>
    </div>
  )
}

export default App
