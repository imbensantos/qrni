# Profile Dashboard Design

**Date:** 2026-03-16
**Status:** Approved

## Summary

Add a `/profile` route that surfaces link management, namespace management, collaboration, and profile editing — all designed in `designs/qrni-app.pen`. Two branches will be created to compare routing libraries: TanStack Router vs React Router.

## Decisions

- **Auth Modal:** Excluded from scope (existing sign-in flow is sufficient)
- **Routing:** Separate `/profile` route (not a state toggle in the main app)
- **Router comparison:** Two branches — `feature/profile-dashboard-tanstack-router` and `feature/profile-dashboard-react-router`
- **Mobile:** Responsive CSS, not separate mobile components
- **Navigation:** ProfileDropdown gets a "View profile" link to `/profile`

## Routes

| Route      | Component       | Auth Required                          |
| ---------- | --------------- | -------------------------------------- |
| `/`        | QRGeneratorPage | No                                     |
| `/profile` | ProfilePage     | Yes (redirect to `/` if not signed in) |

## Component Tree

```
RootLayout (header + router outlet)
├── / → QRGeneratorPage (current App.jsx content)
└── /profile → ProfilePage
     ├── ProfileHeader (avatar, name, email, member since, stats cards)
     ├── MyLinksSection (personal links with 2/5 used indicator)
     │   └── LinkRow (short URL, destination, clicks, date, edit/delete actions)
     ├── NamespaceSection[] (one per namespace — owned + collaborated)
     │   ├── NamespaceHeader (name, member count, role badge, invite/add buttons)
     │   ├── NamespaceLinkRow[] (top 3 links preview)
     │   └── "View all X links →" link
     └── "+ Create new namespace" button
```

## Modals

| Modal                  | Trigger                                 | Fields                                                                                    |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| AddLinkModal           | "+ Add" button on My Links or namespace | Short link slug, Destination URL                                                          |
| EditLinkModal          | Edit icon on link row                   | Short link slug (prefilled), Destination URL, Created date, Clicks, Namespace (read-only) |
| DeleteLinkConfirmModal | Delete icon on link row                 | Warning text, link preview, Cancel/Delete buttons                                         |
| InviteMemberModal      | "Invite" button on namespace            | Email input, role dropdown (Editor/Viewer), Send button, current members list             |
| CreateNamespaceModal   | "+ Create new namespace" button         | Namespace name, URL preview, Description (optional)                                       |
| EditProfileModal       | Edit button on profile header           | Profile photo (upload/remove), Display name, Email (read-only from Google)                |

## Backend Gaps

### New mutations/queries needed:

1. **`links.updateLink`** — Edit slug and/or destination URL for an existing link
   - Args: `linkId`, `newSlug?`, `newDestinationUrl?`
   - Auth: owner only
   - Validates slug uniqueness

2. **`links.listNamespaceLinks`** — List links for a specific namespace with pagination
   - Args: `namespaceId`, `cursor?`, `limit?`
   - Auth: owner or member
   - Returns paginated results

3. **`users.updateProfile`** — Update display name and/or avatar
   - Args: `name?`, `avatarUrl?`
   - Auth: current user only

4. **`users.getUserStats`** — Aggregate stats for profile header
   - Returns: `{ totalLinks, totalClicks, totalNamespaces }`
   - Auth: current user only

### Existing backend (no changes needed):

- `links.createCustomSlugLink` / `links.createNamespacedLink`
- `links.deleteLink`
- `links.listMyLinks`
- `namespaces.create` / `namespaces.listMine` / `namespaces.remove`
- `collaboration.*` (all invite/member functions)
- `users.currentUser`

## Design References

All designs are in `designs/qrni-app.pen`. Key frame IDs:

- Profile View: `3P8lr` (desktop), `0j1cc` (mobile)
- All Namespace Links: `Tm4Y2` (desktop), `609jz` (mobile)
- Profile Dropdown Detail: `YpAA1`
- Add Link Modal: `3cyLz` (desktop), `sMM5z` (mobile)
- Edit Link Modal: `UZS35` / `muWKq` (desktop), `2wW0S` / `MhIzQ` (mobile)
- Delete Link Confirm: `OGNS2` (desktop), `Hpo4V` (mobile)
- Invite Member Modal: `XTHfM` (desktop), `oKKmI` (mobile)
- Create Namespace Modal: `vm1Lv` (desktop), `9wJ2o` (mobile)
- Edit Profile Modal: `BbnlK` (desktop), `FODue` (mobile)
