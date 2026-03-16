# Header Sign-in & Auth Flow Design

## Overview

Add a sign-in button and auth flow to the header/navbar. Google OAuth opens in a popup window. Authenticated users see an avatar with a profile dropdown.

## Unauthenticated State

- "Sign in" button in the header (right side), styled with design system (terracotta accent, pill radius)
- Clicking opens Google OAuth in a popup window
- On success, popup closes and the app reactively picks up the authenticated user via Convex

## Authenticated State

- Circular avatar (~32px) showing Google profile picture, falls back to first initial on colored background
- Click avatar → dropdown menu appears below:
  - User's name and email (non-interactive, for context)
  - "Sign out" button
- Dropdown closes on click outside or Escape key

## Components

- Sign-in button lives directly in the header in `App.jsx`
- New `ProfileDropdown.jsx` — avatar + dropdown component
- Remove existing inline sign-in buttons from ControlsPanel, ShortenPanel, ShortenPreview — header is the single sign-in entry point

## Styling

- Uses existing CSS variables: `--accent-primary`, `--bg-card`, `--border-subtle`, `--shadow-elevated`
- Avatar border: `--border-subtle`
- Dropdown: `--shadow-elevated` for depth

## Rejected Alternatives

- **AuthModal overlay** — unnecessary UI for a single OAuth provider
- **Direct redirect** — loses user's in-progress work; popup is better
- **Inline expand/slide** — more complex for no real benefit
