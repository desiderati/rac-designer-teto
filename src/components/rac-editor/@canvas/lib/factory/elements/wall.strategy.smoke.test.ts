import {describe, expect, it} from 'vitest';
import {
  normalizeWallCanvasGroupToSize,
  toPastelWallFill,
  wallStrategy,
  WALL_STROKE_DASH_ARRAY,
} from './wall.strategy.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';

function createChild(initial: Record<string, unknown>) {
  const child = {
    ...initial,
    set(patch: Record<string, unknown>) {
      Object.assign(child, patch);
    },
  };

  return child;
}

describe('wall.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof wallStrategy.create).toBe('function');
  });

  it('calcula preenchimento pastel a partir da cor da borda', () => {
    expect(toPastelWallFill('#ff0000')).toBe('rgb(255, 189, 189)');
    expect(toPastelWallFill('#0f0')).toBe('rgb(189, 255, 189)');
  });

  it('normaliza resize diagonal sem redimensionar texto nem alterar tracejado', () => {
    const body = createChild({
      myType: 'wallBody',
      width: 200,
      height: 50,
      strokeDashArray: [2, 2],
      strokeUniform: false,
      scaleX: 2,
      scaleY: 3,
    });
    const label = createChild({
      myType: 'wallLabel',
      fontSize: 40,
      scaleX: 2,
      scaleY: 2,
    });
    const group = {
      getCanvasObjects: () => [body, label],
      set(patch: Record<string, unknown>) {
        Object.assign(group, patch);
      },
    } as unknown as CanvasGroup;

    normalizeWallCanvasGroupToSize(group, 320, 90);

    expect(body).toEqual(expect.objectContaining({
      width: 320,
      height: 90,
      scaleX: 1,
      scaleY: 1,
      strokeDashArray: [...WALL_STROKE_DASH_ARRAY],
      strokeUniform: true,
    }));
    expect(label).toEqual(expect.objectContaining({
      fontSize: 15,
      scaleX: 1,
      scaleY: 1,
    }));
    expect(group).toEqual(expect.objectContaining({
      width: 320,
      height: 90,
      scaleX: 1,
      scaleY: 1,
    }));
  });
});

