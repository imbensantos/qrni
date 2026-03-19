# Google AdSense Placement Design

## Goal

Add Google AdSense ads to QRni in a tasteful, non-intrusive way. Ads are shown to free users; a future premium tier will hide them.

## Ad Strategy

- **Format**: Between-content (in-feed) ads + pillar ads on profile desktop
- **Styling**: Default Google AdSense — no custom wrapper styling
- **Gating**: Ads hidden when `isPremium` flag is true (future premium tier)
- **Label**: Small "Ad" text above each unit for transparency

## Placements by Page

### QR Generator — Desktop

- **Controls sidebar (380px)**: 300x250 medium rectangle at the bottom of the panel
- **Preview panel**: 468x60 horizontal ad at the bottom of the container (QR preview remains vertically centered above it)

### QR Generator — Mobile

- **In-feed ad (300x250)**: Between stacked controls and QR preview sections

### Profile — Desktop

- **In-feed ad (728x90)**: Between "My Links" and "Namespaces" sections
- **Pillar ads (160x600)**: One on each side of the centered content column, sticky-positioned

### Profile — Mobile

- **In-feed ad (300x250)**: Between "My Links" and "Namespaces" (no pillar ads)

### Privacy / Static Pages

- **Horizontal ad (728x90)**: After main content, before footer

## Design Reference

Screens in `designs/qrni-app.pen` (y=15500+):

- Screen 1: QR Generator — Desktop w/ Ads
- Screen 2: QR Generator — Mobile w/ Ads
- Screen 3: Profile — Desktop w/ Ads
- Screen 4: Profile — Mobile w/ Ads
- Screen 5: Privacy Page — Desktop w/ Ads

## Technical Notes

- Use `@google/adsense` or manual script injection
- Ad component should accept a `slot` ID and `format` prop
- Wrap in a component that checks `isPremium` and renders nothing if true
- Responsive: hide pillar ads below 1200px breakpoint, swap ad sizes on mobile
