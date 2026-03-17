import { type Page, type Locator } from "@playwright/test";
import { HomePage } from "./home.page";

/**
 * Page object for Bulk mode interactions.
 * Extends HomePage since bulk mode lives on the same page.
 */
export class BulkPage {
  readonly home: HomePage;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.home = new HomePage(page);
  }

  async goto() {
    await this.home.goto();
  }

  async switchToBulk() {
    await this.home.bulkModeBtn.click();
  }

  // ── Data Input ──────────────────────────────────────────────

  get textarea(): Locator {
    return this.page.locator("#bulk-links");
  }

  get fileUploadBtn(): Locator {
    return this.page.locator("button.file-upload-btn");
  }

  get fileInput(): Locator {
    return this.page.locator('input[aria-label="Upload CSV or JSON file"]');
  }

  // ── Format Selector ─────────────────────────────────────────

  get bulkFormatGroup(): Locator {
    return this.page.locator('.sidebar-panel [role="radiogroup"][aria-label="Export format"]');
  }

  bulkFormatOption(format: "PNG" | "SVG" | "WEBP"): Locator {
    return this.bulkFormatGroup.locator(`button[role="radio"]:has-text("${format}")`);
  }

  // ── Bulk Preview (right panel) ──────────────────────────────

  get bulkPreview(): Locator {
    return this.page.locator('section[aria-label="Bulk QR code preview"]');
  }

  get bulkEmpty(): Locator {
    return this.page.locator(".bulk-empty");
  }

  get bulkTable(): Locator {
    return this.page.locator('table[aria-label="QR code entries"]');
  }

  get bulkSummary(): Locator {
    return this.page.locator(".bulk-summary");
  }

  get validCount(): Locator {
    return this.page.locator(".bulk-summary-valid");
  }

  get invalidCount(): Locator {
    return this.page.locator(".bulk-summary-invalid");
  }

  get totalCount(): Locator {
    return this.page.locator(".bulk-summary-total");
  }

  get addRowBtn(): Locator {
    return this.page.locator('button[aria-label="Add new QR code entry"]');
  }

  get downloadZipBtn(): Locator {
    return this.page.locator('button[aria-label="Download QR codes as ZIP"]');
  }

  get downloadPdfBtn(): Locator {
    return this.page.locator('button[aria-label="Download QR codes as PDF"]');
  }

  // ── Table cell inputs ───────────────────────────────────────

  labelInput(rowIndex: number): Locator {
    return this.page.locator(`input[aria-label="Label for row ${rowIndex}"]`);
  }

  urlInput(rowIndex: number): Locator {
    return this.page.locator(`input[aria-label="URL for row ${rowIndex}"]`);
  }

  get tableRows(): Locator {
    return this.bulkTable.locator("tbody tr");
  }
}
