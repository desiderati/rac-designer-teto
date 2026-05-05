import type {CanvasDebugHandle} from '@/components/rac-editor/@canvas/ports/CanvasDebugHandle.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasEditorVisualHandle} from '@/components/rac-editor/@canvas/ports/CanvasEditorVisualHandle.ts';
import type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import type {CanvasControllerHandle} from '@/components/rac-editor/@canvas/ports/CanvasControllerHandle.ts';
import type {CanvasSurfaceResetHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';

/**
 * Capacidades do canvas efetivamente consumidas pela tela do RAC editor.
 */
export type CanvasHandle =
  & CanvasControllerHandle
  & CanvasHouseRuntimeHandle
  & CanvasDebugHandle
  & CanvasDocumentHandle
  & CanvasSnapshotHandle
  & CanvasEditorVisualHandle
  & CanvasSurfaceResetHandle;
