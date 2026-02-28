import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '@/components/lib/canvas';
import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

export const HOUSE_3D_SCALE = HOUSE_DEFAULTS.viewScale; // Same scale used by createHouseTop
export const HOUSE_3D_VIEWER_SCALE = 0.5;
export const HOUSE_3D_FINAL_SCALE = HOUSE_3D_SCALE * HOUSE_3D_VIEWER_SCALE;

export const HOUSE_3D_WIDTH = HOUSE_BASE_WIDTH * HOUSE_3D_FINAL_SCALE;
export const HOUSE_3D_DEPTH = HOUSE_BASE_HEIGHT * HOUSE_3D_FINAL_SCALE;

export const PILOTI_BASE_HEIGHT_PX = HOUSE_DIMENSIONS.piloti.baseHeight * 100 * HOUSE_3D_FINAL_SCALE;
export const PILOTI_TOP_Y = PILOTI_BASE_HEIGHT_PX;
export const PILOTI_STEP_X = HOUSE_DIMENSIONS.piloti.columnSpacing * HOUSE_3D_FINAL_SCALE;
export const PILOTI_STEP_Z = HOUSE_DIMENSIONS.piloti.rowSpacing * HOUSE_3D_FINAL_SCALE;
export const PILOTI_RADIUS = HOUSE_DIMENSIONS.piloti.radius * HOUSE_3D_FINAL_SCALE;

export const CONTRAVENTAMENTO_TOP_WIDTH = HOUSE_DIMENSIONS.contraventamento.topWidth * HOUSE_3D_FINAL_SCALE;
export const CONTRAVENTAMENTO_SQUARE_WIDTH = HOUSE_DIMENSIONS.contraventamento.squareWidth * HOUSE_3D_FINAL_SCALE;

export const FLOOR_HEIGHT = HOUSE_DIMENSIONS.structure.floorHeight * HOUSE_3D_FINAL_SCALE;

export const FLOOR_BEAM_HEIGHT = HOUSE_DIMENSIONS.structure.floorBeamHeight * HOUSE_3D_FINAL_SCALE;
export const FLOOR_BEAM_STRIP_DEPTH = HOUSE_DIMENSIONS.structure.floorBeamStripDepth * HOUSE_3D_FINAL_SCALE;
export const FLOOR_BEAM_ROWS_Z = [
  HOUSE_3D_DEPTH / 2 - FLOOR_BEAM_STRIP_DEPTH / 2, // A: flush with floor edge
  0, // B: centered
  -HOUSE_3D_DEPTH / 2 + FLOOR_BEAM_STRIP_DEPTH / 2, // C: flush with floor edge
];

export const BODY_PROFILE_HEIGHT = HOUSE_DIMENSIONS.structure.bodyHeight * HOUSE_3D_FINAL_SCALE;

export const DIAG_WIDTH = HOUSE_DIMENSIONS.structure.diagonalWidth * HOUSE_3D_FINAL_SCALE;
export const DIAG_HEIGHT = HOUSE_DIMENSIONS.structure.diagonalHeight * HOUSE_3D_FINAL_SCALE;
export const CHAPEL_WIDTH = HOUSE_DIMENSIONS.structure.chapelWidth * HOUSE_3D_FINAL_SCALE;

export const WALL_HEIGHT = HOUSE_DIMENSIONS.structure.wallHeight * HOUSE_3D_FINAL_SCALE;
export const WALL_BASE_Y = PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT + FLOOR_HEIGHT;
export const WALL_THICKNESS = HOUSE_DIMENSIONS.structure.wallThickness * HOUSE_3D_FINAL_SCALE;

export const ROOF_RISE = BODY_PROFILE_HEIGHT - WALL_HEIGHT;
export const ROOF_LONG_SIDE_OVERHANG = HOUSE_DIMENSIONS.roof.longSideOverhang * HOUSE_3D_FINAL_SCALE;
export const ROOF_SHORT_SIDE_OVERHANG = HOUSE_DIMENSIONS.roof.shortSideOverhang * HOUSE_3D_FINAL_SCALE;
export const ROOF_WAVE_AMPLITUDE = HOUSE_DIMENSIONS.roof.waveAmplitude * HOUSE_3D_FINAL_SCALE;
export const ROOF_WAVE_PITCH = HOUSE_DIMENSIONS.roof.wavePitch * HOUSE_3D_FINAL_SCALE;
export const ROOF_WAVE_SEGMENTS_X = HOUSE_DIMENSIONS.roof.waveSegmentsX;
export const ROOF_WAVE_SEGMENTS_Z = HOUSE_DIMENSIONS.roof.waveSegmentsZ;

export const ROOF_BASE_Y = WALL_BASE_Y + WALL_HEIGHT;
export const ROOF_TOP_Y = ROOF_BASE_Y + ROOF_RISE;

export const PANEL_OFFSET_RATIO = WALL_THICKNESS * HOUSE_DIMENSIONS.structure.panelOffsetRatio;

export const TERRAIN_MARGIN = HOUSE_DIMENSIONS.terrain.margin * HOUSE_3D_FINAL_SCALE;
export const TERRAIN_SEGMENTS = HOUSE_DIMENSIONS.terrain.segments;

export const COLORS = {
  roof: '#a8b8c4',
  piloti: '#d8d8d8',
  terrain: '#7da86d',
  floor: '#f7f7f7',
  beam: '#ececec',
  frame: '#bdbdbd',
} as const;
