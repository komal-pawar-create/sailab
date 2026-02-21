

## UX Improvement Plan

A focused set of high-impact, low-effort UX improvements across the landing page, blog, and dashboard areas.

---

### 1. Fix FloatingContactButton ping animation (distracting)

The infinite `animate-ping` ring on the contact FAB is visually noisy and distracting. Replace with a one-time subtle entrance animation.

**File:** `src/components/FloatingContactButton.tsx`
- Remove the `<span className="animate-ping" />` element
- The existing `animate-fade-in` on the button itself is sufficient

---

### 2. Fix BackToTop button overlap with mobile bottom nav

The BackToTop button sits at `bottom-6 right-6` which can overlap the MobileBottomNav on small screens.

**File:** `src/components/landing/BackToTop.tsx`
- Change position to `bottom-20` on mobile (`bottom-6 md:bottom-6` but `bottom-20` for small screens) to clear the mobile nav area
- Add `sr-only` text "Back to top" for screen readers

---

### 3. Make entire BlogCard clickable

Currently only the title and "Read more" link are clickable. On mobile, users expect to tap anywhere on the card.

**File:** `src/components/blog/BlogCard.tsx`
- Wrap the entire `<article>` content in a `<Link>` so the full card is tappable
- Keep the existing hover effects

---

### 4. Add global smooth scroll CSS

Smooth scrolling is only applied via JavaScript on the landing page. Add it globally via CSS for consistent behavior on all anchor links.

**File:** `src/index.css`
- Add `html { scroll-behavior: smooth; }` at the top of the base layer

---

### 5. Add reading progress bar to blog articles

Long blog articles lack a visual indicator of reading progress. Add a thin progress bar at the top of the viewport.

**File:** `src/components/blog/BlogLayout.tsx`
- Track scroll progress as a percentage
- Render a fixed 3px-tall bar at the top with primary color, width proportional to scroll progress

---

### 6. Footer legal links -- add "Coming Soon" state

Privacy Policy, Terms of Service, and Refund Policy links all point to `#`, which is misleading.

**File:** `src/components/landing/FooterSection.tsx`
- Add `aria-disabled="true"` and cursor styling to legal links
- Show a "Coming Soon" tooltip on hover
- Add `rel="noopener noreferrer"` and `target="_blank"` to social links proactively

---

### 7. Add active nav link indicator

Navigation links in the header don't visually indicate the current page.

**File:** `src/components/landing/NavHeader.tsx`
- For route-based links (`/product-tour`, `/blog`), check against `location.pathname`
- Add `text-primary` color and a persistent underline bar for the active link
- Add `aria-current="page"` attribute

---

### 8. Testimonials carousel auto-play

The carousel requires manual interaction which reduces engagement. Add gentle auto-play.

**File:** `src/components/landing/TestimonialsSection.tsx`
- Install `embla-carousel-autoplay` plugin
- Add auto-play with a 5-second delay that pauses on hover/interaction

---

### 9. Reduce CLS on landing page Suspense fallbacks

The `SectionSkeleton` has a generic height that doesn't match actual sections, causing layout shift.

**File:** `src/pages/Index.tsx`
- Add `min-height` to the hero Suspense fallback (e.g., `min-h-[600px]`)
- Add appropriate `min-height` values to other key section fallbacks

---

### Summary

| # | Improvement | File | Type |
|---|-------------|------|------|
| 1 | Remove distracting ping animation | `FloatingContactButton.tsx` | UX |
| 2 | Fix BackToTop mobile overlap | `BackToTop.tsx` | Mobile UX |
| 3 | Full-card clickable blog cards | `BlogCard.tsx` | Mobile UX |
| 4 | Global smooth scroll | `index.css` | UX |
| 5 | Blog reading progress bar | `BlogLayout.tsx` | UX |
| 6 | Legal links "Coming Soon" + social link security | `FooterSection.tsx` | Trust / Security |
| 7 | Active nav link highlight | `NavHeader.tsx` | Accessibility |
| 8 | Testimonials auto-play | `TestimonialsSection.tsx` | Engagement |
| 9 | Reduce CLS with min-height fallbacks | `Index.tsx` | Performance |

### Technical Notes

- New dependency needed: `embla-carousel-autoplay` for item 8
- All changes are backward-compatible and non-breaking
- Total: 9 files modified, no new components created

