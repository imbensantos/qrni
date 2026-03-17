import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Smoke Tests", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("homepage loads and shows QR generator", async ({ page }) => {
    // The main body element should render
    await expect(page.locator("main.body")).toBeVisible();
  });

  test("header is visible with app name", async () => {
    await expect(home.header).toBeVisible();
    await expect(home.logo).toBeVisible();
    await expect(home.logo).toContainText("QRni");
  });

  test("controls panel renders with URL input", async () => {
    await expect(home.urlInput).toBeVisible();
    await expect(home.urlInput).toHaveAttribute("placeholder", "Paste a URL to get started");
    await expect(home.urlInput).toHaveAttribute("type", "url");
    await expect(home.urlLabel).toHaveText("URL");
  });

  test("URL input is focusable and accepts text", async () => {
    // Input should have autofocus
    await expect(home.urlInput).toBeFocused();
    await home.urlInput.fill("https://example.com");
    await expect(home.urlInput).toHaveValue("https://example.com");
  });

  test("preview panel renders with placeholder", async () => {
    await expect(home.previewPanel).toBeVisible();
    await expect(home.qrPlaceholder).toBeVisible();
    await expect(home.qrPlaceholder).toContainText("Paste a URL to get started");
  });

  test("generate button is initially disabled", async () => {
    await expect(home.generateBtn).toBeVisible();
    await expect(home.generateBtn).toBeDisabled();
    await expect(home.generateBtn).toHaveText("Generate QR");
  });

  test("can switch between Single and Bulk modes", async () => {
    // Single mode is active by default
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.bulkModeBtn).toHaveAttribute("aria-pressed", "false");

    // Switch to Bulk
    await home.bulkModeBtn.click();
    await expect(home.bulkModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "false");

    // Bulk panel textarea should appear
    const bulkTextarea = home.page.locator("#bulk-links");
    await expect(bulkTextarea).toBeVisible();

    // Switch back to Single
    await home.singleModeBtn.click();
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.urlInput).toBeVisible();
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Re-navigate to capture console from start
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors (e.g., Convex connection errors in test env)
    const criticalErrors = errors.filter(
      (e) => !e.includes("Convex") && !e.includes("WebSocket") && !e.includes("Failed to fetch"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("sign in button is visible when not authenticated", async () => {
    // In unauthenticated state, sign-in button or auth placeholder should show
    // The app shows either signin-btn, auth-placeholder, or ProfileDropdown
    const signInOrPlaceholder = home.page.locator("button.signin-btn, .auth-placeholder");
    await expect(signInOrPlaceholder.first()).toBeVisible();
  });

  test("sidebar panel contains all control sections", async () => {
    await expect(home.sidebarPanel).toBeVisible();
    await expect(home.modeToggle).toBeVisible();
    await expect(home.urlInput).toBeVisible();
    await expect(home.dotStyleGroup).toBeVisible();
    await expect(home.sizeSlider).toBeVisible();
    await expect(home.logoUploadBtn).toBeVisible();
  });

  test("format selector shows PNG, SVG, WEBP options", async () => {
    await expect(home.formatGroup).toBeVisible();
    await expect(home.formatOption("PNG")).toBeVisible();
    await expect(home.formatOption("SVG")).toBeVisible();
    await expect(home.formatOption("WEBP")).toBeVisible();
  });
});
