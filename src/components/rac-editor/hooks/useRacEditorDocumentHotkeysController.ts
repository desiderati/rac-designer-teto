import {useRacEditorDocumentActions} from '@/components/rac-editor/hooks/useRacEditorDocumentActions.ts';
import {useRacEditorHotkeys} from '@/components/rac-editor/hooks/useRacEditorHotkeys.ts';

type DocumentActionsArgs = Parameters<typeof useRacEditorDocumentActions>[0];
type HotkeysArgs = Parameters<typeof useRacEditorHotkeys>[0];

type UseRacEditorDocumentHotkeysControllerArgs = DocumentActionsArgs & HotkeysArgs;

/**
 * Agrupa comandos de documentos e atalhos globais do editor.
 */
export function useRacEditorDocumentHotkeysController({
  canvasRef,
  onToggleDrawMode,
  onToggleZoomControls,
  onSetCanvasToolMode,
  onFitToView,
}: UseRacEditorDocumentHotkeysControllerArgs) {
  const actions = useRacEditorDocumentActions({
    canvasRef,
  });

  useRacEditorHotkeys({
    onToggleDrawMode,
    onToggleZoomControls,
    onSetCanvasToolMode,
    onFitToView,
  });

  return actions;
}
