import {describe, expect, it, vi} from 'vitest';
import type {RefObject} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';
import {restartActiveHouseDrawing} from './restart-active-house-drawing.ts';

describe('restartActiveHouseDrawing', () => {
  it('reinicia a casa como nao designada antes de salvar o canvas vazio no historico', () => {
    const calls: string[] = [];
    const canvasRef: RefObject<CanvasHandle | null> = {
      current: {
        resetSurface: vi.fn(() => calls.push('reset-surface')),
      } as unknown as CanvasHandle,
    };
    const houseWritePort = {
      resetHouse: vi.fn(() => calls.push('reset-house')),
      setHouseType: vi.fn(() => calls.push('clear-house-type')),
    };
    const resetInsertionFlow = vi.fn(() => calls.push('reset-insertion-flow'));

    restartActiveHouseDrawing({canvasRef, houseWritePort, resetInsertionFlow});

    expect(calls).toEqual([
      'reset-house',
      'clear-house-type',
      'reset-insertion-flow',
      'reset-surface',
    ]);
    expect(houseWritePort.setHouseType).toHaveBeenCalledWith(null);
  });
});
