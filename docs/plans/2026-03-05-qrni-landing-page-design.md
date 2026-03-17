# QRni Landing Page Design

**Tech:** Astro (static site)
**Repo:** New repo — `qrni-landing` under `/Volumes/BNYDRV/Repos/ImBenSantos/`
**Domain:** `qrni.imbento.co`
**App link:** `app.qrni.imbento.co`
**Style:** Soft pastel gradient, Nunito font, flat/material — matches the app

## Goal

Drive visitors to the free QR tool via SEO and credibility. No sign-ups, no lead gen — just funnel to the app.

## Sections

### 1. Hero

- QRni logo (large, white, bold)
- Headline: "Your free, instant QR code maker — no sign-up needed!"
- CTA button: "Generate QR Code" → links to `app.qrni.imbento.co`
- Screenshot/mockup of the app in Mac-style window frame

### 2. How It Works

- 3 columns/cards with icons:
  1. Paste your URL
  2. QR code generates instantly
  3. Download as PNG
- Simple numbered steps, flat icons or Flaticon animated GIFs

### 3. Features

- 4 highlight cards in a grid:
  - Free forever
  - No sign-up required
  - Instant generation
  - High-quality PNG download

### 4. Footer

- "Powered by imBento" with logo (same as the app)
- Flaticon attribution link

## File Structure

```
qrni-landing/
├── src/
│   ├── layouts/Layout.astro
│   ├── pages/index.astro
│   └── styles/global.css
├── public/
│   ├── animated-qr-icon.gif
│   ├── animated-download-icon.gif
│   ├── imbento-logo-white.svg
│   └── og-image.png
├── astro.config.mjs
└── package.json
```

## SEO

- Proper `<title>`, `<meta description>`, OG tags
- Static HTML — instant load, fully crawlable

## Domain Strategy

- Launch with `qrni.imbento.co` (landing) + `app.qrni.imbento.co` (app)
- Separate subdomains since landing (Astro) and app (Vite) are separate deployments
- Migrate to `qrni.app` or similar if traction warrants it
