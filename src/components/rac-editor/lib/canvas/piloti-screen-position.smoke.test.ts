import {describe, expect, it} from 'vitest';
import {projectCanvasPointToScreenPoint} from './piloti-screen-position.ts';

describe('piloti-screen-position utils', () => {
  it('projects local point with explicit viewport transform', () => {
    expect(
      projectCanvasPointToScreenPoint({
        groupMatrix: [2, 0, 0, 3, 100, 50],
        localCanvasPoint: {x: 10, y: 5},
        canvasContainer: {left: 20, top: 30},
        viewportTransform: [1.5, 0, 0, 1.5, -40, 60],
      }),
    ).toEqual({
      x: 160,
      y: 187.5,
    });
  });

  it('uses identity viewport when transform is omitted', () => {
    expect(
      projectCanvasPointToScreenPoint({
        groupMatrix: [1, 0, 0, 1, 200, 120],
        localCanvasPoint: {x: 30, y: 40},
        canvasContainer: {left: 5, top: 10},
      }),
    ).toEqual({
      x: 235,
      y: 170,
    });
  });
});
