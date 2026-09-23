import {useRacEditorController} from '@/components/rac-editor/hooks/useRacEditorController.ts';
import {RacEditorLayout} from '@/components/rac-editor/ui/RacEditorLayout.tsx';
import {useHouse3DImageInsertion} from '@/contexts/House3DImageInsertionContext.tsx';
import {useEffect} from 'react';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';

export function RacEditorContent({
  onExit,
  onDocumentSaveStatusChange,
}: {
  onExit: () => void | Promise<void>;
  onDocumentSaveStatusChange?: (status: HouseDocumentSaveStatus) => void;
}) {
  const layoutProps = useRacEditorController({onExit});
  const {registerCanvasGetter} = useHouse3DImageInsertion();

  useEffect(() => registerCanvasGetter(() => layoutProps.canvas.canvasRef.current), [
    layoutProps.canvas.canvasRef,
    registerCanvasGetter,
  ]);

  useEffect(() => {
    onDocumentSaveStatusChange?.(layoutProps.menus.documentSaveStatus);
  }, [layoutProps.menus.documentSaveStatus, onDocumentSaveStatusChange]);

  return <RacEditorLayout {...layoutProps}/>;
}
