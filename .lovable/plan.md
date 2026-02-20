

## Minor Improvements Across the Application

A collection of small, high-impact polish items to improve UX, accessibility, performance, and code quality.

---

### 1. Fix BackToTop and FloatingContactButton overlap
Both buttons are positioned at `bottom-6 right-6` (BackToTop) and `bottom-6 left-6` (FloatingContact). On mobile, the FloatingContact ping animation is distracting and the BackToTop button can overlap with mobile bottom navigation if present.

**Changes (2 files):**
- `BackToTop.tsx`: Shift to `bottom-20 right-6` on mobile to clear mobile nav; add `sr-only` text inside the button
- `FloatingContactButton.tsx`: Remove the infinite `animate-ping` ring (distracting); replace with a one-time subtle scale-in animation

---

### 2. Add loading="lazy" to non-critical images
The hero dots pattern and stat icons load eagerly. Blog cards and feature sections could benefit from native lazy loading.

**Changes (1 file):**
- `HeroSection.tsx`: Add `loading="lazy"` to the dots background pattern `<div>` (already uses `bg-[url(...)]` so no change needed) -- actually the parallax pattern is CSS, skip. Focus on the logo image in NavHeader which already has no `loading` attribute on desktop (it's above fold, fine). No changes needed here after review.

*Skipped -- images are already handled well.*

---

### 3. Improve blog card accessibility and keyboard navigation
Blog cards use `<Link>` inside `<h3>` but the entire card isn't clickable, making it harder for users to tap on mobile.

**Changes (1 file):**
- `BlogCard.tsx`: Wrap the entire card in a clickable `<Link>` so the full card area is tappable, not just the title and "Read more" text

---

### 4. Add smooth scroll behavior globally
Currently smooth scroll is only on the landing page container. Add it to the `<html>` element via CSS for consistent behavior across all anchor links.

**Changes (1 file):**
- `src/index.css`: Add `html { scroll-behavior: smooth; }` at the top level

---

### 5. Improve footer legal links (currently "#" placeholders)
The Privacy Policy, Terms of Service, and Refund Policy links all point to `#`, which is a dead end and bad for SEO/trust.

**Changes (1 file):**
- `FooterSection.tsx`: Add `aria-disabled="true"` and a "Coming Soon" tooltip to the placeholder legal links so users know they're not broken, just pending

---

### 6. Add `aria-current="page"` to active nav links
The NavHeader navigation links don't indicate which page/section is currently active.

**Changes (1 file):**
- `NavHeader.tsx`: For route-based links (`/product-tour`, `/blog`), add `aria-current="page"` when the current path matches, and visually highlight the active link

---

### 7. Reduce CLS (Cumulative Layout Shift) on landing page
The lazy-loaded sections use `SectionSkeleton` but the skeleton height doesn't match the actual rendered section height, causing layout shift.

**Changes (1 file):**
- `Index.tsx`: Add `min-height` estimates to Suspense fallbacks for hero and demo sections to reduce CLS

---

### 8. Add `rel="noopener noreferrer"` to external social links
Footer social links (Twitter, LinkedIn, YouTube) point to `#` now, but when real URLs are added they'll need security attributes.

**Changes (1 file):**
- `FooterSection.tsx`: Add `target="_blank"` and `rel="noopener noreferrer"` to social links proactively

---

### 9. Testimonials carousel auto-play
The testimonial carousel requires manual interaction. Adding gentle auto-play with pause-on-hover improves engagement.

**Changes (1 file):**
- `TestimonialsSection.tsx`: Add `autoplay` plugin from embla-carousel with a 5-second interval and stop-on-interaction behavior

---

### 10. Blog page -- add reading progress indicator
When reading long blog articles, a thin progress bar at the top helps users know how far they've read.

**Changes (1 file):**
- `BlogLayout.tsx`: Add a fixed top progress bar (2px height, primary color) that fills based on scroll percentage, only shown on individual article pages (not the index)

---

### Summary Table

| # | Improvement | File(s) | Impact |
|---|-------------|---------|--------|
| 1 | Fix floating button overlap + remove ping | `BackToTop.tsx`, `FloatingContactButton.tsx` | UX |
| 2 | *(Skipped -- already good)* | -- | -- |
| 3 | Make full blog card clickable | `BlogCard.tsx` | UX / Mobile |
| 4 | Global smooth scroll CSS | `index.css` | UX |
| 5 | Legal links "Coming Soon" state | `FooterSection.tsx` | Trust / UX |
| 6 | Active nav link indicator | `NavHeader.tsx` | Accessibility |
| 7 | Reduce CLS with min-height fallbacks | `Index.tsx` | Performance |
| 8 | Security attrs on social links | `FooterSection.tsx` | Security |
| 9 | Testimonials auto-play | `TestimonialsSection.tsx` | Engagement |
| 10 | Blog reading progress bar | `BlogLayout.tsx` | UX |

### Technical Notes
- The embla-carousel auto-play plugin is already available as part of the `embla-carousel-react` package ecosystem; we'll need to install `embla-carousel-autoplay` as a dependency.
- All changes are backward-compatible and non-breaking.
- Total files modified: ~8 files, all minor edits.

