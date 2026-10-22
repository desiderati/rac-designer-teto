import {afterEach, describe, expect, it, vi} from 'vitest';
import {calculateGuidedTourLayout} from '@/components/guided-tour/lib/guided-tour-position.ts';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('guided-tour-position', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['Status da Casa', [610.78125, 317.5, 60.21875, 24], 226.75],
    ['Dificuldade', [525.140625, 183.5, 133.859375, 8], 188.25],
    ['Materiais Extras', [169, 228.5, 98, 54], 207.5],
    ['Exportar RAC PDF', [269, 228.5, 98, 54], 188.25],
    ['Casa Construída', [369, 228.5, 98, 54], 207.5],
    ['Arquivar Casa', [469, 228.5, 98, 54], 207.5],
  ] as const)('não encobre o destaque de %s em 736×375 e aponta a seta para o alvo', (_title, bounds, height) => {
    vi.stubGlobal('innerWidth', 736);
    vi.stubGlobal('innerHeight', 375);
    const target = rect(bounds[0], bounds[1], bounds[2], bounds[3]);
    const layout = calculateGuidedTourLayout({
      targetRect: target,
      balloonSize: {width: 240, height},
      placement: 'bottom',
      alignment: 'center',
    });
    const left = Number(layout.balloonStyle.left);
    const top = Number(layout.balloonStyle.top);
    const right = left + 240;
    const bottom = top + height;
    expect(left).toBeGreaterThanOrEqual(12);
    expect(top).toBeGreaterThanOrEqual(12);
    expect(right).toBeLessThanOrEqual(724);
    expect(bottom).toBeLessThanOrEqual(363);
    const overlapsHighlight = left < target.right + 6 && right > target.left - 6
      && top < target.bottom + 6 && bottom > target.top - 6;
    expect(overlapsHighlight).toBe(false);
    if (bottom <= target.top - 6) expect(layout.arrowStyle).toHaveProperty('bottom', -8);
    else if (right <= target.left - 6) expect(layout.arrowStyle).toHaveProperty('right', -8);
    else if (left >= target.right + 6) expect(layout.arrowStyle).toHaveProperty('left', -8);
    else expect(layout.arrowStyle).toHaveProperty('top', -8);
  });

  it('positions lateral balloons using vertical alignment and a centered arrow', () => {
    const layout = calculateGuidedTourLayout({
      targetRect: rect(100, 80, 40, 60),
      balloonSize: {width: 260, height: 120},
      placement: 'right',
      alignment: 'bottom',
      gap: 10,
      viewportPadding: 0,
    });

    expect(layout.balloonStyle.left).toBe(150);
    expect(layout.balloonStyle.top).toBe(20);
    expect(layout.arrowStyle).toEqual(expect.objectContaining({left: -8, top: 90}));
  });

  it('positions top or bottom balloons using horizontal alignment', () => {
    const layout = calculateGuidedTourLayout({
      targetRect: rect(300, 220, 80, 40),
      balloonSize: {width: 200, height: 100},
      placement: 'top',
      alignment: 'right',
      gap: 12,
      viewportPadding: 0,
    });

    expect(layout.balloonStyle.left).toBe(180);
    expect(layout.balloonStyle.top).toBe(108);
    expect(layout.arrowStyle).toEqual(expect.objectContaining({bottom: -8, left: 160}));
  });
});
