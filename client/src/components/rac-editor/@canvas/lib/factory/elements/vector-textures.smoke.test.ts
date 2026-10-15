import {describe, expect, it} from 'vitest';
import {
  createDiagonalStripePathData,
  createRachaoStoneLayout,
  createStairStepPathData,
  createWaterWavePathData,
} from './vector-textures.ts';

describe('vector-textures.ts', () => {
  it('creates water waves as serializable Bézier commands', () => {
    const path = createWaterWavePathData(200, 50, 1);

    expect(path.some(([command]) => command === 'C')).toBe(true);
    expect(path.filter(([command]) => command === 'M')).toHaveLength(3);
    expect(path.every((command) => Array.isArray(command))).toBe(true);
  });

  it('clips diagonal stripe segments to the requested rectangle', () => {
    const width = 80;
    const height = 40;
    const path = createDiagonalStripePathData(width, height, 10);

    expect(path.length).toBeGreaterThan(0);
    for (const command of path) {
      const [, x, y] = command;
      expect(Math.abs(x)).toBeLessThanOrEqual(width / 2 + 0.001);
      expect(Math.abs(y)).toBeLessThanOrEqual(height / 2 + 0.001);
    }
  });

  it('creates stair divisions without any raster source', () => {
    const path = createStairStepPathData(80, 75, 4, 'horizontal');

    expect(path).toHaveLength(6);
    expect(path.filter(([command]) => command === 'M')).toHaveLength(3);
    expect(path.filter(([command]) => command === 'L')).toHaveLength(3);
  });

  it('creates deterministic vector stone positions for rachão', () => {
    const first = createRachaoStoneLayout(120, 50, 1);
    const second = createRachaoStoneLayout(120, 50, 1);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((stone) => stone.left >= -60 && stone.left <= 60)).toBe(true);
    expect(first.every((stone) => stone.top >= -25 && stone.top <= 25)).toBe(true);
  });
});
