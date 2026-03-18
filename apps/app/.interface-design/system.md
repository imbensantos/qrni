# QRni Design System

Extracted from existing codebase on 2026-03-18.

## Typography

- **Font family:** "Outfit", sans-serif
- **Weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (logo only)
- **Scale:** 10px, 11px, 12px, 13px, 14px, 15px, 16px, 18px, 20px, 22px, 24px

| Role                       | Size    | Weight  |
| -------------------------- | ------- | ------- |
| Logo                       | 24px    | 800     |
| Page heading               | 22px    | 700     |
| Modal title                | 18px    | 600-700 |
| Section title / card title | 15px    | 700     |
| Body / input text          | 14-15px | 400-500 |
| Label                      | 13-14px | 500-600 |
| Caption / hint             | 12px    | 500     |
| Badge / micro              | 10-11px | 500-700 |

## Colors (CSS Custom Properties)

### Backgrounds

| Token          | Value   | Usage                                   |
| -------------- | ------- | --------------------------------------- |
| `--bg-page`    | #f5f4f1 | Page background (cream)                 |
| `--bg-card`    | #ffffff | Card / modal surfaces                   |
| `--bg-surface` | #fafaf8 | Subtle surface (table headers, list bg) |
| `--bg-preview` | #f8f6f3 | Preview panel background                |
| `--bg-muted`   | #edecea | Toggle tracks, muted fills              |

### Text

| Token              | Value   | Usage                          |
| ------------------ | ------- | ------------------------------ |
| `--text-primary`   | #1a1918 | Headings, primary content      |
| `--text-secondary` | #6d6c6a | Secondary labels, descriptions |
| `--text-tertiary`  | #9c9b99 | Placeholders, hints, captions  |

### Accents

| Token                    | Value   | Usage                                            |
| ------------------------ | ------- | ------------------------------------------------ |
| `--accent-primary`       | #d89575 | Terracotta — primary CTA, links, icons           |
| `--accent-primary-hover` | #c8845f | Terracotta hover state                           |
| `--accent-secondary`     | #3d8a5a | Sage green — toggles, success, short links       |
| `--accent-light`         | #c8f0d8 | Light green fill                                 |
| `--accent-warm`          | #fff0e8 | Warm terracotta tint — icon circles, hover fills |
| `--accent-warm-hover`    | #fde5d4 | Warm tint hover                                  |
| `--accent-success-bg`    | #e8f5e9 | Success background                               |

### Borders

| Token             | Value   |
| ----------------- | ------- |
| `--border-subtle` | #e5e4e1 |
| `--border-strong` | #d1d0cd |

### Error / Warning

| Token                  | Value   |
| ---------------------- | ------- |
| `--color-error`        | #dc2626 |
| `--color-error-hover`  | #b91c1c |
| `--color-error-bg`     | #fee2e2 |
| `--color-warning-bg`   | #fff8e1 |
| `--color-warning-text` | #b8860b |

### Other

| Token           | Value   |
| --------------- | ------- |
| `--bg-disabled` | #c4b5ab |

## Spacing

**Not on a strict grid.** Values cluster around a base-2 progression with intermediate steps:

```
2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40
```

Most frequent values: **4, 6, 8, 10, 12, 16, 20, 24, 28, 32**

## Radius

Tokenized scale:

| Token           | Value | Usage                                              |
| --------------- | ----- | -------------------------------------------------- |
| `--radius-sm`   | 8px   | Buttons (small), inputs (compact), icon buttons    |
| `--radius-md`   | 12px  | Inputs, dropdowns, cards (medium), modals (mobile) |
| `--radius-lg`   | 16px  | Cards, tables                                      |
| `--radius-xl`   | 20px  | Modals, QR card                                    |
| `--radius-pill` | 100px | CTAs, avatars, badges, toggle pills                |

**Raw values used outside tokens:** 2px, 4px, 6px, 50% (dot icons, copy button, progress bar)

## Depth Strategy: Borders + Shadows (Layered)

Uses **both** borders and shadows with clear hierarchy:

