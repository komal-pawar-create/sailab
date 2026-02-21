

## Add "Don't Show Again" Option to Onboarding Tour First Step

Currently, the "Don't show this tour again" checkbox only appears on the final step of the tour. Users who find the tour disruptive have to either complete the entire tour or skip it — but it comes back next session. This change adds a permanent dismiss option right from the start.

### What Changes

**File: `src/components/OnboardingTour.tsx`**
- Add a "Don't show again" checkbox to the welcome (first) step content, so users can permanently block the tour immediately without going through all steps
- When "Skip Tour" is clicked with the checkbox checked, permanently dismiss the tour
- Update the `handleCallback` to check `dontShowAgain` state on skip as well as finish

**File: `src/components/patient-history/PatientHistoryTour.tsx`**
- Apply the same change: add permanent dismiss checkbox to the first step of the Patient History tour for consistency

### How It Works

1. Tour pops up with the welcome message
2. Below the welcome text, a "Don't show this tour again" checkbox is visible
3. If user checks it and clicks "Skip Tour" or closes — tour is permanently dismissed
4. If unchecked and skipped — tour will reappear next session (current behavior)
5. The final step retains its existing checkbox as well

### Technical Detail

The `dontShowAgain` state is already managed in `OnboardingTour.tsx`. The only change is:
- Pass it into the first step's JSX content (currently only passed to the final step)
- In `handleCallback`, when `STATUS.SKIPPED` fires, check `dontShowAgain` and call `permanentlyDismiss()` if true

No new components or dependencies needed.
