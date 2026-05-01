import {lazy, Suspense} from 'react';
import type {RefObject} from 'react';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';

const LazyHouse3DViewer = lazy(async () => {
  const module = await import('@/components/rac-editor/@viewer-3d/ui/House3DViewer.tsx');
  return {default: module.House3DViewer};
});

interface RacEditor3DViewerOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
}

export function House3DViewerOverlay({open, onOpenChange, canvasRef}: RacEditor3DViewerOverlayProps) {
  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <LazyHouse3DViewer
        open={open}
        onOpenChange={onOpenChange}
        canvasRef={canvasRef}
      />
    </Suspense>
  );
}
