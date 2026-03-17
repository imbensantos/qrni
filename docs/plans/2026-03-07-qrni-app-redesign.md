# QRni App Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the QRni app from a simple URL-to-QR generator into a feature-rich tool with color customization, logo embedding, dot style options, size control, and multiple export formats — wrapped in a warm, wholesome aesthetic.

**Architecture:** Split-panel layout (controls left, preview right) built with React components. Each feature is a controlled component lifting state to the main generator. Uses `qrcode.react` for rendering, `html-to-image` for export, and CSS for the warm pastel design system. Vector doodle decorations are inline SVGs.

**Tech Stack:** React 19, Vite 7, qrcode.react, html-to-image (new dep), Outfit font (replacing Nunito), CSS custom properties for design tokens.

**Design Reference:** `/Volumes/BNYDRV/Repos/ImBenSantos/qrni/designs/qrni-app.pen`

---

### Task 0: Set up design tokens and global styles

**Files:**

- Modify: `apps/app/src/index.css`
- Modify: `apps/app/src/App.css`

**Step 1: Replace index.css with new design tokens and global styles**

Replace the Nunito font import with Outfit. Add CSS custom properties for the design system.

```css
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap");

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-page: #f5f4f1;
  --bg-card: #ffffff;
  --bg-surface: #fafaf8;
  --bg-preview: #f8f6f3;
  --bg-muted: #edecea;

  --text-primary: #1a1918;
  --text-secondary: #6d6c6a;
  --text-tertiary: #9c9b99;

  --accent-primary: #d89575;
  --accent-primary-hover: #c8845f;
  --accent-secondary: #3d8a5a;
  --accent-light: #c8f0d8;
  --accent-warm: #fff0e8;

  --border-subtle: #e5e4e1;
  --border-strong: #d1d0cd;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 100px;

  --shadow-card: 0 2px 12px rgba(26, 25, 24, 0.03);
  --shadow-elevated: 0 4px 20px rgba(26, 25, 24, 0.06);
  --shadow-button: 0 4px 16px rgba(216, 149, 117, 0.25);
}

body {
  font-family: "Outfit", sans-serif;
  min-height: 100vh;
  background: var(--bg-page);
}

#root {
  width: 100%;
  height: 100vh;
}
```

**Step 2: Commit**

```bash
git add apps/app/src/index.css
git commit -m "feat: replace design tokens with warm pastel system"
```

---

### Task 1: Restructure App layout to split-panel

**Files:**

- Modify: `apps/app/src/App.jsx`
- Modify: `apps/app/src/App.css`

**Step 1: Rewrite App.jsx with split-panel layout**

```jsx
import { useState } from "react";
import ControlsPanel from "./components/ControlsPanel";
import PreviewPanel from "./components/PreviewPanel";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [fgColor, setFgColor] = useState("#1A1918");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [logo, setLogo] = useState(null);
  const [dotStyle, setDotStyle] = useState("square");
  const [size, setSize] = useState(512);
  const [format, setFormat] = useState("png");

  const isValidUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">QRni</h1>
        <p className="tagline">Your free QR code maker</p>
      </header>
      <main className="body">
        <ControlsPanel
          url={url}
          onUrlChange={setUrl}
          fgColor={fgColor}
          onFgColorChange={setFgColor}
          bgColor={bgColor}
          onBgColorChange={setBgColor}
          logo={logo}
          onLogoChange={setLogo}
          dotStyle={dotStyle}
          onDotStyleChange={setDotStyle}
          size={size}
          onSizeChange={setSize}
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
  );
}

export default App;
```

**Step 2: Rewrite App.css for split-panel layout**

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 28px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
}

.logo {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .body {
    flex-direction: column;
    overflow-y: auto;
  }
}
```

**Step 3: Commit**

```bash
git add apps/app/src/App.jsx apps/app/src/App.css
git commit -m "feat: restructure app layout to split-panel"
```

---

### Task 2: Build ControlsPanel component

**Files:**

- Create: `apps/app/src/components/ControlsPanel.jsx`
- Create: `apps/app/src/components/ControlsPanel.css`

**Step 1: Create ControlsPanel.jsx**

Component receives all control state as props. Sections: URL input, Colors (fg/bg pickers), Logo upload, Dot Style toggles, Size slider.

```jsx
import "./ControlsPanel.css";

const DOT_STYLES = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "dots", label: "Dots" },
  { id: "diamond", label: "Diamond" },
];

