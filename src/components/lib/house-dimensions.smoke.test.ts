import {describe, expect, it} from 'vitest';
import {HOUSE_DIMENSIONS} from './house-dimensions.ts';

describe('house-dimensions', () => {
  it('exposes core dimension sections', () => {
    expect(HOUSE_DIMENSIONS.footprint.width).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.footprint.depth).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.piloti.radius).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.structure.wallHeight).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.openings.common.doorWidth).toBeGreaterThan(0);
  });
});
