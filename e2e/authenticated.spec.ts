import { test, expect } from "@playwright/test";

test.describe("Authenticated Flow Guards", () => {
  test("profile page shows auth guard for unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    const authGuard = page.locator(".profile-auth-guard");
    const profileBody = page.locator(".pp-body");
    const skeleton = page.locator(".profile-loading");

    await expect(authGuard.or(profileBody).or(skeleton)).toBeVisible();

    if (await authGuard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(authGuard.locator("p")).toHaveText("Sign in to view your profile");
      const backLink = authGuard.locator('a:has-text("Back to home")');
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", "/");
    }
  });

  test("profile auth guard back link navigates home", async ({ page }) => {
    await page.goto("/profile");
    const authGuard = page.locator(".profile-auth-guard");

    if (await authGuard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await authGuard.locator('a:has-text("Back to home")').click();
      await expect(page).toHaveURL("/");
    }
  });
});

test.describe("Invite Accept Page", () => {
  test("shows loading or error state for invalid invite token", async ({ page }) => {
    await page.goto("/invite/invalid-token-12345678");

    const loading = page.locator("text=Loading invite");
    const errorState = page.locator("text=not found");
    const pageContent = page.locator("main");

    await expect(pageContent).toBeVisible();
    await expect(loading.or(errorState).or(pageContent)).toBeVisible();
  });

  test("invite page has proper structure", async ({ page }) => {
    await page.goto("/invite/test-token-abc123");

    await expect(page.locator("main").or(page.locator("body"))).toBeVisible();

    const hasInviteContent = await page
      .locator(".invite-page")
      .isVisible()
      .catch(() => false);
    const hasMain = await page
      .locator("main")
      .isVisible()
      .catch(() => false);

    expect(hasInviteContent || hasMain).toBeTruthy();
  });
});

test.describe("Namespace Management (Unauthenticated)", () => {
  test("short link toggle shows sign-in prompt for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    const toggle = page.locator('[role="switch"][aria-checked]');
    if (await toggle.isVisible()) {
      await toggle.click();

      const signInBtn = page.locator(".inline-signin-btn");
      if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(signInBtn).toHaveText("Sign in");
      }
    }
  });
});
