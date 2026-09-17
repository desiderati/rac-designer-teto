import {House3DFace, HouseSide, HouseType, HouseViewType} from '@/shared/types/house.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import type {House3DElevationViewProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';

export interface Stairs3DData {
  id: string;
  face: House3DFace;
  centerFromLeft: number;
  stairWidth: number;
  stairHeightMts: number;
  stepCount: number;
}

export function parseStairsFromElevationViews(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  elevationViews: House3DElevationViewProjection[];
}): Stairs3DData | null {
  if (!params.houseType) return null;

  for (const view of params.elevationViews) {
    const stairs = view.stairs;
    if (!stairs) continue;

    const stairWidth = Number(stairs.width ?? 0);
    const stairHeightMts = Number(stairs.heightMts ?? 0);
    const stepCount = Number(stairs.stepCount ?? 0);
    const stairLeft = Number(stairs.left ?? 0);
    if (stairWidth <= 0 || stairHeightMts <= 0 || stepCount <= 0) continue;
    if (!Number.isFinite(stairLeft)) continue;

    const face = resolveStairFace({
      houseType: params.houseType,
      sideMappings: params.sideMappings,
      viewType: view.viewType,
    });
    if (!face) continue;

    const bodyWidth = resolveElevationViewBodyWidth({view});
    if (bodyWidth <= 0 || stairWidth <= 0) continue;
    if (!Number.isFinite(stairHeightMts) || stairHeightMts <= 0) continue;

    const rawCenterFromLeft = resolveStairCenterFromLeft({
      bodyLeft: view.bodyLeft,
      bodyWidth,
      stairLeft,
      stairWidth,
    });
    const viewScaleFactor = resolveCanonicalElevationScaleFactor({view, bodyWidth});
    const centerFromLeft = rawCenterFromLeft * viewScaleFactor;
    const normalizedStairWidth = stairWidth * viewScaleFactor;

    return {
      id: `${String(view.instanceId ?? view.viewType)}-stairs`,
      face,
      centerFromLeft,
      stairWidth: normalizedStairWidth,
      stairHeightMts,
      stepCount,
    };
  }

  return null;
}

function resolveElevationViewBodyWidth(params: {
  view: House3DElevationViewProjection;
}): number {
  const bodyWidth = getProjectionWidth(params.view.bodyWidth);
  if (bodyWidth > 0) return bodyWidth;

  const doorWidth = getProjectionWidth(params.view.doorWidth);
  if (doorWidth > 0) {
    const scale = doorWidth / HOUSE_DIMENSIONS.elements.common.doorWidth;
    const isSideView =
      params.view.viewType === 'side1'
      || params.view.viewType === 'side2'
      || params.view.houseView === 'side';
    return (isSideView ? HOUSE_DIMENSIONS.footprint.depth : HOUSE_DIMENSIONS.footprint.width) * scale;
  }

  return getProjectionWidth(params.view.groupWidth);
}

// Map doorSide to 3D face, accounting for tipo6 front-side flip.
function resolveStairFace(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  viewType: HouseViewType;
}): Stairs3DData['face'] | null {
  if (!params.houseType) return null;

  if (params.houseType === 'tipo6') {
    const frontFace: Stairs3DData['face'] =
      params.sideMappings.top === 'front'
        ? 'front'
        : params.sideMappings.bottom === 'front'
          ? 'back'
          : 'front';

    if (params.viewType === 'front') return frontFace;
    if (params.viewType === 'back') return frontFace === 'front' ? 'back' : 'front';
    return null;
  }

  // tipo3: porta está sempre na side2.
  if (params.viewType !== 'side2') return null;
  if (params.sideMappings.left === 'side2') return 'right';
  if (params.sideMappings.right === 'side2') return 'left';
  return 'right';
}

function getProjectionWidth(width: number | undefined): number {
  const parsedWidth = Number(width ?? 0);
  return Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 0;
}

function resolveStairCenterFromLeft(params: {
  bodyLeft: number | undefined;
  bodyWidth: number;
  stairLeft: number;
  stairWidth: number;
}): number {
  const bodyLeft = Number(params.bodyLeft);
  if (Number.isFinite(bodyLeft)) {
    return params.stairLeft - bodyLeft + params.stairWidth / 2;
  }

  // Fallback para projeções antigas ou mocks sem posição do corpo.
  return params.stairLeft + params.stairWidth / 2 + params.bodyWidth / 2;
}

function resolveCanonicalElevationScaleFactor(params: {
  view: House3DElevationViewProjection;
  bodyWidth: number;
}): number {
  const canonicalBodyWidth = resolveCanonicalElevationBodyWidth(params.view);
  if (canonicalBodyWidth <= 0 || params.bodyWidth <= 0) return 1;

  const factor = canonicalBodyWidth / params.bodyWidth;
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
}

function resolveCanonicalElevationBodyWidth(view: House3DElevationViewProjection): number {
  const isSideView =
    view.viewType === 'side1'
    || view.viewType === 'side2'
    || view.houseView === 'side';

  const footprintWidth = isSideView ? HOUSE_DIMENSIONS.footprint.depth : HOUSE_DIMENSIONS.footprint.width;
  return footprintWidth * HOUSE_DIMENSIONS.view.scale;
}
