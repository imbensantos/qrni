# Profile Dashboard (TanStack Router) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/profile` route with link management, namespace management, collaboration, and profile editing using TanStack Router.

**Architecture:** TanStack Router handles `/` (QR generator) and `/profile` (dashboard). A shared root layout renders the header + `<Outlet>`. Profile page is auth-guarded. All modals are local state within ProfilePage.

**Tech Stack:** React 19, TanStack Router, Convex (backend), CSS (no Tailwind)

**Design Reference:** `designs/qrni-app.pen` — see `docs/plans/2026-03-16-profile-dashboard-design.md` for frame IDs.

---

### Task 0: Install TanStack Router and set up Vite plugin

**Files:**

- Modify: `apps/app/package.json`
- Modify: `apps/app/vite.config.js`

**Step 1: Install dependencies**

Run from repo root:

```bash
cd apps/app && npm install @tanstack/react-router @tanstack/react-router-devtools
```

Note: We're using code-based routing (not file-based), so no Vite plugin needed. TanStack Router's file-based routing requires `@tanstack/router-plugin` but adds complexity we don't need for 2 routes.

**Step 2: Commit**

```bash
git add apps/app/package.json apps/app/package-lock.json
git commit -m "feat: install TanStack Router dependencies"
```

---

### Task 1: Set up router with root layout and two routes

**Files:**

- Create: `apps/app/src/router.jsx`
- Create: `apps/app/src/pages/QRGeneratorPage.jsx`
- Create: `apps/app/src/pages/ProfilePage.jsx` (placeholder)
- Modify: `apps/app/src/main.jsx`
- Modify: `apps/app/src/App.jsx`

**Step 1: Create the router file**

Create `apps/app/src/router.jsx`:

```jsx
import {
  createRouter,
  createRoute,
  createRootRoute,
} from "@tanstack/react-router";
import App from "./App";
import QRGeneratorPage from "./pages/QRGeneratorPage";
import ProfilePage from "./pages/ProfilePage";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: QRGeneratorPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

export const routeTree = rootRoute.addChildren([indexRoute, profileRoute]);

export const router = createRouter({ routeTree });
```

**Step 2: Extract QR generator into its own page**

Create `apps/app/src/pages/QRGeneratorPage.jsx`. Move ALL the QR generator state and JSX from `App.jsx` into this component. Keep the same imports and logic — just move it out of App.

```jsx
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import ControlsPanel from "../components/ControlsPanel";
import PreviewPanel from "../components/PreviewPanel";
import BulkPanel from "../components/BulkPanel";
import BulkPreview from "../components/BulkPreview";

function QRGeneratorPage() {
  const [mode, setMode] = useState("single");
  const [url, setUrl] = useState("");
  const [fgColor, setFgColor] = useState("#1A1918");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [logo, setLogo] = useState(null);
  const [dotStyle, setDotStyle] = useState("square");
  const [size, setSize] = useState(512);
  const [format, setFormat] = useState("png");
  const [bulkEntries, setBulkEntries] = useState([]);
  const [shortenLink, setShortenLink] = useState(
    () => localStorage.getItem("qrni-shorten-link") === "true",
  );
  const [shortLinkResult, setShortLinkResult] = useState(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const { trigger } = useWebHaptics();

  const isValidUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <main className="body">
      <div className="sidebar-panel">
        <div
          className={`mode-toggle ${mode}`}
          role="group"
          aria-label="Generation mode"
        >
          <button
            className={`mode-btn ${mode === "single" ? "active" : ""}`}
            aria-pressed={mode === "single"}
            onClick={() => {
              setMode("single");
              trigger("nudge");
            }}
          >
            Single
          </button>
          <button
            className={`mode-btn ${mode === "bulk" ? "active" : ""}`}
            aria-pressed={mode === "bulk"}
            onClick={() => {
              setMode("bulk");
              trigger("nudge");
            }}
          >
            Bulk
          </button>
        </div>
        <hr className="divider" />
        {mode === "single" ? (
          <ControlsPanel
            url={url}
            onUrlChange={(v) => {
              setUrl(v);
              setQrGenerated(false);
            }}
            fgColor={fgColor}
            onFgColorChange={setFgColor}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            logo={logo}
            onLogoChange={setLogo}
            dotStyle={dotStyle}
            onDotStyleChange={setDotStyle}
            size={size}
            onSizeChange={setSize}
            shortenLink={shortenLink}
            onShortenLinkChange={(v) => {
              setShortenLink(v);
              localStorage.setItem("qrni-shorten-link", String(v));
            }}
            onShortLinkCreated={setShortLinkResult}
            onGenerate={() => setQrGenerated(true)}
            qrGenerated={qrGenerated}
          />
        ) : (
          <BulkPanel
            fgColor={fgColor}
            onFgColorChange={setFgColor}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            logo={logo}
            onLogoChange={setLogo}
            dotStyle={dotStyle}
            onDotStyleChange={setDotStyle}
            size={size}
            onSizeChange={setSize}
            format={format}
            onFormatChange={setFormat}
            onEntriesParsed={setBulkEntries}
          />
        )}
      </div>
      {mode === "single" ? (
        <PreviewPanel
          url={url}
          isValidUrl={isValidUrl && qrGenerated}
          fgColor={fgColor}
          bgColor={bgColor}
          logo={logo}
          dotStyle={dotStyle}
          size={size}
          format={format}
          onFormatChange={setFormat}
          shortenLink={shortenLink}
          shortLinkResult={shortLinkResult}
        />
      ) : (
        <BulkPreview
          entries={bulkEntries}
          onEntriesChange={setBulkEntries}
          fgColor={fgColor}
          bgColor={bgColor}
          logo={logo}
          dotStyle={dotStyle}
          size={size}
          format={format}
        />
      )}
    </main>
  );
}

export default QRGeneratorPage;
```

