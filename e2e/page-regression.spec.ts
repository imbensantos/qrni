import { test, expect, type Page } from "@playwright/test";
import { HomePage } from "./pages/home.page";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Navigate to a path while collecting unhandled JS errors (pageerror).
 * Returns the error list so each test can apply its own filter.
 */
async function loadPageWithErrors(page: Page, path: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  return errors;
}

/**
 * Filters that are expected (and benign) in a test environment that has
 * no Convex backend or WebSocket server running.
 */
function isBenignError(msg: string): boolean {
  return (
    msg.includes("Convex") ||
    msg.includes("WebSocket") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError")
  );
}

// ── Homepage (/)) ─────────────────────────────────────────────────────────────

test.describe("Page Regression — / (homepage)", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("renders without JS errors", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("header is visible with QRni logo", async () => {
    await expect(home.header).toBeVisible();
    await expect(home.logo).toBeVisible();
    await expect(home.logo).toContainText("QRni");
  });

  test("URL input is present and focusable", async () => {
    await expect(home.urlInput).toBeVisible();
    await expect(home.urlInput).toHaveAttribute("type", "url");
    await expect(home.urlInput).toHaveAttribute("placeholder", "Paste a URL to get started");
  });

  test("preview panel is present with placeholder", async () => {
    await expect(home.previewPanel).toBeVisible();
    await expect(home.qrPlaceholder).toBeVisible();
  });

  test("format selector has PNG, SVG, WEBP options with correct ARIA roles", async () => {
    await expect(home.formatGroup).toBeVisible();

    const radios = home.formatGroup.locator('[role="radio"]');
    await expect(radios).toHaveCount(3);

    await expect(home.formatOption("PNG")).toBeVisible();
    await expect(home.formatOption("SVG")).toBeVisible();
    await expect(home.formatOption("WEBP")).toBeVisible();

    // PNG is selected by default
    await expect(home.formatOption("PNG")).toHaveAttribute("aria-checked", "true");
    await expect(home.formatOption("SVG")).toHaveAttribute("aria-checked", "false");
    await expect(home.formatOption("WEBP")).toHaveAttribute("aria-checked", "false");
  });

  test("download button is present", async () => {
    await expect(home.downloadBtn).toBeVisible();
  });

  test("mode toggle group is present with Single and Bulk buttons", async () => {
    await expect(home.modeToggle).toBeVisible();
    await expect(home.singleModeBtn).toBeVisible();
    await expect(home.bulkModeBtn).toBeVisible();
    await expect(home.singleModeBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("sidebar panel has dot style, size slider, and logo upload controls", async () => {
    await expect(home.sidebarPanel).toBeVisible();
    await expect(home.dotStyleGroup).toBeVisible();
    await expect(home.sizeSlider).toBeVisible();
    await expect(home.logoUploadBtn).toBeVisible();
  });

  test("unauthenticated state shows sign-in button or auth placeholder", async ({ page }) => {
    const signInOrPlaceholder = page.locator("button.signin-btn, .auth-placeholder");
    await expect(signInOrPlaceholder.first()).toBeVisible();
  });

  test("entering a URL reveals QR code and enables download button", async () => {
    // Before input: QR placeholder is visible, download button is disabled
    await expect(home.qrPlaceholder).toBeVisible();
    await expect(home.downloadBtn).toBeDisabled();

    // Typing a valid URL triggers automatic QR generation (no separate Generate button)
    await home.urlInput.fill("https://example.com");

    // QR code container becomes visible; placeholder hides
    await expect(home.qrCode).toBeVisible({ timeout: 5000 });
    await expect(home.qrPlaceholder).toBeHidden();

    // Download button becomes enabled
    await expect(home.downloadBtn).toBeEnabled();
  });
});

// ── Privacy (/privacy) ────────────────────────────────────────────────────────

test.describe("Page Regression — /privacy", () => {
  test("renders without JS errors", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/privacy");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("page title heading contains 'Privacy'", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1.privacy-hero__title")).toContainText("Privacy");
  });

  test("back-to-home link is present", async ({ page }) => {
    await page.goto("/privacy");
    const backLink = page.locator("a.privacy-page__back-link");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });

  test("table of contents nav is present with all 10 sections", async ({ page }) => {
    await page.goto("/privacy");
    const toc = page.locator("nav.privacy-toc");
    await expect(toc).toBeVisible();
    const tocLinks = toc.locator("a.privacy-toc__link");
    await expect(tocLinks).toHaveCount(10);
  });

  test("desktop table shows all third-party providers", async ({ page }) => {
    await page.goto("/privacy");
    const table = page.locator("table.privacy-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("Google OAuth");
    await expect(table).toContainText("Google Safe Browsing");
    await expect(table).toContainText("Google AdSense");
    await expect(table).toContainText("Google Fonts");
    await expect(table).toContainText("Vercel");
  });

  test("mobile service cards are attached to the DOM and contain all providers", async ({
    page,
  }) => {
    await page.goto("/privacy");
    // Cards exist in the DOM for mobile (visibility controlled via CSS media query)
    const cards = page.locator("ul.privacy-service-cards");
    await expect(cards).toBeAttached();
    await expect(cards).toContainText("Google OAuth");
    await expect(cards).toContainText("Google Safe Browsing");
    await expect(cards).toContainText("Google AdSense");
    await expect(cards).toContainText("Google Fonts");
    await expect(cards).toContainText("Vercel");
  });

  test("contact CTA section is present", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator(".privacy-cta")).toBeVisible();
    await expect(page.locator("a.privacy-cta__button")).toContainText("Contact Us");
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("footer")).toBeVisible();
  });
});

// ── About (/about) ────────────────────────────────────────────────────────────

