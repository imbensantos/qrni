import { useRef, useEffect, useMemo } from 'react'
import QRCodeStyling from 'qr-code-styling'
import Doodles from './Doodles'
import './PreviewPanel.css'

const FORMATS = ['png', 'svg', 'webp']

function PreviewPanel({
  url, isValidUrl, fgColor, bgColor, logo, dotStyle, size,
  format, onFormatChange,
}) {
  const qrContainerRef = useRef(null)

  const qrCode = useMemo(() => new QRCodeStyling({
    width: 200,
    height: 200,
    type: 'svg',
    data: '',
    dotsOptions: { color: fgColor, type: dotStyle },
    backgroundOptions: { color: bgColor },
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

  const handleDownload = () => {
    qrCode.update({ width: size, height: size })
    setTimeout(() => {
      qrCode.download({ name: 'qrni-code', extension: format })
      setTimeout(() => {
        qrCode.update({ width: 200, height: 200 })
      }, 100)
    }, 50)
  }

  return (
    <section className="preview-panel">
      <Doodles />
      <div className="preview-content">
        <div className="qr-card">
          <div className="qr-code" ref={qrContainerRef} style={{ display: isValidUrl ? 'block' : 'none' }} />
          {!isValidUrl && (
            <div className="qr-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M21 14v3h-3M21 21h-3v-3"/></svg>
              <p>Paste a URL to get started</p>
            </div>
          )}
        </div>

        <p className={`status ${isValidUrl ? 'status-ready' : ''}`}>
          {isValidUrl ? 'Ready to download' : 'Enter a valid URL'}
        </p>

        <div className="export-bar">
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
          <button className="download-btn" onClick={handleDownload} disabled={!isValidUrl}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
        </div>

        <footer className="footer">
          <span>Powered by</span>
          <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">
            <strong>imBento</strong>
          </a>
        </footer>
      </div>
    </section>
  )
}

export default PreviewPanel
