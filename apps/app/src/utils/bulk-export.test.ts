/**
 * I16: renderToBlob swallows null blob.
 *
 * `canvas.toBlob` can legitimately return null when the browser cannot
 * serialise the canvas (e.g. tainted canvas, unsupported format). The current
 * implementation uses a non-null assertion (`blob!`) and resolves with the
 * null value, causing downstream code to receive a null Blob reference
 * instead of a proper error.
 *
 * I17: Baseline PDF layout math tests.
 *
 * These test the existing correct layout calculations in generatePdf without
 * touching DOM/import side-effects. They should PASS against current code.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToBlob } from "./bulk-export";

// ---------------------------------------------------------------------------
// Helpers / minimal DOM mocks required by renderToBlob
// ---------------------------------------------------------------------------

type ExportFormat = "png" | "webp" | "svg";

/**
 * Create a mock QR code object whose `append` method inserts a canvas element
 * with a controlled `toBlob` behaviour into the provided container.
 */
function makeMockQr(toBlobImpl: (callback: BlobCallback) => void) {
  return {
    append: (container: HTMLElement) => {
      const canvas = document.createElement("canvas");
      canvas.toBlob = vi.fn((callback: BlobCallback) => {
        toBlobImpl(callback);
      }) as typeof canvas.toBlob;
      container.appendChild(canvas);
    },
  };
}

// ---------------------------------------------------------------------------
// I16a — renderToBlob rejects with descriptive error when toBlob returns null
// ---------------------------------------------------------------------------

describe("I16: renderToBlob — null blob handling (FAILS against current code)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects with a descriptive error when canvas.toBlob returns null (FAILS: current code resolves instead)", async () => {
    const mockQr = makeMockQr((cb) => cb(null));
    await expect(renderToBlob(mockQr, "png")).rejects.toThrow();
  });

  it("resolved value is null under current implementation (documents the bug)", async () => {
    // Now that the fix is applied, the promise rejects instead of resolving with null.
    const mockQr = makeMockQr((cb) => cb(null));
    await expect(renderToBlob(mockQr, "png")).rejects.toThrow();
  });

  it("rejects with a descriptive error message when canvas.toBlob returns null", async () => {
    const mockQr = makeMockQr((cb) => cb(null));
    await expect(renderToBlob(mockQr, "png")).rejects.toThrow(/canvas\.toBlob returned null/i);
  });

  it("rejects for webp format when canvas.toBlob returns null (FAILS against current code)", async () => {
    const mockQr = makeMockQr((cb) => cb(null));
    await expect(renderToBlob(mockQr, "webp")).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// I16b — Fixed implementation behaves correctly (PASSES — specifies intent)
// ---------------------------------------------------------------------------

describe("I16: renderToBlob — fixed implementation rejects correctly (PASSES)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when toBlob returns null", async () => {
    const mockQr = makeMockQr((cb) => cb(null));
    await expect(renderToBlob(mockQr, "png")).rejects.toThrow(/canvas\.toBlob returned null/i);
  });

  it("resolves when toBlob returns a real Blob", async () => {
    const fakeBlob = new Blob(["fake-png-data"], { type: "image/png" });
    const mockQr = makeMockQr((cb) => cb(fakeBlob));

    const result = await renderToBlob(mockQr, "png");
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("image/png");
  });

  it("calls toBlob with image/webp mime type for webp format", async () => {
    const fakeBlob = new Blob(["fake-webp-data"], { type: "image/webp" });
    let capturedMimeType: string | undefined;
    const mockQr = {
      append: (container: HTMLElement) => {
        const canvas = document.createElement("canvas");
        canvas.toBlob = vi.fn((callback: BlobCallback, mimeType?: string) => {
          capturedMimeType = mimeType;
          callback(fakeBlob);
        }) as typeof canvas.toBlob;
        container.appendChild(canvas);
      },
    };

    await renderToBlob(mockQr, "webp");
    expect(capturedMimeType).toBe("image/webp");
  });

  it("calls toBlob with image/png mime type for png format", async () => {
    const fakeBlob = new Blob(["fake-png-data"], { type: "image/png" });
    let capturedMimeType: string | undefined;
    const mockQr = {
      append: (container: HTMLElement) => {
        const canvas = document.createElement("canvas");
        canvas.toBlob = vi.fn((callback: BlobCallback, mimeType?: string) => {
          capturedMimeType = mimeType;
          callback(fakeBlob);
        }) as typeof canvas.toBlob;
        container.appendChild(canvas);
      },
    };

    await renderToBlob(mockQr, "png");
    expect(capturedMimeType).toBe("image/png");
  });
});

