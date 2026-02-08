

# Enhance Pricing Card Total Calculation Display

## Current State
The billing summary is shown as a single line of text:
- Yearly: `₹2,388/year billed annually`
- 3-Year: `₹6,444 billed every 3 years`

## Requested Change
Show the total calculation more prominently below the monthly rate when yearly or 3-year billing is selected.

---

## Visual Design

### Current Layout
```
₹199  ₹159/month
₹1,908/year billed annually
```

### New Layout
```
₹199  ₹159/month

Total: ₹1,908/year
Save ₹480 compared to monthly
```

---

## Implementation Details

### File to Modify
`src/components/landing/shared.tsx`

### Changes to `getBillingSummary` and Price Display

Update the billing summary section (lines 248-250) to show:
1. **Total amount** in a more prominent style
2. **Savings amount** showing how much they save compared to monthly billing

### Updated Code Structure

```tsx
{/* Price Display - Non-enterprise plans */}
<div className="mb-2">
  {showDiscount && (
    <span className="text-lg text-muted-foreground line-through mr-2">
      ₹{price.toLocaleString('en-IN')}
    </span>
  )}
  <span className="text-4xl font-bold text-foreground">
    ₹{discountedPrice.toLocaleString('en-IN')}
  </span>
  <span className="text-muted-foreground">/month</span>
</div>

{/* Total Calculation - Only show for yearly/3-year */}
{billingPeriod !== 'monthly' ? (
  <div className="mb-6 pb-6 border-b border-border">
    <div className="flex items-center justify-between text-sm mb-1">
      <span className="text-muted-foreground">Total:</span>
      <span className="font-semibold text-foreground">
        ₹{totalAmount.toLocaleString('en-IN')}
        {billingPeriod === 'yearly' ? '/year' : ' for 3 years'}
      </span>
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">You save:</span>
      <span className="text-green-600 dark:text-green-400 font-medium">
        ₹{savings.toLocaleString('en-IN')}
      </span>
    </div>
  </div>
) : (
  <p className="text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
    Billed monthly, cancel anytime
  </p>
)}
```

### Calculation Logic

Add helper function to calculate total and savings:

```tsx
const getTotalAndSavings = (
  basePrice: number, 
  discountedPrice: number, 
  billingPeriod: 'monthly' | 'yearly' | '3-year'
) => {
  const months = billingPeriod === 'yearly' ? 12 : 36;
  const totalWithDiscount = discountedPrice * months;
  const totalWithoutDiscount = basePrice * months;
  const savings = totalWithoutDiscount - totalWithDiscount;
  
  return { total: totalWithDiscount, savings };
};
```

---

## Expected Result

### Monthly Selected
```
₹199/month
Billed monthly, cancel anytime
```

### Yearly Selected (20% off)
```
₹199  ₹159/month

Total:     ₹1,908/year
You save:  ₹480
```

### 3-Year Selected (40% off)
```
₹199  ₹119/month

Total:     ₹4,284 for 3 years
You save:  ₹2,856
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/shared.tsx` | Add `getTotalAndSavings` helper, update price display section to show total and savings prominently |

---

## Benefits

1. **Clarity** - Users immediately see the total commitment amount
2. **Value Proposition** - Highlighting savings encourages longer commitments
3. **Transparency** - Clear breakdown of what they pay and save

