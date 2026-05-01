import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {
  CanvasActiveSelectionHandle,
  CanvasDrawingModeHandle,
  CanvasRenderHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';

/**
 * Capacidades exigidas pelos controladores de fluxo do canvas.
 */
export type CanvasControllerHandle =
  & CanvasActiveSelectionHandle
  & CanvasDrawingModeHandle
  & CanvasHistoryHandle
  & CanvasObjectCreationHandle
  & CanvasRenderHandle
  & CanvasScreenProjectionHandle
  & CanvasViewportHandle;
