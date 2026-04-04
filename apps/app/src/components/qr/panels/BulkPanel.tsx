import { useRef, useState, useEffect, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import { parseFile, type BulkEntry } from "../../../utils/bulk-utils";
import ColorPicker from "../controls/ColorPicker";
import LogoUploader from "../controls/LogoUploader";
import DotStyleSelector from "../controls/DotStyleSelector";
import AppFooter from "../../layout/AppFooter";
import "./BulkPanel.css";

const FORMATS = ["png", "svg", "webp"] as const;
type ExportFormat = (typeof FORMATS)[number];

interface BulkPanelProps {
  fgColor: string;
  onFgColorChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
  dotStyle: string;
  onDotStyleChange: (style: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onEntriesParsed: (entries: BulkEntry[]) => void;
}

function BulkPanel({
  fgColor,
  onFgColorChange,
  bgColor,
  onBgColorChange,
  logo,
  onLogoChange,
  dotStyle,
  onDotStyleChange,
  size,
  onSizeChange,
  format,
  onFormatChange,
  onEntriesParsed,
}: BulkPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState("");
  const [dragging, setDragging] = useState(false);
  const { trigger } = useWebHaptics();

  const autoParse = useCallback(
    (text: string) => {
      if (!text.trim()) {
        onEntriesParsed([]);
        return;
      }
      const isJson = text.trim().startsWith("[");
      const entries = parseFile(text, isJson ? "data.json" : "data.csv");
      onEntriesParsed(entries);
    },
    [onEntriesParsed],
  );

  useEffect(() => {
    const timer = setTimeout(() => autoParse(inputText), 400);
    return () => clearTimeout(timer);
  }, [inputText, autoParse]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target?.result as string);
    reader.readAsText(file);
    trigger("success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target?.result as string);
    reader.readAsText(file);
    trigger("success");
    e.target.value = "";
  };

  return (
    <>
      {/* Data Input */}
      <section className="control-section" role="group" aria-labelledby="links-label">
        <label id="links-label" className="control-label" htmlFor="bulk-links">
          Your Links
        </label>
        <div
          className={`data-input-wrapper${dragging ? " dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
        >
          <textarea
            ref={textareaRef}
            id="bulk-links"
            className="data-input"
            placeholder={"Homepage, https://example.com\nGoogle, https://google.com"}
            value={inputText}
            onKeyDown={() => trigger(8)}
            onBeforeInput={() => trigger(8)}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />
          {dragging && (
            <div className="drag-overlay" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Drop file here</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="file-upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Or drop a CSV / JSON here
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleFileUpload}
            hidden
            aria-label="Upload CSV or JSON file"
          />
        </button>
      </section>

      <hr className="divider" />

      {/* Format */}
      <section className="control-section" role="group" aria-labelledby="format-label">
        <span id="format-label" className="control-label">
          Export Format
        </span>
        <div
          className={`format-selector format-${FORMATS.indexOf(format)}`}
          role="radiogroup"
          aria-label="Export format"
        >
          {FORMATS.map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={format === f}
              className={`format-option ${format === f ? "active" : ""}`}
              onClick={() => {
                onFormatChange(f);
                trigger("nudge");
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Colors — shared component */}
      <ColorPicker
        fgColor={fgColor}
        onFgColorChange={onFgColorChange}
        bgColor={bgColor}
        onBgColorChange={onBgColorChange}
        labelId="bulk-colors"
      />

      <hr className="divider" />

      {/* Logo — shared component */}
      <LogoUploader logo={logo} onLogoChange={onLogoChange} labelId="bulk-logo" />

      <hr className="divider" />

      {/* Dot Style — shared component */}
      <DotStyleSelector
        dotStyle={dotStyle}
        onDotStyleChange={onDotStyleChange}
        labelId="bulk-dotstyle"
      />

      <hr className="divider" />

      {/* Size */}
      <section className="control-section" role="group" aria-labelledby="bulk-size-label">
        <div className="control-header">
          <span id="bulk-size-label" className="control-label">
            Size
          </span>
          <span className="size-value" aria-live="polite">
            {size} px
          </span>
        </div>
        <input
          type="range"
          min={128}
          max={2048}
          step={64}
          value={size}
          onChange={(e) => {
            onSizeChange(Number(e.target.value));
            trigger(15);
          }}
          className="size-slider"
          aria-label="QR code size in pixels"
          aria-valuemin={128}
          aria-valuemax={2048}
          aria-valuenow={size}
          aria-valuetext={`${size} pixels`}
        />
        <div className="size-range" aria-hidden="true">
          <span>128</span>
          <span>2048</span>
        </div>
      </section>
      <div className="panel-spacer" />

      <AppFooter className="panel-footer-desktop" />
    </>
  );
}

export default BulkPanel;
