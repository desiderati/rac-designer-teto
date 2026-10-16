interface ResizeObserverScheduler {
  schedule: () => void;
  cancel: () => void;
}

/**
 * ResizeObserver callbacks run during the browser's layout notification phase.
 * Deferring the resulting state/DOM work prevents feedback loops when the
 * callback itself changes a measured canvas or overlay.
 */
export function createResizeObserverScheduler(callback: () => void): ResizeObserverScheduler {
  let frameId: number | ReturnType<typeof setTimeout> | null = null;
  let cancelFrame: (() => void) | null = null;

  const flush = () => {
    frameId = null;
    cancelFrame = null;
    callback();
  };

  return {
    schedule: () => {
      if (frameId !== null) return;

      if (typeof globalThis.requestAnimationFrame === 'function') {
        const id = globalThis.requestAnimationFrame(flush);
        frameId = id;
        cancelFrame = () => globalThis.cancelAnimationFrame(id);
        return;
      }

      const id = globalThis.setTimeout(flush, 0);
      frameId = id;
      cancelFrame = () => globalThis.clearTimeout(id);
    },
    cancel: () => {
      if (frameId === null) return;
      cancelFrame?.();
      frameId = null;
      cancelFrame = null;
    },
  };
}
