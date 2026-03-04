import {describe, expect, it} from 'vitest';
import {
  COLORS,
  FLOOR_HEIGHT,
  HOUSE_3D_DEPTH,
  HOUSE_3D_FINAL_SCALE,
  HOUSE_3D_WIDTH, PILOTI_RADIUS
} from '@/components/rac-editor/lib/3d/constants.ts';

describe('constants.ts', () => {
  it('derives positive dimensions from base scale', () => {
    expect(HOUSE_3D_FINAL_SCALE).toBeGreaterThan(0);
    expect(HOUSE_3D_WIDTH).toBeGreaterThan(0);
    expect(HOUSE_3D_DEPTH).toBeGreaterThan(0);
    expect(PILOTI_RADIUS).toBeGreaterThan(0);
    expect(FLOOR_HEIGHT).toBeGreaterThan(0);
    expect(COLORS.roof).toBe('#a8b8c4');
  });
});

