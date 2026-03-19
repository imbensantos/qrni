# Google AdSense Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add Google AdSense ads to QRni, gated behind a future premium flag, with between-content and pillar placements across all pages.

**Architecture:** A reusable `<AdSlot>` component wraps AdSense units and checks `isPremium` before rendering. The AdSense script is loaded once in `index.html`. CSP and Privacy Policy are updated to allow Google ad domains.

**Tech Stack:** React 19, Google AdSense (manual script tag), Vite, Vercel (CSP headers)

---

### Task 0: Add AdSense script to index.html

**Files:**

- Modify: `apps/app/index.html:46-49`

**Step 1: Add the AdSense script tag**

Add inside `<head>`, before the closing `</head>` tag:

```html
<!-- Google AdSense -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
  crossorigin="anonymous"
></script>
```

> **Note:** Replace `ca-pub-XXXXXXXXXX` with the actual AdSense publisher ID. Use an environment variable or placeholder for now.

**Step 2: Commit**

```bash
git add apps/app/index.html
git commit -m "feat: add Google AdSense script tag to index.html"
```

---

### Task 1: Update CSP headers for AdSense

**Files:**

- Modify: `apps/app/vercel.json:16-17`

**Step 1: Update the Content-Security-Policy header**

AdSense requires these additional CSP sources:

- `script-src`: `https://pagead2.googlesyndication.com https://www.googletagservices.com https://adservice.google.com`
- `frame-src`: `https://googleads.g.doubleclick.net https://tpc.googlesyndication.com`
- `img-src`: `https://pagead2.googlesyndication.com` (already covered by `https:`)
- `connect-src`: `https://pagead2.googlesyndication.com`
- `style-src`: already has `'unsafe-inline'`

Update the CSP value in `vercel.json`:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://www.googletagservices.com https://adservice.google.com; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://pagead2.googlesyndication.com; img-src 'self' https: data: blob:; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; frame-ancestors 'none'; object-src 'none'"
}
```

**Step 2: Also update the CSP in `vite.config.js`** (for dev mode, if present)

Check `apps/app/vite.config.js` for dev CSP headers and update similarly.

**Step 3: Commit**

```bash
git add apps/app/vercel.json apps/app/vite.config.js
git commit -m "feat: update CSP headers to allow Google AdSense domains"
```

---

### Task 2: Create the AdSlot component

**Files:**

- Create: `apps/app/src/components/AdSlot.tsx`
- Create: `apps/app/src/components/AdSlot.css`
- Create: `apps/app/src/components/AdSlot.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/app/src/components/AdSlot.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdSlot from "./AdSlot";

// Mock window.adsbygoogle
beforeEach(() => {
  (window as any).adsbygoogle = [];
});

afterEach(() => {
  delete (window as any).adsbygoogle;
});

