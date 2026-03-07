import { useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { toPng, toSvg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import Doodles from './Doodles'
import './PreviewPanel.css'

const FORMATS = ['PNG', 'SVG', 'PDF']

function PreviewPanel({
  url, isValidUrl, fgColor, bgColor, logo, dotStyle, size,
  format, onFormatChange,
}) {
  const qrRef = useRef(null)

  const handleDownload = useCallback(async () => {
    const node = qrRef.current
    if (!node) return

    const fmt = format.toLowerCase()

    if (fmt === 'png') {
      const dataUrl = await toPng(node, { pixelRatio: size / node.offsetWidth })
      const link = document.createElement('a')
      link.download = 'qrni-code.png'
      link.href = dataUrl
      link.click()
    } else if (fmt === 'svg') {
      const dataUrl = await toSvg(node)
      const link = document.createElement('a')
      link.download = 'qrni-code.svg'
      link.href = dataUrl
      link.click()
    } else if (fmt === 'pdf') {
      const dataUrl = await toPng(node, { pixelRatio: 4 })
      const pdf = new jsPDF({ unit: 'px', format: [size, size] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, size, size)
      pdf.save('qrni-code.pdf')
    }
  }, [format, size])

  return (
    <section className="preview-panel">
      <Doodles />
      <div className="preview-content">
        <div className="qr-card">
          {isValidUrl ? (
            <div className="qr-code" ref={qrRef}>
              <QRCodeCanvas
                value={url}
                size={200}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
                marginSize={2}
                imageSettings={logo ? {
                  src: logo,
                  height: 40,
                  width: 40,
                  excavate: true,
                } : undefined}
              />
            </div>
          ) : (
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
                className={`format-option ${format === f.toLowerCase() || format === f ? 'active' : ''}`}
                onClick={() => onFormatChange(f.toLowerCase())}
              >
                {f}
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
