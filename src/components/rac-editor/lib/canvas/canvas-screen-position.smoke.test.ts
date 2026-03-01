import {describe, expect, it} from 'vitest';
import {getCanvasViewportOffset, toCanvasScreenPoint} from './canvas-screen-position.ts';

describe('canvas screen position helpers', () => {
  it('centers canvas when scaled size is smaller than container', () => {
    const offset = getCanvasViewportOffset({
      canvasPosition: {x: 0, y: 0, zoom: 1},
      containerWidth: 500,
      containerHeight: 500,
      canvasWidth: 300,
      canvasHeight: 200,
    });

    expect(offset).toEqual({canvasX: 100, canvasY: 150});
  });

  it('projects canvas point to screen coordinates', () => {
    const point = toCanvasScreenPoint({
      canvasPosition: {x: 20, y: 10, zoom: 2},
      containerRect: {left: 100, top: 50, width: 400, height: 300},
      canvasWidth: 200,
      canvasHeight: 100,
      point: {x: 10, y: 5},
    });

    expect(point).toEqual({x: 120, y: 110});
  });
});
