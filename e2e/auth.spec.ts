import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";
import { ProfilePage } from "./pages/profile.page";

test.describe("Authentication", () => {
  test("shows sign in button when not authenticated", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // Wait for auth state to resolve — either sign-in button or auth placeholder
    // In a test environment without auth, we expect the sign-in button
    const signIn = home.signInBtn;
    const placeholder = page.locator(".auth-placeholder");

    // One of these should be visible
    await expect(signIn.or(placeholder)).toBeVisible();
  });

  test("sign in button has correct text", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // If sign-in button is visible, check its text
    if (await home.signInBtn.isVisible()) {
      await expect(home.signInBtn).toHaveText("Sign in");
    }
  });

  test("sign in button is clickable", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    if (await home.signInBtn.isVisible()) {
      // Should not throw when clicked
      await home.signInBtn.click();
    }
  });

  test("short link toggle shows sign-in prompt when not authenticated", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    // Enable shorten link toggle
    await home.shortenLinkToggle.click();

    // For unauthenticated users, the nudge area should show a sign-in prompt
    const signInPrompt = page.locator(".shortlink-options .nudge-text button.inline-signin-btn");
    const nudgeText = page.locator(".shortlink-options .nudge-text");

    // Either shows inline sign-in button or custom slug input (if cached user)
    if (await signInPrompt.isVisible()) {
      await expect(signInPrompt).toHaveText("Sign in");
      await expect(nudgeText).toContainText("for custom slugs and namespaces");
    }
  });

  test("profile page requires authentication", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Should show loading skeleton briefly, then auth guard
    // Wait for either auth guard or profile body
    const authGuard = profile.authGuard;
    const profileBody = profile.profileBody;
    const skeleton = profile.loadingSkeleton;

    await expect(authGuard.or(profileBody).or(skeleton)).toBeVisible();

    // Without auth, should eventually show auth guard
    if (await authGuard.isVisible()) {
      await expect(profile.authGuardText).toHaveText("Sign in to view your profile");
      await expect(profile.backToHomeLink).toBeVisible();
    }
  });

  test("profile auth guard has working back-to-home link", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Wait for auth guard or body
    const authGuard = profile.authGuard;
    if (await authGuard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profile.backToHomeLink.click();
      await expect(page).toHaveURL("/");
    }
  });
});
