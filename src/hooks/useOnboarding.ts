import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const { profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if profile exists and onboarding not completed
    if (profile && !profile.onboarding_completed) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const openOnboarding = () => setShowOnboarding(true);
  const closeOnboarding = () => setShowOnboarding(false);

  return {
    showOnboarding,
    openOnboarding,
    closeOnboarding,
    isOnboardingCompleted: profile?.onboarding_completed ?? false
  };
};
