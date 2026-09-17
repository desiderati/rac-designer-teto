import type {CanvasSnapshotPort} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotPort.ts';

/**
 * Capacidade de inserir snapshots visuais externos no canvas.
 */
export interface CanvasSnapshotHandle {
  createSnapshotPort(): CanvasSnapshotPort | null;
}
