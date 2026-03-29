

# Replace Hero Dashboard Screenshot with Real Product Screenshot

## Problem
The current `src/assets/screenshots/dashboard-overview.png` is a low-quality generated/placeholder image with unreadable text. As the first impression on the landing page, it needs to show the real LabFlow dashboard.

## Solution

1. **Take a real screenshot** of the live dashboard at `https://labflow.mywebz.in/dashboard` (or from the preview) using browser tools at a high resolution (1280x720+)
2. **Replace** `src/assets/screenshots/dashboard-overview.png` with the real screenshot
3. This image is already imported and used in both `HeroSection.tsx` and `PlatformPreview.tsx`, so no code changes are needed -- just the asset swap

## Steps
1. Navigate to the dashboard in the preview, take a clean high-res screenshot
2. Copy it to `src/assets/screenshots/dashboard-overview.png`, replacing the placeholder
3. Optionally update the other placeholder screenshots (`patients-list.png`, `billing-interface.png`, `reports-view.png`, `analytics-dashboard.png`) with real ones too

## Files Changed
| File | Change |
|------|--------|
| `src/assets/screenshots/dashboard-overview.png` | Replace with real screenshot |
| Optionally 4 other screenshots | Replace with real screenshots |

No code changes required -- the imports and references are already correct.

