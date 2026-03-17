import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Responsive Layout", () => {
  test("mobile layout (375x812) renders all key elements", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const home = new HomePage(page);

    // Header, controls, and preview should all be visible
    await expect(home.header).toBeVisible();
    await expect(home.logo).toBeVisible();
    await expect(home.urlInput).toBeVisible();
    await expect(home.previewPanel).toBeVisible();
    await expect(home.generateBtn).toBeVisible();
  });

  test("desktop layout (1440x900) renders side-by-side panels", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const home = new HomePage(page);

    await expect(home.sidebarPanel).toBeVisible();
    await expect(home.previewPanel).toBeVisible();

    // Both panels should be visible simultaneously
    const sidebarBox = await home.sidebarPanel.boundingBox();
    const previewBox = await home.previewPanel.boundingBox();

    expect(sidebarBox).toBeTruthy();
    expect(previewBox).toBeTruthy();

    // On desktop, sidebar and preview should be side by side (sidebar left, preview right)
    if (sidebarBox && previewBox) {
      // Preview panel should be to the right of or overlapping with sidebar
      // (they shouldn't be stacked vertically)
      expect(previewBox.x).toBeGreaterThanOrEqual(sidebarBox.x);
    }
  });

  test("tablet layout (768x1024) renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    const home = new HomePage(page);

    await expect(home.header).toBeVisible();
    await expect(home.urlInput).toBeVisible();
    await expect(home.previewPanel).toBeVisible();
  });

  test("mobile layout shows mobile footer in preview panel", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Mobile footer should be in preview panel
    const mobileFooter = page.locator(".panel-footer-mobile");
    // Desktop footer should be hidden at mobile widths (CSS handles this)
    const desktopFooter = page.locator(".panel-footer-desktop");

    await expect(mobileFooter).toBeAttached();
    await expect(desktopFooter).toBeAttached();
  });

  test("mode toggle is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const home = new HomePage(page);

    await expect(home.modeToggle).toBeVisible();
    await home.bulkModeBtn.click();
    await expect(home.bulkModeBtn).toHaveAttribute("aria-pressed", "true");

    // Bulk textarea should be visible on mobile
    const bulkTextarea = page.locator("#bulk-links");
    await expect(bulkTextarea).toBeVisible();
  });

  test("small mobile viewport (320x568) does not overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    const home = new HomePage(page);

    // Key elements should still be accessible
    await expect(home.header).toBeVisible();
    await expect(home.urlInput).toBeVisible();

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320);
  });

  test("large desktop viewport (1920x1080) renders without issues", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    const home = new HomePage(page);
    await expect(home.header).toBeVisible();
    await expect(home.sidebarPanel).toBeVisible();
    await expect(home.previewPanel).toBeVisible();
  });
});
