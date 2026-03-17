import { useRef, useState, useEffect, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import { parseFile } from "../utils/bulk-utils";
import { DOT_STYLES } from "../utils/constants";
import "./BulkPanel.css";

const FORMATS = ["png", "svg", "webp"];

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
}) {
  const logoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dotRowRef = useRef(null);
  const dotDragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const [inputText, setInputText] = useState("");
  const [dragging, setDragging] = useState(false);
  const { trigger } = useWebHaptics();

  const onDotDragStart = (e) => {
    const row = dotRowRef.current;
    dotDragState.current = {
      isDown: true,
      startX: e.pageX - row.offsetLeft,
      scrollLeft: row.scrollLeft,
    };
    row.classList.add("dragging");
  };
  const onDotDragEnd = () => {
    dotDragState.current.isDown = false;
    dotRowRef.current?.classList.remove("dragging");
  };
  const onDotDragMove = (e) => {
    if (!dotDragState.current.isDown) return;
    e.preventDefault();
    const row = dotRowRef.current;
    const x = e.pageX - row.offsetLeft;
    row.scrollLeft =
      dotDragState.current.scrollLeft - (x - dotDragState.current.startX);
  };

  const handleDotRowKeyDown = (e) => {
    const row = dotRowRef.current;
    if (!row) return;
    if (e.key === "ArrowRight") {
      row.scrollLeft += 80;
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      row.scrollLeft -= 80;
      e.preventDefault();
    }
  };

  const autoParse = useCallback(
    (text) => {
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

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target.result);
    reader.readAsText(file);
    trigger("success");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target.result);
    reader.readAsText(file);
    trigger("success");
    e.target.value = "";
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLogoChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Data Input */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="links-label"
      >
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
            placeholder={
              "Homepage, https://example.com\nGoogle, https://google.com"
            }
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
          or Upload a CSV / JSON
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
      <section
        className="control-section"
        role="group"
        aria-labelledby="format-label"
      >
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

      {/* Colors */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="bulk-colors-label"
      >
        <span id="bulk-colors-label" className="control-label">
          Colors
        </span>
        <div className="color-row">
          <div className="color-group">
            <span className="color-sublabel">Foreground</span>
            <label className="color-picker">
              <input
                type="color"
                aria-label="Foreground color"
                value={fgColor}
                onClick={() => trigger("nudge")}
                onInput={(e) => {
                  onFgColorChange(e.target.value);
                  trigger(30);
                }}
                onChange={(e) => {
                  onFgColorChange(e.target.value);
                  trigger("success");
                }}
              />
              <span
                className="color-swatch"
                style={{ background: fgColor }}
                aria-hidden="true"
              />
              <span className="color-value">{fgColor.toUpperCase()}</span>
            </label>
          </div>
          <div className="color-group">
            <span className="color-sublabel">Background</span>
            <label className="color-picker">
              <input
                type="color"
                aria-label="Background color"
                value={bgColor}
                onClick={() => trigger("nudge")}
                onInput={(e) => {
                  onBgColorChange(e.target.value);
                  trigger(30);
                }}
                onChange={(e) => {
                  onBgColorChange(e.target.value);
                  trigger("success");
                }}
              />
              <span
                className="color-swatch"
                style={{ background: bgColor }}
                aria-hidden="true"
              />
              <span className="color-value">{bgColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Logo */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="bulk-logo-label"
      >
        <span id="bulk-logo-label" className="control-label">
          Logo
        </span>
        {logo ? (
          <div className="logo-preview">
            <img src={logo} alt="Custom QR code logo" className="logo-thumb" />
            <button
              className="logo-remove"
              onClick={() => {
                onLogoChange(null);
                trigger("nudge");
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-zone"
            onClick={() => {
              logoInputRef.current?.click();
              trigger("nudge");
            }}
          >
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              hidden
              aria-label="Upload logo image"
            />
            <span>Add logo</span>
          </button>
        )}
      </section>

      <hr className="divider" />

      {/* Dot Style */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="bulk-dotstyle-label"
      >
        <span id="bulk-dotstyle-label" className="control-label">
          Dot Style
        </span>
        <div
          className="dot-row"
          ref={dotRowRef}
          role="radiogroup"
          aria-label="Dot style"
          onMouseDown={onDotDragStart}
          onMouseLeave={onDotDragEnd}
          onMouseUp={onDotDragEnd}
          onMouseMove={onDotDragMove}
          onKeyDown={handleDotRowKeyDown}
        >
          {DOT_STYLES.map((ds) => (
            <button
              key={ds.id}
              role="radio"
              aria-checked={dotStyle === ds.id}
              className={`dot-option ${dotStyle === ds.id ? "active" : ""}`}
              onClick={() => {
                onDotStyleChange(ds.id);
                trigger("success");
              }}
            >
              <span
                className={`dot-icon dot-icon-${ds.id}`}
                aria-hidden="true"
              />
              <span className="dot-option-label">{ds.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Size */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="bulk-size-label"
      >
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

      <footer className="panel-footer panel-footer-desktop">
        <span>Powered by</span>
        <a
          href="https://imbensantos.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit imBento website"
        >
          <img
            src="/imbento-logo-dark.svg"
            alt="imBento"
            className="imbento-logo"
          />
        </a>
      </footer>
    </>
  );
}

export default BulkPanel;