| Level     | Technique                    | Token/Value                                 |
| --------- | ---------------------------- | ------------------------------------------- |
| Flat      | 1px solid border             | `--border-subtle`                           |
| Contained | 1.5px solid border           | Inputs, emphasized controls                 |
| Card      | 1px border + subtle shadow   | `--shadow-card`                             |
| Elevated  | Shadow only                  | `--shadow-elevated`                         |
| Dropdown  | 1px border + dropdown shadow | `--shadow-dropdown`                         |
| Button    | Shadow only (accent-tinted)  | `--shadow-button` / `--shadow-button-hover` |
| Modal     | Shadow only (heavy)          | `--shadow-modal`                            |

### Shadow Tokens

| Token                   | Value                              |
| ----------------------- | ---------------------------------- |
| `--shadow-subtle`       | 0 1px 3px rgba(26,25,24, 0.06)     |
| `--shadow-card`         | 0 2px 8px rgba(26,25,24, 0.03)     |
| `--shadow-elevated`     | 0 4px 20px rgba(26,25,24, 0.06)    |
| `--shadow-dropdown`     | 0 4px 16px rgba(26,25,24, 0.1)     |
| `--shadow-button`       | 0 4px 16px rgba(216,149,117, 0.25) |
| `--shadow-button-hover` | 0 6px 20px rgba(216,149,117, 0.35) |
| `--shadow-modal`        | 0 8px 32px rgba(26,25,24, 0.15)    |

**Violation:** Some inline shadows exist outside tokens (sidebar `1px 0 8px`, toggle knob `0 1px 3px`, slider thumb `0 2px 6px`, bulk secondary button `0 4px 16px rgba(109,108,106,0.2)`).

## Border Widths

| Width        | Usage                                            |
| ------------ | ------------------------------------------------ |
| 1px solid    | Standard borders (cards, tables, dropdowns)      |
| 1.5px solid  | Emphasized inputs, color pickers, toggle borders |
| 1.5px dashed | Upload zones, create-new affordances             |
| 2px solid    | Focus states (focus-within on inputs)            |

## Patterns

### Button — Primary CTA

```
height: 44px
width: 200px (or 100% mobile)
border-radius: var(--radius-pill)
background: var(--accent-primary)
color: white
font-size: 16px
font-weight: 700
box-shadow: var(--shadow-button)
hover: translateY(-2px) + shadow-button-hover
disabled: bg-disabled, cursor not-allowed
```

### Button — Secondary (Outlined)

```
height: 40-44px
border-radius: var(--radius-pill) or var(--radius-md)
border: 1-1.5px solid var(--border-subtle) or var(--accent-secondary)
background: transparent
color: var(--text-secondary) or var(--accent-secondary)
font-size: 13-14px
font-weight: 500-600
hover: fill background or darken border
```

### Button — Small Action

```
padding: 8px 14-16px
border-radius: var(--radius-sm)
background: var(--accent-primary) or var(--accent-warm)
font-size: 13px
font-weight: 600-700
```

### Button — Icon

```
padding: 4-6px
border-radius: var(--radius-sm)
background: none
color: var(--text-tertiary)
hover: color accent-primary, background accent-warm
hover (delete): color error, background error-bg
```

### Button — Close (Modal)

```
width: 32px
height: 32px
border-radius: var(--radius-sm)
background: none
color: var(--text-tertiary)
hover: color text-primary, background bg-muted
```

### Input — Standard

```
height: 44-48px
padding: 0 14-16px
border: 1-1.5px solid var(--border-subtle)
border-radius: var(--radius-md)
background: var(--bg-page) or var(--bg-card)
font-size: 14-15px
focus: border-color accent-primary (+ optional ring shadow)
mobile: font-size 16px (prevent zoom)
```

### Input — Compact

```
height: 32px
padding: 0 10px
border: 1.5px solid var(--border-subtle)
border-radius: var(--radius-sm)
font-size: 13px
```

### Card

```
background: var(--bg-card)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-lg)
box-shadow: var(--shadow-card)
```

### Card Header

```
padding: 16px 20px
display: flex
align-items: center
justify-content: space-between
gap: 12px
```

### Modal

```
max-width: 460px
padding: 28px (24px mobile)
border-radius: var(--radius-xl) (var(--radius-md) mobile)
box-shadow: var(--shadow-modal)
background: var(--bg-card)
```

### Modal Header

```
icon-circle: 40px, pill radius, accent-warm bg, accent-primary color
title: 18px, weight 600-700
subtitle: 13px, text-tertiary
close: 32px square, sm radius, text-tertiary
```

