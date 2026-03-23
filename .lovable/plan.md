

## Problem

1. **No scroll**: `body` has `overflow: hidden` in `src/index.css`, so pages that exceed viewport height cannot be scrolled.
2. **Page design**: The AccessBlocked page needs to be scrollable and more premium/persuasive.

## Plan

### 1. Fix global scroll issue (`src/index.css`)
- Remove `overflow: hidden` from `body` — this is blocking scroll on ALL pages, not just AccessBlocked.
- Keep `overscroll-behavior: none` for bounce prevention.

### 2. Redesign AccessBlocked page (`src/pages/AccessBlocked.tsx`)
- Change outer container from `flex items-center justify-center` to `overflow-y-auto` so content scrolls naturally.
- Make the page more premium and persuasive:
  - Add a dramatic hero section with urgency messaging
  - Add testimonial/social proof section with fake quotes from pastors
  - Add a "limited time" urgency badge
  - Add animated gradient background
  - Make the lifetime plan card more visually dominant with glow effects
  - Add a guarantee/trust section (e.g., "Satisfação garantida")
  - Add comparison: "Quanto custa preparar um sermão sem IA?" vs "Com SermonPro AI"
  - Bigger, bolder CTAs with pulsing animation on the lifetime plan button
- Ensure the page scrolls smoothly on mobile (391px viewport)

### Technical Details
- `src/index.css`: Remove `overflow: hidden` from body styles
- `src/pages/AccessBlocked.tsx`: Full redesign with scroll support and premium sales copy

