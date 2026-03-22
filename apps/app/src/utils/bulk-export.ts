import type { BulkEntry } from "./bulk-utils";
import { DOWNLOAD_FILENAME_BULK_ZIP, DOWNLOAD_FILENAME_BULK_PDF } from "./constants";
import type { ExportFormat } from "../types";

export type { ExportFormat };

export interface QrOptions {
  fgColor: string;
  bgColor: string;
  dotStyle: string;
  logo?: string | null;
  size: number;
}

async function waitForElement(
  container: HTMLElement,
  selector: string,
  timeoutMs = 5000,
): Promise<Element> {
  const interval = 10;
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    const el = container.querySelector(selector);
    if (el) return el;
    await new Promise((r) => setTimeout(r, interval));
    elapsed += interval;
  }
  throw new Error(`${selector} not rendered within ${timeoutMs}ms`);
}

function createQRCode(QRCodeStyling: any, url: string, options: QrOptions): any {
  const { fgColor, bgColor, dotStyle, logo, size } = options;
  return new QRCodeStyling({
    width: size,
    height: size,
    type: "canvas",
    data: url,
    dotsOptions: { color: fgColor, type: dotStyle },
    backgroundOptions: { color: bgColor === "transparent" ? "rgba(0,0,0,0)" : bgColor },
    cornersSquareOptions: { type: "extra-rounded" },
    imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.35 },
    image: logo || undefined,
    qrOptions: { errorCorrectionLevel: "H" },
  });
}

export async function renderToBlob(qr: any, format: ExportFormat): Promise<Blob> {
  const container = document.createElement("div");
  qr.append(container);

  if (format === "svg") {
    const svgEl = await waitForElement(container, "svg");
    const svgData = new XMLSerializer().serializeToString(svgEl);
    return new Blob([svgData], { type: "image/svg+xml" });
  }

  const canvas = (await waitForElement(container, "canvas")) as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(`canvas.toBlob returned null — canvas may be tainted or format unsupported`),
          );
        } else {
          resolve(blob);
        }
      },
      format === "webp" ? "image/webp" : "image/png",
    );
  });
}

const CHUNK_SIZE = 10;

export async function generateZip(
  entries: BulkEntry[],
  options: QrOptions,
  format: ExportFormat,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const [{ default: QRCodeStyling }, { default: JSZip }] = await Promise.all([
    import("qr-code-styling"),
    import("jszip"),
  ]);

  const zip = new JSZip();
  const validEntries = entries.filter((e) => e.valid);
  const ext = format === "svg" ? "svg" : format === "webp" ? "webp" : "png";

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (entry) => {
      const qr = createQRCode(QRCodeStyling, entry.url, options);
      const blob = await renderToBlob(qr, format);
      zip.file(`${entry.filename}.${ext}`, blob);
    });
    await Promise.all(promises);
    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length);

    // Yield to UI between chunks
    await new Promise((r) => setTimeout(r, 0));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, DOWNLOAD_FILENAME_BULK_ZIP);
}

export async function generatePdf(
  entries: BulkEntry[],
  options: QrOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const [{ default: QRCodeStyling }, { jsPDF }] = await Promise.all([
    import("qr-code-styling"),
    import("jspdf"),
  ]);

  const validEntries = entries.filter((e) => e.valid);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const cols = 3;
  const cellW = (pageW - margin * 2) / cols;
  const qrSize = cellW - 10;
  const cellH = qrSize + 16; // QR + label space
  const rows = Math.floor((pageH - margin * 2) / cellH);
  const perPage = cols * rows;

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE);

    for (const entry of chunk) {
      const idx = validEntries.indexOf(entry);
      const pageIdx = Math.floor(idx / perPage);
      const posOnPage = idx % perPage;
      const col = posOnPage % cols;
      const row = Math.floor(posOnPage / cols);

      if (posOnPage === 0 && pageIdx > 0) pdf.addPage();

      const x = margin + col * cellW + (cellW - qrSize) / 2;
      const y = margin + row * cellH;

      const qr = createQRCode(QRCodeStyling, entry.url, {
        ...options,
        size: 512,
      });
      const container = document.createElement("div");
      qr.append(container);
      const canvas = (await waitForElement(container, "canvas")) as HTMLCanvasElement;
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);

      pdf.setFontSize(8);
      pdf.setTextColor(100);
      const labelText = entry.label.length > 25 ? entry.label.slice(0, 22) + "..." : entry.label;
      pdf.text(labelText, x + qrSize / 2, y + qrSize + 6, { align: "center" });
    }

    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length);
    await new Promise((r) => setTimeout(r, 0));
  }

  pdf.save(DOWNLOAD_FILENAME_BULK_PDF);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