**Step 3: Create placeholder ProfilePage**

Create `apps/app/src/pages/ProfilePage.jsx`:

```jsx
function ProfilePage() {
  return (
    <main className="profile-page">
      <p>Profile coming soon</p>
    </main>
  );
}

export default ProfilePage;
```

**Step 4: Refactor App.jsx to be the root layout**

Replace `apps/app/src/App.jsx` with:

```jsx
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Outlet, Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import ProfileDropdown from "./components/ProfileDropdown";
import "./App.css";

function App() {
  const { signIn } = useAuthActions();
  const user = useQuery(api.users.currentUser);

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo-link">
          <h1 className="logo">QRni ✨</h1>
        </Link>
        {user ? (
          <ProfileDropdown user={user} />
        ) : (
          <button className="signin-btn" onClick={() => signIn("google")}>
            Sign in
          </button>
        )}
      </header>
      <Outlet />
    </div>
  );
}

export default App;
```

**Step 5: Update main.jsx to use the router**

Replace `apps/app/src/main.jsx` with:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { RouterProvider } from "@tanstack/react-router";
import { inject } from "@vercel/analytics";
import { router } from "./router.jsx";
import "./index.css";

inject();

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexAuthProvider>
  </StrictMode>,
);
```

**Step 6: Add logo-link style to App.css**

Append to `apps/app/src/App.css`:

```css
.logo-link {
  text-decoration: none;
}
```

**Step 7: Verify the app runs**

```bash
cd apps/app && npm run dev
```

Visit `http://localhost:5173/` — should see QR generator as before.
Visit `http://localhost:5173/profile` — should see "Profile coming soon".

**Step 8: Commit**

```bash
git add apps/app/src/
git commit -m "feat: set up TanStack Router with root layout and two routes"
```

---

### Task 2: Add "View profile" link to ProfileDropdown

**Files:**

- Modify: `apps/app/src/components/ProfileDropdown.jsx`
- Modify: `apps/app/src/components/ProfileDropdown.css`

**Step 1: Add profile link to dropdown menu**

In `ProfileDropdown.jsx`, add `import { Link } from '@tanstack/react-router'` and add a "View profile" menu item before the divider/sign-out:

```jsx
<Link
  to="/profile"
  className="profile-menu-item"
  role="menuitem"
  onClick={() => setOpen(false)}
>
  View profile
</Link>
```

**Step 2: Commit**

