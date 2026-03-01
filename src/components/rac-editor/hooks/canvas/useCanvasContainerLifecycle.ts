import {Dispatch, MutableRefObject, SetStateAction, useEffect} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/components/rac-editor/lib/canvas';

interface UseCanvasContainerLifecycleArgs {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  setContainerSize: Dispatch<SetStateAction<{ width: number; height: number }>>;
  containerSize: { width: number; height: number };
  zoom: number;
  setViewportX: Dispatch<SetStateAction<number>>;
  setViewportY: Dispatch<SetStateAction<number>>;
}

export function useCanvasContainerLifecycle({
  containerRef,
  setContainerSize,
  containerSize,
  zoom,
  setViewportX,
  setViewportY,
}: UseCanvasContainerLifecycleArgs) {

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;

      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [containerRef, setContainerSize]);

  useEffect(() => {
    const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

    setViewportX((prev) => Math.max(0, Math.min(prev, maxX)));
    setViewportY((prev) => Math.max(0, Math.min(prev, maxY)));
  }, [containerSize, setViewportX, setViewportY, zoom]);
}
