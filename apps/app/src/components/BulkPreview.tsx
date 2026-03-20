import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useWebHaptics } from "web-haptics/react";
import { generateZip, generatePdf, type ExportFormat } from "../utils/bulk-export";
import { isValidUrl, sanitizeLabel, deduplicateLabels, type BulkEntry } from "../utils/bulk-utils";
import Doodles from "./Doodles";
import AdSlot from "./AdSlot";
import "./BulkPreview.css";

interface BulkPreviewProps {
  entries: BulkEntry[];
  onEntriesChange: (entries: BulkEntry[]) => void;
  fgColor: string;
  bgColor: string;
  logo: string | null;
  dotStyle: string;
  size: number;
  format: ExportFormat;
}

function BulkPreview({
  entries,
  onEntriesChange,
  fgColor,
  bgColor,
  logo,
  dotStyle,
  size,
  format,
}: BulkPreviewProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [exportError, setExportError] = useState<string | null>(null);
  const { trigger } = useWebHaptics();

  const validCount = entries.filter((e) => e.valid).length;
  const invalidCount = entries.length - validCount;

  const styleOptions = { fgColor, bgColor, dotStyle, logo, size };

  const handleAddRow = useCallback(() => {
    const nextIndex = entries.length > 0 ? Math.max(...entries.map((e) => e.index)) + 1 : 1;
    const newEntry: BulkEntry = {
      index: nextIndex,
      label: "",
      url: "",
      filename: "qr-code",
      valid: false,
      error: "Missing label",
    };
    onEntriesChange(deduplicateLabels([...entries, newEntry]));
    trigger("nudge");
  }, [entries, onEntriesChange, trigger]);

  const handleCellEdit = useCallback(
    (index: number, field: "label" | "url", value: string) => {
      const updated = entries.map((entry) => {
        if (entry.index !== index) return entry;
        const newEntry = { ...entry, [field]: value };
        const label = newEntry.label.trim();
        const url = newEntry.url.trim();
        const valid = isValidUrl(url);
        const error = !label
          ? "Missing label"
          : !url
            ? "Missing URL"
            : !valid
              ? "Invalid URL (must start with http:// or https://)"
              : null;
        return {
          ...newEntry,
          filename: sanitizeLabel(label),
          valid: !!label && valid,
          error,
        };
      });
      onEntriesChange(deduplicateLabels(updated));
    },
    [entries, onEntriesChange],
  );

  const handleZip = async () => {
    setGenerating(true);
    setExportError(null);
    trigger("nudge");
    try {
      await generateZip(entries, styleOptions, format, (current, total) => {
        setProgress({ current, total });
      });
      trigger("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate ZIP";
      setExportError(message);
      trigger("error");
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handlePdf = async () => {
    setGenerating(true);
    setExportError(null);
    trigger("nudge");
    try {
      await generatePdf(entries, styleOptions, (current, total) => {
        setProgress({ current, total });
      });
      trigger("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate PDF";
      setExportError(message);
      trigger("error");
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  if (entries.length === 0) {
    return (
      <section className="bulk-preview" aria-label="Bulk QR code preview">
        <Doodles />
        <div className="bulk-empty">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p>Upload a CSV or JSON file to get started</p>
          <p className="bulk-empty-hint">
            Format: each row needs a <strong>label</strong> and a <strong>url</strong>
          </p>
        </div>
        <AdSlot
          slot="PREVIEW_PANEL_SLOT_ID"
          format="horizontal"
          className="ad-slot--bulk-preview"
        />
        <footer className="panel-footer panel-footer-mobile">
          <p className="copyright-footer">
            &copy; {new Date().getFullYear()} QRni &middot;{" "}
            <Link to="/privacy" className="footer-link">
              Privacy
            </Link>
          </p>
          <span className="powered-by">
            Powered by
            <a
              href="https://imbensantos.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit imBento website"
            >
              <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
            </a>
          </span>
        </footer>
      </section>
    );
  }

  return (
    <section className="bulk-preview" aria-label="Bulk QR code preview">
      <Doodles />
      <div className="bulk-preview-content">
        {/* Summary */}
        <div className="bulk-summary" aria-live="polite" aria-atomic="true">
          <span className="bulk-summary-valid">{validCount} valid</span>
          {invalidCount > 0 && <span className="bulk-summary-invalid">{invalidCount} invalid</span>}
          <span className="bulk-summary-total">{entries.length} total</span>
        </div>

        {/* Table */}
        <div className="bulk-table-wrapper">
          <table className="bulk-table" aria-label="QR code entries">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Label</th>
                <th scope="col">URL</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.index} className={entry.valid ? "" : "bulk-row-invalid"}>
                  <td>{entry.index}</td>
                  <td className="bulk-cell-label">
                    <input
                      className="bulk-cell-input"
                      value={entry.label}
                      onKeyDown={() => trigger(8)}
                      onBeforeInput={() => trigger(8)}
                      onChange={(e) => handleCellEdit(entry.index, "label", e.target.value)}
                      placeholder="Label"
                      aria-label={`Label for row ${entry.index}`}
                    />
                  </td>
                  <td className="bulk-cell-url">
                    <input
                      className="bulk-cell-input"
                      value={entry.url}
                      onKeyDown={() => trigger(8)}
                      onBeforeInput={() => trigger(8)}
                      onChange={(e) => handleCellEdit(entry.index, "url", e.target.value)}
                      placeholder="https://..."
                      aria-label={`URL for row ${entry.index}`}
                    />
                  </td>
                  <td>
                    {entry.valid ? (
                      <span className="bulk-status-valid">Valid</span>
                    ) : (
                      <span className="bulk-status-invalid" role="alert">
                        {entry.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="bulk-add-row" onClick={handleAddRow} aria-label="Add new QR code entry">
          + Add row
        </button>

        {/* Progress */}
        {generating && (
          <div className="bulk-progress" role="status" aria-live="polite">
            <div
              className="bulk-progress-bar"
              role="progressbar"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-label="Generation progress"
            >
              <div
                className="bulk-progress-fill"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="bulk-progress-text">
              Generating {progress.current} of {progress.total}...
            </span>
          </div>
        )}

        {/* Export error */}
        {exportError && (
          <div className="bulk-export-error" role="alert">
            <span>{exportError}</span>
            <button
              className="bulk-export-error-dismiss"
              onClick={() => setExportError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Export buttons */}
        {!generating && (
          <div className="bulk-export-bar">
            <button
              className="download-btn"
              onClick={handleZip}
              disabled={validCount === 0}
              aria-label="Download QR codes as ZIP"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download ZIP
            </button>
            <button
              className="download-btn bulk-btn-secondary"
              onClick={handlePdf}
              disabled={validCount === 0}
              aria-label="Download QR codes as PDF"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Download PDF
            </button>
          </div>
        )}

        <AdSlot slot="PREVIEW_PANEL_SLOT_ID" format="horizontal" className="ad-slot--preview" />
      </div>
    </section>
  );
}

export default BulkPreview;