```bash
git add apps/app/src/components/ProfileDropdown.jsx
git commit -m "feat: add 'View profile' link to ProfileDropdown"
```

---

### Task 3: Backend — add updateLink mutation

**Files:**

- Modify: `convex/links.ts`

**Step 1: Add updateLink mutation**

Add to `convex/links.ts`:

```typescript
export const updateLink = mutation({
  args: {
    linkId: v.id("links"),
    newSlug: v.optional(v.string()),
    newDestinationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found");
    if (link.owner !== user._id) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};

    if (args.newDestinationUrl !== undefined) {
      if (
        !args.newDestinationUrl.startsWith("http://") &&
        !args.newDestinationUrl.startsWith("https://")
      ) {
        throw new Error("URL must start with http:// or https://");
      }
      updates.destinationUrl = args.newDestinationUrl;
    }

    if (args.newSlug !== undefined) {
      if (!isValidCustomSlug(args.newSlug)) {
        throw new Error(
          "Slug must be 1-60 chars: letters, numbers, hyphens, underscores",
        );
      }

      // Build new shortCode
      let newShortCode: string;
      if (link.namespace) {
        const ns = await ctx.db.get(link.namespace);
        if (!ns) throw new Error("Namespace not found");
        // Check uniqueness within namespace
        const existing = await ctx.db
          .query("links")
          .withIndex("by_namespace_slug", (q) =>
            q
              .eq("namespace", link.namespace!)
              .eq("namespaceSlug", args.newSlug!),
          )
          .first();
        if (existing && existing._id !== link._id)
          throw new Error("This slug already exists in this namespace");
        newShortCode = `${ns.slug}/${args.newSlug}`;
        updates.namespaceSlug = args.newSlug;
      } else {
        // Check uniqueness for flat slugs
        const existing = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", args.newSlug!))
          .first();
        if (existing && existing._id !== link._id)
          throw new Error("This slug is already taken");
        newShortCode = args.newSlug;
      }
      updates.shortCode = newShortCode;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.linkId, updates);
    }
  },
});
```

**Step 2: Commit**

```bash
git add convex/links.ts
git commit -m "feat: add updateLink mutation for editing link slug and destination"
```

---

### Task 4: Backend — add listNamespaceLinks query

**Files:**

- Modify: `convex/links.ts`

**Step 1: Add listNamespaceLinks query**

Add to `convex/links.ts`:

```typescript
export const listNamespaceLinks = query({
  args: {
    namespaceId: v.id("namespaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) return [];

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) return [];

    // Check access: owner or member
    const isOwner = namespace.owner === user._id;
    if (!isOwner) {
      const membership = await ctx.db
        .query("namespace_members")
        .withIndex("by_namespace_user", (q) =>
          q.eq("namespace", args.namespaceId).eq("user", user._id),
        )
        .first();
      if (!membership) return [];
    }

    return await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId),
      )
      .order("desc")
      .collect();
  },
});
```

**Step 2: Commit**

```bash
git add convex/links.ts
git commit -m "feat: add listNamespaceLinks query"
```

---

### Task 5: Backend — add updateProfile mutation and getUserStats query

**Files:**

- Modify: `convex/users.ts`

**Step 1: Add updateProfile mutation and getUserStats query**

Replace `convex/users.ts` with:

```typescript
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const links = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();

    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

    const ownedNamespaces = await ctx.db
      .query("namespaces")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();

    const memberships = await ctx.db
      .query("namespace_members")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();

    const totalNamespaces = ownedNamespaces.length + memberships.length;

    return { totalLinks, totalClicks, totalNamespaces };
  },
});
```

**Step 2: Commit**

```bash
git add convex/users.ts
git commit -m "feat: add updateProfile mutation and getUserStats query"
```

---

### Task 6: Build ProfilePage — header and stats section

**Files:**

- Create: `apps/app/src/pages/ProfilePage.jsx` (replace placeholder)
- Create: `apps/app/src/pages/ProfilePage.css`

**Step 1: Build ProfileHeader with stats**

Build the profile page with the header section matching the design (frame `3P8lr`):

