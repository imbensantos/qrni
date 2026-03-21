# About Us & Contact Us Pages — Design

**Date:** 2026-03-22
**Status:** Approved

## Overview

Add two new static-ish pages to the app: `/about` and `/contact`. Both follow the existing PrivacyPage layout pattern (card on cream background, back link, footer, pillar ads).

## About Us (`/about`)

### Structure

1. **Hero section** — "About QRni" title + one-liner tagline ("Free QR codes & short links, no fuss.")
2. **What is QRni** — Brief product description: QR generation, URL shortening, namespaces/teams, click analytics. Emphasize free, no sign-up required.
3. **Why we built it** — Earnest "corny" tone. A simple tool that just works, no walls, privacy-respecting.
4. **Meet the maker** — Ben Santos card:
   - Photo/avatar
   - "Front-End Developer from Davao City, Philippines"
   - Short personal bio
   - Links: GitHub, LinkedIn, website (imbensantos.com)

## Contact Us (`/contact`)

### Structure

1. **Title + intro** — "Get in Touch" with a friendly line
2. **Contact form** — Name, Email, Message fields
   - Submits to Convex `contactSubmissions` table
   - Basic client-side validation (required fields, email format)
   - Success/error feedback
3. **Direct contact section** — Email link to contact@qrni.to, social links
4. **Rate limiting** — IP or session-based to prevent spam

### Backend

- **New Convex table:** `contactSubmissions`
  - `name: string`
  - `email: string`
  - `message: string`
  - `createdAt: number`
  - `isRead: boolean` (default false, for future admin use)
- **New mutation:** `submitContactForm`
  - Validates input (non-empty, valid email format)
  - Rate-limits (by IP or session)
  - Inserts row
- No email notification — view submissions in Convex dashboard for now

## Shared Patterns

- Same layout as PrivacyPage: card on cream background, back link, AppFooter, pillar ads
- CSS variables, Inter for body, Outfit for nav
- Reuse a shared "static page" CSS base extracted from PrivacyPage styles
- Add routes to router.tsx
- Update AppFooter to include About and Contact links

## Out of Scope

- Admin panel for viewing contact submissions
- Email notifications on new submissions
- CMS or editable content
