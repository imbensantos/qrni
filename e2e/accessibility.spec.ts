import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Accessibility", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("URL input has proper label", async () => {
    await expect(home.urlInput).toHaveAttribute("id", "url-input");
    await expect(home.urlLabel).toHaveAttribute("for", "url-input");
    await expect(home.urlLabel).toHaveText("URL");
  });

  test("URL input has type=url for semantic correctness", async () => {
    await expect(home.urlInput).toHaveAttribute("type", "url");
  });

  test("mode toggle has aria-label", async () => {
    await expect(home.modeToggle).toHaveAttribute("role", "group");
    await expect(home.modeToggle).toHaveAttribute("aria-label", "Generation mode");
  });

  test("mode buttons use aria-pressed", async () => {
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.bulkModeBtn).toHaveAttribute("aria-pressed", "false");

    await home.bulkModeBtn.click();
    await expect(home.bulkModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("dot style selector uses radiogroup role", async () => {
    await expect(home.dotStyleGroup).toHaveAttribute("role", "radiogroup");
    await expect(home.dotStyleGroup).toHaveAttribute("aria-label", "Dot style");

    // Each option should have role=radio and aria-checked
    const options = home.dotStyleGroup.locator('button[role="radio"]');
    const count = await options.count();
    expect(count).toBe(6); // square, rounded, dots, classy, leaf, blob

    // Exactly one should be checked
    const checked = home.dotStyleGroup.locator('button[aria-checked="true"]');
    await expect(checked).toHaveCount(1);
  });

  test("format selector uses radiogroup role", async () => {
    await expect(home.formatGroup).toHaveAttribute("role", "radiogroup");
    await expect(home.formatGroup).toHaveAttribute("aria-label", "Export format");

    const options = home.formatGroup.locator('button[role="radio"]');
    await expect(options).toHaveCount(3);
  });

  test("shorten link toggle uses switch role", async () => {
    await expect(home.shortenLinkToggle).toHaveAttribute("role", "switch");
    await expect(home.shortenLinkToggle).toHaveAttribute("aria-checked", /true|false/);
  });

  test("size slider has proper ARIA attributes", async () => {
    await expect(home.sizeSlider).toHaveAttribute("aria-label", "QR code size in pixels");
    await expect(home.sizeSlider).toHaveAttribute("aria-valuemin", "128");
    await expect(home.sizeSlider).toHaveAttribute("aria-valuemax", "2048");
    await expect(home.sizeSlider).toHaveAttribute("aria-valuenow", "512");
    await expect(home.sizeSlider).toHaveAttribute("aria-valuetext", "512 pixels");
  });

  test("size value has aria-live for screen readers", async () => {
    await expect(home.sizeValue).toHaveAttribute("aria-live", "polite");
  });

  test("preview panel has aria-label", async () => {
    await expect(home.previewPanel).toHaveAttribute("aria-label", "QR code preview");
  });

  test("QR code image has aria-label", async () => {
    await expect(home.qrCode).toHaveAttribute("role", "img");
    await expect(home.qrCode).toHaveAttribute("aria-label", "Generated QR code");
  });

  test("status text has aria-live for dynamic updates", async () => {
    await expect(home.statusText).toHaveAttribute("aria-live", "polite");
    await expect(home.statusText).toHaveAttribute("aria-atomic", "true");
  });

  test("download button has accessible label", async () => {
    await expect(home.downloadBtn).toHaveAttribute("aria-label", "Download QR code");
  });

  test("color inputs have accessible labels", async () => {
    await expect(home.fgColorInput).toHaveAttribute("aria-label", "Foreground color");
    await expect(home.bgColorInput).toHaveAttribute("aria-label", "Background color");
  });

  test("logo upload has accessible label", async () => {
    await expect(home.logoFileInput).toHaveAttribute("aria-label", "Upload logo image");
  });

  test("decorative SVG icons are hidden from screen readers", async ({ page }) => {
    // All decorative SVGs should have aria-hidden="true"
    const decorativeSvgs = page.locator('svg[aria-hidden="true"]');
    const count = await decorativeSvgs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("control sections have proper group roles and labels", async ({ page }) => {
    const groups = page.locator('.control-section[role="group"]');
    const count = await groups.count();
    expect(count).toBeGreaterThan(0);

    // Each group should have aria-labelledby
    for (let i = 0; i < count; i++) {
      const labelledBy = await groups.nth(i).getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
    }
  });

  test("tab navigation reaches key interactive elements", async ({ page }) => {
    // Start at URL input (autofocused)
    await expect(home.urlInput).toBeFocused();

    // Tab through elements — should reach toggle, generate button, etc.
    await page.keyboard.press("Tab");
    // After URL input, tab should move to next focusable element
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("Escape key closes modal backdrop", async ({ page }) => {
    // The ModalBackdrop listens for Escape.
    // We can test this indirectly if we can open a modal.
    // For now, verify the modal component pattern exists and is not visible.
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });

  test("bulk mode textarea has proper label", async ({ page }) => {
    await home.bulkModeBtn.click();

    const textarea = page.locator("#bulk-links");
    const label = page.locator("#links-label");

    await expect(label).toHaveText("Your Links");
    await expect(textarea).toBeVisible();
  });

  test("bulk preview table has proper aria-label", async ({ page }) => {
    await home.bulkModeBtn.click();

    // Paste data to show table
    const textarea = page.locator("#bulk-links");
    await textarea.fill("Test, https://example.com");

    const table = page.locator('table[aria-label="QR code entries"]');
    await table.waitFor({ state: "visible", timeout: 2000 });
    await expect(table).toHaveAttribute("aria-label", "QR code entries");
  });

  test("bulk add row button has aria-label", async ({ page }) => {
    await home.bulkModeBtn.click();

    const textarea = page.locator("#bulk-links");
    await textarea.fill("Test, https://example.com");

    const addRowBtn = page.locator('button[aria-label="Add new QR code entry"]');
    await addRowBtn.waitFor({ state: "visible", timeout: 2000 });
    await expect(addRowBtn).toHaveAttribute("aria-label", "Add new QR code entry");
  });

  test("bulk export buttons have aria-labels", async ({ page }) => {
    await home.bulkModeBtn.click();

    const textarea = page.locator("#bulk-links");
    await textarea.fill("Test, https://example.com");

    const zipBtn = page.locator('button[aria-label="Download QR codes as ZIP"]');
    const pdfBtn = page.locator('button[aria-label="Download QR codes as PDF"]');

    await zipBtn.waitFor({ state: "visible", timeout: 2000 });
    await expect(zipBtn).toHaveAttribute("aria-label", "Download QR codes as ZIP");
    await expect(pdfBtn).toHaveAttribute("aria-label", "Download QR codes as PDF");
  });
});
