# OG Bot Detection for Link Previews

## Problem

When a qrni.to short link is pasted in messaging apps (iMessage, Slack, Discord, etc.), the link preview shows nothing useful because the redirect handler returns an immediate 302. Most link preview crawlers don't follow redirects, so users see a bare URL instead of a rich preview of the destination.

## Solution

Detect link preview bots by `User-Agent` and serve them an HTML page with Open Graph meta tags mirroring the destination's OG data. Regular users continue to get the instant 302 redirect — no change to their experience.

## Flow

### Bot request

1. Resolve the link (same as today)
2. Check `User-Agent` against known bot list
3. If bot: check for cached OG data on the link document
4. If cached: serve HTML with OG tags + `<meta http-equiv="refresh">` redirect
5. If not cached (old links or failed prior fetch): fetch destination, parse OG tags, cache on link document, then serve
6. Increment click count (same as today)

### Regular user request

No change — instant 302 redirect.

### Manual refresh

Button in link management UI triggers re-scrape and updates cached OG fields.

## Data Model

Add optional fields to `links` table:

| Field           | Type      | Description                          |
| --------------- | --------- | ------------------------------------ |
| `ogTitle`       | `string?` | Destination page's `og:title`        |
| `ogDescription` | `string?` | Destination page's `og:description`  |
| `ogImage`       | `string?` | URL to destination page's `og:image` |
| `ogSiteName`    | `string?` | Destination page's `og:site_name`    |
| `ogFetchedAt`   | `number?` | Timestamp of last OG fetch           |

Storage impact: ~0.5-1 KB per link (text fields + one URL string). Image is stored as a URL reference, not downloaded.

## Bot User-Agents

Detect the following crawlers:

- `Slackbot`
- `Twitterbot`
- `facebookexternalhit`
- `LinkedInBot`
- `Discordbot`
- `WhatsApp`
- `Applebot`
- `TelegramBot`
- `Googlebot`
- `bingbot`

## HTML Served to Bots

```html
<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="..." />
    <meta property="og:description" content="..." />
    <meta property="og:image" content="..." />
    <meta property="og:url" content="..." />
    <meta property="og:site_name" content="..." />
    <meta http-equiv="refresh" content="0;url=..." />
  </head>
  <body></body>
</html>
```

## Fallback (No OG Tags Found)

When the destination page has no OG tags or the fetch fails:

- `og:title` → destination URL
- `og:description` → omitted
- `og:image` → omitted
- `og:site_name` → destination domain

## Components

1. **OG scraper** — Convex action that fetches a URL, parses HTML for OG meta tags, and updates the link document. Used by lazy fetch and manual refresh.
2. **Bot detection in `convex/http.ts`** — User-Agent check in the redirect handler; serves OG HTML to bots, 302 to everyone else.
3. **Refresh preview UI** — Button in link management view that triggers the scraper action.

## Design Decisions

- **Lazy fetch over backfill migration** — Old links get their OG data fetched on first bot hit, avoiding a one-time migration. First bot hit may be slightly slower; all subsequent hits are instant from cache.
- **Pure mirror, no branding** — Preview cards look exactly like sharing the destination link directly. No "via qrni.to" branding.
- **Store image URL, not image data** — Zero storage cost for images. Tradeoff: if destination deletes the image, preview image breaks.
- **Meta refresh fallback** — If a real user somehow gets the bot page, `<meta http-equiv="refresh" content="0;url=...">` redirects them instantly.
