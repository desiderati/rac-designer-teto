import {afterEach, describe, expect, it, vi} from 'vitest';
import {createResizeObserverScheduler} from './resize-observer-scheduler.ts';

describe('resize-observer-scheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesce notificações no mesmo frame', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = createResizeObserverScheduler(callback);

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();
    expect(callback).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);

    scheduler.schedule();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('cancela a atualização pendente ao desmontar', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = createResizeObserverScheduler(callback);

    scheduler.schedule();
    scheduler.cancel();
    vi.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });
});
