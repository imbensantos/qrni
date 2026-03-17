import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Navigation", () => {
  test("homepage loads at root path", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");

    const home = new HomePage(page);
    await expect(home.logo).toBeVisible();
    await expect(home.urlInput).toBeVisible();
  });

  test("logo link navigates to home", async ({ page }) => {
    await page.goto("/");
    const logoLink = page.locator("a.logo-link");
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("navigates to profile page", async ({ page }) => {
    await page.goto("/profile");

    // Profile page should render (either auth guard, skeleton, or full profile)
    const profilePage = page.locator("main.profile-page");
    await expect(profilePage).toBeVisible();
  });

  test("navigates back to home from profile", async ({ page }) => {
    await page.goto("/profile");

    // Click logo to go back home
    const logoLink = page.locator("a.logo-link");
    await logoLink.click();

    await expect(page).toHaveURL("/");
    const home = new HomePage(page);
    await expect(home.urlInput).toBeVisible();
  });

  test("unknown routes do not crash the app", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/nonexistent-page");

    // App should not crash — header should still be visible
    const header = page.locator("header.header");
    await expect(header).toBeVisible();

    // No unhandled JS errors
    expect(errors).toHaveLength(0);
  });

  test("direct navigation to root shows single mode by default", async ({ page }) => {
    await page.goto("/");
    const home = new HomePage(page);
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "true");
    await expect(home.urlInput).toBeVisible();
  });

  test("browser back/forward preserves state", async ({ page }) => {
    await page.goto("/");
    const home = new HomePage(page);
    await expect(home.urlInput).toBeVisible();

    // Navigate to profile
    await page.goto("/profile");
    const profilePage = page.locator("main.profile-page");
    await expect(profilePage).toBeVisible();

    // Go back
    await page.goBack();
    await expect(home.urlInput).toBeVisible();

    // Go forward
    await page.goForward();
    await expect(profilePage).toBeVisible();
  });

  test("app wraps content in error boundary", async ({ page }) => {
    await page.goto("/");
    // The root app wrapper should be present
    const appWrapper = page.locator("div.app");
    await expect(appWrapper).toBeVisible();
  });
});