### Modal Actions

```
display: flex
gap: 10-12px
buttons: height 44px, radius md or pill
cancel: border subtle, transparent bg
confirm: accent-primary bg, white text
```

### Dropdown Menu

```
background: var(--bg-card)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-md)
box-shadow: var(--shadow-dropdown)
padding: 4-6px
z-index: 100 (or 50 for kebab)
animation: scale(0.92) + translateY(-4px) → scale(1) + translateY(0), 0.18s ease-out
```

### Dropdown Item

```
height: 36px
padding: 0 12px
border-radius: var(--radius-sm)
font-size: 13px
font-weight: 500
color: var(--text-secondary)
hover: background var(--bg-page)
```

### Divider

```
height: 1px
background: var(--border-subtle)
border: none
```

### Segmented Control (Mode Toggle / Format Selector)

```
background: var(--bg-muted)
border-radius: var(--radius-md)
padding: 3px
sliding indicator: bg-card, sm radius, shadow-subtle
option: sm radius, 13px, weight 500, text-tertiary
active option: text-primary, weight 600
transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1)
```

### Upload Zone

```
height: 72px
border: 1.5px dashed var(--border-subtle)
border-radius: var(--radius-md)
color: var(--text-tertiary)
font-size: 14px
hover: border accent-primary, color accent-primary, bg accent-warm
```

### Badge — Count

```
width/height: 22px
border-radius: pill
background: var(--accent-warm)
color: var(--accent-primary)
font-size: 11px
font-weight: 700
```

### Badge — Role

```
font-size: 11px
font-weight: 600
padding: 2-4px 8-10px
border-radius: pill or sm
owner: accent-success-bg + accent-secondary
viewer: bg-muted + text-secondary
pending: warning-bg + warning-text
```

## Transitions

| Duration | Easing                       | Usage                                 |
| -------- | ---------------------------- | ------------------------------------- |
| 0.15s    | ease                         | Most hover states (bg, color, border) |
| 0.18s    | ease-out                     | Dropdown enter animations             |
| 0.2s     | ease                         | Border-color, focus transitions       |
| 0.25s    | cubic-bezier(0.4, 0, 0.2, 1) | Segmented control slider              |
| 0.3s     | ease-out                     | Content animations (fadeScaleIn)      |

## Animations

| Name             | Duration                    | Usage                     |
| ---------------- | --------------------------- | ------------------------- |
| `fadeScaleIn`    | 0.3s ease-out               | QR code appearance        |
| `slideDown`      | 0.2s ease-out               | Expanding sections        |
| `skeleton-pulse` | 1.5s ease-in-out infinite   | Loading skeletons         |
| `twinkle`        | 2-2.5s ease-in-out infinite | Doodle sparkles           |
| `float`          | 2.5-3s ease-in-out infinite | Doodle hearts             |
| `breathe`        | 3s ease-in-out infinite     | Doodle corners            |
| `sway`           | 3s ease-in-out infinite     | Doodle waves              |
| `spin`           | 8-10s linear infinite       | Doodle rings              |
| `pulse`          | 2.5s ease-in-out infinite   | Doodle dots               |
| `pp-row-in`      | 0.3s ease                   | Link row stagger entrance |
| `pp-copy-pop`    | 0.3s ease                   | Copy button feedback      |

## Responsive

- **Breakpoint:** 768px (single breakpoint)
- **Mobile inputs:** font-size bumped to 16px (prevents iOS zoom)
- **Mobile padding:** generally 16px horizontal (vs 20-40px desktop)
- **Layout:** sidebar+preview → stacked column on mobile

## Focus States

Standard pattern:

```
outline: 2px solid var(--accent-primary)
outline-offset: 2px
```

Input focus:

```
border-color: var(--accent-primary)
box-shadow: 0 0 0 3px rgba(216, 149, 117, 0.2)  /* optional ring */
```

## z-index Scale

| Value | Usage                                            |
| ----- | ------------------------------------------------ |
| 0     | Doodles layer                                    |
| 1     | Content above doodles                            |
| 10    | Role dropdown                                    |
| 50    | Kebab menus                                      |
| 100   | Header dropdowns, namespace dropdowns, skip link |
| 1000  | Modal backdrop                                   |
