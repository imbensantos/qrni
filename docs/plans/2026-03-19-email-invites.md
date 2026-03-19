# Email Invites Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Wire up Resend to send invite emails when a namespace owner invites a collaborator, and build the `/invite/$token` accept route.

**Architecture:** Add a Convex action (`sendInviteEmail`) that calls Resend after `createEmailInvite` succeeds. The mutation schedules the action via `ctx.scheduler.runAfter`. A new TanStack Router route at `/invite/$token` queries invite details and lets the user accept. Email HTML matches the Pencil design (warm cream, Outfit font, green CTA).

**Tech Stack:** Resend SDK, Convex actions + scheduler, TanStack Router, React

---

### Task 0: Install Resend and set env var

**Files:**

- Modify: `package.json` (root)

**Step 1: Install resend**

```bash
cd /Volumes/BNYDRV/Repos/ImBenSantos/qrni && npm install resend
```

**Step 2: Set Convex env var**

```bash
npx convex env set RESEND_API_KEY <paste-your-key>
npx convex env set APP_URL https://app.qrni.to
```

> Note: `APP_URL` is needed so the Convex action can build the invite link. In dev, set it to `http://localhost:5173`.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install resend for email invites"
```

---

### Task 1: Create the email HTML template

**Files:**

- Create: `convex/lib/emailTemplates.ts`
- Test: `convex/lib/emailTemplates.test.ts`

**Step 1: Write the failing test**

```typescript
// convex/lib/emailTemplates.test.ts
import { describe, it, expect } from "vitest";
import { buildInviteEmailHtml } from "./emailTemplates";

