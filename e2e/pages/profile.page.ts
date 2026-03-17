import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the Profile page (/profile).
 */
export class ProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/profile");
  }

  // ── Auth Guard ──────────────────────────────────────────────

  get authGuard(): Locator {
    return this.page.locator(".profile-auth-guard");
  }

  get authGuardText(): Locator {
    return this.authGuard.locator("p");
  }

  get backToHomeLink(): Locator {
    return this.authGuard.locator('a:has-text("Back to home")');
  }

  // ── Loading Skeleton ────────────────────────────────────────

  get loadingSkeleton(): Locator {
    return this.page.locator(".profile-loading");
  }

  // ── Profile Body ────────────────────────────────────────────

  get profileBody(): Locator {
    return this.page.locator(".pp-body");
  }

  get avatar(): Locator {
    return this.page.locator(".pp-avatar");
  }

  get userName(): Locator {
    return this.page.locator(".pp-user-name");
  }

  get userEmail(): Locator {
    return this.page.locator(".pp-user-email");
  }

  get editProfileBtn(): Locator {
    return this.page.locator(".pp-edit-profile-btn");
  }

  // ── Stats ───────────────────────────────────────────────────

  get statsRow(): Locator {
    return this.page.locator(".pp-stats-row");
  }

  statCard(label: string): Locator {
    return this.page.locator(`.pp-stat-card:has(.pp-stat-label:has-text("${label}"))`);
  }

  // ── Namespaces ──────────────────────────────────────────────

  get createNamespaceBtn(): Locator {
    return this.page.locator(".pp-create-namespace-btn");
  }

  get namespaceHeader(): Locator {
    return this.page.locator(".pp-namespace-header");
  }

  // ── Page container ──────────────────────────────────────────

  get main(): Locator {
    return this.page.locator("main.profile-page");
  }
}
