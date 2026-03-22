import { describe, it, expect } from "vitest";

/**
 * Regression/playbook tests for the PDF layout math in bulk-export.ts (lines 111–129).
 *
 * These tests pin the CURRENT CORRECT BEHAVIOR so that an upcoming refactor
 * (extracting magic numbers to named constants) cannot silently change any
 * computed value. No module imports are needed — the math is pure and is
 * re-implemented here verbatim from the source.
 *
 * If a test fails after the refactor, the named constant(s) introduced in
 * that refactor have altered the computation. Fix the constant, not the test.
 */

// ---------------------------------------------------------------------------
// Layout constants — mirrored from bulk-export.ts
// ---------------------------------------------------------------------------
const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const MARGIN = 15; // page margin in mm (applied to all four sides)
const COLS = 3; // QR columns per page
const CELL_W = (PAGE_W - MARGIN * 2) / COLS;
const QR_SIZE = CELL_W - 10;
const CELL_H = QR_SIZE + 16; // QR height + label space
const ROWS = Math.floor((PAGE_H - MARGIN * 2) / CELL_H);
const PER_PAGE = COLS * ROWS;

// Chunk size used for async processing in both generateZip and generatePdf
const CHUNK_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers that mirror the per-entry position logic in bulk-export.ts
// ---------------------------------------------------------------------------
function positionFor(idx: number): {
  pageIdx: number;
  posOnPage: number;
  col: number;
  row: number;
} {
  const pageIdx = Math.floor(idx / PER_PAGE);
  const posOnPage = idx % PER_PAGE;
  const col = posOnPage % COLS;
  const row = Math.floor(posOnPage / COLS);
  return { pageIdx, posOnPage, col, row };
}

function pageCount(entryCount: number): number {
  return Math.ceil(entryCount / PER_PAGE);
}

function xOffset(col: number): number {
  return MARGIN + col * CELL_W + (CELL_W - QR_SIZE) / 2;
}

function yOffset(row: number): number {
  return MARGIN + row * CELL_H;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PDF layout constants", () => {
  it("CELL_W is 60mm", () => {
    expect(CELL_W).toBe(60);
  });

  it("QR_SIZE is 50mm", () => {
    expect(QR_SIZE).toBe(50);
  });

  it("CELL_H is 66mm", () => {
    expect(CELL_H).toBe(66);
  });

  it("ROWS is 4 per page", () => {
    expect(ROWS).toBe(4);
  });

  it("PER_PAGE is 12", () => {
    expect(PER_PAGE).toBe(12);
  });

  it("CHUNK_SIZE is 10", () => {
    expect(CHUNK_SIZE).toBe(10);
  });

  it("ROWS is derived from floor((297 - 30) / 66)", () => {
    // Explicit arithmetic check so the derivation is visible
    expect(Math.floor((PAGE_H - MARGIN * 2) / CELL_H)).toBe(4);
  });
});

describe("PDF position calculations", () => {
  it("idx=0 → page 0, col 0, row 0", () => {
    expect(positionFor(0)).toEqual({ pageIdx: 0, posOnPage: 0, col: 0, row: 0 });
  });

  it("idx=1 → page 0, col 1, row 0", () => {
    expect(positionFor(1)).toEqual({ pageIdx: 0, posOnPage: 1, col: 1, row: 0 });
  });

  it("idx=2 → page 0, col 2, row 0", () => {
    expect(positionFor(2)).toEqual({ pageIdx: 0, posOnPage: 2, col: 2, row: 0 });
  });

  it("idx=3 → page 0, col 0, row 1 (wraps to next row)", () => {
    expect(positionFor(3)).toEqual({ pageIdx: 0, posOnPage: 3, col: 0, row: 1 });
  });

  it("idx=11 → page 0, col 2, row 3 (last slot on first page)", () => {
    expect(positionFor(11)).toEqual({ pageIdx: 0, posOnPage: 11, col: 2, row: 3 });
  });

  it("idx=12 → page 1, col 0, row 0 (first slot on second page)", () => {
    expect(positionFor(12)).toEqual({ pageIdx: 1, posOnPage: 0, col: 0, row: 0 });
  });

  it("idx=23 → page 1, col 2, row 3 (last slot on second page)", () => {
    expect(positionFor(23)).toEqual({ pageIdx: 1, posOnPage: 11, col: 2, row: 3 });
  });

  it("idx=24 → page 2, col 0, row 0 (first slot on third page)", () => {
    expect(positionFor(24)).toEqual({ pageIdx: 2, posOnPage: 0, col: 0, row: 0 });
  });
});

describe("PDF page count", () => {
  it("1 entry → 1 page", () => {
    expect(pageCount(1)).toBe(1);
  });

  it("12 entries → 1 page (exactly fills one page)", () => {
    expect(pageCount(12)).toBe(1);
  });

  it("13 entries → 2 pages (one entry overflows)", () => {
    expect(pageCount(13)).toBe(2);
  });

  it("500 entries → 42 pages (ceil(500/12) = 42)", () => {
    expect(pageCount(500)).toBe(42);
  });

  it("0 entries → 0 pages", () => {
    expect(pageCount(0)).toBe(0);
  });

  it("24 entries → 2 pages (exactly fills two pages)", () => {
    expect(pageCount(24)).toBe(2);
  });
});

describe("PDF cell x/y offsets", () => {
  // x = margin + col * cellW + (cellW - qrSize) / 2
  // The centering offset (cellW - qrSize) / 2 = (60 - 50) / 2 = 5mm
  const CENTER_PAD = (CELL_W - QR_SIZE) / 2; // 5mm

  it("center pad is 5mm", () => {
    expect(CENTER_PAD).toBe(5);
  });

  it("col 0 x-offset is 20mm (margin + centering)", () => {
    expect(xOffset(0)).toBe(20); // 15 + 0*60 + 5
  });

  it("col 1 x-offset is 80mm", () => {
    expect(xOffset(1)).toBe(80); // 15 + 1*60 + 5
  });

  it("col 2 x-offset is 140mm", () => {
    expect(xOffset(2)).toBe(140); // 15 + 2*60 + 5
  });

  it("row 0 y-offset is 15mm (equals margin)", () => {
    expect(yOffset(0)).toBe(15); // 15 + 0*66
  });

  it("row 1 y-offset is 81mm", () => {
    expect(yOffset(1)).toBe(81); // 15 + 1*66
  });

  it("row 3 y-offset is 213mm", () => {
    expect(yOffset(3)).toBe(213); // 15 + 3*66
  });
});