- Large avatar (circle, 64px)
- User name, email, "Member since" date
- Three stats cards: Links, Clicks, Namespaces
- Each stat card has the number on top and label below, with terracotta/sage green border-top accent

Reference the design screenshot for exact layout. Use CSS variables from `index.css`.

The profile page should fetch `api.users.currentUser`, `api.users.getUserStats`, `api.links.listMyLinks`, and `api.namespaces.listMine`.

If user is not authenticated, redirect to `/` using TanStack Router's `beforeLoad` or a simple redirect in the component.

**Step 2: Verify**

Visit `/profile` while signed in. Should see avatar, name, email, stats cards.

**Step 3: Commit**

```bash
git add apps/app/src/pages/
git commit -m "feat: build ProfilePage with header and stats section"
```

---

### Task 7: Build MyLinksSection on ProfilePage

**Files:**

- Modify: `apps/app/src/pages/ProfilePage.jsx`
- Modify: `apps/app/src/pages/ProfilePage.css`

**Step 1: Build "My Links" section**

Matching design frame `3P8lr`:

- Section header: "My Links" with link count badge, "X of 5 custom slugs used" text, "+ Add" button
- Link rows showing: short URL (with copy icon), destination URL, click count, date, edit/delete icon buttons
- Only show links where `namespace` is null/undefined (personal flat links)
- Copy icon copies `qrni.co/{slug}` to clipboard

**Step 2: Commit**

```bash
git add apps/app/src/pages/
git commit -m "feat: add MyLinksSection to ProfilePage"
```

---

### Task 8: Build NamespaceSection on ProfilePage

**Files:**

- Modify: `apps/app/src/pages/ProfilePage.jsx`
- Modify: `apps/app/src/pages/ProfilePage.css`

**Step 1: Build namespace sections**

Matching design frame `3P8lr`:

- One section per namespace (from `api.namespaces.listMine` — both owned and collaborated)
- Namespace header: name, link count, member count, role badge (Owner/Editor/Viewer), member avatars, "Invite" button (owners only), expand/collapse chevron
- Show top 3 links per namespace as preview rows
- "View all X links →" link at bottom (will be wired in Task 12)
- "Add link" button for owners and editors
- "+ Create new namespace" button at the very bottom of the page

**Step 2: Commit**

```bash
git add apps/app/src/pages/
git commit -m "feat: add NamespaceSection to ProfilePage"
```

---

### Task 9: Build AddLinkModal

**Files:**

- Create: `apps/app/src/components/modals/AddLinkModal.jsx`
- Create: `apps/app/src/components/modals/AddLinkModal.css`
- Create: `apps/app/src/components/modals/ModalBackdrop.jsx`
- Create: `apps/app/src/components/modals/ModalBackdrop.css`

**Step 1: Build shared ModalBackdrop**

Simple backdrop component with gray overlay and centered content. Closes on backdrop click and Escape key. Matches design frame `3cyLz`.

**Step 2: Build AddLinkModal**

Matching design frame `3cyLz` (desktop) / `sMM5z` (mobile):

- Props: `isOpen`, `onClose`, `namespaceId?` (null = personal link), `namespaceSlug?`
- Fields: Short link slug input (prefixed with `qrni.co/` or `qrni.co/{namespace}/`), Destination URL input
- Buttons: Cancel, "Create link" (terracotta accent)
- Calls `api.links.createCustomSlugLink` (personal) or `api.links.createNamespacedLink` (namespaced)
- Shows validation errors inline
- Closes on success

**Step 3: Wire into ProfilePage**

Add state for `addLinkModal: { open: boolean, namespaceId?: Id, namespaceSlug?: string }`. Trigger from "+ Add" buttons in MyLinksSection and NamespaceSection.

