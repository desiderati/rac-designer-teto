import {describe, expect, it} from 'vitest';
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
