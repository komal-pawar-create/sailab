

## Add Language Selector to Dashboard

Add the existing `LanguageSelector` component to the Dashboard header area, next to the existing action buttons (Help, Refresh, Analytics).

### What Changes

**File: `src/pages/Dashboard.tsx`**
- Import `LanguageSelector` from `@/components/landing/LanguageSelector`
- Add `<LanguageSelector />` inside the action buttons row (line 204-216), placed before the Help button

This reuses the same component already working on the landing page -- no new components needed.

### Technical Detail

The `LanguageSelector` component accepts an optional `isScrolled` prop for styling. In the dashboard context, we'll pass `isScrolled={true}` so it uses the muted background style that fits better with the dashboard UI.

