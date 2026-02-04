
# Auth Page Enhancement: Logo Prominence & Back to Home Navigation

## Overview
Improve the Auth page by adding a "Back to Home" button and making the logo more prominent, especially on mobile screens. The reference image shows the LabFlow logo prominently displayed in the landing page header.

---

## Changes Required

### 1. Add Back to Home Button
Add a prominent button at the top-left of the auth card (similar to ForgotPassword page pattern) that navigates users back to the landing page.

### 2. Enhance Logo Prominence
- Increase logo size significantly, especially on mobile
- Add a subtle glow effect for visual appeal (matching NavHeader style)
- Use responsive sizing: larger on mobile to fill more horizontal space

---

## Visual Design

### Current Layout
```
+---------------------------+
|    [small logo]           |
|    description            |
|    ---------------------- |
|    [Sign In Form]         |
+---------------------------+
```

### New Layout
```
+---------------------------+
| <- Back to Home           |
|                           |
|    [PROMINENT LOGO]       |
|    description            |
|    ---------------------- |
|    [Sign In Form]         |
+---------------------------+
```

---

## Technical Implementation

### File to Modify
`src/pages/Auth.tsx`

### Changes

**1. Add Import**
```typescript
import { ArrowLeft } from 'lucide-react';
```

**2. Add Back to Home Button**
Add above the logo in CardHeader, styled as a ghost button with left arrow icon.

**3. Enhanced Logo Styles**
- Mobile: `h-16` to `h-20` (larger, more prominent)
- Desktop: `h-14` to `h-16`
- Add glow effect with gradient blur background
- Center alignment with proper spacing

### Responsive Logo Sizing
| Screen | Current | New |
|--------|---------|-----|
| Mobile | h-12 | h-16 sm:h-20 |
| Desktop | h-12 | h-14 md:h-16 |

### Glow Effect
Add a subtle animated glow behind the logo:
```tsx
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl -z-10 rounded-full scale-150" />
  <img src="/images/labflow-logo.png" ... />
</div>
```

---

## Code Changes Summary

| Element | Change |
|---------|--------|
| Back Button | Add ghost button with ArrowLeft icon linking to `/` |
| Logo Size | Increase from `h-12` to `h-16 sm:h-20` |
| Logo Effect | Add gradient glow background |
| Layout | Add spacing between back button and logo |

---

## Benefits

1. **Better Navigation** - Users can easily return to the landing page
2. **Brand Recognition** - Larger, more prominent logo reinforces brand identity
3. **Mobile UX** - Logo is now readable and professional on small screens
4. **Visual Consistency** - Matches the glow effect used in the landing page NavHeader
