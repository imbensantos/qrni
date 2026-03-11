import { useState } from 'react'
import { generateZip, generatePdf } from '../utils/bulk-export'
import Doodles from './Doodles'
import './BulkPreview.css'

function BulkPreview({
  entries,
  fgColor, bgColor, logo, dotStyle, size, format,
}) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const validCount = entries.filter((e) => e.valid).length
  const invalidCount = entries.length - validCount

  const styleOptions = { fgColor, bgColor, dotStyle, logo, size }

  const handleZip = async () => {
    setGenerating(true)
    try {
      await generateZip(entries, styleOptions, format, (current, total) => {
        setProgress({ current, total })
      })
    } finally {
      setGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handlePdf = async () => {
    setGenerating(true)
    try {
      await generatePdf(entries, styleOptions, (current, total) => {
        setProgress({ current, total })
      })
    } finally {
      setGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  if (entries.length === 0) {
    return (
      <section className="bulk-preview">
        <Doodles />
        <div className="bulk-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>Upload a CSV or JSON file to get started</p>
          <p className="bulk-empty-hint">
            Format: each row needs a <strong>label</strong> and a <strong>url</strong>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bulk-preview">
      <Doodles />
      <div className="bulk-preview-content">
        {/* Summary */}
        <div className="bulk-summary">
          <span className="bulk-summary-valid">{validCount} valid</span>
          {invalidCount > 0 && (
            <span className="bulk-summary-invalid">{invalidCount} invalid</span>
          )}
          <span className="bulk-summary-total">{entries.length} total</span>
        </div>

        {/* Table */}
        <div className="bulk-table-wrapper">
          <table className="bulk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Label</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.index} className={entry.valid ? '' : 'bulk-row-invalid'}>
                  <td>{entry.index}</td>
                  <td className="bulk-cell-label">{entry.label || '—'}</td>
                  <td className="bulk-cell-url">{entry.url || '—'}</td>
                  <td>
                    {entry.valid ? (
                      <span className="bulk-status-valid">Valid</span>
                    ) : (
                      <span className="bulk-status-invalid" title={entry.error}>
                        {entry.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Progress */}
        {generating && (
          <div className="bulk-progress">
            <div className="bulk-progress-bar">
              <div
                className="bulk-progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span className="bulk-progress-text">
              Generating {progress.current} of {progress.total}...
            </span>
          </div>
        )}

        {/* Export buttons */}
        {!generating && (
          <div className="bulk-export-bar">
            <button
              className="download-btn"
              onClick={handleZip}
              disabled={validCount === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download ZIP
            </button>
            <button
              className="download-btn bulk-btn-secondary"
              onClick={handlePdf}
              disabled={validCount === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Download PDF
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default BulkPreview