describe("AdSlot", () => {
  it("renders an ins element with correct data attributes", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute("data-ad-slot")).toBe("1234567890");
    expect(ins?.getAttribute("data-ad-format")).toBe("auto");
  });

  it("renders nothing when isPremium is true", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" isPremium={true} />);
    expect(container.innerHTML).toBe("");
  });

  it("pushes to adsbygoogle array on mount", () => {
    render(<AdSlot slot="1234567890" format="auto" />);
    expect((window as any).adsbygoogle.length).toBe(1);
  });

  it("applies className when provided", () => {
    const { container } = render(<AdSlot slot="1234567890" format="auto" className="my-ad" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains("my-ad")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/app && npx vitest run src/components/AdSlot.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the AdSlot component**

```tsx
// apps/app/src/components/AdSlot.tsx
import { useEffect, useRef } from "react";
import "./AdSlot.css";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdSlotProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  isPremium?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  isPremium = false,
  className,
  style,
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || isPremium) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded (e.g., ad blocker)
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className={`ad-slot${className ? ` ${className}` : ""}`} style={style}>
      <span className="ad-slot-label">Ad</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

export default AdSlot;
```

**Step 4: Write the CSS**

```css
/* apps/app/src/components/AdSlot.css */
.ad-slot {
  width: 100%;
}

.ad-slot-label {
  display: block;
  font-size: 10px;
  color: var(--text-tertiary, #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
```

**Step 5: Run test to verify it passes**

Run: `cd apps/app && npx vitest run src/components/AdSlot.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/app/src/components/AdSlot.tsx apps/app/src/components/AdSlot.css apps/app/src/components/AdSlot.test.tsx
git commit -m "feat: create AdSlot component with premium gating"
```

---

### Task 3: Add ad to the QR Generator preview panel

**Files:**

- Modify: `apps/app/src/components/PreviewPanel.tsx:91-233`
- Modify: `apps/app/src/components/PreviewPanel.css`

**Step 1: Import AdSlot**

At the top of `PreviewPanel.tsx`, add:

```tsx
import AdSlot from "./AdSlot";
```

**Step 2: Add ad at the bottom of the preview panel**

Inside the `preview-panel` section, after `<div className="preview-content">` closes (before `</section>`), add:

```tsx
<AdSlot slot="PREVIEW_PANEL_SLOT_ID" format="horizontal" className="ad-slot--preview" />
```

**Step 3: Add CSS for positioning**

In `PreviewPanel.css`, add:

```css
.ad-slot--preview {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 468px;
  z-index: 1;
}
```

> The preview panel already has `position: relative` (verify and add if not).

**Step 4: Commit**

```bash
git add apps/app/src/components/PreviewPanel.tsx apps/app/src/components/PreviewPanel.css
git commit -m "feat: add AdSense slot to QR generator preview panel"
```

---

### Task 4: Add ad to the controls sidebar

**Files:**

- Modify: `apps/app/src/components/ControlsPanel.tsx:362-363`

**Step 1: Import AdSlot**

```tsx
import AdSlot from "./AdSlot";
```

**Step 2: Add ad between the generate button and the panel-spacer**

After the `<button className="generate-btn">` (line ~361) and before `<div className="panel-spacer" />` (line ~363), add:

```tsx
<AdSlot slot="SIDEBAR_SLOT_ID" format="rectangle" className="ad-slot--sidebar" />
```

**Step 3: Commit**

```bash
git add apps/app/src/components/ControlsPanel.tsx
git commit -m "feat: add AdSense slot to QR generator controls sidebar"
```

---

### Task 5: Add ads to the Profile page (in-feed + pillars)

**Files:**

- Modify: `apps/app/src/pages/ProfilePage.tsx:167-183`
- Modify: `apps/app/src/pages/ProfilePage.css`

**Step 1: Import AdSlot**

```tsx
import AdSlot from "../components/AdSlot";
```

**Step 2: Add in-feed ad between My Links and Namespaces**

After the `<MyLinksSection>` component (line ~173) and before the namespace header `<div className="pp-namespace-header">` (line ~176), add:

```tsx
<AdSlot slot="PROFILE_INFEED_SLOT_ID" format="horizontal" className="ad-slot--profile-infeed" />
```

**Step 3: Add pillar ads on each side**

Inside the `<div className="pp-body">` container, add two pillar ads:

```tsx
<AdSlot
  slot="PROFILE_PILLAR_LEFT_SLOT_ID"
  format="vertical"
  responsive={false}
  className="ad-slot--pillar ad-slot--pillar-left"
/>
<AdSlot
  slot="PROFILE_PILLAR_RIGHT_SLOT_ID"
  format="vertical"
  responsive={false}
  className="ad-slot--pillar ad-slot--pillar-right"
/>
```

**Step 4: Add pillar CSS**

In `ProfilePage.css`, add:

```css
.ad-slot--pillar {
  position: sticky;
  top: 80px;
  width: 160px;
  height: 600px;
  flex-shrink: 0;
}

.ad-slot--pillar-left {
  order: -1;
}

.ad-slot--pillar-right {
  order: 1;
}

.ad-slot--profile-infeed {
  margin: 16px 0;
}

/* Hide pillar ads on smaller screens */
@media (max-width: 1200px) {
  .ad-slot--pillar {
    display: none;
  }
}
```

> The `.pp-body` container may need `display: flex` with the content column centered. Verify and adjust layout if needed.

**Step 5: Commit**

```bash
git add apps/app/src/pages/ProfilePage.tsx apps/app/src/pages/ProfilePage.css
git commit -m "feat: add AdSense slots to profile page (in-feed + pillars)"
```

---

### Task 6: Add ad to the Privacy page

**Files:**

- Modify: `apps/app/src/pages/PrivacyPage.tsx:226-243`

**Step 1: Import AdSlot**

```tsx
import AdSlot from "../components/AdSlot";
```

**Step 2: Add ad between content and footer**

After `</div>` closing the `.privacy-body` div (line ~226) and before `<footer>` (line ~228), add:

```tsx
<AdSlot
  slot="PRIVACY_SLOT_ID"
  format="horizontal"
  className="ad-slot--static-page"
  style={{ maxWidth: 728, margin: "24px auto" }}
/>
```

**Step 3: Commit**

```bash
git add apps/app/src/pages/PrivacyPage.tsx
git commit -m "feat: add AdSense slot to privacy page"
```

---

### Task 7: Add ad to the mobile QR Generator layout

**Files:**

- Modify: `apps/app/src/pages/QRGeneratorPage.tsx:111-113`

**Step 1: Import AdSlot**

```tsx
import AdSlot from "../components/AdSlot";
```

**Step 2: Add a mobile-only in-feed ad**

Between the sidebar panel and preview panel (between the closing `</div>` of `.sidebar-panel` and the `<PreviewPanel>`), add:

```tsx
<AdSlot slot="MOBILE_INFEED_SLOT_ID" format="rectangle" className="ad-slot--mobile-infeed" />
```

**Step 3: Add CSS to show only on mobile**

In `App.css` (where `.body` responsive styles live):

```css
.ad-slot--mobile-infeed {
  display: none;
  padding: 12px 16px;
}

@media (max-width: 768px) {
  .ad-slot--mobile-infeed {
    display: block;
  }
}
```

**Step 4: Commit**

```bash
git add apps/app/src/pages/QRGeneratorPage.tsx apps/app/src/App.css
git commit -m "feat: add mobile-only in-feed ad to QR generator page"
```

---

### Task 8: Update Privacy Policy for AdSense disclosure

**Files:**

- Modify: `apps/app/src/pages/PrivacyPage.tsx:144-148` (the TODO comment area)
- Modify: `apps/app/src/pages/PrivacyPage.tsx:150-156` (cookies section)

**Step 1: Update the third-party services table**

Add a new row to the table (after the Vercel Analytics row):

```tsx
<tr>
  <td>Google AdSense</td>
  <td>Advertising</td>
  <td>
    Cookies, device information, and browsing behavior for ad personalization (see{" "}
    <a
      href="https://policies.google.com/technologies/ads"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google's ad policies
    </a>
    )
  </td>
</tr>
```

**Step 2: Remove the TODO comment and update the "no advertising" paragraph**

Replace lines 144-148 (TODO + "We do not use advertising networks") with:

```tsx
<p>
  We use Google AdSense to display ads to free-tier users. Google may use cookies and device
  identifiers to serve personalized ads. You can opt out of personalized advertising at{" "}
  <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
    Google Ad Settings
  </a>
  . We do not sell your data.
</p>
```

**Step 3: Update the Cookies section**

Replace the cookies paragraph (section 4) to mention advertising cookies:

```tsx
<p>
  QRni uses cookies for authentication (session tokens via our auth provider) and advertising
  (Google AdSense may set cookies for ad personalization and measurement). Authentication cookies
  are strictly necessary and are cleared when you log out. You can manage ad cookie preferences
  through your{" "}
  <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
    Google Ad Settings
  </a>
  .
</p>
```

**Step 4: Commit**

```bash
git add apps/app/src/pages/PrivacyPage.tsx
git commit -m "docs: update privacy policy for Google AdSense disclosure"
```

---

### Task 9: Integration test — verify ads render on all pages

**Files:**

- Create: `apps/app/src/components/AdSlot.integration.test.tsx`

**Step 1: Write integration tests**

```tsx
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import AdSlot from "./AdSlot";

beforeEach(() => {
  (window as any).adsbygoogle = [];
});

afterEach(() => {
  delete (window as any).adsbygoogle;
});

describe("AdSlot integration", () => {
  it("renders with horizontal format", () => {
    const { container } = render(<AdSlot slot="123" format="horizontal" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins?.getAttribute("data-ad-format")).toBe("horizontal");
  });

  it("renders with vertical format for pillar ads", () => {
    const { container } = render(<AdSlot slot="456" format="vertical" responsive={false} />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins?.getAttribute("data-ad-format")).toBe("vertical");
    expect(ins?.getAttribute("data-full-width-responsive")).toBe("false");
  });

  it("does not push to adsbygoogle when premium", () => {
    render(<AdSlot slot="789" isPremium={true} />);
    expect((window as any).adsbygoogle.length).toBe(0);
  });
});
```

**Step 2: Run all tests**

Run: `cd apps/app && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add apps/app/src/components/AdSlot.integration.test.tsx
git commit -m "test: add AdSlot integration tests"
```

---

## Summary of Ad Slot IDs to Configure

After getting your AdSense publisher ID (`ca-pub-XXXXXXXXXX`), create these ad units in the AdSense dashboard and replace the placeholder slot IDs:

| Location             | Placeholder                    | Format     | Size    |
| -------------------- | ------------------------------ | ---------- | ------- |
| Preview panel        | `PREVIEW_PANEL_SLOT_ID`        | horizontal | 468x60  |
| Controls sidebar     | `SIDEBAR_SLOT_ID`              | rectangle  | 300x250 |
| Mobile in-feed       | `MOBILE_INFEED_SLOT_ID`        | rectangle  | 300x250 |
| Profile in-feed      | `PROFILE_INFEED_SLOT_ID`       | horizontal | 728x90  |
| Profile pillar left  | `PROFILE_PILLAR_LEFT_SLOT_ID`  | vertical   | 160x600 |
| Profile pillar right | `PROFILE_PILLAR_RIGHT_SLOT_ID` | vertical   | 160x600 |
| Privacy page         | `PRIVACY_SLOT_ID`              | horizontal | 728x90  |

## Design Reference

See `docs/plans/2026-03-19-adsense-placement-design.md` and Pencil screens in `designs/qrni-app.pen`.
