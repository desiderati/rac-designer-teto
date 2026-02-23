import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {getTutorialStepIds} from "@/components/rac-editor/Tutorial";
import {
  isTutorialCompleted,
  markTutorialCompleted,
  resetTutorialProgress,
} from "@/lib/persistence/tutorial-storage";

export type TutorialStepId = "main-fab" | "house" | "elements" | "zoom-minimap" | "more-options";

interface UseRacTutorialFlowResult {
  tutorialStep: TutorialStepId | null;
  setTutorialStep: Dispatch<SetStateAction<TutorialStepId | null>>;
  tutorialHouseSelectorPreview: boolean;
  setTutorialHouseSelectorPreview: Dispatch<SetStateAction<boolean>>;
  advanceTutorial: (completedStep: TutorialStepId) => void;
  completeTutorial: () => void;
  restartTutorialProgress: () => void;
}

export function useRacTutorialFlow(onComplete?: () => void): UseRacTutorialFlowResult {
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
  const [tutorialHouseSelectorPreview, setTutorialHouseSelectorPreview] = useState(false);

  useEffect(() => {
    if (!isTutorialCompleted()) {
      setTutorialStep("main-fab");
    }
  }, []);

  const completeTutorial = () => {
    setTutorialStep(null);
    setTutorialHouseSelectorPreview(false);
    markTutorialCompleted();
    onComplete?.();
  };

  const advanceTutorial = (completedStep: TutorialStepId) => {
    const steps = getTutorialStepIds() as TutorialStepId[];
    const currentIndex = steps.indexOf(completedStep);
    if (currentIndex < steps.length - 1) {
      setTutorialStep(steps[currentIndex + 1]);
      return;
    }

    completeTutorial();
  };

  const restartTutorialProgress = () => {
    resetTutorialProgress();
    setTutorialStep("main-fab");
    setTutorialHouseSelectorPreview(false);
  };

  return {
    tutorialStep,
    setTutorialStep,
    tutorialHouseSelectorPreview,
    setTutorialHouseSelectorPreview,
    advanceTutorial,
    completeTutorial,
    restartTutorialProgress,
  };
}
