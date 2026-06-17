import {SettingsModal} from '@/components/rac-editor/@modals/ui/SettingsModal.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';
import {ImageUploadModal} from '@/components/rac-editor/@modals/ui/ImageUploadModal.tsx';

interface RacEditorOverlaysProps {
  isMobile: boolean;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onSettingsChange: () => void;
  isImageUploadOpen: boolean;
  onImageUploadOpenChange: (open: boolean) => void;
  onInsertUploadedImage: (dataUrl: string) => Promise<boolean> | boolean;
  showRestartConfirm: boolean;
  onConfirmRestartDrawing: () => void;
  onCloseRestartConfirm: () => void;
}

export function RacEditorModals({
  isMobile,
  isSettingsOpen,
  onSettingsOpenChange,
  onSettingsChange,
  isImageUploadOpen,
  onImageUploadOpenChange,
  onInsertUploadedImage,
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

      <ImageUploadModal
        isMobile={isMobile}
        isOpen={isImageUploadOpen}
        onOpenChange={onImageUploadOpenChange}
        onInsertImage={onInsertUploadedImage}
      />

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
