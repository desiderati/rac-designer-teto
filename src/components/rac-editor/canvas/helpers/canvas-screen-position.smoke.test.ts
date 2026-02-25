import {describe, expect, it} from 'vitest';
import {getCanvasViewportOffset, toCanvasScreenPoint} from './canvas-screen-position.ts';
import {CANVAS_DEFAULTS} from '@/config.ts';

describe('canvas-screen-position utils', () => {
  it('projects point with centered canvas when scaled canvas fits container', () => {
    expect(
      toCanvasScreenPoint({
        canvasPosition: {x: 0, y: 0, zoom: 0.5},
        containerRect: {left: 10, top: 20, width: 1000, height: 800},
        canvasWidth: CANVAS_DEFAULTS.width,
        canvasHeight: CANVAS_DEFAULTS.height,
        point: {x: 100, y: 200},
      }),
    ).toEqual({
      x: 235,
      y: 195,
    });
  });

  it('projects point with scrolled canvas when scaled canvas exceeds container', () => {
    expect(
      toCanvasScreenPoint({
        canvasPosition: {x: 120, y: 80, zoom: 1.5},
        containerRect: {left: 50, top: 60, width: 900, height: 700},
        canvasWidth: CANVAS_DEFAULTS.width,
        canvasHeight: CANVAS_DEFAULTS.height,
        point: {x: 400, y: 300},
      }),
    ).toEqual({
      x: 530,
      y: 430,
    });
  });

  it('returns centered offsets when scaled canvas fits container', () => {
    expect(
      getCanvasViewportOffset({
        canvasPosition: {x: 30, y: 40, zoom: 0.5},
        containerWidth: 1000,
        containerHeight: 800,
        canvasWidth: CANVAS_DEFAULTS.width,
        canvasHeight: CANVAS_DEFAULTS.height,
      }),
    ).toEqual({
      canvasX: 175,
      canvasY: 75,
    });
  });

  it('returns viewport-based offsets when scaled canvas exceeds container', () => {
    expect(
      getCanvasViewportOffset({
        canvasPosition: {x: 120, y: 80, zoom: 1.5},
        containerWidth: 900,
        containerHeight: 700,
        canvasWidth: CANVAS_DEFAULTS.width,
        canvasHeight: CANVAS_DEFAULTS.height,
      }),
    ).toEqual({
      canvasX: -120,
      canvasY: -80,
    });
  });
});
