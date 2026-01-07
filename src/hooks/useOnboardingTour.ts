import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'labmaster_onboarding_completed';

export const useOnboardingTour = () => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour has been completed before
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      // Delay tour start to let the page render
      const timer = setTimeout(() => setRunTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setRunTour(false);
    setStepIndex(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setStepIndex(0);
    setRunTour(true);
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return {
    runTour,
    setRunTour,
    stepIndex,
    setStepIndex,
    completeTour,
    resetTour,
    skipTour,
  };
};
