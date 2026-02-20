

## Fix Mobile Header Overlap

### Problem
On small screens, the NavHeader logo is too large (`h-16` unscrolled) and the row of mobile controls (language selector + dark mode toggle + hamburger menu) crowds the header, causing visual overlap with the hero badge below.

### Changes

#### 1. Reduce mobile logo size (`src/components/landing/NavHeader.tsx`)
- **Unscrolled**: Change logo from `h-16 md:h-20 lg:h-24` to `h-10 md:h-20 lg:h-24` (smaller on mobile only)
- **Scrolled**: Change from `h-10 md:h-12 lg:h-14` to `h-8 md:h-12 lg:h-14`
- Reduce mobile header padding from `py-5`/`py-3` to `py-3`/`py-2` on small screens using responsive classes

#### 2. Compact mobile controls spacing (`src/components/landing/NavHeader.tsx`)
- Reduce gap between mobile controls from `gap-2` to `gap-1`
- Hide the chevron arrow on the language selector on mobile to save space (it already hides the language name text on small screens)

#### 3. Add top padding to hero section (`src/components/landing/HeroSection.tsx`)
- Change `py-10 md:py-20` to `pt-24 pb-10 md:py-20` to ensure the hero content clears the fixed header on mobile

### Files Modified
| File | Change |
|------|--------|
| `src/components/landing/NavHeader.tsx` | Smaller mobile logo, tighter padding, compact control spacing |
| `src/components/landing/HeroSection.tsx` | Add sufficient top padding to clear the fixed header |

