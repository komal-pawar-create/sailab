

# Fix: Can't Pick Date in Calendar Popover

## Problem
In the "Create New Follow-up" dialog, clicking the **Pick date** button opens the calendar popover, but clicking a date does nothing — the date can't be selected.

## Root Cause
The `Calendar` popover is rendered **inside a Radix Dialog**. Radix Dialog traps focus and intercepts pointer events on anything outside the dialog content. Because the `PopoverContent` is portaled to `document.body` (outside the dialog DOM tree), the day-button clicks get blocked / focus-stolen by the dialog's `onPointerDownOutside` handler — so `onSelect` never fires.

This is a well-known Radix interaction issue and affects both the **Due Date** and **Remind Date** popovers in `src/components/forms/AddFollowupForm.tsx`.

## Fix
In `src/components/forms/AddFollowupForm.tsx`, on **both** `<PopoverContent>` elements (Due Date + Remind Date), stop the dialog from swallowing the pointer events:

```tsx
<PopoverContent
  className="w-auto p-0 z-[100]"
  align="start"
  onOpenAutoFocus={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
  <Calendar ... />
</PopoverContent>
```

- `onPointerDownOutside={e => e.preventDefault()}` — keeps day clicks from being treated as outside-clicks
- `onOpenAutoFocus={e => e.preventDefault()}` — prevents focus war with the dialog
- `z-[100]` — ensures the popover stacks above the dialog overlay
- `align="start"` — keeps the calendar anchored to the trigger nicely

Also remove `initialFocus` on the Calendar (it fights with the dialog's focus trap).

## Files Changed

| File | Change |
|------|--------|
| `src/components/forms/AddFollowupForm.tsx` | Add `onPointerDownOutside` + `onOpenAutoFocus` preventDefault and `z-[100]` to both date PopoverContents; drop `initialFocus` on Calendars |

## Out of Scope (already covered by previously approved plan)
- Profiles RLS policy fix for follow-up assignee 403
- OperatorSelect 400 error
- Bills search 400 error

