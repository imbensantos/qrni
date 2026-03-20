import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { isValidUrl, type BulkEntry } from "../utils/bulk-utils";
import { type ExportFormat } from "../utils/bulk-export";
import type { ShortLinkResult } from "../types";
import ControlsPanel from "../components/ControlsPanel";
import PreviewPanel from "../components/PreviewPanel";
import BulkPanel from "../components/BulkPanel";
import BulkPreview from "../components/BulkPreview";
import AdSlot from "../components/AdSlot";

type QRMode = "single" | "bulk";

function QRGeneratorPage() {
  const [mode, setMode] = useState<QRMode>("single");
  const [url, setUrl] = useState("");
  const [fgColor, setFgColor] = useState("#1A1918");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [logo, setLogo] = useState<string | null>(null);
  const [dotStyle, setDotStyle] = useState("square");
  const [size, setSize] = useState(512);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [bulkEntries, setBulkEntries] = useState<BulkEntry[]>([]);
  const [shortenLink, setShortenLink] = useState(() => {
    try {
      return localStorage.getItem("qrni-shorten-link") === "true";
    } catch {
      return false;
    }
  });
  const [shortLinkResult, setShortLinkResult] = useState<ShortLinkResult | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const { trigger } = useWebHaptics();

  const urlIsValid = isValidUrl(url);

  return (
    <main className="body" id="main-content">
      <div className="sidebar-panel">
        <div className={`mode-toggle ${mode}`} role="group" aria-label="Generation mode">
          <button
            className={`mode-btn ${mode === "single" ? "active" : ""}`}
            aria-pressed={mode === "single"}
            onClick={() => {
              setMode("single");
              trigger("nudge");
            }}
          >
            Single
          </button>
          <button
            className={`mode-btn ${mode === "bulk" ? "active" : ""}`}
            aria-pressed={mode === "bulk"}
            onClick={() => {
              setMode("bulk");
              trigger("nudge");
            }}
          >
            Bulk
          </button>
        </div>
        {mode === "single" ? (
          <ControlsPanel
            url={url}
            onUrlChange={(v) => {
              setUrl(v);
              setQrGenerated(false);
            }}
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
            shortenLink={shortenLink}
            onShortenLinkChange={(v) => {
              setShortenLink(v);
              try {
                localStorage.setItem("qrni-shorten-link", String(v));
              } catch {
                /* private browsing */
              }
            }}
            onShortLinkCreated={setShortLinkResult}
            onGenerate={() => setQrGenerated(true)}
          />
        ) : (
          <BulkPanel
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
            format={format}
            onFormatChange={setFormat}
            onEntriesParsed={setBulkEntries}
          />
        )}
      </div>
      <AdSlot slot="MOBILE_INFEED_SLOT_ID" format="rectangle" className="ad-slot--mobile-infeed" />
      {mode === "single" ? (
        <PreviewPanel
          url={url}
          isValidUrl={urlIsValid && qrGenerated}
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
  );
}

export default QRGeneratorPage;
