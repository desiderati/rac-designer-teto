import type {CanvasDebugHandle} from '@/components/rac-editor/@canvas/ports/CanvasDebugHandle.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasEditorVisualHandle} from '@/components/rac-editor/@canvas/ports/CanvasEditorVisualHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import type {CanvasSurfaceHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';

export type {CanvasDebugHandle} from '@/components/rac-editor/@canvas/ports/CanvasDebugHandle.ts';
export type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
export type {CanvasEditorVisualHandle} from '@/components/rac-editor/@canvas/ports/CanvasEditorVisualHandle.ts';
export type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
export type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
export type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
export type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
export type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
export type {
  CanvasActiveSelectionHandle,
  CanvasDrawingModeHandle,
  CanvasRenderHandle,
  CanvasSurfaceHandle,
  CanvasSurfaceResetHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
export type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';

/**
 * Porta imperativa completa exposta pelo canvas.
 *
 * Este tipo permanece como composição transitória para o `forwardRef` do canvas.
 * Consumidores novos devem depender das capacidades menores acima.
 */
export interface CanvasInteractionPort
  extends CanvasHouseRuntimeHandle,
    CanvasDocumentHandle,
    CanvasDebugHandle,
    CanvasSnapshotHandle,
    CanvasHistoryHandle,
    CanvasObjectCreationHandle,
    CanvasSurfaceHandle,
    CanvasScreenProjectionHandle,
    CanvasEditorVisualHandle,
    CanvasViewportHandle {
}

export type CanvasHandle = CanvasInteractionPort;
