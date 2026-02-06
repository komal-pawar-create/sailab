

# Prominent LabFlow Branding on Auth Page

## Current Issue
The logo image on the Auth page is too small (`h-16 sm:h-20`) and not visually prominent enough. The current sizing doesn't create the brand impact needed for a professional login page.

## Solution
Replace the small logo image with a large, prominent text-based brand display using "LabFlow" as a styled heading with an accent gradient effect. This approach:
- Is simpler and more reliable than image sizing
- Creates a bold, professional first impression
- Works consistently across all screen sizes
- Matches modern SaaS login page designs

---

## Visual Design

### Current
```
+---------------------------+
| <- Back to Home           |
|    [small logo image]     |
|    description            |
+---------------------------+
```

### New (Prominent)
```
+---------------------------+
| <- Back to Home           |
|                           |
|       LabFlow             | <-- Large gradient text
|       (tagline)           |
|                           |
+---------------------------+
```

---

## Implementation Details

### File to Modify
`src/pages/Auth.tsx`

### Changes

**Replace the logo image block with styled text:**

```tsx
<div className="relative flex flex-col items-center mb-6">
  {/* Glow effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 blur-3xl -z-10 rounded-full scale-150" />
  
  {/* Large Brand Name */}
  <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent tracking-tight">
    LabFlow
  </h1>
  
  {/* Optional: Small flask icon or subtle detail */}
  <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent mt-3 rounded-full" />
</div>
```

### Styling Breakdown

| Element | Style | Purpose |
|---------|-------|---------|
| Text size | `text-5xl sm:text-6xl md:text-7xl` | Very large on mobile, even larger on desktop |
| Font weight | `font-bold` | Strong visual presence |
| Color | Gradient with `bg-clip-text text-transparent` | Premium gradient text effect |
| Tracking | `tracking-tight` | Professional typography |
| Glow | `blur-3xl` with `scale-150` | Subtle ambient glow behind text |
| Accent line | `h-1 w-20` gradient | Decorative underline for polish |

---

## Before/After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Size | ~64px height | ~72px font (mobile), ~84px (desktop) |
| Type | Image | Styled text |
| Impact | Subtle | Bold & prominent |
| Glow | Small blur | Large ambient glow |

---

## Benefits

1. **Maximum Prominence** - Large text fills the header area
2. **Consistent** - No image loading issues or sizing quirks
3. **Responsive** - Scales beautifully from mobile to desktop
4. **Professional** - Gradient text is a modern premium design pattern
5. **Accessible** - Text is selectable and screen-reader friendly

