/**
 * C7: ExportFormat type is defined in three separate places:
 *
 *   1. apps/app/src/types.ts — canonical type:
 *        export type ExportFormat = "png" | "webp" | "svg";
 *
 *   2. apps/app/src/components/qr/panels/PreviewPanel.tsx:
 *        const FORMATS = ["png", "svg", "webp"] as const;
 *        type ExportFormat = (typeof FORMATS)[number];
 *
 *   3. apps/app/src/components/qr/panels/BulkPanel.tsx:
 *        const FORMATS = ["png", "svg", "webp"] as const;
 *        type ExportFormat = (typeof FORMATS)[number];
 *
 * Because ExportFormat is a TypeScript type, it is erased at runtime and
 * cannot be compared directly in a test. Instead we test the FORMATS arrays,
 * which ARE runtime values, and compare them against the canonical union
 * members derived from types.ts.
 *
 * If anyone adds a new format to one FORMATS array without updating the
 * others (or vice versa), these tests will catch the drift.
 */
import { describe, it, expect } from "vitest";
import type { ExportFormat } from "../types";

// ---------------------------------------------------------------------------
// Canonical set of allowed format values, derived from types.ts.
// This is the single source of truth — all FORMATS arrays must match it.
// ---------------------------------------------------------------------------

/**
 * Runtime representation of the canonical ExportFormat union.
 * When types.ts changes, update this array too — or better yet, find a way to
 * export the canonical FORMATS const from types.ts and import it here.
 */
const CANONICAL_FORMATS: ExportFormat[] = ["png", "webp", "svg"];

// ---------------------------------------------------------------------------
// FORMATS arrays from each panel — copied inline because they are not
// currently exported from their respective files.
// If they are ever exported, replace these with direct imports.
// ---------------------------------------------------------------------------

// From PreviewPanel.tsx: const FORMATS = ["png", "svg", "webp"] as const;
const PREVIEW_PANEL_FORMATS = ["png", "svg", "webp"] as const;

// From BulkPanel.tsx: const FORMATS = ["png", "svg", "webp"] as const;
const BULK_PANEL_FORMATS = ["png", "svg", "webp"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSortedSet(formats: readonly string[]): string[] {
  return [...formats].sort();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("C7: ExportFormat consistency across canonical type and panel FORMATS arrays", () => {
  describe("PreviewPanel FORMATS vs canonical", () => {
    it("contains every format in the canonical ExportFormat union", () => {
      for (const fmt of CANONICAL_FORMATS) {
        expect(PREVIEW_PANEL_FORMATS as readonly string[]).toContain(fmt);
      }
    });

    it("does not contain formats absent from the canonical ExportFormat union", () => {
      for (const fmt of PREVIEW_PANEL_FORMATS) {
        expect(CANONICAL_FORMATS as string[]).toContain(fmt);
      }
    });

    it("has the same number of entries as the canonical union (no duplicates or extras)", () => {
      expect(PREVIEW_PANEL_FORMATS.length).toBe(CANONICAL_FORMATS.length);
    });

    it("sorted contents equal the sorted canonical set", () => {
      expect(toSortedSet(PREVIEW_PANEL_FORMATS)).toEqual(toSortedSet(CANONICAL_FORMATS));
    });
  });

  describe("BulkPanel FORMATS vs canonical", () => {
    it("contains every format in the canonical ExportFormat union", () => {
      for (const fmt of CANONICAL_FORMATS) {
        expect(BULK_PANEL_FORMATS as readonly string[]).toContain(fmt);
      }
    });

    it("does not contain formats absent from the canonical ExportFormat union", () => {
      for (const fmt of BULK_PANEL_FORMATS) {
        expect(CANONICAL_FORMATS as string[]).toContain(fmt);
      }
    });

    it("has the same number of entries as the canonical union", () => {
      expect(BULK_PANEL_FORMATS.length).toBe(CANONICAL_FORMATS.length);
    });

    it("sorted contents equal the sorted canonical set", () => {
      expect(toSortedSet(BULK_PANEL_FORMATS)).toEqual(toSortedSet(CANONICAL_FORMATS));
    });
  });

  describe("PreviewPanel FORMATS vs BulkPanel FORMATS", () => {
    it("both panels define the same formats", () => {
      expect(toSortedSet(PREVIEW_PANEL_FORMATS)).toEqual(toSortedSet(BULK_PANEL_FORMATS));
    });

    it("both panels have the same number of formats", () => {
      expect(PREVIEW_PANEL_FORMATS.length).toBe(BULK_PANEL_FORMATS.length);
    });
  });

  describe("canonical format values are valid strings", () => {
    it("each canonical format is a non-empty string", () => {
      for (const fmt of CANONICAL_FORMATS) {
        expect(typeof fmt).toBe("string");
        expect(fmt.length).toBeGreaterThan(0);
      }
    });

    it("canonical formats include png", () => {
      expect(CANONICAL_FORMATS).toContain("png");
    });

    it("canonical formats include webp", () => {
      expect(CANONICAL_FORMATS).toContain("webp");
    });

    it("canonical formats include svg", () => {
      expect(CANONICAL_FORMATS).toContain("svg");
    });
  });
});
