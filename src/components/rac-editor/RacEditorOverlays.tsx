import {HouseType} from '@/lib/house-manager';
import {House3DViewer} from './House3DViewer';
import {Tutorial} from './Tutorial';
import {PilotiTutorialBalloon} from './PilotiTutorialBalloon';
import {OnboardingBalloon} from './OnboardingBalloon';
import {HouseTypeSelector} from './modals/selectors/HouseTypeSelector.tsx';
import {SettingsModal} from './modals/SettingsModal.tsx';
import {ConfirmDialogModal} from './modals/ConfirmDialogModal.tsx';
import {NivelDefinition, NivelDefinitionEditor} from './modals/editors/NivelDefinitionEditor.tsx';

interface RacEditorOverlaysProps {
  isMobile: boolean;
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
  tutorialHouseSelectorPreview: boolean;
  is3DViewerOpen: boolean;
  on3DViewerOpenChange: (open: boolean) => void;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsChange: () => void;
  tutorialStep: string | null;
  onTutorialComplete: () => void;
  pilotiTutorialPosition: { x: number; y: number } | null;
  onClosePilotiTutorial: () => void;
  onboardingBalloon: {
    position: { x: number; y: number };
    text: string;
  } | null;
  onCloseOnboardingBalloon: () => void;
  showRestartConfirm: boolean;
  onConfirmRestartTutorial: () => void;
  onCloseRestartConfirm: () => void;
  showUngroupConfirm: boolean;
  onConfirmUngroup: () => void;
  onCloseUngroupConfirm: () => void;
  nivelDefinitionOpen: boolean;
  onCloseNivelDefinition: () => void;
  onApplyNiveis: (niveis: Record<string, NivelDefinition>) => void;
  pilotiData: Record<string, { height: number; isMaster: boolean; nivel: number; }>;
}

export function RacEditorOverlays({
  isMobile,
  houseTypeSelectorOpen,
  onHouseTypeSelectorClose,
  onHouseTypeSelected,
  tutorialHouseSelectorPreview,
  is3DViewerOpen,
  on3DViewerOpenChange,
  isSettingsOpen,
  onSettingsOpenChange,
  onSettingsChange,
  tutorialStep,
  onTutorialComplete,
  pilotiTutorialPosition,
  onClosePilotiTutorial,
  onboardingBalloon,
  onCloseOnboardingBalloon,
  showRestartConfirm,
  onConfirmRestartTutorial,
  onCloseRestartConfirm,
  showUngroupConfirm,
  onConfirmUngroup,
  onCloseUngroupConfirm,
  nivelDefinitionOpen,
  onCloseNivelDefinition,
  onApplyNiveis,
  pilotiData,
}: RacEditorOverlaysProps) {
  return (
    <>
      <HouseTypeSelector
        isOpen={houseTypeSelectorOpen}
        onClose={onHouseTypeSelectorClose}
        onSelectType={onHouseTypeSelected}
        tutorialLocked={tutorialHouseSelectorPreview}/>

      <House3DViewer
        open={is3DViewerOpen}
        onOpenChange={on3DViewerOpenChange}/>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={onSettingsOpenChange}
        onSettingsChange={onSettingsChange}/>

      {tutorialStep &&
        <Tutorial
          onComplete={onTutorialComplete}
          currentStepId={tutorialStep}/>
      }

      {pilotiTutorialPosition &&
        <PilotiTutorialBalloon
          position={pilotiTutorialPosition}
          onClose={onClosePilotiTutorial}/>
      }

      {onboardingBalloon &&
        <OnboardingBalloon
          position={onboardingBalloon.position}
          text={onboardingBalloon.text}
          onClose={onCloseOnboardingBalloon}/>
      }

      <ConfirmDialogModal
        isMobile={isMobile}
        isOpen={showRestartConfirm}
        title="Reiniciar Canvas"
        description="Isso irá limpar todo o conteúdo do canvas e iniciar o tutorial novamente. Deseja continuar?"
        confirmLabel="Confirmar"
        onConfirm={onConfirmRestartTutorial}
        onRequestClose={onCloseRestartConfirm}
      />

      <ConfirmDialogModal
        isMobile={isMobile}
        isOpen={showUngroupConfirm}
        title="Desagrupar Casa"
        description="Ao desagrupar a casa, ela perderá a funcionalidade de edição de pilotis e se tornará apenas um conjunto de formas sem funcionalidades especiais. Deseja continuar?"
        confirmLabel="Desagrupar"
        onConfirm={onConfirmUngroup}
        onRequestClose={onCloseUngroupConfirm}
      />

      <NivelDefinitionEditor
        isOpen={nivelDefinitionOpen}
        onClose={onCloseNivelDefinition}
        onApply={onApplyNiveis}
        pilotiData={pilotiData}/>
    </>
  );
}
