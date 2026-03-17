# QRni URL Shortener Design

## Overview

Add a URL shortener to QRni, turning it into a combined QR code generator + link shortener — targeted at event organizers who need both a scannable QR code and a clean, memorable short link for printed materials (invites, flyers, posters).

## Architecture

Fully Convex-powered. No edge functions. Convex handles storage, shortening logic, redirects (via HTTP Actions), and auth.

```
User -> short domain/:code -> Convex HTTP Action -> 301 redirect -> destination
User -> short domain/:namespace/:slug -> Convex HTTP Action -> 301 redirect -> destination
```

### Stack Additions

- **Convex** — database, serverless functions, HTTP actions
- **Convex Auth + Google sign-in** — for namespaces and custom slugs only
- **Google Safe Browsing API** — free URL safety checks (10k/day)

### Domain

Domain-agnostic design. Target domain is `qrni.to` (pending purchase). Falls back to current domain with a `/s/` prefix until short domain is available.

## Link Types

| Type             | Auth Required? | Limit                          | Example                    |
| ---------------- | -------------- | ------------------------------ | -------------------------- |
| Anonymous random | No             | 10/hr per IP                   | `qrni.to/a3Xk9`            |
| Flat custom slug | Yes            | 5 per user                     | `qrni.to/myresume`         |
| Namespaced       | Yes            | Unlimited links (5 namespaces) | `qrni.to/benandmaria/rsvp` |

### Short Code Generation

- Random codes: 6-8 alphanumeric characters (base62: a-z, A-Z, 0-9)
- Custom slugs: user-chosen, must be unique, subject to limits
- Namespace format: lowercase alphanumeric + hyphens, 3-30 chars

## Namespaces

Namespaces let users group links under a shared prefix — ideal for events.

**Examples:**

```
qrni.to/benandmaria/rsvp
qrni.to/benandmaria/photos
qrni.to/benandmaria/registry

qrni.to/techconf2026/schedule
qrni.to/techconf2026/tickets
qrni.to/techconf2026/map
```

### Rules

- Users can claim up to **5 namespaces** on the free tier
- Namespaces with zero links or zero clicks for **5 months** get released automatically
- Same 5-month inactivity expiration applies to flat custom slugs
- Reserved list for common/brand terms (manual, small list to start)

## Namespace Collaboration

Multiple users can manage links within a shared namespace — ideal for event planning teams.

### Roles

| Role   | Add/edit links | Delete links | View click counts | Manage members | Delete namespace |
| ------ | -------------- | ------------ | ----------------- | -------------- | ---------------- |
| Owner  | Yes            | Yes          | Yes               | Yes            | Yes              |
| Editor | Yes            | Yes          | Yes               | No             | No               |
| Viewer | No             | No           | Yes               | No             | No               |

### Invite System

Two invite methods:

- **Email invite** — owner enters an email and selects a role. Invitee receives a notification/link and must sign in with that Google account to accept.
- **Invite link** — owner generates a shareable link with a preset role (e.g., `qrni.to/benandmaria/--invite/abc123`). Reusable until the owner revokes it. Anyone with the link can join.

### Rules

- Only the owner can invite members, change roles, and revoke invite links
- Editors can add, edit, and delete links but cannot manage members
- Viewers can only see links and click counts
- No cap on collaborators per namespace (for now)
- Namespace counts toward the **owner's** 5-namespace limit, not collaborators'

## Schema (Convex)

### users

- `_id` (auto)
- Google identity (via Convex Auth)
- `created_at`

### namespaces

- `_id` (auto)
- `owner` (user ref)
- `slug` (unique, indexed)
- `created_at`
- `last_active_at`

### namespace_members

- `_id` (auto)
- `namespace` (namespace ref, indexed)
- `user` (user ref, indexed)
- `role` ("editor" | "viewer")
- `invited_by` (user ref)
- `joined_at`

### namespace_invites

- `_id` (auto)
- `namespace` (namespace ref, indexed)
- `role` ("editor" | "viewer")
- `type` ("email" | "link")
- `email` (optional, for email invites)
- `token` (unique, indexed, for invite links)
- `created_by` (user ref)
- `created_at`
- `revoked` (boolean, default false)

### links

- `_id` (auto)
- `short_code` (unique, indexed)
- `namespace` (optional ref)
- `namespace_slug` (optional, for namespaced links)
- `destination_url`
- `creator_ip` (for anonymous links)
- `owner` (user ref, for authed links)
- `created_at`
- `click_count`

## Redirect Flow

1. Convex HTTP Action receives request at `/:code` or `/:namespace/:slug`
2. Look up link in DB (indexed query)
3. Increment click count (async mutation)
4. Return 301 redirect to destination URL
5. If not found, redirect to QRni homepage

## Safety & Rate Limiting

- Anonymous link creation: **10 links/hour per IP**
- All URLs checked against **Google Safe Browsing API** before creation
- Flagged URLs rejected with an error message
- Rate limiting enforced in Convex functions

## UI Design

### New "Shorten" Mode in Sidebar

Added as a third mode alongside Single and Bulk in the existing sidebar panel.

### Anonymous View (Not Signed In)

- URL input field
- "Shorten" button
- Result: random short link with copy button
- Prompt to sign in for custom slugs/namespaces

### Signed-In View

- URL input field
- Custom slug field (optional, shows "2 of 5 used")
- Namespace dropdown: owned namespaces + collaborated namespaces + "Create new namespace"
- Slug-within-namespace field (when namespace selected)
- "Shorten" button
- Result: short link with copy button
- Simple list/table of user's links below the form

### Namespace Management View

Accessible when a namespace is selected in the dropdown (owner only sees full management):

- **Members tab** — list of collaborators with roles, remove button
- **Invite** — email input + role selector, or "Generate invite link" button
- **Active invite links** — list with revoke button
- Editors/viewers see a simplified view (just the link list)

### Microcopy Nudges

Encourage namespace usage over flat custom slugs:

- On custom slug field: "You've used 2 of 5 custom slugs. Tip: Create a namespace for unlimited links!"
- When entering custom slug: "Want unlimited short links? Try a namespace instead — perfect for grouping event links."

### Integration with QR Modes

- Single mode gets a toggle: "Also create short link"
- When enabled, the QR code encodes the short URL instead of the original
- Short link displayed alongside the QR preview with a copy button

## Key Decisions

- **Convex only (no edge functions)** — simpler architecture, 1M free calls/month (vs 100k on Vercel edge). Redirect latency (~50-200ms) is acceptable for human-initiated clicks.
- **Auth only for custom slugs/namespaces** — keeps anonymous shortening frictionless while preventing slug squatting.
- **Flat custom slug limit (5)** — encourages namespace adoption, prevents squatting.
- **5-month inactivity expiration** — automatically recycles unused slugs/namespaces without being too aggressive.
- **Domain-agnostic** — ready for `qrni.to` when purchased, works without it.
- **Namespace collaboration** — owner/editor/viewer roles with email + invite link support. No collaborator cap for now; add limits if abused.
