
# Fix Pricing Display: Update Database Values

## Problem Identified
The pricing cards are showing **₹15,000/month** and **₹25,000/month** instead of **₹199/month** and **₹299/month**.

**Root Cause**: The database table `landing_pricing` contains old pricing values that override the defaults set in `Index.tsx`.

| Plan | Current DB Value | Expected Value |
|------|------------------|----------------|
| Starter | ₹15,000 | ₹199 |
| Professional | ₹25,000 | ₹299 |
| Enterprise | Custom | Custom (no change) |

## Data Flow
```text
Index.tsx default state (₹199/₹299)
         ↓
useEffect fetches from database
         ↓
Database returns old values (₹15,000/₹25,000)
         ↓
State gets overwritten with database values
         ↓
Wrong prices displayed on screen
```

## Solution
Run a database migration to update the `landing_pricing` table with the correct monthly subscription prices.

### Migration SQL
```sql
-- Update Starter plan price to ₹199/month
UPDATE landing_pricing 
SET price = 199, amc_price = 0 
WHERE name = 'Starter';

-- Update Professional plan price to ₹299/month
UPDATE landing_pricing 
SET price = 299, amc_price = 0 
WHERE name = 'Professional';
```

## Files to Modify
| File | Change |
|------|--------|
| New migration file | SQL to update `landing_pricing` table with correct prices |

## Expected Result After Fix
| Plan | Monthly | Yearly (20% off) | 3-Year (40% off) |
|------|---------|------------------|------------------|
| Starter | ₹199 | ₹159 | ₹119 |
| Professional | ₹299 | ₹239 | ₹179 |
| Enterprise | Custom | Custom | Custom |
