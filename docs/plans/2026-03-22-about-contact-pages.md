# About Us & Contact Us Pages — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add `/about` and `/contact` pages to the app with a contact form that saves submissions to Convex.

**Architecture:** Two new page components following the PrivacyPage pattern (card on cream bg, back link, pillar ads, footer). Contact form backed by a new Convex mutation + `contactSubmissions` table. Shared "static page" CSS base extracted from PrivacyPage. Rate limiting reuses existing `checkRateLimit` from `linkHelpers.ts`.

**Tech Stack:** React 19, TanStack Router, Convex (schema + mutation), CSS (design system variables)

---

### Task 0: Create feature branch

**Step 1: Create and switch to a new branch**

```bash
git checkout -b feat/about-contact-pages
```

**Step 2: Commit the design doc**

```bash
git add docs/plans/2026-03-22-about-contact-pages-design.md docs/plans/2026-03-22-about-contact-pages.md
git commit -m "docs: add design and implementation plan for about/contact pages"
```

---

### Task 1: Add `contactSubmissions` table to Convex schema

**Files:**

- Modify: `convex/schema.ts`
- Modify: `convex/lib/constants.ts` (add rate limit + error constants)

**Step 1: Write the failing test**

Create `convex/contact.test.ts`:

```ts
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("submitContactForm", () => {
  test("saves a valid submission", async () => {
    const t = convexTest(schema);
    await t.mutation(api.contact.submitContactForm, {
      name: "Test User",
      email: "test@example.com",
      message: "Hello, this is a test message.",
    });
    // Query the table directly to verify insertion
    const submissions = await t.run(async (ctx) => {
      return await ctx.db.query("contactSubmissions").collect();
    });
    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toBe("Test User");
    expect(submissions[0].email).toBe("test@example.com");
    expect(submissions[0].message).toBe("Hello, this is a test message.");
    expect(submissions[0].isRead).toBe(false);
    expect(submissions[0].createdAt).toBeTypeOf("number");
  });

  test("rejects empty name", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.contact.submitContactForm, {
        name: "",
        email: "test@example.com",
        message: "Hello",
      }),
    ).rejects.toThrow("Name is required");
  });

  test("rejects empty message", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.contact.submitContactForm, {
        name: "Test",
        email: "test@example.com",
        message: "",
      }),
    ).rejects.toThrow("Message is required");
  });

  test("rejects invalid email", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.contact.submitContactForm, {
        name: "Test",
        email: "not-an-email",
        message: "Hello",
      }),
    ).rejects.toThrow("Invalid email address");
  });

  test("rejects message over 5000 characters", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.contact.submitContactForm, {
        name: "Test",
        email: "test@example.com",
        message: "x".repeat(5001),
      }),
    ).rejects.toThrow("Message must be 5000 characters or fewer");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd convex && npx vitest run contact.test.ts
```

Expected: FAIL — `contactSubmissions` table and `contact.submitContactForm` don't exist.

**Step 3: Add schema + constants + mutation**

Add to `convex/schema.ts` (after `audit_log` table):

```ts
contactSubmissions: defineTable({
  name: v.string(),
  email: v.string(),
  message: v.string(),
  createdAt: v.number(),
  isRead: v.boolean(),
}).index("by_created_at", ["createdAt"]),
```

Add to `convex/lib/constants.ts` (in LIMITS section):

```ts
/** Maximum contact form message length */
export const MAX_CONTACT_MESSAGE_LENGTH = 5000;

/** Maximum contact form name length */
export const MAX_CONTACT_NAME_LENGTH = 200;
```

Add rate limit constant (in RATE LIMITING section):

```ts
/** Contact form submission rate limit per IP per window */
export const CONTACT_RATE_LIMIT = 5;
```

Add error messages (in ERR object):

