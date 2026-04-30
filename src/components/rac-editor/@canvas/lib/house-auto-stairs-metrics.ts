import type {HousePiloti, HouseSide} from '@/shared/types/house.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {NUMERIC_EPSILON, PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';
import {resolveDoorSideCornerIds} from '@/shared/types/piloti.ts';

export const AUTO_STAIR_BASE_WIDTH_PX = HOUSE_DIMENSIONS.elements.common.windowWidth;

const AUTO_STAIR_HEIGHT_EXTRA_MTS = 0.3;
const AUTO_STAIR_STEP_MIN_DEPTH_PX = 10;
const AUTO_STAIR_STEP_HEIGHT_MTS = 0.3;
const AUTO_STAIR_FLOOR_HEIGHT_MTS = HOUSE_DIMENSIONS.structure.floorHeight / 100;
const AUTO_STAIR_BEAM_HEIGHT_MTS = HOUSE_DIMENSIONS.structure.floorBeamHeight / 100;

export interface StairMetrics {
  leftNivel: number;
  rightNivel: number;
  stairHeight: number;
  steps: number;
}

export interface DoorSideAxisContext {
  side: HouseSide;
  reverseAxis: boolean;
}

export function resolveAxisCornerIds(params: DoorSideAxisContext): {leftId: string; rightId: string} {
  const corners = resolveDoorSideCornerIds(params.side);
  if (!params.reverseAxis) return corners;
  return {leftId: corners.rightId, rightId: corners.leftId};
}

export function resolveAxisMiddleIds(params: DoorSideAxisContext): string[] {
  const middleIds = resolveDoorSideMiddleIds(params.side);
  return params.reverseAxis ? [...middleIds].reverse() : middleIds;
}

export function resolveTopStairMetrics(params: {
  pilotis: Record<string, HousePiloti>;
  doorSide: HouseSide;
  bodyWidth: number;
  bodyHeight: number;
  stairSpan: number;
  stairCenter: number;
}): StairMetrics {
  const corners = resolveDoorSideCornerIds(params.doorSide);
  const leftCornerNivel = Number(params.pilotis[corners.leftId]?.nivel ?? PILOTI_DEFAULT_NIVEL);
  const rightCornerNivel = Number(params.pilotis[corners.rightId]?.nivel ?? PILOTI_DEFAULT_NIVEL);
  const middleNivel = resolveAverageNivelFromIds({
    pilotis: params.pilotis,
    ids: resolveAxisMiddleIds({side: params.doorSide, reverseAxis: false}),
    fallback: (leftCornerNivel + rightCornerNivel) / 2,
  });

  const axisLeft =
    params.doorSide === 'left' || params.doorSide === 'right' ? -params.bodyHeight / 2 : -params.bodyWidth / 2;
  const axisRight =
    params.doorSide === 'left' || params.doorSide === 'right' ? params.bodyHeight / 2 : params.bodyWidth / 2;

  const leftEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairCenter - params.stairSpan / 2,
    leftX: axisLeft,
    rightX: axisRight,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });
  const rightEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairCenter + params.stairSpan / 2,
    leftX: axisLeft,
    rightX: axisRight,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });

  return buildStairMetricsFromGroundNiveis({
    leftGroundNivel: leftEdgeNivel,
    rightGroundNivel: rightEdgeNivel,
    leftCornerNivel,
    rightCornerNivel,
  });
}

export function buildStairMetricsFromGroundNiveis(params: {
  leftGroundNivel: number;
  rightGroundNivel: number;
  leftCornerNivel?: number;
  rightCornerNivel?: number;
}): StairMetrics {
  const leftNivel = round2(params.leftGroundNivel);
  const rightNivel = round2(params.rightGroundNivel);
  const referenceGroundLevel = Math.min(leftNivel, rightNivel);

  const stairHeight = round2(
    referenceGroundLevel + AUTO_STAIR_HEIGHT_EXTRA_MTS + AUTO_STAIR_FLOOR_HEIGHT_MTS + AUTO_STAIR_BEAM_HEIGHT_MTS,
  );
  const steps = Math.max(1, Math.round(stairHeight / AUTO_STAIR_STEP_HEIGHT_MTS));

  return {leftNivel, rightNivel, stairHeight, steps};
}

export function resolveAverageNivelFromIds(params: {
  pilotis: Record<string, HousePiloti>;
  ids: string[] | null;
  fallback: number;
}): number {
  if (!params.ids?.length) return params.fallback;

  const values = params.ids.map((id) => params.pilotis[id]?.nivel).filter((value) => Number.isFinite(value));
  if (!values.length) return params.fallback;

  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

export function evaluateBinomialQuadraticNivel(params: {
  x: number;
  leftX: number;
  rightX: number;
  leftNivel: number;
  middleNivel: number;
  rightNivel: number;
}): number {
  const denominator = params.rightX - params.leftX;
  if (Math.abs(denominator) < NUMERIC_EPSILON) return params.leftNivel;

  const t = clamp01((params.x - params.leftX) / denominator);
  const oneMinusT = 1 - t;

  return oneMinusT * oneMinusT * params.leftNivel + 2 * oneMinusT * t * params.middleNivel + t * t * params.rightNivel;
}

export function resolveStairDepthPxFromHeight(stairHeightMts: number, scale: number): number {
  const stairHeightPx = stairHeightMts * 100 * scale;
  return Math.max(AUTO_STAIR_STEP_MIN_DEPTH_PX * scale, stairHeightPx);
}

function resolveDoorSideMiddleIds(side: HouseSide): string[] {
  if (side === 'top') return ['piloti_1_0', 'piloti_2_0'];
  if (side === 'bottom') return ['piloti_1_2', 'piloti_2_2'];
  if (side === 'left') return ['piloti_0_1'];
  return ['piloti_3_1'];
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
