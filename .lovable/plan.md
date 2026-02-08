
# Pricing Section Redesign with Billing Period Toggle

## Overview
Transform the pricing section with a subscription-based model featuring monthly/yearly/3-year billing options with progressive discounts, and fix the "Most Popular" badge visibility.

---

## Issues to Fix

### 1. "Most Popular" Badge Cutoff
**Current Problem**: Badge positioned at `-top-0 -translate-y-1/2` causes it to be clipped by container
**Solution**: Add proper padding/margin to the parent container and ensure badge is fully visible

### 2. Pricing Model Change
**Current**: One-time setup + AMC yearly fee
**New**: Monthly subscription with billing period toggle

| Plan | Monthly | Yearly (20% off) | 3-Year (40% off) |
|------|---------|------------------|------------------|
| Starter | ₹199 | ₹159/mo (₹1,910/yr) | ₹119/mo (₹4,284 total) |
| Professional | ₹299 | ₹239/mo (₹2,868/yr) | ₹179/mo (₹6,444 total) |
| Enterprise | Contact Sales | Contact Sales | Contact Sales |

---

## Visual Design

### Billing Period Toggle
```
+---------------------------------------+
|  Monthly  |  Yearly     |  3 Years   |
|           |  Save 20%   |  Save 40%  |
+---------------------------------------+
```

- Segmented control / toggle group with 3 options
- Active option highlighted with primary color
- Discount badges shown on yearly/3-year options

### Card Layout Changes
- Add `pt-6` to pricing grid to prevent badge clipping
- Popular card badge positioned with proper overflow handling
- Dynamic price display based on selected billing period
- Strike-through original price when discount applied

---

## Implementation Details

### Files to Modify

#### 1. `src/components/landing/PricingSection.tsx`
- Add billing period state (`'monthly' | 'yearly' | '3-year'`)
- Add toggle component before pricing cards
- Calculate discounted prices based on selection
- Pass billing period to PricingCard

#### 2. `src/components/landing/shared.tsx` (PricingCard)
- Update to accept billing period and base monthly price
- Display price dynamically based on billing
- Show original vs discounted price with visual indicator
- Fix "Most Popular" badge overflow issue

#### 3. `src/components/landing/types.ts`
- Update `PricingPlan` interface to support monthly pricing
- Add `billingPeriod` type

#### 4. `src/pages/Index.tsx`
- Update default pricing data with new monthly prices:
  - Starter: ₹199/month
  - Professional: ₹299/month
  - Enterprise: Contact Sales

---

## Code Structure

### Billing Toggle Component
```tsx
type BillingPeriod = 'monthly' | 'yearly' | '3-year';

const billingOptions = [
  { value: 'monthly', label: 'Monthly', discount: 0 },
  { value: 'yearly', label: 'Yearly', discount: 20, badge: 'Save 20%' },
  { value: '3-year', label: '3 Years', discount: 40, badge: 'Save 40%' },
];

<div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full mb-12">
  {billingOptions.map(option => (
    <button
      key={option.value}
      onClick={() => setBillingPeriod(option.value)}
      className={cn(
        "px-4 py-2 rounded-full transition-all",
        billingPeriod === option.value 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted-foreground/10"
      )}
    >
      <span>{option.label}</span>
      {option.badge && (
        <span className="ml-1.5 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
          {option.badge}
        </span>
      )}
    </button>
  ))}
</div>
```

### Price Calculation
```tsx
const calculatePrice = (basePrice: number, billingPeriod: BillingPeriod) => {
  switch (billingPeriod) {
    case 'yearly':
      return Math.round(basePrice * 0.8); // 20% off
    case '3-year':
      return Math.round(basePrice * 0.6); // 40% off
    default:
      return basePrice;
  }
};
```

### Updated Price Display
```tsx
{/* Price with discount indicator */}
<div className="mb-6">
  {billingPeriod !== 'monthly' && (
    <span className="text-lg text-muted-foreground line-through mr-2">
      ₹{basePrice}
    </span>
  )}
  <span className="text-4xl font-bold text-foreground">
    ₹{discountedPrice}
  </span>
  <span className="text-muted-foreground">/month</span>
</div>

{/* Billing summary */}
<p className="text-sm text-muted-foreground mb-6 pb-6 border-b">
  {billingPeriod === 'yearly' && `₹${discountedPrice * 12}/year billed annually`}
  {billingPeriod === '3-year' && `₹${discountedPrice * 36} billed every 3 years`}
  {billingPeriod === 'monthly' && 'Billed monthly, cancel anytime'}
</p>
```

### Fixed Popular Badge
```tsx
{/* Add overflow-visible and padding to grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pt-8">

{/* Badge with proper positioning */}
{isPopular && (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg whitespace-nowrap">
      <Star className="h-4 w-4 fill-current" />
      Most Popular
    </div>
  </div>
)}
```

---

## Updated Pricing Data (Index.tsx)

```typescript
const [pricingPlans, setPricingPlans] = useState<PricingItem[]>([
  { 
    id: '1', 
    name: 'Starter', 
    price: 199, // Monthly base price
    amc_price: 0, // Not used in new model
    discount: null, 
    min_labs: null, 
    features: ['Single branch', 'Up to 500 patients/month', 'Basic reports', 'Email support', '1 user account'], 
    is_popular: false, 
    is_enterprise: false 
  },
  { 
    id: '2', 
    name: 'Professional', 
    price: 299, // Monthly base price
    amc_price: 0, 
    discount: null, 
    min_labs: null, 
    features: ['Up to 3 branches', 'Unlimited patients', 'Advanced analytics', 'Priority support', '5 user accounts', 'Custom branding'], 
    is_popular: true, 
    is_enterprise: false 
  },
  { 
    id: '3', 
    name: 'Enterprise', 
    price: 0, // Contact for pricing
    amc_price: 0, 
    discount: null, 
    min_labs: 5, 
    features: ['Unlimited branches', 'Unlimited everything', 'Dedicated support', 'Custom integrations', 'On-premise option', 'SLA guarantee'], 
    is_popular: false, 
    is_enterprise: true 
  }
]);
```

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `src/components/landing/PricingSection.tsx` | Add billing toggle, pass billing period to cards, fix grid padding |
| `src/components/landing/shared.tsx` | Update PricingCard for dynamic pricing, fix badge overflow |
| `src/components/landing/types.ts` | Add `BillingPeriod` type, update `PricingPlan` interface |
| `src/pages/Index.tsx` | Update default pricing data with new monthly prices |

---

## Benefits

1. **Modern SaaS Pricing** - Industry-standard subscription model with billing flexibility
2. **Clear Value Proposition** - Visible discounts incentivize longer commitments
3. **Better UX** - Toggle makes comparing plans easy
4. **Fixed Visual Bug** - "Most Popular" badge fully visible
5. **Scalable** - Easy to adjust prices and discounts in the future
