import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {queueCompletedFreehandTip, RAC_CANVAS_OBJECT_INSERTED_EVENT} from './canvas-object-dom-events.ts';

describe('dica de cor do desenho livre', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('só emite a dica depois do evento de conclusão do traço', () => {
    const listener = vi.fn();
    document.addEventListener(RAC_CANVAS_OBJECT_INSERTED_EVENT, listener as EventListener);
    try {
      queueCompletedFreehandTip(
        {left: 10, top: 20, width: 40, height: 30},
        ({x, y}) => ({x: x + 100, y: y + 200}),
      );
      expect(listener).not.toHaveBeenCalled();
      vi.runOnlyPendingTimers();
      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
        kind: 'freehand', rect: {left: 110, top: 220, width: 40, height: 30},
      });
    } finally {
      document.removeEventListener(RAC_CANVAS_OBJECT_INSERTED_EVENT, listener as EventListener);
    }
  });
});