**Step 4: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add AddLinkModal with shared ModalBackdrop"
```

---

### Task 10: Build EditLinkModal

**Files:**

- Create: `apps/app/src/components/modals/EditLinkModal.jsx`
- Create: `apps/app/src/components/modals/EditLinkModal.css`

**Step 1: Build EditLinkModal**

Matching design frame `UZS35` (desktop) / `2wW0S` (mobile):

- Props: `isOpen`, `onClose`, `link` (full link object)
- Fields: Short link slug (prefilled, editable), Destination URL (prefilled, editable)
- Read-only info: Created date, Clicks count, Namespace name (if namespaced)
- Buttons: Cancel, "Save changes" (terracotta accent)
- Calls `api.links.updateLink`
- Closes on success

**Step 2: Wire into ProfilePage**

Add state for `editLinkModal: { open: boolean, link?: LinkObject }`. Trigger from edit icons on link rows.

**Step 3: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add EditLinkModal"
```

---

### Task 11: Build DeleteLinkConfirmModal

**Files:**

- Create: `apps/app/src/components/modals/DeleteLinkConfirmModal.jsx`
- Create: `apps/app/src/components/modals/DeleteLinkConfirmModal.css`

**Step 1: Build DeleteLinkConfirmModal**

Matching design frame `OGNS2` (desktop) / `Hpo4V` (mobile):

- Props: `isOpen`, `onClose`, `link` (full link object)
- Red trash icon at top
- Warning text: "This will permanently delete the short link qrni.co/{slug} and its QR code. Anyone using this link will get a 404 error. This action cannot be undone."
- Link preview card showing short URL and destination
- Buttons: Cancel, "Delete link" (red/danger)
- Calls `api.links.deleteLink`
- Closes on success

**Step 2: Wire into ProfilePage**

Add state for `deleteLinkModal: { open: boolean, link?: LinkObject }`. Trigger from delete icons.

**Step 3: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add DeleteLinkConfirmModal"
```

---

### Task 12: Build CreateNamespaceModal

**Files:**

- Create: `apps/app/src/components/modals/CreateNamespaceModal.jsx`
- Create: `apps/app/src/components/modals/CreateNamespaceModal.css`

**Step 1: Build CreateNamespaceModal**

Matching design frame `vm1Lv` (desktop) / `9wJ2o` (mobile):

- Props: `isOpen`, `onClose`
- Fields: Namespace name (shows live URL preview: `qrni.co/{name}/your-slug`), Description (optional textarea)
- Validation: 3-30 chars, lowercase letters/numbers/hyphens
- Buttons: Cancel, "Create namespace" (terracotta accent)
- Calls `api.namespaces.create`
- Closes on success

Note: The current `namespaces.create` doesn't accept a description field. The schema also doesn't have one. We'll skip the description field for now since it's not in the schema — the design shows it as optional.

**Step 2: Wire into ProfilePage**

Trigger from "+ Create new namespace" button at bottom of page.

**Step 3: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add CreateNamespaceModal"
```

---

### Task 13: Build InviteMemberModal

**Files:**

- Create: `apps/app/src/components/modals/InviteMemberModal.jsx`
- Create: `apps/app/src/components/modals/InviteMemberModal.css`

**Step 1: Build InviteMemberModal**

Matching design frame `XTHfM` (desktop) / `oKKmI` (mobile):

- Props: `isOpen`, `onClose`, `namespaceId`, `namespaceName`
- Top section: "Invite to {name}" header, email input, role dropdown (Editor/Viewer), "Send invite" button
- Bottom section: "Current members" list showing:
  - Each member: avatar, name, email, role badge (Owner/Editor/Viewer)
  - Pending invites: email, "Pending" badge, X button to revoke
- Calls `api.collaboration.createEmailInvite` to send invite
- Calls `api.collaboration.listMembers` and `api.collaboration.listInvites` to populate member list
- Calls `api.collaboration.revokeInvite` for X button on pending invites

**Step 2: Wire into ProfilePage**

Trigger from "Invite" button on namespace sections. Only visible to namespace owners.

