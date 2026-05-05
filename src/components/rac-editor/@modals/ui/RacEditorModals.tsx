import {SettingsModal} from '@/components/rac-editor/@modals/ui/SettingsModal.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';

interface RacEditorOverlaysProps {
  isMobile: boolean;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsChange: () => void;
  showRestartConfirm: boolean;
  onConfirmRestartDrawing: () => void;
  onCloseRestartConfirm: () => void;
}

export function RacEditorModals({
  isMobile,
  isSettingsOpen,
  onSettingsOpenChange,
  onSettingsChange,
  showRestartConfirm,
  onConfirmRestartDrawing,
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
        description='Isso irá limpar todo o conteúdo do canvas. Deseja continuar?'
        confirmLabel='Confirmar'
        handleConfirm={onConfirmRestartDrawing}
        handleCancel={onCloseRestartConfirm}
      />
    </>
  );
}
