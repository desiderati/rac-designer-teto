import {SettingsModal} from '@/components/rac-editor/ui/modals/SettingsModal.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';

interface RacEditorOverlaysProps {
  isMobile: boolean;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsChange: () => void;
  showRestartConfirm: boolean;
  onConfirmRestartTutorial: () => void;
  onCloseRestartConfirm: () => void;
  showUngroupConfirm: boolean;
  onConfirmUngroup: () => void;
  onCloseUngroupConfirm: () => void;
}

export function RacEditorModals({
  isMobile,
  isSettingsOpen,
  onSettingsOpenChange,
  onSettingsChange,
  showRestartConfirm,
  onConfirmRestartTutorial,
  onCloseRestartConfirm,
  showUngroupConfirm,
  onConfirmUngroup,
  onCloseUngroupConfirm,
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

      <ConfirmDialogModal
        isMobile={isMobile}
        isOpen={showUngroupConfirm}
        title='Desagrupar Casa'
        description='Ao desagrupar a casa, ela perderá a funcionalidade de edição de pilotis e se tornará apenas um conjunto de formas sem funcionalidades especiais. Deseja continuar?'
        confirmLabel='Desagrupar'
        handleConfirm={onConfirmUngroup}
        handleCancel={onCloseUngroupConfirm}
      />
    </>
  );
}
