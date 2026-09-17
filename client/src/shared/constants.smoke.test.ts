import {describe, expect, it} from 'vitest';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HOUSE_BASE_HEIGHT,
  HOUSE_BASE_WIDTH,
  HOUSE_FAMILY_NAME_MAX_LENGTH,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_MASTER_FILL_COLOR,
} from '@/shared/constants.ts';

describe('constants.ts', () => {
  it('exposes expected base values', () => {
    expect(CANVAS_WIDTH).toBeGreaterThan(0);
    expect(CANVAS_HEIGHT).toBeGreaterThan(0);
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(1.282, 3);
    expect(HOUSE_BASE_WIDTH).toBeGreaterThan(0);
    expect(HOUSE_BASE_HEIGHT).toBeGreaterThan(0);
    expect(HOUSE_FAMILY_NAME_MAX_LENGTH).toBe(25);
    expect(PILOTI_BASE_HEIGHT_PX).toBeGreaterThan(0);
    expect(typeof PILOTI_MASTER_FILL_COLOR).toBe('string');
  });
});