```ts
// Contact form
CONTACT_NAME_REQUIRED: "Name is required",
CONTACT_EMAIL_INVALID: "Invalid email address",
CONTACT_MESSAGE_REQUIRED: "Message is required",
CONTACT_MESSAGE_TOO_LONG: `Message must be ${MAX_CONTACT_MESSAGE_LENGTH} characters or fewer`,
CONTACT_NAME_TOO_LONG: `Name must be ${MAX_CONTACT_NAME_LENGTH} characters or fewer`,
CONTACT_RATE_LIMITED: "You've sent too many messages. Please wait a bit and try again.",
```

Export `checkRateLimit` from `convex/lib/linkHelpers.ts` — change `async function checkRateLimit` to `export async function checkRateLimit` so `contact.ts` can reuse it.

Create `convex/contact.ts`:

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "./lib/linkHelpers";
import {
  CONTACT_RATE_LIMIT,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
  ERR,
} from "./lib/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim();
    const message = args.message.trim();

    if (!name) throw new Error(ERR.CONTACT_NAME_REQUIRED);
    if (name.length > MAX_CONTACT_NAME_LENGTH) throw new Error(ERR.CONTACT_NAME_TOO_LONG);
    if (!EMAIL_REGEX.test(email)) throw new Error(ERR.CONTACT_EMAIL_INVALID);
    if (!message) throw new Error(ERR.CONTACT_MESSAGE_REQUIRED);
    if (message.length > MAX_CONTACT_MESSAGE_LENGTH) throw new Error(ERR.CONTACT_MESSAGE_TOO_LONG);

    // Rate limit by IP (uses headers from Convex HTTP)
    // For mutations called from the client, we use a generic key
    // since client mutations don't have IP access
    const identity = await ctx.auth.getUserIdentity();
    const rateLimitKey = identity ? `contact:${identity.subject}` : `contact:anonymous`;

    await checkRateLimit(ctx, rateLimitKey, CONTACT_RATE_LIMIT, ERR.CONTACT_RATE_LIMITED, true);

    await ctx.db.insert("contactSubmissions", {
      name,
      email,
      message,
      createdAt: Date.now(),
      isRead: false,
    });
  },
});
```

**Step 4: Run tests to verify they pass**

```bash
cd convex && npx vitest run contact.test.ts
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add convex/schema.ts convex/lib/constants.ts convex/lib/linkHelpers.ts convex/contact.ts convex/contact.test.ts
git commit -m "feat: add contactSubmissions table and submitContactForm mutation"
```

---

### Task 2: Extract shared static page CSS from PrivacyPage

**Files:**

- Create: `apps/app/src/pages/shared/StaticPage.css`
- Modify: `apps/app/src/pages/privacy/PrivacyPage.css` (import shared, remove duplicated rules)

**Step 1: Create shared CSS**

Create `apps/app/src/pages/shared/StaticPage.css` by extracting the common layout from PrivacyPage:

```css
/* Shared layout for static content pages (privacy, about, contact) */

.static-page {
  flex: 1;
  background: var(--bg-page);
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  display: flex;
  flex-direction: column;
  /*
   * AdSense injects height:auto !important on ancestor elements of ad slots,
   * which breaks scrolling. min-height + max-height together resist that
   * override and act as a fixed height, while overflow-y:auto enables scrolling
   * when the content is taller than the viewport.
   */
  min-height: calc(100vh - 65px);
  min-height: calc(100dvh - 65px);
  max-height: calc(100vh - 65px);
  max-height: calc(100dvh - 65px);
  overflow-y: auto;
}

.static-page-body {
  max-width: 720px;
  margin: 32px auto;
  padding: 32px 40px 64px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}

.static-page-back-link {
  display: inline-block;
  margin-bottom: 24px;
  font-family: "Outfit", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color 0.15s;
}

.static-page-back-link:hover {
  color: var(--accent-primary);
}

.static-page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.static-page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

/* Typography */
.static-page-body h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 32px;
  margin-bottom: 12px;
}

.static-page-body h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-top: 16px;
  margin-bottom: 6px;
}

.static-page-body p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.static-page-body ul {
  padding-left: 20px;
  margin-bottom: 12px;
}

