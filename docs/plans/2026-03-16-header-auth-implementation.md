# Header Auth Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add a sign-in button and profile dropdown to the header, using Google OAuth in a popup window.

**Architecture:** New `ProfileDropdown` component handles avatar display and dropdown menu. Sign-in triggers `signIn("google")` via `useAuthActions()` from Convex Auth. Existing inline sign-in buttons in child components are removed — the header becomes the single auth entry point.

**Tech Stack:** React 19, Convex Auth (`@convex-dev/auth`), CSS (existing design system variables)

---

### Task 1: Create ProfileDropdown component

**Files:**

- Create: `apps/app/src/components/ProfileDropdown.jsx`
- Create: `apps/app/src/components/ProfileDropdown.css`

**Step 1: Create ProfileDropdown.jsx**

```jsx
import { useState, useRef, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import "./ProfileDropdown.css";

function ProfileDropdown({ user }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuthActions();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const initial = (user.name || user.email || "?")[0].toUpperCase();

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-avatar-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Profile menu"
      >
        {user.image ? (
          <img src={user.image} alt="" className="profile-avatar-img" />
        ) : (
          <span className="profile-avatar-fallback">{initial}</span>
        )}
      </button>
      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-info">
            <span className="profile-menu-name">{user.name}</span>
            {user.email && (
              <span className="profile-menu-email">{user.email}</span>
            )}
          </div>
          <hr className="profile-menu-divider" />
          <button
            className="profile-menu-item"
            role="menuitem"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
```

**Step 2: Create ProfileDropdown.css**

```css
.profile-dropdown {
  position: relative;
}

.profile-avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--border-subtle);
  padding: 0;
  cursor: pointer;
  background: var(--bg-muted);
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.profile-avatar-btn:hover {
  border-color: var(--accent-primary);
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-fallback {
  font-family: "Outfit", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.profile-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
  z-index: 100;
  padding: 4px 0;
}

.profile-menu-info {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-menu-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.profile-menu-email {
  font-size: 12px;
  color: var(--text-tertiary);
}

.profile-menu-divider {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 4px 0;
}

.profile-menu-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
}

.profile-menu-item:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}
```

**Step 3: Commit**

```bash
git add apps/app/src/components/ProfileDropdown.jsx apps/app/src/components/ProfileDropdown.css
git commit -m "feat: add ProfileDropdown component with avatar and sign-out menu"
```

---

### Task 2: Add sign-in button and ProfileDropdown to header

**Files:**

- Modify: `apps/app/src/App.jsx`
- Modify: `apps/app/src/App.css`

**Step 1: Update App.jsx header**

Add imports at top:

```jsx
import { useAuthActions } from "@convex-dev/auth/react";
import ProfileDropdown from "./components/ProfileDropdown";
```

Inside the `App` function, add:

```jsx
const { signIn } = useAuthActions();
```

Replace the header JSX (lines 31-36) with:

```jsx
<header className="header">
  <h1 className="logo">QRni ✨</h1>
  {user ? (
    <ProfileDropdown user={user} />
  ) : (
    <button className="signin-btn" onClick={() => signIn("google")}>
      Sign in
    </button>
  )}
</header>
```

**Step 2: Add sign-in button styles to App.css**

After the `.user-name` block (which will be removed), add:

```css
.signin-btn {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent-primary);
  color: white;
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.signin-btn:hover {
  opacity: 0.85;
}
```

Remove the `.user-name` CSS block (lines 17-21) since it's no longer used.

**Step 3: Commit**

```bash
git add apps/app/src/App.jsx apps/app/src/App.css
git commit -m "feat: add sign-in button and profile dropdown to header"
```

---

### Task 3: Remove inline sign-in buttons from child components

**Files:**

- Modify: `apps/app/src/components/ControlsPanel.jsx`
- Modify: `apps/app/src/components/ShortenPanel.jsx`
- Modify: `apps/app/src/components/ShortenPreview.jsx`

**Step 1: Clean up ControlsPanel.jsx**

- Remove `import { useAuthActions } from "@convex-dev/auth/react"` (line 4)
- Remove `const { signIn } = useAuthActions()` (line 42)
- Remove the `handleSignIn` function that calls `signIn("google")`
- Remove the sign-in nudge block (lines 450-477) — the `<div className="auth-nudge">` section with the inline sign-in button
- Keep the `useAuth()` import and `isAuthenticated` check — it's still used to gate namespace/custom-slug features

**Step 2: Clean up ShortenPanel.jsx**

- Remove the sign-in hint block (lines 290-295):
  ```jsx
  {
    !isAuthenticated && (
      <p className="shorten-hint">
        Sign in for custom slugs and namespaces — perfect for events!
      </p>
    );
  }
  ```

**Step 3: Clean up ShortenPreview.jsx**

- Change the unauthenticated empty state (lines 116-121) to show a neutral message instead of "Sign in to see your short links":
  ```jsx
  <EmptyState icon="🔗" message="Your shortened links will appear here" />
  ```

**Step 4: Commit**

```bash
git add apps/app/src/components/ControlsPanel.jsx apps/app/src/components/ShortenPanel.jsx apps/app/src/components/ShortenPreview.jsx
git commit -m "refactor: remove inline sign-in buttons, header is now the single auth entry point"
```

---

### Task 4: Visual verification

**Step 1: Run dev server and verify**

```bash
cd apps/app && npm run dev
```

Check in browser:

- [ ] Unauthenticated: "Sign in" button visible in header (right side, terracotta pill)
- [ ] Click sign in → Google OAuth opens (popup or redirect depending on Convex auth config)
- [ ] Authenticated: avatar shows in header, no sign-in button
- [ ] Click avatar → dropdown with name, email, "Sign out"
- [ ] Click outside dropdown → closes
- [ ] Press Escape → closes
- [ ] Sign out works and returns to unauthenticated state
- [ ] No more inline sign-in buttons in ControlsPanel or ShortenPanel
- [ ] Mobile responsive: header still looks good at 768px
