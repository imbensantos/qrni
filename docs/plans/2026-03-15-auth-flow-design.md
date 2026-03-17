# Auth Flow Design

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add a Google OAuth sign-in modal that appears when unauthenticated users try to use auth-gated features (custom slugs, namespaces, link history). Add a user profile dropdown with sign-out in the header.

## Decisions

- **Provider:** Google only (already configured via Convex Auth)
- **UI pattern:** Modal overlay (not a separate page)
- **Trigger:** On feature use — modal appears when user attempts an auth-gated action
- **Post-auth:** Modal closes, feature becomes available immediately

## Components

### AuthModal (`AuthModal.jsx` + `AuthModal.css`)

- Semi-transparent dark backdrop (`rgba(0,0,0,0.4)`)
- Centered white card (~400px wide), 16px border-radius
- App branding: "QRni" heading
- Friendly copy: "Sign in to unlock this" with brief feature description
- Single "Continue with Google" button with Google icon
- Close button (X) in top-right corner
- Entrance animation: fade + scale

### AuthContext (or lifted state in App.jsx)

- `isAuthModalOpen` state
- `openAuthModal(featureDescription?)` — opens modal with optional context message
- `closeAuthModal()` — closes modal

### Header Profile (in App.jsx)

- When authenticated: user avatar/initial + name
- Click reveals dropdown with "Sign out" option
- Uses `signOut()` from `@convex-dev/auth/react`

## Integration Points

| Location                                     | Current Behavior                       | New Behavior                                      |
| -------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| ControlsPanel — short link toggle (unauthed) | Inline "Sign in" text button           | Calls `openAuthModal()`                           |
| ControlsPanel — namespace dropdown           | Hidden when unauthed                   | Shows lock icon, calls `openAuthModal()` on click |
| ShortenPanel — custom slug hint              | Inline "Sign in" text                  | Calls `openAuthModal()`                           |
| ShortenPreview — empty state                 | "Sign in to see your short links" text | Calls `openAuthModal()`                           |
| App.jsx header                               | Shows user name as plain text          | Avatar + dropdown with sign-out                   |

## Styling

Matches existing design system:

- Outfit font family
- Terracotta accent (`#D89575`) for primary button
- Cream background (`#F5F4F1`) for card
- CSS variables from existing `App.css`
- Responsive: full-width card on mobile (<768px)

## Out of Scope

- Email/password auth
- User profile editing
- Email verification
- Rate limiting on auth attempts