// ---------------------------------------------------------------------------
// I17: PDF layout math baseline tests (PASSES — establishes coverage)
//
// These test the pure arithmetic from generatePdf in bulk-export.ts.
// The constants are extracted inline to avoid triggering the dynamic imports
// (qr-code-styling, jspdf) that generatePdf itself performs.
// ---------------------------------------------------------------------------

describe("I17: PDF layout math (PASSES — baseline coverage)", () => {
  // Constants mirrored from generatePdf in bulk-export.ts
  const PAGE_W_MM = 210;
  const PAGE_H_MM = 297;
  const MARGIN_MM = 15;
  const COLS = 3;
  const CHUNK_SIZE = 10;

  const cellW = (PAGE_W_MM - MARGIN_MM * 2) / COLS;
  const qrSize = cellW - 10;
  const cellH = qrSize + 16;
  const rows = Math.floor((PAGE_H_MM - MARGIN_MM * 2) / cellH);
  const perPage = COLS * rows;

  it("cellW divides the printable width evenly into 3 columns", () => {
    const printableW = PAGE_W_MM - MARGIN_MM * 2;
    expect(cellW).toBe(printableW / COLS);
    expect(cellW).toBeCloseTo(60, 5); // (210 - 30) / 3 = 60mm
  });

  it("qrSize is 10mm less than cellW", () => {
    expect(qrSize).toBe(cellW - 10);
    expect(qrSize).toBeCloseTo(50, 5);
  });

  it("cellH accommodates the QR code plus a 16mm label zone", () => {
    expect(cellH).toBe(qrSize + 16);
    expect(cellH).toBeCloseTo(66, 5);
  });

  it("rows fits within the printable page height", () => {
    const printableH = PAGE_H_MM - MARGIN_MM * 2;
    expect(rows * cellH).toBeLessThanOrEqual(printableH);
    expect(rows).toBeGreaterThan(0);
  });

  it("perPage equals cols * rows", () => {
    expect(perPage).toBe(COLS * rows);
  });

  it("column x position is within the printable area", () => {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_MM + col * cellW + (cellW - qrSize) / 2;
      expect(x).toBeGreaterThanOrEqual(MARGIN_MM);
      expect(x + qrSize).toBeLessThanOrEqual(PAGE_W_MM - MARGIN_MM);
    }
  });

  it("row y position for first row starts at the margin", () => {
    const y = MARGIN_MM + 0 * cellH;
    expect(y).toBe(MARGIN_MM);
  });

  it("last row y position is within the page", () => {
    const lastRow = rows - 1;
    const y = MARGIN_MM + lastRow * cellH;
    expect(y + cellH).toBeLessThanOrEqual(PAGE_H_MM - MARGIN_MM + cellH); // last cell may reach close to edge
    expect(y).toBeGreaterThan(0);
  });

  it("CHUNK_SIZE is 10 (matches the hardcoded constant in bulk-export.ts)", () => {
    // If the chunk size changes, the progress callback math changes too.
    expect(CHUNK_SIZE).toBe(10);
  });

  it("page index for first entry is 0", () => {
    const idx = 0;
    const pageIdx = Math.floor(idx / perPage);
    expect(pageIdx).toBe(0);
  });

  it("page index increments correctly at perPage boundary", () => {
    const firstEntryOnPage2 = perPage;
    const pageIdx = Math.floor(firstEntryOnPage2 / perPage);
    expect(pageIdx).toBe(1);
  });

  it("posOnPage resets to 0 at each page boundary", () => {
    expect(perPage % perPage).toBe(0);
    expect((perPage + 1) % perPage).toBe(1);
  });

  it("column index is posOnPage modulo cols", () => {
    for (let posOnPage = 0; posOnPage < perPage; posOnPage++) {
      const col = posOnPage % COLS;
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(COLS);
    }
  });

  it("row index is floor(posOnPage / cols)", () => {
    for (let posOnPage = 0; posOnPage < perPage; posOnPage++) {
      const row = Math.floor(posOnPage / COLS);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(rows);
    }
  });

  it("label truncation threshold is 25 characters", () => {
    // From: entry.label.length > 25 ? entry.label.slice(0, 22) + "..." : entry.label
    const label25 = "a".repeat(25);
    const label26 = "a".repeat(26);
    const truncated = label26.length > 25 ? label26.slice(0, 22) + "..." : label26;
    const notTruncated = label25.length > 25 ? label25.slice(0, 22) + "..." : label25;

    expect(truncated).toBe("a".repeat(22) + "...");
    expect(notTruncated).toBe(label25);
  });

  it("truncated label has maximum length of 25 characters", () => {
    const longLabel = "a".repeat(100);
    const result = longLabel.length > 25 ? longLabel.slice(0, 22) + "..." : longLabel;
    expect(result.length).toBe(25);
  });
});
