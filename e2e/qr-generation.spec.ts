import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("QR Code Generation", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("shows placeholder when no URL is entered", async () => {
    await expect(home.qrPlaceholder).toBeVisible();
    await expect(home.statusText).toHaveText("Enter a valid URL");
    await expect(home.statusText).not.toHaveClass(/status-ready/);
  });

  test("generate button enables when valid URL is entered", async () => {
    await expect(home.generateBtn).toBeDisabled();
    await home.urlInput.fill("https://example.com");
    await expect(home.generateBtn).toBeEnabled();
  });

  test("generate button stays disabled for invalid URL", async () => {
    await home.urlInput.fill("not-a-url");
    await expect(home.generateBtn).toBeDisabled();
  });

  test("generates QR code when Generate QR is clicked with valid URL", async () => {
    await home.urlInput.fill("https://example.com");
    await home.generateBtn.click();

    // After generation, QR code should be visible and placeholder hidden
    await expect(home.qrCode).toBeVisible();
    await expect(home.qrPlaceholder).not.toBeVisible();
    await expect(home.statusText).toHaveText("Ready to download");
    await expect(home.statusText).toHaveClass(/status-ready/);
  });

  test("QR code disappears when URL is cleared after generation", async () => {
    await home.urlInput.fill("https://example.com");
    await home.generateBtn.click();
    await expect(home.qrCode).toBeVisible();

    // Clear URL — qrGenerated resets to false on URL change
    await home.urlInput.fill("");
    await expect(home.qrPlaceholder).toBeVisible();
    await expect(home.statusText).toHaveText("Enter a valid URL");
  });

  test("changes dot style", async () => {
    // Default is Square
    await expect(home.dotStyleOption("Square")).toHaveAttribute("aria-checked", "true");

    // Click Rounded
    await home.dotStyleOption("Rounded").click();
    await expect(home.dotStyleOption("Rounded")).toHaveAttribute("aria-checked", "true");
    await expect(home.dotStyleOption("Square")).toHaveAttribute("aria-checked", "false");

    // Click Dots
    await home.dotStyleOption("Dots").click();
    await expect(home.dotStyleOption("Dots")).toHaveAttribute("aria-checked", "true");
    await expect(home.dotStyleOption("Rounded")).toHaveAttribute("aria-checked", "false");
  });

  test("all dot styles are available", async () => {
    const styles = ["Square", "Rounded", "Dots", "Classy", "Leaf", "Blob"];
    for (const style of styles) {
      await expect(home.dotStyleOption(style)).toBeVisible();
    }
  });

  test("color picker shows foreground and background", async () => {
    await expect(home.fgColorInput).toBeVisible();
    await expect(home.bgColorInput).toBeVisible();

    // Default values shown as text
    await expect(home.fgColorValue).toHaveText("#1A1918");
    await expect(home.bgColorValue).toHaveText("#FFFFFF");
  });

  test("size slider shows default value and adjusts", async ({ page }) => {
    await expect(home.sizeSlider).toBeVisible();
    await expect(home.sizeValue).toContainText("512 px");

    // Change slider value
    await home.sizeSlider.fill("1024");
    await expect(home.sizeValue).toContainText("1024 px");
  });

  test("format selector switches between PNG/SVG/WebP", async () => {
    // PNG is default (first format)
    await expect(home.formatOption("PNG")).toHaveAttribute("aria-checked", "true");

    // Switch to SVG
    await home.formatOption("SVG").click();
    await expect(home.formatOption("SVG")).toHaveAttribute("aria-checked", "true");
    await expect(home.formatOption("PNG")).toHaveAttribute("aria-checked", "false");

    // Switch to WEBP
    await home.formatOption("WEBP").click();
    await expect(home.formatOption("WEBP")).toHaveAttribute("aria-checked", "true");
    await expect(home.formatOption("SVG")).toHaveAttribute("aria-checked", "false");
  });

  test("download button is disabled without QR code", async () => {
    await expect(home.downloadBtn).toBeDisabled();
  });

  test("download button enables after QR generation", async () => {
    await home.urlInput.fill("https://example.com");
    await home.generateBtn.click();
    await expect(home.downloadBtn).toBeEnabled();
  });

  test("download button triggers download", async ({ page }) => {
    await home.urlInput.fill("https://example.com");
    await home.generateBtn.click();

    // Listen for download event
    const downloadPromise = page.waitForEvent("download");
    await home.downloadBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("qrni-code");
  });

  test("shorten link toggle is visible", async () => {
    await expect(home.shortenLinkLabel).toHaveText("Also create short link");
    await expect(home.shortenLinkToggle).toBeVisible();
    await expect(home.shortenLinkToggle).toHaveAttribute("role", "switch");
  });

  test("shorten link toggle can be toggled on and off", async () => {
    // Initially off (unless localStorage has it on)
    await home.shortenLinkToggle.click();
    // Options section should appear
    const options = home.page.locator(".shortlink-options");
    await expect(options).toBeVisible();

    // Toggle off
    await home.shortenLinkToggle.click();
    await expect(options).not.toBeVisible();
  });

  test("logo upload zone is visible", async () => {
    await expect(home.logoUploadBtn).toBeVisible();
    await expect(home.logoUploadBtn).toContainText("Add logo");
  });

  test("logo can be uploaded and removed", async ({ page }) => {
    // Upload via hidden file input with a minimal 1x1 PNG
    await home.logoFileInput.setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    // Logo preview should appear
    await expect(home.logoPreviewImg).toBeVisible();
    await expect(home.logoRemoveBtn).toBeVisible();

    // Remove logo
    await home.logoRemoveBtn.click();
    await expect(home.logoPreviewImg).not.toBeVisible();
    await expect(home.logoUploadBtn).toBeVisible();
  });
});
