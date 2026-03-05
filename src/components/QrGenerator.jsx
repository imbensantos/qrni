import { useState, useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './QrGenerator.css'

function QrGenerator() {
  const [url, setUrl] = useState('')
  const canvasRef = useRef(null)

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'qrni-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  return (
    <div className="generator">
      <div className="input-wrapper">
        <input
          type="url"
          className="url-input"
          placeholder="Paste your URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
      </div>

      <div className="qr-area" ref={canvasRef}>
        {isValidUrl ? (
          <div className="qr-code-wrapper">
            <QRCodeCanvas
              value={url}
              size={200}
              level="H"
              marginSize={2}
            />
          </div>
        ) : (
          <div className="qr-placeholder">
            <img
              src="/animated-qr-icon.gif"
              alt="QR placeholder"
              className="placeholder-icon"
            />
            <p className="placeholder-text">
              {url ? 'Enter a valid URL starting with http:// or https://' : 'Your QR code will appear here'}
            </p>
          </div>
        )}
      </div>

      {isValidUrl && (
        <button className="download-btn" onClick={handleDownload}>
          <img
            src="/animated-download-icon.gif"
            alt=""
            className="btn-icon"
          />
          Download PNG
        </button>
      )}
    </div>
  )
}

export default QrGenerator
