import {lazy, Suspense} from 'react';

const LazyHouse3DViewer = lazy(async () => {
  const module = await import('@/components/rac-editor/viewer3d/ui/House3DViewer.tsx');
  return {default: module.House3DViewer};
});

interface RacEditor3DViewerOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RacEditor3DViewerOverlay({open, onOpenChange}: RacEditor3DViewerOverlayProps) {
  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <LazyHouse3DViewer
        open={open}
        onOpenChange={onOpenChange}
      />
    </Suspense>
  );
}
