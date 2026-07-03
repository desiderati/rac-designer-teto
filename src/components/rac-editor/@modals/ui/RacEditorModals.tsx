import {SettingsModal} from '@/components/rac-editor/@modals/ui/SettingsModal.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';
import {ImageUploadModal} from '@/components/rac-editor/@modals/ui/ImageUploadModal.tsx';
import {RacPdfExportChecklistModal} from '@/components/rac-editor/@modals/ui/RacPdfExportChecklistModal.tsx';
import type {RacPdfExportChecklist} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';

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
  pdfExportChecklist: RacPdfExportChecklist | null;
  isPdfExportChecklistOpen: boolean;
  isPdfExporting: boolean;
  onConfirmPdfExport: () => void;
  onCancelPdfExport: () => void;
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
  pdfExportChecklist,
  isPdfExportChecklistOpen,
  isPdfExporting,
  onConfirmPdfExport,
  onCancelPdfExport,
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

      <RacPdfExportChecklistModal
        isMobile={isMobile}
        isOpen={isPdfExportChecklistOpen}
        checklist={pdfExportChecklist}
        isExporting={isPdfExporting}
        onConfirm={onConfirmPdfExport}
        onCancel={onCancelPdfExport}
      />
    </>
  );
}
