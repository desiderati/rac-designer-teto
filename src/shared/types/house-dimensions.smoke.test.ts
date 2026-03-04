import {describe, expect, it} from 'vitest';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

describe('house-dimensions', () => {
  it('exposes core dimension sections', () => {
    expect(HOUSE_DIMENSIONS.footprint.width).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.footprint.depth).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.piloti.radius).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.structure.wallHeight).toBeGreaterThan(0);
    expect(HOUSE_DIMENSIONS.elements.common.doorWidth).toBeGreaterThan(0);
  });
});
