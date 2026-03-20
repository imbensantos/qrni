import { useState } from "react";
import type { ExportFormat } from "../utils/bulk-export";
import type { ShortLinkResult } from "../types";
import type { BulkEntry } from "../utils/bulk-utils";

type QRMode = "single" | "bulk";

export function useQROptions() {
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

  const handleShortenLinkChange = (v: boolean) => {
    setShortenLink(v);
    try {
      localStorage.setItem("qrni-shorten-link", String(v));
    } catch {
      /* private browsing */
    }
  };

  const handleUrlChange = (v: string) => {
    setUrl(v);
    setQrGenerated(false);
  };

  return {
    mode,
    setMode,
    url,
    onUrlChange: handleUrlChange,
    fgColor,
    setFgColor,
    bgColor,
    setBgColor,
    logo,
    setLogo,
    dotStyle,
    setDotStyle,
    size,
    setSize,
    format,
    setFormat,
    bulkEntries,
    setBulkEntries,
    shortenLink,
    onShortenLinkChange: handleShortenLinkChange,
    shortLinkResult,
    setShortLinkResult,
    qrGenerated,
    setQrGenerated,
  };
}
