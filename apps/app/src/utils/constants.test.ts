import { describe, it, expect } from "vitest";
import {
  DOT_STYLES,
  DOWNLOAD_FILENAME_SINGLE,
  DOWNLOAD_FILENAME_BULK_ZIP,
  DOWNLOAD_FILENAME_BULK_PDF,
} from "./constants";

describe("constants", () => {
  describe("DOT_STYLES", () => {
    it("contains exactly 6 styles", () => {
      expect(DOT_STYLES).toHaveLength(6);
    });

    it("each style has an id and label", () => {
      for (const style of DOT_STYLES) {
        expect(style.id).toBeTruthy();
        expect(style.label).toBeTruthy();
      }
    });

    it("includes the expected style ids", () => {
      const ids = DOT_STYLES.map((s) => s.id);
      expect(ids).toEqual([
        "square",
        "rounded",
        "dots",
        "classy",
        "classy-rounded",
        "extra-rounded",
      ]);
    });
  });

  describe("download filenames", () => {
    it("DOWNLOAD_FILENAME_SINGLE is defined", () => {
      expect(DOWNLOAD_FILENAME_SINGLE).toBe("qrni-code");
    });

    it("DOWNLOAD_FILENAME_BULK_ZIP is defined", () => {
      expect(DOWNLOAD_FILENAME_BULK_ZIP).toBe("qrni-bulk.zip");
    });

    it("DOWNLOAD_FILENAME_BULK_PDF is defined", () => {
      expect(DOWNLOAD_FILENAME_BULK_PDF).toBe("qrni-bulk.pdf");
    });
  });
});
