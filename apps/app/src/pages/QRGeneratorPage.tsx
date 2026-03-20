import { useWebHaptics } from "web-haptics/react";
import { isValidUrl } from "../utils/bulk-utils";
import { useQROptions } from "../hooks/useQROptions";
import ControlsPanel from "../components/ControlsPanel";
import PreviewPanel from "../components/PreviewPanel";
import BulkPanel from "../components/BulkPanel";
import BulkPreview from "../components/BulkPreview";
import AdSlot from "../components/AdSlot";

function QRGeneratorPage() {
  const qr = useQROptions();
  const { trigger } = useWebHaptics();
  const urlIsValid = isValidUrl(qr.url);

  return (
    <main className="body" id="main-content">
      <div className="sidebar-panel">
        <div className={`mode-toggle ${qr.mode}`} role="group" aria-label="Generation mode">
          <button
            className={`mode-btn ${qr.mode === "single" ? "active" : ""}`}
            aria-pressed={qr.mode === "single"}
            onClick={() => {
              qr.setMode("single");
              trigger("nudge");
            }}
          >
            Single
          </button>
          <button
            className={`mode-btn ${qr.mode === "bulk" ? "active" : ""}`}
            aria-pressed={qr.mode === "bulk"}
            onClick={() => {
              qr.setMode("bulk");
              trigger("nudge");
            }}
          >
            Bulk
          </button>
        </div>
        {qr.mode === "single" ? (
          <ControlsPanel
            url={qr.url}
            onUrlChange={qr.onUrlChange}
            fgColor={qr.fgColor}
            onFgColorChange={qr.setFgColor}
            bgColor={qr.bgColor}
            onBgColorChange={qr.setBgColor}
            logo={qr.logo}
            onLogoChange={qr.setLogo}
            dotStyle={qr.dotStyle}
            onDotStyleChange={qr.setDotStyle}
            size={qr.size}
            onSizeChange={qr.setSize}
            shortenLink={qr.shortenLink}
            onShortenLinkChange={qr.onShortenLinkChange}
            onShortLinkCreated={qr.setShortLinkResult}
            onGenerate={() => qr.setQrGenerated(true)}
          />
        ) : (
          <BulkPanel
            fgColor={qr.fgColor}
            onFgColorChange={qr.setFgColor}
            bgColor={qr.bgColor}
            onBgColorChange={qr.setBgColor}
            logo={qr.logo}
            onLogoChange={qr.setLogo}
            dotStyle={qr.dotStyle}
            onDotStyleChange={qr.setDotStyle}
            size={qr.size}
            onSizeChange={qr.setSize}
            format={qr.format}
            onFormatChange={qr.setFormat}
            onEntriesParsed={qr.setBulkEntries}
          />
        )}
      </div>
      <AdSlot slot="MOBILE_INFEED_SLOT_ID" format="rectangle" className="ad-slot--mobile-infeed" />
      {qr.mode === "single" ? (
        <PreviewPanel
          url={qr.url}
          isValidUrl={urlIsValid && qr.qrGenerated}
          fgColor={qr.fgColor}
          bgColor={qr.bgColor}
          logo={qr.logo}
          dotStyle={qr.dotStyle}
          size={qr.size}
          format={qr.format}
          onFormatChange={qr.setFormat}
          shortenLink={qr.shortenLink}
          shortLinkResult={qr.shortLinkResult}
        />
      ) : (
        <BulkPreview
          entries={qr.bulkEntries}
          onEntriesChange={qr.setBulkEntries}
          fgColor={qr.fgColor}
          bgColor={qr.bgColor}
          logo={qr.logo}
          dotStyle={qr.dotStyle}
          size={qr.size}
          format={qr.format}
        />
      )}
    </main>
  );
}

export default QRGeneratorPage;
