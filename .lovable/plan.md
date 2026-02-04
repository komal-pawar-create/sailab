
# Excel Export Clean Number Formatting

## Problem
Currently, Excel exports show amount columns (PAID, UNPAID, DISCOUNT, etc.) with ₹ symbol and comma separators (e.g., `₹1,200`). This makes it difficult to use the data for calculations in Excel, as the values are treated as text rather than numbers.

## Solution
Create a separate formatting function for Excel exports that outputs plain numeric values without currency symbols or thousand separators. PDF and Print outputs will continue using the formatted currency display since they are meant for human reading.

---

## Changes Overview

### 1. Add New Helper Function
Add `formatNumberForExcel` to `src/lib/exportUtils.ts`:
- Returns the raw number as a simple string
- No currency symbol, no commas
- Example: `1200` instead of `₹1,200`

### 2. Update Report Components
Modify 6 report files to use plain numbers for Excel exports:

| Report | Amount Columns Affected |
|--------|------------------------|
| PatientReport | paid, unpaid, discount |
| BillsReport | total_amount, paid_amount, due_amount |
| RevenueReport | total_revenue, collections, outstanding |
| CollectionReport | payment_amount |
| DoctorReferralReport | total_revenue |
| DailyActivityReport | amount |

---

## Technical Implementation

### New Function in exportUtils.ts
```typescript
// Format number for Excel (plain number, no currency symbol or commas)
export const formatNumberForExcel = (amount: number): number => {
  return amount;
};
```

Note: Return the actual number rather than a string so Excel treats it as a numeric value.

### Update Pattern for Each Report
Change Excel export handlers from:
```typescript
const handleExportExcel = () => {
  const exportData = data.map((r) => ({
    ...r,
    paid: formatCurrency(r.paid),      // ₹1,200
    unpaid: formatCurrency(r.unpaid),  // ₹500
  }));
  exportToExcel(exportData, columns, options);
};
```

To:
```typescript
const handleExportExcel = () => {
  const exportData = data.map((r) => ({
    ...r,
    paid: r.paid,      // 1200
    unpaid: r.unpaid,  // 500
  }));
  exportToExcel(exportData, columns, options);
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/exportUtils.ts` | Add `formatNumberForExcel` helper function |
| `src/components/reports/PatientReport.tsx` | Update `handleExportExcel` to use plain numbers |
| `src/components/reports/BillsReport.tsx` | Update `handleExportExcel` to use plain numbers |
| `src/components/reports/RevenueReport.tsx` | Update `handleExportExcel` to use plain numbers |
| `src/components/reports/CollectionReport.tsx` | Update `handleExportExcel` to use plain numbers |
| `src/components/reports/DoctorReferralReport.tsx` | Update `handleExportExcel` to use plain numbers |
| `src/components/reports/DailyActivityReport.tsx` | Update `handleExportExcel` to use plain numbers |

---

## Before/After Example

**Before (Current)**
| PAID | UNPAID | DISCOUNT |
|------|--------|----------|
| ₹500 | ₹0 | ₹0 |
| ₹1,200 | ₹0 | ₹0 |

**After (Fixed)**
| PAID | UNPAID | DISCOUNT |
|------|--------|----------|
| 500 | 0 | 0 |
| 1200 | 0 | 0 |

---

## Benefits
1. Excel can recognize values as numbers for SUM, calculations, and sorting
2. PDF and Print outputs retain formatted display (₹ with commas) for readability
3. Clean separation between machine-readable (Excel) and human-readable (PDF/Print) formats
