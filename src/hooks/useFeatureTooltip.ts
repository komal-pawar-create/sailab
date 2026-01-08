import { useState, useEffect, useCallback } from 'react';

const FEATURE_USAGE_KEY = 'lab-master-feature-usage';

interface FeatureUsage {
  [key: string]: boolean;
}

export const useFeatureTooltip = (featureKey: string) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(FEATURE_USAGE_KEY);
    const usage: FeatureUsage = stored ? JSON.parse(stored) : {};
    const seen = usage[featureKey] === true;
    setHasBeenSeen(seen);
    
    // Show tooltip only if feature hasn't been seen
    if (!seen) {
      // Small delay to let the component mount
      const timer = setTimeout(() => setShowTooltip(true), 500);
      return () => clearTimeout(timer);
    }
  }, [featureKey]);

  const markAsSeen = useCallback(() => {
    const stored = localStorage.getItem(FEATURE_USAGE_KEY);
    const usage: FeatureUsage = stored ? JSON.parse(stored) : {};
    usage[featureKey] = true;
    localStorage.setItem(FEATURE_USAGE_KEY, JSON.stringify(usage));
    setHasBeenSeen(true);
    setShowTooltip(false);
  }, [featureKey]);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    markAsSeen();
  }, [markAsSeen]);

  return {
    showTooltip,
    hasBeenSeen,
    markAsSeen,
    dismissTooltip,
  };
};

// Utility to reset all feature tooltips (for testing/settings)
export const resetFeatureTooltips = () => {
  localStorage.removeItem(FEATURE_USAGE_KEY);
};

// Utility to check if any feature tooltips are pending
export const hasUnseenFeatures = (): boolean => {
  const stored = localStorage.getItem(FEATURE_USAGE_KEY);
  return !stored || Object.keys(JSON.parse(stored)).length === 0;
};
