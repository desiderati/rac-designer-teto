import {BASE_PILOTI_HEIGHT_PX, BASE_TOP_HEIGHT, BASE_TOP_WIDTH} from "@/components/lib/canvas";

export const TOP_VIEW_SCALE = 0.6; // Same scale used by createHouseTop
export const VIEWER_MODEL_SCALE = 0.5;
export const U = TOP_VIEW_SCALE * VIEWER_MODEL_SCALE;

export const HOUSE_WIDTH = BASE_TOP_WIDTH * U;
export const HOUSE_DEPTH = BASE_TOP_HEIGHT * U;

export const PILOTI_STEP_X = 155 * U;
export const PILOTI_STEP_Z = 135 * U;
export const PILOTI_RADIUS = 15 * U;
export const BASE_PILOTI_HEIGHT = BASE_PILOTI_HEIGHT_PX * U;
export const PILOTI_TOP_Y = BASE_PILOTI_HEIGHT;
export const CONTRAV_TOP_WIDTH = 5 * U;
export const CONTRAV_SQUARE_WIDTH = 10 * U;
export const CONTRAV_OFFSET_M = 0.2;

export const FLOOR_BEAM_HEIGHT = 20 * U;
export const FLOOR_BEAM_STRIP_DEPTH = 10 * U;
export const FLOOR_HEIGHT = 10 * U;
export const BODY_PROFILE_HEIGHT = 273 * U;
export const WALL_HEIGHT = 213 * U;
export const DIAG_W = 244 * U;
export const DIAG_H2 = 261 * U;
export const CHAPEL_W = 122 * U;
export const ROOF_RISE = BODY_PROFILE_HEIGHT - WALL_HEIGHT;
export const ROOF_SHORT_SIDE_OVERHANG = 10 * U; // 10 cm on the 3 m side
export const ROOF_LONG_SIDE_OVERHANG = 10 * U; // 10 cm on the square-panel side
export const ROOF_WAVE_AMPLITUDE = 1.8 * U;
export const ROOF_WAVE_PITCH = 28 * U;
export const ROOF_WAVE_SEGMENTS_X = 10;
export const ROOF_WAVE_SEGMENTS_Z = 28;

export const WALL_BASE_Y = PILOTI_TOP_Y + FLOOR_BEAM_HEIGHT + FLOOR_HEIGHT;
export const ROOF_BASE_Y = WALL_BASE_Y + WALL_HEIGHT;
export const ROOF_TOP_Y = ROOF_BASE_Y + ROOF_RISE;

export const WALL_THICKNESS = 2 * U;
export const FRONT_BACK_PANEL_OFFSET = WALL_THICKNESS * 0.65;
export const TERRAIN_MARGIN = 90 * U;
export const TERRAIN_SEGMENTS = 28;

export const FLOOR_BEAM_ROWS_Z = [
  HOUSE_DEPTH / 2 - FLOOR_BEAM_STRIP_DEPTH / 2, // A: flush with floor edge
  0, // B: centered
  -HOUSE_DEPTH / 2 + FLOOR_BEAM_STRIP_DEPTH / 2, // C: flush with floor edge
];

export const COLORS = {
  roof: "#a8b8c4",
  piloti: "#d8d8d8",
  terrain: "#7da86d",
  floor: "#f7f7f7",
  beam: "#ececec",
  frame: "#bdbdbd",
} as const;

export const ALL_PILOTI_IDS = Array.from({length: 3 * 4}, (_, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return `piloti_${col}_${row}`;
});
