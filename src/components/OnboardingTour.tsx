import { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, EVENTS, ACTIONS } from 'react-joyride';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useTheme } from 'next-themes';
import { Checkbox } from '@/components/ui/checkbox';

interface FinalStepContentProps {
  dontShowAgain: boolean;
  setDontShowAgain: (value: boolean) => void;
}

const FinalStepContent = ({ dontShowAgain, setDontShowAgain }: FinalStepContentProps) => (
  <div className="text-center">
    <h3 className="text-lg font-semibold mb-2">You're All Set! 🚀</h3>
    <p className="text-sm text-muted-foreground mb-3">
      You now know the basics of Lab Master. Start by adding your first patient!
    </p>
    <p className="text-xs text-muted-foreground mb-4">
      Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded">?</kbd> anytime to see all keyboard shortcuts.
    </p>
    <div className="flex items-center justify-center gap-2 pt-2 border-t">
      <Checkbox
        id="dont-show-again"
        checked={dontShowAgain}
        onCheckedChange={(checked) => setDontShowAgain(checked === true)}
      />
      <label
        htmlFor="dont-show-again"
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
        <h3 className="text-lg font-semibold mb-2">Welcome to Lab Master! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          Let us show you around the key features to help you get started managing your lab efficiently.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="stats-row"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📊 Dashboard Stats</h3>
        <p className="text-sm text-muted-foreground">
          View your key metrics at a glance — patients registered, tests completed, pending bills, and more.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="time-filter"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📅 Time Period Filter</h3>
        <p className="text-sm text-muted-foreground">
          Filter all dashboard data by time period — today, this week, this month, or view all records.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="add-patient"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">👤 Add New Patient</h3>
        <p className="text-sm text-muted-foreground">
          Click here to register a new patient. You can also use the keyboard shortcut <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt+P</kbd>.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="patients-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📋 Patients List</h3>
        <p className="text-sm text-muted-foreground">
          View all registered patients here. From each row, you can view history, add reports, or create bills.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="reports-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🔬 Test Reports</h3>
        <p className="text-sm text-muted-foreground">
          Manage test reports from this tab. Upload results, track status, and download completed reports.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="bills-tab"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">💰 Bills & Payments</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage bills here. Track pending amounts and record payments from patients.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="command-palette"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">⌨️ Quick Actions</h3>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd> to open the command palette for quick navigation and actions.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📁 Navigation</h3>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to navigate between Dashboard, Patient History, Reports, Settings, and more.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: 'body',
    content: finalStepContent,
    placement: 'center',
  },
];

interface OnboardingTourProps {
  onRestart?: () => void;
}

export const OnboardingTour = ({ onRestart }: OnboardingTourProps) => {
  const { runTour, setRunTour, stepIndex, setStepIndex, completeTour, permanentlyDismiss } = useOnboardingTour();
  const { theme } = useTheme();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const tourSteps = createTourSteps(
    <FinalStepContent dontShowAgain={dontShowAgain} setDontShowAgain={setDontShowAgain} />
  );

  const handleCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      if (dontShowAgain) {
        permanentlyDismiss();
      } else {
        completeTour();
      }
    }
  };

  const isDark = theme === 'dark';

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
        last: 'Get Started',
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

export default OnboardingTour;
