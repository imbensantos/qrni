import { useRef, useEffect, useMemo } from 'react'
import { useWebHaptics } from 'web-haptics/react'
import QRCodeStyling from 'qr-code-styling'
import Doodles from './Doodles'
import './PreviewPanel.css'

const FORMATS = ['png', 'svg', 'webp']

const BASE_URL_PATH = '/'

function PreviewPanel({
  url, isValidUrl, fgColor, bgColor, logo, dotStyle, size,
  format, onFormatChange, shortenLink, shortLinkResult,
}) {
  const qrContainerRef = useRef(null)
  const { trigger } = useWebHaptics()

  const qrCode = useMemo(() => new QRCodeStyling({
    width: 200,
    height: 200,
    type: 'svg',
    data: '',
    dotsOptions: {},
    backgroundOptions: {},
    cornersSquareOptions: { type: 'extra-rounded' },
    imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
    qrOptions: { errorCorrectionLevel: 'H' },
  }), [])

  useEffect(() => {
    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = ''
      qrCode.append(qrContainerRef.current)
    }
  }, [qrCode])

  useEffect(() => {
    qrCode.update({
      data: isValidUrl ? url : '',
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      image: logo || undefined,
    })
  }, [url, isValidUrl, fgColor, bgColor, logo, dotStyle, qrCode])

  const handleDownload = async () => {
    trigger('success')
    qrCode.update({ width: size, height: size })
    await qrCode.download({ name: 'qrni-code', extension: format })
    qrCode.update({ width: 200, height: 200 })
  }

  return (
    <section className="preview-panel" aria-label="QR code preview">
      <Doodles />
      <div className="preview-content">
        <div className="qr-card">
          <div className="qr-code" ref={qrContainerRef} role="img" aria-label="Generated QR code" style={{ display: isValidUrl ? 'block' : 'none' }} />
          {!isValidUrl && (
            <div className="qr-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M21 14v3h-3M21 21h-3v-3"/></svg>
              <p>Paste a URL to get started</p>
            </div>
          )}
        </div>

        <p className={`status ${isValidUrl ? 'status-ready' : ''}`} aria-live="polite" aria-atomic="true">
          {isValidUrl ? 'Ready to download' : 'Enter a valid URL'}
        </p>

        {shortenLink && isValidUrl && shortLinkResult && (
          <div className="short-link-card">
            <div className="sl-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="sl-url">{`${window.location.host}${BASE_URL_PATH}${shortLinkResult.shortCode}`}</span>
            </div>
            <button className="sl-copy-btn" onClick={() => {
              const shortUrl = `${window.location.origin}${BASE_URL_PATH}${shortLinkResult.shortCode}`
              navigator.clipboard?.writeText(shortUrl)
              trigger('success')
            }}>
              Copy
            </button>
          </div>
        )}

        <div className="export-bar">
          <div className={`format-selector format-${FORMATS.indexOf(format)}`} role="radiogroup" aria-label="Export format">
            {FORMATS.map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={format === f}
                className={`format-option ${format === f ? 'active' : ''}`}
                onClick={() => { onFormatChange(f); trigger('nudge') }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="download-btn" onClick={handleDownload} disabled={!isValidUrl} aria-label="Download QR code">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
        </div>

        <footer className="panel-footer panel-footer-mobile">
          <span>Powered by</span>
          <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer" aria-label="Visit imBento website">
            <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
          </a>
        </footer>
      </div>
    </section>
  )
}

export default PreviewPanel