**Step 3: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add InviteMemberModal"
```

---

### Task 14: Build EditProfileModal

**Files:**

- Create: `apps/app/src/components/modals/EditProfileModal.jsx`
- Create: `apps/app/src/components/modals/EditProfileModal.css`

**Step 1: Build EditProfileModal**

Matching design frame `BbnlK` (desktop) / `FODue` (mobile):

- Props: `isOpen`, `onClose`, `user` (current user object)
- Profile photo section: avatar preview, "Upload" and "Remove" links (for now, just update avatarUrl — actual file upload can be a follow-up)
- Display name: text input, prefilled
- Email: text input, disabled/read-only, helper text "Email is managed by your Google account"
- Buttons: Cancel, "Save changes" (terracotta accent)
- Calls `api.users.updateProfile`
- Closes on success

**Step 2: Wire into ProfilePage**

Add an edit button (pencil icon) near the profile header that opens EditProfileModal.

**Step 3: Commit**

```bash
git add apps/app/src/components/modals/ apps/app/src/pages/
git commit -m "feat: add EditProfileModal"
```

---

### Task 15: Build AllNamespaceLinksView

**Files:**

- Modify: `apps/app/src/pages/ProfilePage.jsx`
- Modify: `apps/app/src/pages/ProfilePage.css`

**Step 1: Build the "all links" view**

Matching design frame `Tm4Y2` (desktop) / `609jz` (mobile):

- This is a sub-view within ProfilePage, toggled by state (not a separate route)
- State: `allLinksView: { active: boolean, namespaceId?: Id, namespaceName?: string }`
- When active, replaces the main profile content with:
  - "← Back to profile" link
  - Namespace avatar + name + link/member counts + role badge
  - "Invite" and "+ Add link" buttons
  - Table with columns: Link (name + destination), Clicks, Created, Actions (edit/delete icons)
  - Client-side pagination (5 per page) with page buttons
- "View all X links →" in namespace sections triggers this view

**Step 2: Commit**

```bash
git add apps/app/src/pages/
git commit -m "feat: add AllNamespaceLinksView to ProfilePage"
```

---

### Task 16: Mobile responsive styles

**Files:**

- Modify: `apps/app/src/pages/ProfilePage.css`
- Modify: `apps/app/src/components/modals/ModalBackdrop.css`

**Step 1: Add responsive breakpoints**

Add `@media (max-width: 768px)` rules for:

- Profile header: stack avatar/info vertically, stats cards in a row
- Link rows: stack vertically, hide date column
- Namespace sections: full width
- Modals: full-width with small margin, bottom-sheet feel on mobile
- All Namespace Links table: card layout instead of table on mobile
- Pagination: smaller touch targets

Reference the mobile design frames (`0j1cc`, `609jz`, etc.) for exact mobile layouts.

**Step 2: Commit**

```bash
git add apps/app/src/pages/ apps/app/src/components/modals/
git commit -m "feat: add mobile responsive styles for profile dashboard"
```

---

### Task 17: Update Vite config for SPA routing fallback

**Files:**

- Modify: `apps/app/vite.config.js`

**Step 1: Ensure `/profile` doesn't 404 on page refresh**

The Vite dev server handles this by default for the SPA. But for production builds, we need to ensure the deployment (Vercel) serves `index.html` for all routes.

Check that `apps/app/vercel.json` has a catch-all rewrite. If it exists, verify it has:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

But make sure it doesn't interfere with the short-link proxy in `vite.config.js`. The short-link proxy regex patterns should still work since they're dev-only middleware.

**Step 2: Commit**

```bash
git add apps/app/vercel.json
git commit -m "feat: ensure SPA routing fallback for production"
```

---

### Task 18: Final integration test

**Step 1: Manual smoke test**

Run the app and verify all flows:

1. Visit `/` — QR generator works as before
2. Sign in with Google
3. Click avatar → see "View profile" option
4. Click "View profile" → navigate to `/profile`
5. See profile header with stats
6. See "My Links" section
7. See namespace sections
8. Click "+ Add" → AddLinkModal opens, create a link
9. Click edit icon → EditLinkModal opens, edit a link
10. Click delete icon → DeleteLinkConfirmModal opens, delete a link
11. Click "+ Create new namespace" → CreateNamespaceModal opens
12. Click "Invite" on a namespace → InviteMemberModal opens
13. Click profile edit → EditProfileModal opens
14. Click "View all X links →" → AllNamespaceLinksView shows with pagination
15. Click "← Back to profile" → returns to main profile
16. Browser back/forward works
17. Resize to mobile — responsive layout

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes for profile dashboard"
```