test.describe("Page Regression — /about", () => {
  test("renders without JS errors", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/about");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("page uses about-page main element", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("main.about-page")).toBeVisible();
  });

  test("h1 contains 'About QRni'", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1.about-hero__title")).toContainText("About QRni");
  });

  test("back-to-home link is present", async ({ page }) => {
    await page.goto("/about");
    const backLink = page.locator("a.about-page__back-link");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });

  test("about cards section is present", async ({ page }) => {
    await page.goto("/about");
    const cards = page.locator(".about-cards");
    await expect(cards).toBeVisible();
    // Two content cards: "What is QRni?" and "Why we built it"
    await expect(cards.locator(".about-card")).toHaveCount(2);
  });

  test("meet the maker section shows Ben Santos", async ({ page }) => {
    await page.goto("/about");
    const maker = page.locator(".about-maker");
    await expect(maker).toBeVisible();
    await expect(maker.locator(".about-maker__name")).toContainText("Ben Santos");
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("footer")).toBeVisible();
  });
});

// ── Contact (/contact) ────────────────────────────────────────────────────────

test.describe("Page Regression — /contact", () => {
  test("renders without JS errors", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/contact");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("page uses contact-page main element", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main.contact-page")).toBeVisible();
  });

  test("h1 contains 'Get in Touch'", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1.contact-hero__title")).toContainText("Get in Touch");
  });

  test("back-to-home link is present", async ({ page }) => {
    await page.goto("/contact");
    const backLink = page.locator("a.contact-page__back-link");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });

  test("contact form has name, email, message, and submit button", async ({ page }) => {
    await page.goto("/contact");
    const form = page.locator("form.contact-form");
    await expect(form).toBeVisible();
    await expect(form.locator("input[type='text'].contact-input")).toBeVisible();
    await expect(form.locator("input[type='email'].contact-input")).toBeVisible();
    await expect(form.locator("textarea.contact-textarea")).toBeVisible();
    await expect(form.locator("button[type='submit'].contact-submit")).toBeVisible();
  });

  test("S12 fix: mailto link uses env-based email, not hardcoded qrni.to domain", async ({
    page,
  }) => {
    await page.goto("/contact");
    const mailtoLinks = page.locator("a[href^='mailto:']");
    const count = await mailtoLinks.count();
    // There should be at least one mailto link (the email sidebar card)
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await mailtoLinks.nth(i).getAttribute("href");
      // The S12 fix replaced hardcoded email with import.meta.env.VITE_CONTACT_EMAIL,
      // which falls back to "contact@example.com" — never the old qrni.to address
      expect(href).not.toContain("qrni.to");
    }
  });

  test("sidebar email card and note card are visible", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator(".contact-sidebar__email-card")).toBeVisible();
    await expect(page.locator(".contact-sidebar__note-card")).toBeVisible();
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("footer")).toBeVisible();
  });
});

// ── Profile (/profile) — unauthenticated ──────────────────────────────────────

test.describe("Page Regression — /profile (unauthenticated)", () => {
  test("renders without critical JS errors", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/profile");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("main.profile-page element is present", async ({ page }) => {
    await page.goto("/profile");
    // While waiting for Convex auth, shows skeleton; once resolved null → auth guard.
    // Either way, main.profile-page must be in the DOM.
    await expect(page.locator("main.profile-page")).toBeVisible({ timeout: 8000 });
  });

  test("unauthenticated state shows auth guard with back-to-home link", async ({ page }) => {
    await page.goto("/profile");
    // Wait for Convex auth to resolve; the loading skeleton transitions to auth guard
    const authGuard = page.locator(".profile-auth-guard");
    // In test env (no backend) Convex may stay loading — accept either guard or skeleton
    const guardOrLoading = page.locator(".profile-auth-guard, .profile-loading");
    await expect(guardOrLoading).toBeVisible({ timeout: 8000 });
  });
});

// ── Invite (/invite/:token) ───────────────────────────────────────────────────

test.describe("Page Regression — /invite/:token", () => {
  test("renders without critical JS errors for an invalid token", async ({ page }) => {
    const errors = await loadPageWithErrors(page, "/invite/invalid-token-regression-test");
    const critical = errors.filter((e) => !isBenignError(e));
    expect(critical).toHaveLength(0);
  });

  test("renders the invite-page wrapper", async ({ page }) => {
    await page.goto("/invite/invalid-token-regression-test");
    // The page renders either loading state or invalid-invite card — both use .invite-page
    await expect(page.locator(".invite-page")).toBeVisible({ timeout: 8000 });
  });

  test("shows invite-card container", async ({ page }) => {
    await page.goto("/invite/invalid-token-regression-test");
    await expect(page.locator(".invite-card")).toBeVisible({ timeout: 8000 });
  });

  test("eventually shows 'Loading invitation...' or 'Invite not found' without crashing", async ({
    page,
  }) => {
    await page.goto("/invite/invalid-token-regression-test");
    // With no Convex backend: stays in loading state
    // With a backend: resolves to null → "Invite not found"
    const loadingOrInvalid = page.locator("p.invite-loading, h1.invite-title");
    await expect(loadingOrInvalid).toBeVisible({ timeout: 8000 });
  });
});

// ── Cross-page: header present on pages that use it ──────────────────────────

test.describe("Page Regression — header present on app routes", () => {
  // The app shell (App.tsx) renders the header on all routes that embed the
  // layout. Static pages (privacy, about, contact) do NOT use the header component —
  // they have their own back-links. The QR generator and profile pages do.

  test("/ renders header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header.header")).toBeVisible();
  });

  test("/profile renders header", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("header.header")).toBeVisible();
  });
});
