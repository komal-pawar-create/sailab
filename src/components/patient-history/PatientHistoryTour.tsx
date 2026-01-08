import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, EVENTS, ACTIONS } from 'react-joyride';
import { useTheme } from 'next-themes';
import { Checkbox } from '@/components/ui/checkbox';

const TOUR_STORAGE_KEY = 'labmaster_patient_history_tour_completed';
const TOUR_PERMANENT_DISMISS_KEY = 'labmaster_patient_history_tour_dismissed';

interface FinalStepContentProps {
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
}

const FinalStepContent = ({ dontShowAgain, setDontShowAgain }: FinalStepContentProps) => (
  <div className="text-center">
    <h3 className="text-lg font-semibold mb-2">You're Ready! 🎉</h3>
    <p className="text-sm text-muted-foreground mb-3">
      Now you know how to manage patient history efficiently. Use the tabs and quick actions to stay organized.
    </p>
    <p className="text-xs text-muted-foreground mb-4">
      Tip: Use <kbd className="px-1.5 py-0.5 bg-muted rounded">Alt+1-4</kbd> to switch between tabs quickly.
    </p>
    <div className="flex items-center justify-center gap-2 pt-2 border-t">
      <Checkbox
        id="ph-dont-show-again"
        checked={dontShowAgain}
        onCheckedChange={(checked) => setDontShowAgain(checked === true)}
      />
      <label
        htmlFor="ph-dont-show-again"
        className="text-sm text-muted-foreground cursor-pointer"
      >
        Don't show this tour again
      </label>
    </div>
  </div>
);

const createTourSteps = (finalStepContent: React.ReactNode): Step[] => [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Welcome to Patient History! 📋</h3>
        <p className="text-sm text-muted-foreground">
          This page gives you a complete view of any patient's records — tests, bills, follow-ups, and activity.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="patient-search"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🔍 Find a Patient</h3>
        <p className="text-sm text-muted-foreground">
          Search by name, patient ID, or phone number to quickly find and select a patient.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="quick-stats"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📊 Quick Stats</h3>
        <p className="text-sm text-muted-foreground">
          View key metrics at a glance — total tests, pending payments, open follow-ups, and patient rating. Click any stat to jump to that tab.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ph-reports-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🔬 Reports Tab</h3>
        <p className="text-sm text-muted-foreground">
          View all test reports and uploaded documents for this patient. Download or preview reports directly.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ph-billing-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">💰 Billing Tab</h3>
        <p className="text-sm text-muted-foreground">
          Manage bills, track payments, and see outstanding amounts. Record new payments or print invoices.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ph-followups-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">⏰ Follow-ups Tab</h3>
        <p className="text-sm text-muted-foreground">
          Schedule and manage follow-up reminders. Mark them complete when done and track priority levels.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="quick-actions"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">⚡ Quick Actions</h3>
        <p className="text-sm text-muted-foreground">
          Add new test reports, create bills, or schedule follow-ups without leaving this page.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="export-pdf"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📥 Export History</h3>
        <p className="text-sm text-muted-foreground">
          Export a complete PDF summary of the patient's history including all reports, bills, and follow-ups.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: 'body',
    content: finalStepContent,
    placement: 'center',
  },
];

interface PatientHistoryTourProps {
  hasPatientSelected: boolean;
}

export const PatientHistoryTour = ({ hasPatientSelected }: PatientHistoryTourProps) => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Only start tour if patient is selected and tour hasn't been dismissed
    if (!hasPatientSelected) return;
    
    const permanentlyDismissed = localStorage.getItem(TOUR_PERMANENT_DISMISS_KEY);
    if (permanentlyDismissed) return;

    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasPatientSelected]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      if (dontShowAgain) {
        localStorage.setItem(TOUR_PERMANENT_DISMISS_KEY, 'true');
      }
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setRunTour(false);
      setStepIndex(0);
    }
  };

  const isDark = theme === 'dark';

  const tourSteps = createTourSteps(
    <FinalStepContent dontShowAgain={dontShowAgain} setDontShowAgain={setDontShowAgain} />
  );

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Got It!',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: isDark ? 'hsl(var(--card))' : 'white',
          textColor: isDark ? 'hsl(var(--card-foreground))' : 'hsl(222.2, 84%, 4.9%)',
          arrowColor: isDark ? 'hsl(var(--card))' : 'white',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 8,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(222.2, 84%, 4.9%)',
          marginRight: 8,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 13,
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
};

export default PatientHistoryTour;
