import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the QR Generator homepage (/).
 * Encapsulates all selectors so test files stay DRY.
 */
export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────

  async goto() {
    await this.page.goto("/");
  }

  // ── Header ──────────────────────────────────────────────────

  get header(): Locator {
    return this.page.locator("header.header");
  }

  get logo(): Locator {
    return this.page.locator("h1.logo");
  }

  get signInBtn(): Locator {
    return this.page.locator("button.signin-btn");
  }

  // ── Mode Toggle ─────────────────────────────────────────────

  get modeToggle(): Locator {
    return this.page.locator('[role="group"][aria-label="Generation mode"]');
  }

  get singleModeBtn(): Locator {
    return this.page.locator('.mode-btn:has-text("Single")');
  }

  get bulkModeBtn(): Locator {
    return this.page.locator('.mode-btn:has-text("Bulk")');
  }

  // ── Controls Panel (Single mode) ───────────────────────────

  get urlInput(): Locator {
    return this.page.locator("#url-input");
  }

  get urlLabel(): Locator {
    return this.page.locator("#url-label");
  }

  get generateBtn(): Locator {
    return this.page.locator("button.generate-btn");
  }

  get shortenLinkToggle(): Locator {
    return this.page.locator('button[role="switch"]');
  }

  get shortenLinkLabel(): Locator {
    return this.page.locator(".shortlink-label");
  }

  // ── Colors ──────────────────────────────────────────────────

  get fgColorInput(): Locator {
    return this.page.locator('input[aria-label="Foreground color"]');
  }

  get bgColorInput(): Locator {
    return this.page.locator('input[aria-label="Background color"]');
  }

  get fgColorValue(): Locator {
    return this.page.locator(".color-group").first().locator(".color-value");
  }

  get bgColorValue(): Locator {
    return this.page.locator(".color-group").last().locator(".color-value");
  }

  // ── Dot Style ───────────────────────────────────────────────

  get dotStyleGroup(): Locator {
    return this.page.locator('[role="radiogroup"][aria-label="Dot style"]');
  }

  dotStyleOption(label: string): Locator {
    return this.dotStyleGroup.locator(`button:has-text("${label}")`);
  }

  // ── Logo ────────────────────────────────────────────────────

  get logoUploadBtn(): Locator {
    return this.page.locator("button.upload-zone");
  }

  get logoFileInput(): Locator {
    return this.page.locator('input[aria-label="Upload logo image"]');
  }

  get logoRemoveBtn(): Locator {
    return this.page.locator("button.logo-remove");
  }

  get logoPreviewImg(): Locator {
    return this.page.locator("img.logo-thumb");
  }

  // ── Size ────────────────────────────────────────────────────

  get sizeSlider(): Locator {
    return this.page.locator('input[aria-label="QR code size in pixels"]');
  }

  get sizeValue(): Locator {
    return this.page.locator(".size-value").first();
  }

  // ── Preview Panel ───────────────────────────────────────────

  get previewPanel(): Locator {
    return this.page.locator('section[aria-label="QR code preview"]');
  }

  get qrCode(): Locator {
    return this.page.locator('.qr-code[role="img"]');
  }

  get qrPlaceholder(): Locator {
    return this.page.locator(".qr-placeholder");
  }

  get statusText(): Locator {
    return this.page.locator("p.status");
  }

  // ── Export / Download ───────────────────────────────────────

  get formatGroup(): Locator {
    return this.page.locator('.preview-panel [role="radiogroup"][aria-label="Export format"]');
  }

  formatOption(format: "PNG" | "SVG" | "WEBP"): Locator {
    return this.formatGroup.locator(`button[role="radio"]:has-text("${format}")`);
  }

  get downloadBtn(): Locator {
    return this.page.locator('button[aria-label="Download QR code"]');
  }

  // ── Sidebar ─────────────────────────────────────────────────

  get sidebarPanel(): Locator {
    return this.page.locator(".sidebar-panel");
  }
}
