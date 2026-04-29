import {SettingsModal} from '@/components/rac-editor/modals/ui/SettingsModal.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/modals/ui/ConfirmDialogModal.tsx';

interface RacEditorOverlaysProps {
  isMobile: boolean;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsChange: () => void;
  showRestartConfirm: boolean;
  onConfirmRestartTutorial: () => void;
  onCloseRestartConfirm: () => void;
}

export function RacEditorModals({
  isMobile,
  isSettingsOpen,
  onSettingsOpenChange,
  onSettingsChange,
  showRestartConfirm,
  onConfirmRestartTutorial,
  onCloseRestartConfirm,
}: RacEditorOverlaysProps) {
  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={onSettingsOpenChange}
        onSettingsChange={onSettingsChange}/>

      <ConfirmDialogModal
        isMobile={isMobile}
        isOpen={showRestartConfirm}
        title='Reiniciar Canvas'
        description='Isso irá limpar todo o conteúdo do canvas e iniciar o tutorial novamente. Deseja continuar?'
        confirmLabel='Confirmar'
        handleConfirm={onConfirmRestartTutorial}
        handleCancel={onCloseRestartConfirm}
      />
    </>
  );
}
