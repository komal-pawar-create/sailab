

# Homepage UX Improvement Plan

After reviewing all landing page components, here are the key UX issues and proposed fixes:

## Issues Identified

1. **Too many competing popups/overlays** -- ExitIntentPopup, ScrollOfferBanner, TimedSoftCTA, LiveActivityFeed, FloatingContactButton, and SocialProofBar all fight for attention. This creates popup fatigue and feels spammy.

2. **Hero section is text-heavy with no visual product preview** -- Users land on a wall of text + stats but never see the actual product until they scroll far down to the Demo section.

3. **SocialProofBar overlaps navigation** -- Fixed at `top-16` (64px), it sits directly under the navbar and pushes content perception down, creating a cramped feel on scroll.

4. **Redundant CTAs** -- "Get Started" and "Login" both go to `/auth`. The navbar has 3 action buttons (Book Demo, Login, Get Started) which is excessive.

5. **Demo section defaults to "video coming soon"** -- If no demo videos exist in the DB, users see a dead play button with "Demo video coming soon" which hurts credibility.

6. **Animations delay content visibility** -- Multiple `opacity-0` with staggered delays mean users see blank space for 400-500ms on first load.

7. **Mobile: No product screenshots anywhere** -- The entire page is text and icons; no visual proof of the product UI.

---

## Proposed Changes

### 1. Reduce Popup Clutter
- Remove `TimedSoftCTA` (45s popup) entirely -- it adds little value and annoys users
- Increase `ScrollOfferBanner` threshold from 60% to 80% scroll depth
- Keep ExitIntentPopup (desktop only, already 30s delayed) and FloatingContactButton
- Remove `LiveActivityFeed` toast notifications -- fake activity feeds erode trust

### 2. Add Product Screenshot to Hero
- Add a browser-frame mockup below the CTA buttons showing a dashboard screenshot (use existing `src/assets/screenshots/dashboard-overview.png`)
- This replaces the stats cards as the primary visual, moving stats into a compact inline bar above the screenshot

### 3. Fix Navigation UX
- Remove the duplicate "Login" ghost button from navbar -- keep only "Book Demo" (outline) and "Get Started" (primary)
- Remove `SocialProofBar` entirely -- it duplicates the hero stats and clutters the fixed header area

### 4. Improve Demo Section Fallback
- When no videos exist, show an interactive tour by default instead of a "coming soon" placeholder
- Set `activeTab` default to `'tour'` when `demoVideos` is empty

### 5. Reduce Animation Delays
- Cut all stagger delays in half (e.g., `delay-400` to `delay-200`)
- Remove `opacity-0` initial state from hero stats -- let them render immediately with counter animation only

### 6. Add Product Screenshot Grid to Features Section
- Below the feature cards, add a 2-column grid showing actual app screenshots with captions (using existing assets in `src/assets/screenshots/`)

### 7. Improve Mobile Hero
- Reduce hero `min-h-screen` to `min-h-[80vh]` on mobile to show more content above the fold
- Make stat cards 2x2 grid instead of horizontal scroll on mobile for better scannability

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Remove TimedSoftCTA, LiveActivityFeed, SocialProofBar imports and usage |
| `src/components/landing/HeroSection.tsx` | Add product screenshot mockup, reduce animation delays, adjust mobile layout |
| `src/components/landing/NavHeader.tsx` | Remove duplicate Login button |
| `src/components/landing/DemoSection.tsx` | Default to tour tab when no videos, improve fallback |
| `src/components/landing/ScrollOfferBanner.tsx` | Increase scroll threshold to 80% |
| `src/components/landing/FeaturesSection.tsx` | Add screenshot grid below feature cards |