.static-page-body li {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.static-page-body a {
  color: var(--accent-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.static-page-body a:hover {
  color: var(--accent-primary-hover);
}

.static-page-footer {
  font-family: "Outfit", sans-serif;
  margin-top: auto;
  padding-bottom: 20px;
}

/* Mobile */
@media (max-width: 768px) {
  .static-page {
    min-height: 0;
    max-height: none;
    overflow-y: visible;
  }

  .static-page-body {
    padding: 20px 16px 48px;
  }

  .static-page-title {
    font-size: 22px;
  }
}
```

**Step 2: Update PrivacyPage.css to import shared and keep only privacy-specific styles**

Replace `apps/app/src/pages/privacy/PrivacyPage.css` with:

```css
@import "../shared/StaticPage.css";

/* Privacy-specific styles */
.privacy-table-wrap {
  overflow-x: auto;
  margin: 12px 0 16px;
}

.privacy-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.privacy-table th {
  text-align: left;
  padding: 10px 14px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.privacy-table td {
  padding: 10px 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.privacy-table tr:last-child td {
  border-bottom: none;
}
```

**Step 3: Update PrivacyPage.tsx to use shared class names**

Replace the privacy-specific class names with the shared ones:

- `privacy-page` → `static-page`
- `privacy-body` → `static-page-body`
- `privacy-back-link` → `static-page-back-link`
- `privacy-title` → `static-page-title`
- `privacy-effective-date` → `static-page-subtitle`
- `privacy-page-footer` → `static-page-footer`

**Step 4: Visually verify the privacy page still looks correct**

Open the app in browser and navigate to `/privacy`. Verify nothing broke.

**Step 5: Commit**

```bash
git add apps/app/src/pages/shared/StaticPage.css apps/app/src/pages/privacy/PrivacyPage.css apps/app/src/pages/privacy/PrivacyPage.tsx
git commit -m "refactor: extract shared static page CSS from PrivacyPage"
```

---

### Task 3: Create About page

**Files:**

- Create: `apps/app/src/pages/about/AboutPage.tsx`
- Create: `apps/app/src/pages/about/AboutPage.css`

**Step 1: Create the About page component**

Create `apps/app/src/pages/about/AboutPage.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./AboutPage.css";

function AboutPage() {
  return (
    <main id="main-content" className="static-page about-page">
      <div className="static-page-body">
        <Link to="/" className="static-page-back-link">
          &larr; Back to home
        </Link>

        <h2 className="static-page-title">About QRni</h2>
        <p className="static-page-subtitle">Free QR codes & short links, no fuss.</p>

        <h3>What is QRni?</h3>
        <p>
          QRni is a free tool for creating QR codes and shortening URLs. No sign-up required — just
          paste a link, get a QR code or short URL, and go. If you do sign in, you unlock features
          like custom short links, click analytics, and team namespaces for organizing links with
          collaborators.
        </p>

        <h3>Why we built it</h3>
        <p>
          Most QR code tools are bloated with features nobody asked for, paywalled for basic use, or
          plastered with dark patterns. QRni is the opposite — a simple tool that does what it says,
          respects your privacy, and gets out of your way. It's earnestly, unapologetically
          straightforward.
        </p>

        <h3>Meet the maker</h3>
        <div className="about-maker-card">
          <img
            src="https://github.com/imbensantos.png"
            alt="Ben Santos"
            className="about-maker-avatar"
          />
          <div className="about-maker-info">
            <h4 className="about-maker-name">Ben Santos</h4>
            <p className="about-maker-role">Front-End Developer from Davao City, Philippines</p>
            <p className="about-maker-bio">
              A passionate web developer who builds tools that are useful, accessible, and a little
              bit corny. QRni is a labor of love — built with React, Convex, and too many late
              nights.
            </p>
            <div className="about-maker-links">
              <a href="https://imbensantos.com" target="_blank" rel="noopener noreferrer">
                Website
              </a>
              <a href="https://github.com/imbensantos" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/imbensantos"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>

      <AdSlot
        slot="ABOUT_PILLAR_LEFT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-left"
      />
      <AdSlot
        slot="ABOUT_PILLAR_RIGHT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-right"
      />
      <AdSlot
        slot="ABOUT_SLOT_ID"
        format="horizontal"
        className="ad-slot--static-page"
        style={{ maxWidth: 728, margin: "24px auto" }}
      />

      <AppFooter className="static-page-footer" variant="privacy" />
    </main>
  );
}

export default AboutPage;
```

**Step 2: Create About page CSS**

Create `apps/app/src/pages/about/AboutPage.css`:

```css
@import "../shared/StaticPage.css";

/* About-specific: maker card */
.about-maker-card {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  padding: 20px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.about-maker-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.about-maker-info {
  min-width: 0;
}

.about-maker-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.about-maker-role {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.about-maker-bio {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.about-maker-links {
  display: flex;
  gap: 16px;
}

.about-maker-links a {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-primary);
  text-decoration: none;
}

.about-maker-links a:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 768px) {
  .about-maker-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .about-maker-links {
    justify-content: center;
  }
}
```

**Step 3: Commit**

```bash
git add apps/app/src/pages/about/
git commit -m "feat: add About page"
```

---

### Task 4: Create Contact page

**Files:**

- Create: `apps/app/src/pages/contact/ContactPage.tsx`
- Create: `apps/app/src/pages/contact/ContactPage.css`

**Step 1: Create the Contact page component**

Create `apps/app/src/pages/contact/ContactPage.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../../convex/_generated/api";
import AdSlot from "../../components/ads/AdSlot";
import AppFooter from "../../components/layout/AppFooter";
import "./ContactPage.css";

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submitContact = useMutation(api.contact.submitContactForm);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      await submitContact({ name, email, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main id="main-content" className="static-page contact-page">
      <div className="static-page-body">
        <Link to="/" className="static-page-back-link">
          &larr; Back to home
        </Link>

        <h2 className="static-page-title">Get in Touch</h2>
        <p className="static-page-subtitle">
          Got a question, found a bug, or just want to say hi? We'd love to hear from you.
        </p>

        {status === "sent" ? (
          <div className="contact-success">
            <p>Thanks for reaching out! We'll get back to you soon.</p>
            <button
              type="button"
              className="contact-send-another"
              onClick={() => setStatus("idle")}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="contact-label">
              Name
              <input
                type="text"
                className="contact-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={200}
                placeholder="Your name"
              />
            </label>

            <label className="contact-label">
              Email
              <input
                type="email"
                className="contact-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label className="contact-label">
              Message
              <textarea
                className="contact-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={5000}
                rows={6}
                placeholder="What's on your mind?"
              />
            </label>

            {status === "error" && <p className="contact-error">{errorMsg}</p>}

            <button type="submit" className="contact-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}

        <div className="contact-direct">
          <h3>Prefer email?</h3>
          <p>
            You can also reach us directly at <a href="mailto:contact@qrni.to">contact@qrni.to</a>.
          </p>
        </div>
      </div>

      <AdSlot
        slot="CONTACT_PILLAR_LEFT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-left"
      />
      <AdSlot
        slot="CONTACT_PILLAR_RIGHT_SLOT_ID"
        format="vertical"
        responsive={false}
        className="ad-slot--pillar ad-slot--pillar-right"
      />
      <AdSlot
        slot="CONTACT_SLOT_ID"
        format="horizontal"
        className="ad-slot--static-page"
        style={{ maxWidth: 728, margin: "24px auto" }}
      />

      <AppFooter className="static-page-footer" variant="privacy" />
    </main>
  );
}

export default ContactPage;
```

**Step 2: Create Contact page CSS**

Create `apps/app/src/pages/contact/ContactPage.css`:

```css
@import "../shared/StaticPage.css";

/* Contact form */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.contact-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.contact-input,
.contact-textarea {
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color 0.15s;
}

.contact-input:focus,
.contact-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.contact-textarea {
  resize: vertical;
  min-height: 120px;
}

.contact-submit {
  align-self: flex-start;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: "Outfit", sans-serif;
  color: var(--bg-card);
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: opacity 0.15s;
}

.contact-submit:hover:not(:disabled) {
  opacity: 0.85;
}

.contact-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.contact-error {
  font-size: 13px;
  color: var(--text-error, #dc3545);
  margin: 0;
}

.contact-success {
  padding: 24px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  text-align: center;
}

.contact-success p {
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.contact-send-another {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Direct contact section */
.contact-direct {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
}
```

**Step 3: Commit**

```bash
git add apps/app/src/pages/contact/
git commit -m "feat: add Contact page with form"
```

---

### Task 5: Wire routes and update footer links

**Files:**

- Modify: `apps/app/src/router.tsx`
- Modify: `apps/app/src/components/layout/AppFooter.tsx`
- Modify: `convex/lib/constants.ts` (add "contact" to RESERVED_SLUGS)

**Step 1: Add routes**

In `apps/app/src/router.tsx`:

Add imports:

```ts
import AboutPage from "./pages/about/AboutPage";
import ContactPage from "./pages/contact/ContactPage";
```

Add route definitions (after `inviteRoute`):

```ts
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});
```

Update `routeTree`:

```ts
export const routeTree = rootRoute.addChildren([
  indexRoute,
  profileRoute,
  privacyRoute,
  inviteRoute,
  aboutRoute,
  contactRoute,
]);
```

**Step 2: Update AppFooter**

Update `apps/app/src/components/layout/AppFooter.tsx` to add About and Contact links in the default variant:

```tsx
function AppFooter({ className = "", adSlot, variant = "default" }: AppFooterProps) {
  return (
    <footer className={`panel-footer ${className}`}>
      {adSlot && <AdSlot slot={adSlot.slot} format={adSlot.format} className={adSlot.className} />}
      <p className="copyright-footer">
        &copy; {new Date().getFullYear()} QRni
        {variant === "privacy" ? (
          ". All rights reserved."
        ) : (
          <>
            {" "}
            &middot;{" "}
            <Link to="/about" className="footer-link">
              About
            </Link>{" "}
            &middot;{" "}
            <Link to="/contact" className="footer-link">
              Contact
            </Link>{" "}
            &middot;{" "}
            <Link to="/privacy" className="footer-link">
              Privacy
            </Link>
          </>
        )}
      </p>
      <span className="powered-by">
        Powered by
        <a
          href="https://imbensantos.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit imBento website"
        >
          <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
        </a>
      </span>
    </footer>
  );
}
```

**Step 3: Add "contact" to RESERVED_SLUGS**

In `convex/lib/constants.ts`, add `"contact"` to the `RESERVED_SLUGS` set (it's already got `"about"`).

**Step 4: Run the app and verify**

- Navigate to `/about` — page renders with maker card
- Navigate to `/contact` — form renders, submit works
- Footer links work on all pages
- Mobile layout looks correct

**Step 5: Commit**

```bash
git add apps/app/src/router.tsx apps/app/src/components/layout/AppFooter.tsx convex/lib/constants.ts
git commit -m "feat: wire about/contact routes and update footer links"
```

---

### Task 6: Visual verification and polish

**Step 1: Desktop verification**

Use Playwright to screenshot both pages at 1280x800:

- `/about`
- `/contact`
- `/contact` with form filled + submitted (success state)
- `/privacy` (verify refactor didn't break it)

**Step 2: Mobile verification**

Use Playwright at 375x3000 (tall viewport) to screenshot:

- `/about` (check maker card stacks vertically)
- `/contact` (check form is full-width)

**Step 3: Fix any visual issues found**

**Step 4: Final commit if any fixes needed**

```bash
git commit -m "fix: polish about/contact page styling"
```
