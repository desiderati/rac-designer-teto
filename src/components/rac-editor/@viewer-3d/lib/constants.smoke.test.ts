import {describe, expect, it} from 'vitest';
import {
  COLORS,
  FLOOR_HEIGHT,
  HOUSE_3D_CAMERA_FOV,
  HOUSE_3D_CAMERA_POSITION,
  HOUSE_3D_CAMERA_TARGET,
  HOUSE_3D_COMPACT_CAMERA_FOV,
  HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH,
  HOUSE_3D_COMPACT_CAMERA_POSITION,
  HOUSE_3D_DEPTH,
  HOUSE_3D_FINAL_SCALE,
  HOUSE_3D_WIDTH, PILOTI_RADIUS
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';

describe('constants.ts', () => {
  it('derives positive dimensions from base scale', () => {
    expect(HOUSE_3D_FINAL_SCALE).toBeGreaterThan(0);
    expect(HOUSE_3D_WIDTH).toBeGreaterThan(0);
    expect(HOUSE_3D_DEPTH).toBeGreaterThan(0);
    expect(PILOTI_RADIUS).toBeGreaterThan(0);
    expect(FLOOR_HEIGHT).toBeGreaterThan(0);
    expect(COLORS.roof).toBe('#a8b8c4');
  });

  it('mantem enquadramento inicial da camera 3D centralizado na casa', () => {
    expect(HOUSE_3D_CAMERA_POSITION).toEqual([180, 140, 250]);
    expect(HOUSE_3D_CAMERA_TARGET).toEqual([0, 28, 0]);
    expect(HOUSE_3D_CAMERA_FOV).toBe(40);
    expect(HOUSE_3D_COMPACT_CAMERA_POSITION).toEqual([220, 150, 305]);
    expect(HOUSE_3D_COMPACT_CAMERA_FOV).toBe(48);
    expect(HOUSE_3D_COMPACT_CAMERA_MAX_WIDTH).toBe(520);
  });
});

