import {describe, expect, it, vi} from 'vitest';
import type {IText} from 'fabric';
import {getGenericObjectEditorStrategy} from '../../generic-object-editor-strategy.ts';
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
      text: 'Vizinho',
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
      top: 63,
    }));
    expect(group).toEqual(expect.objectContaining({
      width: 320,
      height: 90,
      scaleX: 1,
      scaleY: 1,
    }));
  });

  it('não reserva uma faixa externa quando o muro está sem texto', () => {
    const wall = wallStrategy.create({width: 800, height: 600} as any);
    const children = wall.getObjects();
    const body = children.find((child) => child.myType === 'wallBody');
    const label = children.find((child) => child.myType === 'wallLabel');
    expect(body).toBeDefined();
    expect(label).toBeDefined();
    expect(label?.visible).toBe(false);
    expect(wall.height).toBeCloseTo(body!.getScaledHeight());
  });

  it.each(['', 'Vizinho'])('mantém os tijolos cobrindo o corpo após redimensionamentos com texto "%s"', (text) => {
    const wall = wallStrategy.create({width: 800, height: 600} as any) as CanvasGroup;
    getGenericObjectEditorStrategy('wall').apply({canvas: {requestRenderAll: vi.fn()} as any, object: wall, color: '#a85f43', label: text});
    const body = wall.getCanvasObjects().find((child) => child.myType === 'wallBody')!;
    const bricks = wall.getCanvasObjects().filter((child) => child.myType === 'wallBrick');
    const label = wall.getCanvasObjects().find((child) => child.myType === 'wallLabel') as IText;
    // Simula uma faixa produzida e salva pela versão anterior.
    body.set({height: 90});
    for (const [scaleX, scaleY] of [[1.537, 2], [0.813, 0.751], [1.21, 1.413]]) {
      const previousWidth = body.width;
      const previousHeight = body.height;
      wall.set({scaleX, scaleY});
      const bodyCenter = body.getCenterPoint();
      wall.fire('scaling');
      expect(body.width).toBeCloseTo(previousWidth * scaleX);
      expect(body.height).toBeCloseTo(previousHeight * scaleY);
      expect(body.getCenterPoint().x).toBeCloseTo(bodyCenter.x);
      expect(body.getCenterPoint().y).toBeCloseTo(bodyCenter.y);
      expect(Math.min(...bricks.map((brick) => (brick.top - body.top) / body.height))).toBeCloseTo(-1 / 3);
      expect(Math.max(...bricks.map((brick) => (brick.top - body.top) / body.height))).toBeCloseTo(1 / 3);
      expect(bricks[0].height).toBeCloseTo(body.height / 3 - 2);
      expect(label.visible).toBe(Boolean(text));
      if (text) expect(label.top - body.top).toBeCloseTo(body.height / 2 + 18);
      else expect(wall.height).toBeCloseTo(body.getScaledHeight());
    }
    getGenericObjectEditorStrategy('wall').apply({canvas: {requestRenderAll: vi.fn()} as any, object: wall, color: '#a85f43', label: ''});
    expect(wall.height).toBeCloseTo(body.getScaledHeight());
  });
});

