import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'labflow_onboarding_completed';
const TOUR_PERMANENT_DISMISS_KEY = 'labflow_onboarding_dismissed';
const TOUR_AUTO_COUNT_KEY = 'labflow_onboarding_auto_show_count';
const TOUR_AUTO_SESSION_KEY = 'labflow_onboarding_auto_started_session';
const MAX_AUTO_SHOWS = 3;

export const useOnboardingTour = () => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour has been permanently dismissed
    const permanentlyDismissed = localStorage.getItem(TOUR_PERMANENT_DISMISS_KEY);
    if (permanentlyDismissed) return;

    // Check if tour has been completed before (session-based)
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const autoShowCount = Number(localStorage.getItem(TOUR_AUTO_COUNT_KEY) || '0');
    if (!tourCompleted && autoShowCount < MAX_AUTO_SHOWS && !sessionStorage.getItem(TOUR_AUTO_SESSION_KEY)) {
      sessionStorage.setItem(TOUR_AUTO_SESSION_KEY, 'true');
      // Delay tour start to let the page render
      const timer = setTimeout(() => {
        const latestCount = Number(localStorage.getItem(TOUR_AUTO_COUNT_KEY) || '0');
        sessionStorage.removeItem(TOUR_AUTO_SESSION_KEY);
        if (latestCount >= MAX_AUTO_SHOWS) return;
        localStorage.setItem(TOUR_AUTO_COUNT_KEY, String(latestCount + 1));
        if (latestCount + 1 >= MAX_AUTO_SHOWS) {
          localStorage.setItem(TOUR_PERMANENT_DISMISS_KEY, 'true');
        }
        setRunTour(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        sessionStorage.removeItem(TOUR_AUTO_SESSION_KEY);
      };
    }
  }, []);

  useEffect(() => {
    const handleManualReset = () => {
      setStepIndex(0);
      setRunTour(true);
    };
    window.addEventListener('labflow:reset-onboarding-tour', handleManualReset);
    return () => window.removeEventListener('labflow:reset-onboarding-tour', handleManualReset);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setRunTour(false);
    setStepIndex(0);
  }, []);

  const permanentlyDismiss = useCallback(() => {
    localStorage.setItem(TOUR_PERMANENT_DISMISS_KEY, 'true');
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setRunTour(false);
    setStepIndex(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(TOUR_PERMANENT_DISMISS_KEY);
    setStepIndex(0);
    setRunTour(true);
    window.dispatchEvent(new Event('labflow:reset-onboarding-tour'));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const isTourDismissed = useCallback(() => {
    return localStorage.getItem(TOUR_PERMANENT_DISMISS_KEY) === 'true';
  }, []);

  return {
    runTour,
    setRunTour,
    stepIndex,
    setStepIndex,
    completeTour,
    permanentlyDismiss,
    resetTour,
    skipTour,
    isTourDismissed,
  };
};
