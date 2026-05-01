import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {getTutorialStepIds, TutorialStepId} from '@/components/rac-editor/lib/tutorial.ts';

interface UseTutorialFlowResult {
  tutorialStep: TutorialStepId | null;
  setTutorialStep: Dispatch<SetStateAction<TutorialStepId | null>>;
  tutorialHouseSelectorPreview: boolean;
  setTutorialHouseSelectorPreview: Dispatch<SetStateAction<boolean>>;
  advanceTutorial: (completedStep: TutorialStepId) => void;
  completeTutorial: () => void;
  restartTutorialProgress: () => void;
}

export function useTutorialFlow(onComplete?: () => void): UseTutorialFlowResult {
  const {tutorialProgressPort} = useEditorPorts();
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
  const [tutorialHouseSelectorPreview, setTutorialHouseSelectorPreview] = useState(false);

  useEffect(() => {
    if (!tutorialProgressPort.isTutorialCompleted()) {
      setTutorialStep('main-fab');
    }
  }, [tutorialProgressPort]);

  const completeTutorial = () => {
    setTutorialStep(null);
    setTutorialHouseSelectorPreview(false);
    tutorialProgressPort.markTutorialCompleted();
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
    tutorialProgressPort.resetTutorialProgress();
    setTutorialStep('main-fab');
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
