import {Dispatch, MutableRefObject, SetStateAction, useEffect, useRef} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {createResizeObserverScheduler} from '@/shared/lib/resize-observer-scheduler.ts';

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
  const lastSizeRef = useRef<{width: number; height: number} | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;

      const nextSize = {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      };
      const previousSize = lastSizeRef.current;
      if (previousSize?.width === nextSize.width && previousSize.height === nextSize.height) return;
      lastSizeRef.current = nextSize;
      setContainerSize((currentSize) =>
        currentSize.width === nextSize.width && currentSize.height === nextSize.height
          ? currentSize
          : nextSize,
      );
    };

    updateSize();
    const scheduler = createResizeObserverScheduler(updateSize);
    const resizeObserver = new ResizeObserver(scheduler.schedule);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      scheduler.cancel();
    };
  }, [containerRef, setContainerSize]);

  useEffect(() => {
    const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

    setViewportX((prev) => Math.max(0, Math.min(prev, maxX)));
    setViewportY((prev) => Math.max(0, Math.min(prev, maxY)));
  }, [containerSize, setViewportX, setViewportY, zoom]);
}
