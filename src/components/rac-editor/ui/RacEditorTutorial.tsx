import {Tutorial} from '@/components/rac-editor/ui/tutorial/Tutorial.tsx';
import {TutorialBalloon} from '@/components/rac-editor/ui/tutorial/TutorialBalloon.tsx';

interface RacEditorTutorialProps {
  tutorialStep: string | null;
  onTutorialComplete: () => void;
  tutorialPilotiPosition: { x: number; y: number } | null;
  onCloseTutorialPiloti: () => void;
  tutorialBalloon: {
    position: { x: number; y: number };
    text: string;
  } | null;
  onCloseTutorialBalloon: () => void;
}

export function RacEditorTutorial({
  tutorialStep,
  onTutorialComplete,
  tutorialPilotiPosition,
  onCloseTutorialPiloti,
  tutorialBalloon,
  onCloseTutorialBalloon,
}: RacEditorTutorialProps) {
  return (
    <>
      {tutorialStep &&
        <Tutorial
          currentStepId={tutorialStep}
          onComplete={onTutorialComplete}/>
      }

      {tutorialPilotiPosition &&
        <TutorialBalloon
          position={tutorialPilotiPosition}
          text={'Clique duas vezes para alterar a altura do Piloti.'}
          onClose={onCloseTutorialPiloti}/>
      }

      {tutorialBalloon &&
        <TutorialBalloon
          position={tutorialBalloon.position}
          text={tutorialBalloon.text}
          onClose={onCloseTutorialBalloon}/>
      }
    </>
  );
}