describe("buildInviteEmailHtml", () => {
  const baseArgs = {
    inviterName: "Ben Santos",
    namespaceName: "my-project",
    role: "editor" as const,
    acceptUrl: "https://app.qrni.to/invite/abc123",
  };

  it("returns an HTML string containing the inviter name", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Ben Santos");
  });

  it("includes the namespace name", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("my-project");
  });

  it("includes the role", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Editor");
  });

  it("includes the accept URL in the CTA link", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain('href="https://app.qrni.to/invite/abc123"');
  });

  it("includes the 7-day expiry notice", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("7 days");
  });

  it("includes the powered by Imbento footer", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Imbento");
  });

  it("includes the copyright footer", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("QRni");
    expect(html).toContain("All rights reserved");
  });

  it("escapes HTML entities in user-provided strings", () => {
    const html = buildInviteEmailHtml({
      ...baseArgs,
      inviterName: '<script>alert("xss")</script>',
      namespaceName: "proj&<>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("proj&amp;&lt;&gt;");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test:convex -- --run emailTemplates
```

Expected: FAIL — module not found

**Step 3: Write the email template**

```typescript
// convex/lib/emailTemplates.ts

/** Escape HTML special chars to prevent XSS in email content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface InviteEmailArgs {
  inviterName: string;
  namespaceName: string;
  role: "editor" | "viewer";
  acceptUrl: string;
}

export function buildInviteEmailHtml(args: InviteEmailArgs): string {
  const inviter = escapeHtml(args.inviterName);
  const namespace = escapeHtml(args.namespaceName);
  const role = args.role.charAt(0).toUpperCase() + args.role.slice(1);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>You're invited to collaborate on ${namespace}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F4F1; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #F5F4F1; padding: 40px 0; }
    .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 2px 12px rgba(26,25,24,0.03); }
    .logo-row { text-align: center; margin-bottom: 24px; }
    .logo-text { font-size: 24px; font-weight: 700; color: #1A1918; letter-spacing: -0.5px; }
    .logo-icon { color: #3D8A5A; font-size: 24px; }
    .divider { border: none; border-top: 1px solid #E5E4E1; margin: 0 0 24px 0; }
    .hero { text-align: center; margin-bottom: 24px; }
    .invite-circle { display: inline-block; width: 64px; height: 64px; background: #C8F0D8; border-radius: 50%; line-height: 64px; text-align: center; margin-bottom: 12px; }
    .invite-circle svg { vertical-align: middle; }
    .hero h1 { font-size: 26px; font-weight: 600; color: #1A1918; margin: 0 0 12px 0; letter-spacing: -0.5px; }
    .hero p { font-size: 15px; color: #6D6C6A; margin: 0; }
    .namespace-badge { display: inline-flex; align-items: center; gap: 10px; background: #FAFAF8; border: 1px solid #E5E4E1; border-radius: 12px; padding: 12px 20px; margin: 0 auto 8px auto; }
    .namespace-badge span { font-size: 18px; font-weight: 600; color: #1A1918; }
    .role-row { text-align: center; margin-bottom: 24px; }
    .role-label { font-size: 14px; color: #9C9B99; }
    .role-badge { display: inline-block; background: #C8F0D8; color: #3D8A5A; font-size: 13px; font-weight: 600; border-radius: 100px; padding: 4px 12px; margin-left: 8px; }
    .cta { display: block; width: 100%; background: #3D8A5A; color: #FFFFFF !important; text-decoration: none; text-align: center; font-size: 16px; font-weight: 600; padding: 14px 24px; border-radius: 12px; box-sizing: border-box; letter-spacing: -0.2px; }
    .expiry { text-align: center; font-size: 12px; color: #9C9B99; margin: 24px 0 0 0; }
    .divider-2 { border: none; border-top: 1px solid #E5E4E1; margin: 24px 0; }
    .footer-text { text-align: center; font-size: 12px; color: #9C9B99; line-height: 1.5; margin: 0; }
    .bottom-footer { text-align: center; padding: 16px 0 0 0; max-width: 520px; margin: 0 auto; }
    .copyright { font-size: 12px; color: #9C9B99; margin: 0 0 10px 0; }
    .powered-by { font-size: 11px; color: #9C9B99; }
    .powered-by a { color: #6D6C6A; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-row">
        <span class="logo-icon">&#9638;&#9638;</span>
        <span class="logo-text">QRni</span>
      </div>
      <hr class="divider" />
      <div class="hero">
        <div class="invite-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D8A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <h1>You're invited!</h1>
        <p>${inviter} invited you to collaborate on</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <div class="namespace-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D89575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>${namespace}</span>
        </div>
      </div>
      <div class="role-row">
        <span class="role-label">as</span>
        <span class="role-badge">${role}</span>
      </div>
      <a href="${args.acceptUrl}" class="cta">Accept Invitation</a>
      <p class="expiry">This invitation expires in 7 days.</p>
      <hr class="divider-2" />
      <p class="footer-text">If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="bottom-footer">
      <p class="copyright">&copy; QRni ${year}. All rights reserved.</p>
      <p class="powered-by">Powered by <a href="https://imbensantos.com">Imbento</a></p>
    </div>
  </div>
</body>
</html>`;
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test:convex -- --run emailTemplates
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add convex/lib/emailTemplates.ts convex/lib/emailTemplates.test.ts
git commit -m "feat: add invite email HTML template"
```

---

### Task 2: Create the Convex sendInviteEmail action

**Files:**

- Create: `convex/email.ts`

**Step 1: Write the action**

```typescript
// convex/email.ts
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { buildInviteEmailHtml } from "./lib/emailTemplates";

export const sendInviteEmail = action({
  args: {
    to: v.string(),
    inviterName: v.string(),
    namespaceName: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not set, skipping invite email");
      return;
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      console.error("APP_URL not set, skipping invite email");
      return;
    }

    const acceptUrl = `${appUrl}/invite/${args.token}`;
    const html = buildInviteEmailHtml({
      inviterName: args.inviterName,
      namespaceName: args.namespaceName,
      role: args.role,
      acceptUrl,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "QRni <no-reply@qrni.to>",
      to: args.to,
      subject: `${args.inviterName} invited you to collaborate on ${args.namespaceName}`,
      html,
    });

    if (error) {
      console.error("Failed to send invite email:", error);
    }
  },
});
```

> **Important:** This file uses `"use node"` at the top because Resend SDK requires Node.js runtime. Convex actions with `"use node"` run in a Node.js environment.

**Step 2: Verify types compile**

```bash
cd /Volumes/BNYDRV/Repos/ImBenSantos/qrni && npx convex dev --once
```

Expected: No type errors

**Step 3: Commit**

```bash
git add convex/email.ts
git commit -m "feat: add sendInviteEmail Convex action via Resend"
```

---

### Task 3: Wire createEmailInvite to schedule the email

**Files:**

- Modify: `convex/collaboration.ts`

**Step 1: Update the mutation to schedule the email action**

In `convex/collaboration.ts`, add the import at the top:

```typescript
import { internal } from "./_generated/api";
```

Then, after the `logAudit` call in `createEmailInvite` (before `return inviteId`), add:

```typescript
// Schedule the invite email (fire-and-forget — don't block the mutation)
await ctx.scheduler.runAfter(0, internal.email.sendInviteEmail, {
  to: normalizedEmail,
  inviterName: user.name || user.email || "Someone",
  namespaceName: namespace.slug,
  role: args.role,
  token,
});
```

Also update the `sendInviteEmail` export in `convex/email.ts` from `action` to `internalAction`:

```typescript
// convex/email.ts — change the import and export
import { internalAction } from "./_generated/server";

export const sendInviteEmail = internalAction({
  // ... same args and handler
});
```

> Using `internalAction` + `ctx.scheduler.runAfter` means the email action is not callable from the client — only from other server-side functions.

**Step 2: Verify types compile**

```bash
npx convex dev --once
```

**Step 3: Commit**

```bash
git add convex/collaboration.ts convex/email.ts
git commit -m "feat: schedule invite email after creating email invite"
```

---

### Task 4: Create the invite query for the accept page

**Files:**

- Modify: `convex/collaboration.ts`

**Step 1: Write the failing test**

This is a query that fetches invite details by token — no auth required (recipient may not be signed in yet). Add to test file:

```typescript
// Test concept: getInviteByToken returns invite details for valid tokens
// This will be validated via the actual route, but we test the query shape
```

**Step 2: Add the query**

In `convex/collaboration.ts`, add a new public query:

```typescript
export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("namespace_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite || invite.revoked) return null;
    if (invite.expiresAt !== undefined && Date.now() > invite.expiresAt) return null;

    const namespace = await ctx.db.get(invite.namespace);
    if (!namespace) return null;

    const inviter = await ctx.db.get(invite.createdBy);

    return {
      namespaceName: namespace.slug,
      role: invite.role,
      type: invite.type,
      email: invite.email,
      inviterName: inviter?.name || inviter?.email || "Someone",
    };
  },
});
```

**Step 3: Verify types compile**

```bash
npx convex dev --once
```

**Step 4: Commit**

```bash
git add convex/collaboration.ts
git commit -m "feat: add getInviteByToken query for accept page"
```

---

### Task 5: Create the /invite/$token route and page

**Files:**

- Create: `apps/app/src/pages/InviteAcceptPage.tsx`
- Create: `apps/app/src/pages/InviteAcceptPage.css`
- Modify: `apps/app/src/router.tsx`

**Step 1: Create the page component**

```typescript
// apps/app/src/pages/InviteAcceptPage.tsx
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "@tanstack/react-router";
import "./InviteAcceptPage.css";

function InviteAcceptPage() {
  const { token } = useParams({ from: "/invite/$token" });
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const invite = useQuery(api.collaboration.getInviteByToken, { token });
  const acceptInvite = useMutation(api.collaboration.acceptInvite);
  const [status, setStatus] = useState<"idle" | "accepting" | "accepted" | "error">("idle");
  const [error, setError] = useState("");

  async function handleAccept() {
    setStatus("accepting");
    setError("");
    try {
      await acceptInvite({ token });
      setStatus("accepted");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message || "Failed to accept invite");
    }
  }

  // Loading state
  if (invite === undefined || authLoading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-loading">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired invite
  if (invite === null) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle invite-icon-error">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D08068" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="invite-title">Invite not found</h1>
          <p className="invite-subtitle">This invitation may have expired or been revoked.</p>
          <a href="/" className="invite-cta-secondary">Go to QRni</a>
        </div>
      </div>
    );
  }

  // Accepted state
  if (status === "accepted") {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="invite-title">You're in!</h1>
          <p className="invite-subtitle">
            You've joined <strong>{invite.namespaceName}</strong> as {invite.role}.
          </p>
          <a href="/" className="invite-cta">Go to QRni</a>
        </div>
      </div>
    );
  }

  // Main invite view
  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-icon-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 className="invite-title">You're invited!</h1>
        <p className="invite-subtitle">
          {invite.inviterName} invited you to collaborate on
        </p>

        <div className="invite-namespace-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D89575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>{invite.namespaceName}</span>
        </div>

        <div className="invite-role-row">
          <span className="invite-role-label">as</span>
          <span className="invite-role-badge">{invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}</span>
        </div>

        {!isAuthenticated ? (
          <button className="invite-cta" onClick={() => signIn("google")}>
            Sign in with Google to accept
          </button>
        ) : (
          <button
            className="invite-cta"
            onClick={handleAccept}
            disabled={status === "accepting"}
          >
            {status === "accepting" ? "Accepting..." : "Accept Invitation"}
          </button>
        )}

        {error && <p className="invite-error">{error}</p>}
      </div>
    </div>
  );
}

export default InviteAcceptPage;
```

**Step 2: Create the CSS**

```css
/* apps/app/src/pages/InviteAcceptPage.css */
.invite-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f4f1;
  padding: 24px;
}

.invite-card {
  max-width: 440px;
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(26, 25, 24, 0.03);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.invite-loading {
  font-family: "Outfit", sans-serif;
  font-size: 15px;
  color: #9c9b99;
}

.invite-icon-circle {
  width: 64px;
  height: 64px;
  background: #c8f0d8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.invite-icon-error {
  background: #fdeae6;
}

.invite-title {
  font-family: "Outfit", sans-serif;
  font-size: 26px;
  font-weight: 600;
  color: #1a1918;
  margin: 0;
  letter-spacing: -0.5px;
}

.invite-subtitle {
  font-family: "Outfit", sans-serif;
  font-size: 15px;
  color: #6d6c6a;
  margin: 0;
  line-height: 1.5;
}

.invite-namespace-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fafaf8;
  border: 1px solid #e5e4e1;
  border-radius: 12px;
  padding: 12px 20px;
}

.invite-namespace-badge span {
  font-family: "Outfit", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1a1918;
}

.invite-role-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.invite-role-label {
  font-family: "Outfit", sans-serif;
  font-size: 14px;
  color: #9c9b99;
}

.invite-role-badge {
  background: #c8f0d8;
  color: #3d8a5a;
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  font-weight: 600;
  border-radius: 100px;
  padding: 4px 12px;
}

.invite-cta {
  width: 100%;
  background: #3d8a5a;
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-family: "Outfit", sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 24px;
  border-radius: 12px;
  letter-spacing: -0.2px;
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 8px;
  transition: opacity 0.15s;
}

.invite-cta:hover {
  opacity: 0.9;
}

.invite-cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.invite-cta-secondary {
  font-family: "Outfit", sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #3d8a5a;
  text-decoration: none;
  margin-top: 8px;
}

.invite-cta-secondary:hover {
  text-decoration: underline;
}

.invite-error {
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  color: #d08068;
  margin: 4px 0 0 0;
}
```

**Step 3: Register the route**

In `apps/app/src/router.tsx`, add:

```typescript
import InviteAcceptPage from "./pages/InviteAcceptPage";

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: InviteAcceptPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  profileRoute,
  privacyRoute,
  inviteRoute,
]);
```

**Step 4: Verify it builds**

```bash
npm run build:app
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/app/src/pages/InviteAcceptPage.tsx apps/app/src/pages/InviteAcceptPage.css apps/app/src/router.tsx
git commit -m "feat: add /invite/$token route for accepting email invites"
```

---

### Task 6: Manual E2E verification

**Step 1: Start dev servers**

```bash
npx convex dev &
npm run dev:app
```

**Step 2: Verify env vars are set**

```bash
npx convex env list
```

Confirm `RESEND_API_KEY` and `APP_URL` are present.

**Step 3: Test the full flow**

1. Sign in to the app
2. Create a namespace (or use an existing one)
3. Open the Invite Members modal
4. Enter a real email address and click "Send invite"
5. Check the email inbox — should receive the styled invite email
6. Click "Accept Invitation" in the email
7. Lands on `/invite/{token}` page
8. Sign in (if needed) and accept
9. Verify membership shows in the namespace

**Step 4: Test error states**

- Visit `/invite/invalid-token` — should show "Invite not found"
- Try accepting an already-accepted invite — should show error
- Visit a revoked invite link — should show "Invite not found"
