import { useCallback, useEffect, useState } from 'react';
import TUTORIAL_STEPS from '../components/tutorial/tutorialSteps';

const STORAGE_KEY = 'sampleTutorialCompleted';

export default function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const stepConfig = TUTORIAL_STEPS[currentStep] || null;

  return {
    isActive,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    stepConfig,
    startTour,
    endTour,
    nextStep,
    prevStep,
  };
}