function ControlsPanel({
  url,
  onUrlChange,
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
}) {
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLogoChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <aside className="controls-panel">
      {/* URL */}
      <section className="control-section">
        <label className="control-label">URL</label>
        <input
          type="url"
          className="url-input"
          placeholder="Paste a URL to get started"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          autoFocus
        />
      </section>

      <hr className="divider" />

      {/* Colors */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Colors</span>
        </div>
        <div className="color-row">
          <div className="color-group">
            <span className="color-sublabel">Foreground</span>
            <label className="color-picker">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => onFgColorChange(e.target.value)}
              />
              <span className="color-swatch" style={{ background: fgColor }} />
              <span className="color-value">{fgColor.toUpperCase()}</span>
            </label>
          </div>
          <div className="color-group">
            <span className="color-sublabel">Background</span>
            <label className="color-picker">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
              />
              <span className="color-swatch" style={{ background: bgColor }} />
              <span className="color-value">{bgColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Logo */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Logo</span>
        </div>
        {logo ? (
          <div className="logo-preview">
            <img src={logo} alt="Logo" className="logo-thumb" />
            <button className="logo-remove" onClick={() => onLogoChange(null)}>
              Remove
            </button>
          </div>
        ) : (
          <label className="upload-zone">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              hidden
            />
            <span>Add logo</span>
          </label>
        )}
      </section>

      <hr className="divider" />

      {/* Dot Style */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Dot Style</span>
        </div>
        <div className="dot-row">
          {DOT_STYLES.map((ds) => (
            <button
              key={ds.id}
              className={`dot-option ${dotStyle === ds.id ? "active" : ""}`}
              onClick={() => onDotStyleChange(ds.id)}
            >
              <span className={`dot-icon dot-icon-${ds.id}`} />
              <span className="dot-option-label">{ds.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Size */}
      <section className="control-section">
        <div className="control-header">
          <span className="control-label">Size</span>
          <span className="size-value">{size} px</span>
        </div>
        <input
          type="range"
          min={128}
          max={2048}
          step={64}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="size-slider"
        />
        <div className="size-range">
          <span>128</span>
          <span>2048</span>
        </div>
      </section>
    </aside>
  );
}

export default ControlsPanel;
```

**Step 2: Create ControlsPanel.css**

Style the controls panel with warm design tokens. Key styles: 380px width, vertical scroll, 28px padding, section gaps.

```css
.controls-panel {
  width: 380px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-card);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 1px 0 8px rgba(26, 25, 24, 0.03);
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.divider {
  border: none;
  height: 1px;
  background: var(--border-subtle);
}

/* URL Input */
.url-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  font-family: "Outfit", sans-serif;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.url-input:focus {
  border-color: var(--accent-primary);
}

.url-input::placeholder {
  color: var(--text-tertiary);
}

/* Colors */
.color-row {
  display: flex;
  gap: 16px;
}

.color-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-sublabel {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 10px;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-picker input[type="color"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.color-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

/* Logo Upload */
.upload-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 72px;
  border: 1.5px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-zone:hover {
  border-color: var(--accent-primary);
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.logo-thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.logo-remove {
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
}

.logo-remove:hover {
  color: var(--text-primary);
}

/* Dot Style */
.dot-row {
  display: flex;
  gap: 10px;
}

.dot-option {
  flex: 1;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-page);
  cursor: pointer;
  transition: all 0.2s;
}

.dot-option.active {
  background: var(--accent-warm);
  border-color: var(--accent-primary);
}

.dot-option-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.dot-option.active .dot-option-label {
  font-weight: 600;
  color: var(--accent-primary);
}

/* Dot icons */
.dot-icon {
  width: 16px;
  height: 16px;
  background: var(--text-tertiary);
}

.dot-option.active .dot-icon {
  background: var(--accent-primary);
}

.dot-icon-square {
  border-radius: 2px;
}
.dot-icon-rounded {
  border-radius: 6px;
}
.dot-icon-dots {
  border-radius: 50%;
}
.dot-icon-diamond {
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  border-radius: 1px;
}

/* Size Slider */
.size-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.size-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-muted);
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--accent-primary);
  box-shadow: 0 2px 6px rgba(26, 25, 24, 0.12);
  cursor: pointer;
}

.size-range {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
}

/* Mobile */
@media (max-width: 768px) {
  .controls-panel {
    width: 100%;
    height: auto;
    max-height: 50vh;
  }
}
```

**Step 3: Commit**

```bash
git add apps/app/src/components/ControlsPanel.jsx apps/app/src/components/ControlsPanel.css
git commit -m "feat: add ControlsPanel with all customization options"
```

---

### Task 3: Build PreviewPanel component

**Files:**

- Create: `apps/app/src/components/PreviewPanel.jsx`
- Create: `apps/app/src/components/PreviewPanel.css`
- Create: `apps/app/src/components/Doodles.jsx`

**Step 1: Create Doodles.jsx — SVG vector decorations**

Export a component that renders all the sparkles, hearts, rings, waves, corner brackets, etc. as inline SVGs positioned absolutely within the preview panel.

```jsx
export default function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      {/* Sparkles */}
      <svg
        className="doodle doodle-sparkle-1"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          d="M16 0L18 12L26 6L20 14L32 16L20 18L26 26L18 20L16 32L14 20L6 26L12 18L0 16L12 14L6 6L14 12Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="doodle doodle-sparkle-2"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 0L14 9L20 4L15 11L24 12L15 13L20 20L14 15L12 24L10 15L4 20L9 13L0 12L9 11L4 4L10 9Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="doodle doodle-sparkle-3"
        width="18"
        height="18"
        viewBox="0 0 18 18"
      >
        <path
          d="M9 0L10 7L15 3L11 8L18 9L11 10L15 15L10 11L9 18L8 11L3 15L7 10L0 9L7 8L3 3L8 7Z"
          fill="currentColor"
        />
      </svg>

      {/* Hearts */}
      <svg
        className="doodle doodle-heart-1"
        width="20"
        height="18"
        viewBox="0 0 20 18"
      >
        <path
          d="M10 18L8.5 16.6C3.4 12 0 9 0 5.2C0 2.3 2.3 0 5.2 0C6.8 0 8.4 .7 10 2.1C11.6 .7 13.2 0 14.8 0C17.7 0 20 2.3 20 5.2C20 9 16.6 12 11.5 16.6L10 18Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="doodle doodle-heart-2"
        width="16"
        height="14"
        viewBox="0 0 16 14"
      >
        <path
          d="M8 14L6.8 13C2.7 9.6 0 7.2 0 4.2C0 1.8 1.8 0 4.2 0C5.4 0 6.7 .6 8 1.7C9.3 .6 10.6 0 11.8 0C14.2 0 16 1.8 16 4.2C16 7.2 13.3 9.6 9.2 13L8 14Z"
          fill="currentColor"
        />
      </svg>

      {/* Corner brackets around QR card */}
      <svg
        className="doodle doodle-corner-tl"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 16L0 4C0 2 2 0 4 0L16 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="doodle doodle-corner-tr"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 0L12 0C14 0 16 2 16 4L16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="doodle doodle-corner-bl"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <path
          d="M16 16L4 16C2 16 0 14 0 12L0 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="doodle doodle-corner-br"
        width="16"
        height="16"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 16L12 16C14 16 16 14 16 12L16 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Waves */}
      <svg
        className="doodle doodle-wave-1"
        width="50"
        height="16"
        viewBox="0 0 50 16"
      >
        <path
          d="M0 8C6 0 12 16 18 8C24 0 30 16 36 8C42 0 50 16 50 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Rings */}
      <svg
        className="doodle doodle-ring-1"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="doodle doodle-ring-2"
        width="18"
        height="18"
        viewBox="0 0 18 18"
      >
        <circle
          cx="9"
          cy="9"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      {/* Dots */}
      <svg
        className="doodle doodle-dot-1"
        width="8"
        height="8"
        viewBox="0 0 8 8"
      >
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </svg>
      <svg
        className="doodle doodle-dot-2"
        width="6"
        height="6"
        viewBox="0 0 6 6"
      >
        <circle cx="3" cy="3" r="3" fill="currentColor" />
      </svg>
      <svg
        className="doodle doodle-dot-3"
        width="4"
        height="4"
        viewBox="0 0 4 4"
      >
        <circle cx="2" cy="2" r="2" fill="currentColor" />
      </svg>

      {/* Arrow */}
      <svg
        className="doodle doodle-arrow"
        width="36"
        height="30"
        viewBox="0 0 36 30"
      >
        <path
          d="M0 24C4 8 16 0 32 4M32 4L26 0M32 4L30 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Diamond */}
      <svg
        className="doodle doodle-diamond"
        width="12"
        height="12"
        viewBox="0 0 12 12"
      >
        <path d="M6 0L12 6L6 12L0 6Z" fill="currentColor" />
      </svg>

      {/* Zigzag */}
      <svg
        className="doodle doodle-zigzag"
        width="30"
        height="16"
        viewBox="0 0 30 16"
      >
        <path
          d="M0 16L7.5 0L15 16L22.5 0L30 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
```

**Step 2: Create PreviewPanel.jsx**

Shows QR preview card, status text, format selector, download button, and footer. Includes Doodles component.

```jsx
import { useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import Doodles from "./Doodles";
import "./PreviewPanel.css";

const FORMATS = ["PNG", "SVG", "PDF"];

function PreviewPanel({
  url,
  isValidUrl,
  fgColor,
  bgColor,
  logo,
  dotStyle,
  size,
  format,
  onFormatChange,
}) {
  const qrRef = useRef(null);

  const handleDownload = useCallback(async () => {
    const node = qrRef.current;
    if (!node) return;

    const fmt = format.toLowerCase();

    if (fmt === "png") {
      const dataUrl = await toPng(node, {
        pixelRatio: size / node.offsetWidth,
      });
      const link = document.createElement("a");
      link.download = "qrni-code.png";
      link.href = dataUrl;
      link.click();
    } else if (fmt === "svg") {
      const dataUrl = await toSvg(node);
      const link = document.createElement("a");
      link.download = "qrni-code.svg";
      link.href = dataUrl;
      link.click();
    } else if (fmt === "pdf") {
      const dataUrl = await toPng(node, { pixelRatio: 4 });
      const pdf = new jsPDF({ unit: "px", format: [size, size] });
      pdf.addImage(dataUrl, "PNG", 0, 0, size, size);
      pdf.save("qrni-code.pdf");
    }
  }, [format, size]);

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
                imageSettings={
                  logo
                    ? {
                        src: logo,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="qr-placeholder">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="3" height="3" />
                <path d="M21 14v3h-3M21 21h-3v-3" />
              </svg>
              <p>Paste a URL to get started</p>
            </div>
          )}
        </div>

        <p className={`status ${isValidUrl ? "status-ready" : ""}`}>
          {isValidUrl ? "Ready to download" : "Enter a valid URL"}
        </p>

        <div className="export-bar">
          <div className="format-selector">
            {FORMATS.map((f) => (
              <button
                key={f}
                className={`format-option ${format === f.toLowerCase() || format === f ? "active" : ""}`}
                onClick={() => onFormatChange(f.toLowerCase())}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            className="download-btn"
            onClick={handleDownload}
            disabled={!isValidUrl}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>

        <footer className="footer">
          <span>Powered by</span>
          <a
            href="https://imbensantos.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>imBento</strong>
          </a>
        </footer>
      </div>
    </section>
  );
}

export default PreviewPanel;
```

**Step 3: Create PreviewPanel.css**

Style the preview panel, QR card, doodle positions/animations, format selector, download button, and footer.

```css
.preview-panel {
  flex: 1;
  position: relative;
  background: var(--bg-preview);
  overflow: hidden;
}

.preview-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 32px;
}

/* QR Card */
.qr-card {
  width: 260px;
  height: 260px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-elevated);
}

.qr-code {
  animation: fadeScaleIn 0.3s ease-out;
}

@keyframes fadeScaleIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--border-strong);
}

.qr-placeholder p {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-align: center;
  max-width: 160px;
}

/* Status */
.status {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.status-ready {
  color: var(--accent-secondary);
}

/* Export */
.export-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.format-selector {
  display: flex;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  padding: 3px;
}

.format-option {
  width: 68px;
  height: 30px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.format-option.active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(26, 25, 24, 0.06);
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 200px;
  height: 44px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent-primary);
  color: white;
  font-family: "Outfit", sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-button);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(216, 149, 117, 0.35);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Footer */
.footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.footer a {
  color: var(--text-secondary);
  text-decoration: none;
}

/* Doodles positioning & animation */
.doodles {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.doodle {
  position: absolute;
}

.doodle-sparkle-1 {
  top: 13%;
  left: 17%;
  color: var(--accent-primary);
  opacity: 0.5;
  animation: twinkle 3s ease-in-out infinite;
}
.doodle-sparkle-2 {
  top: 22%;
  right: 15%;
  color: var(--accent-secondary);
  opacity: 0.45;
  animation: twinkle 3s ease-in-out infinite 1s;
}
.doodle-sparkle-3 {
  bottom: 15%;
  left: 55%;
  color: var(--accent-primary);
  opacity: 0.35;
  animation: twinkle 3s ease-in-out infinite 2s;
}

.doodle-heart-1 {
  top: 40%;
  left: 12%;
  color: var(--accent-primary);
  opacity: 0.3;
  animation: float 4s ease-in-out infinite;
}
.doodle-heart-2 {
  bottom: 20%;
  right: 12%;
  color: var(--accent-secondary);
  opacity: 0.25;
  animation: float 4s ease-in-out infinite 2s;
}

.doodle-corner-tl {
  top: 17%;
  left: 28%;
  color: var(--accent-primary);
  opacity: 0.4;
}
.doodle-corner-tr {
  top: 17%;
  right: 28%;
  color: var(--accent-primary);
  opacity: 0.4;
}
.doodle-corner-bl {
  bottom: 30%;
  left: 28%;
  color: var(--accent-primary);
  opacity: 0.4;
}
.doodle-corner-br {
  bottom: 30%;
  right: 28%;
  color: var(--accent-primary);
  opacity: 0.4;
}

.doodle-wave-1 {
  bottom: 25%;
  left: 10%;
  color: var(--accent-primary);
  opacity: 0.25;
  animation: sway 5s ease-in-out infinite;
}

.doodle-ring-1 {
  top: 50%;
  left: 14%;
  color: var(--accent-primary);
  opacity: 0.2;
  animation: spin 12s linear infinite;
}
.doodle-ring-2 {
  top: 18%;
  right: 22%;
  color: var(--accent-secondary);
  opacity: 0.2;
  animation: spin 15s linear infinite reverse;
}

.doodle-dot-1 {
  top: 28%;
  left: 22%;
  color: var(--accent-primary);
  opacity: 0.25;
}
.doodle-dot-2 {
  bottom: 18%;
  right: 18%;
  color: var(--accent-secondary);
  opacity: 0.25;
}
.doodle-dot-3 {
  top: 45%;
  right: 10%;
  color: var(--accent-primary);
  opacity: 0.2;
}

.doodle-arrow {
  top: 24%;
  left: 18%;
  color: var(--accent-primary);
  opacity: 0.3;
}
.doodle-diamond {
  top: 14%;
  left: 52%;
  color: var(--accent-secondary);
  opacity: 0.3;
  animation: twinkle 4s ease-in-out infinite 1.5s;
}
.doodle-zigzag {
  bottom: 12%;
  right: 20%;
  color: var(--accent-primary);
  opacity: 0.25;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes sway {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .preview-panel {
    min-height: 50vh;
  }
}
```

**Step 4: Commit**

```bash
git add apps/app/src/components/PreviewPanel.jsx apps/app/src/components/PreviewPanel.css apps/app/src/components/Doodles.jsx
git commit -m "feat: add PreviewPanel with doodle decorations and export controls"
```

---

### Task 4: Install new dependencies

**Files:**

- Modify: `apps/app/package.json`

**Step 1: Install html-to-image and jspdf**

```bash
cd apps/app && npm install html-to-image jspdf
```

**Step 2: Commit**

```bash
git add apps/app/package.json apps/app/package-lock.json
git commit -m "feat: add html-to-image and jspdf for multi-format export"
```

---

### Task 5: Clean up old component files

**Files:**

- Delete: `apps/app/src/components/QrGenerator.jsx`
- Delete: `apps/app/src/components/QrGenerator.css`

**Step 1: Remove old files**

```bash
rm apps/app/src/components/QrGenerator.jsx apps/app/src/components/QrGenerator.css
```

**Step 2: Commit**

```bash
git add -u apps/app/src/components/
git commit -m "chore: remove old QrGenerator component"
```

---

### Task 6: Test the full app locally

**Step 1: Run dev server**

```bash
cd /Volumes/BNYDRV/Repos/ImBenSantos/qrni && npm run dev:app
```

**Step 2: Verify in browser**

- [ ] App loads with split-panel layout
- [ ] Header shows "QRni" and "Your free QR code maker"
- [ ] URL input accepts URLs and shows QR code preview
- [ ] Color pickers change QR foreground/background
- [ ] Logo upload embeds image in QR center
- [ ] Dot style toggles show active state (note: qrcode.react doesn't support dot styles natively — this is visual-only for now, implementation can be extended later with a custom renderer)
- [ ] Size slider updates value display
- [ ] Format selector switches between PNG/SVG/PDF
- [ ] Download button exports in selected format
- [ ] Doodle decorations are visible with animations
- [ ] Footer shows "Powered by imBento"
- [ ] Mobile view stacks panels vertically

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: QRni app redesign — split-panel layout with warm pastel aesthetic"
```

---

### Notes

- **Dot styles:** `qrcode.react` doesn't natively support dot shape customization. The toggle UI is implemented but the QR rendering uses default square dots. A future task can integrate a custom QR renderer (e.g. `qr-code-styling`) for actual dot shape rendering.
- **Mascot illustration:** The design spec includes a mascot character (transparent PNG/SVG) to be placed behind the QR card. This needs to be created externally (Procreate/Illustrator) and added as a static asset in a future task.
- **Micro-animations:** CSS animations for doodles are included (twinkle, float, sway, spin). Additional Framer Motion animations can be added later for state transitions.
