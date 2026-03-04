import {CanvasGroup, CanvasObject, getCanvasGroupObjects} from '@/components/rac-editor/lib/canvas';
import {HouseSide, HouseType, HouseViewType} from '@/shared/types/house.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

export interface Stair3DData {
  id: string;
  face: 'front' | 'back' | 'left' | 'right';
  centerFromLeft: number;
  width: number;
  stairHeightMts: number;
  stepCount: number;
}

export function parseAutoStairsFromElevationViews(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  elevationViews: Array<{
    viewType: HouseViewType;
    group: CanvasGroup;
  }>;
}): Stair3DData {
  if (!params.houseType) return null;

  for (const view of params.elevationViews) {
    const groupObjects = getCanvasGroupObjects(view.group);
    const stairObject =
      groupObjects.find((object) => object?.isAutoStairs === true) ?? null;
    if (!stairObject) continue;

    const face = resolveStairFace({
      houseType: params.houseType,
      sideMappings: params.sideMappings,
      viewType: view.viewType,
    });
    if (!face) continue;

    const bodyWidth = resolveElevationBodyWidth({
      group: view.group,
      viewType: view.viewType,
      objects: groupObjects,
    });
    const stairWidth = getObjectWidth(stairObject);
    const stairHeightMts = Number(stairObject.stairsHeight ?? 0);
    const stepCount = Math.max(1, stairObject.stairsStepCount ?? 0);
    if (bodyWidth <= 0 || stairWidth <= 0) continue;
    if (!Number.isFinite(stairHeightMts) || stairHeightMts <= 0) continue;

    // Escada na elevação está em origem esquerda (left), no mesmo eixo horizontal da fachada.
    const centerFromLeft = Number(stairObject.left ?? 0) + stairWidth / 2 + bodyWidth / 2;

    return {
      id: `${String(view.group.houseInstanceId ?? view.viewType)}-stairs`,
      face,
      centerFromLeft,
      width: stairWidth,
      stairHeightMts,
      stepCount,
    };
  }
}

function resolveStairFace(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  viewType: HouseViewType;
}): Stair3DData['face'] | null {
  if (!params.houseType) return null;

  if (params.houseType === 'tipo6') {
    const frontFace: Stair3DData['face'] =
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

function getObjectWidth(object: CanvasObject): number {
  if (!object) return 0;

  const widthRuntime = object as CanvasObject & {
    getScaledWidth?: () => number;
    getBoundingRect?: (absolute?: boolean, calculate?: boolean) => { width?: number };
  };

  const widthFromProps = Number(object.width ?? 0) * Number(object.scaleX ?? 1);
  if (Number.isFinite(widthFromProps) && widthFromProps > 0) return widthFromProps;

  const widthFromScaled = Number(widthRuntime.getScaledWidth?.() ?? 0);
  if (Number.isFinite(widthFromScaled) && widthFromScaled > 0) return widthFromScaled;

  const bbox = widthRuntime.getBoundingRect?.(false, false);
  const widthFromBounds = Number(bbox?.width ?? 0);
  if (Number.isFinite(widthFromBounds) && widthFromBounds > 0) return widthFromBounds;

  return 0;
}

function resolveElevationBodyWidth(params: {
  group: CanvasGroup;
  viewType: HouseViewType;
  objects: CanvasObject[];
}): number {
  const body = params.objects.find((object) => object?.isHouseBody);
  const bodyWidth = getObjectWidth(body);
  if (bodyWidth > 0) return bodyWidth;

  // Fallback principal: escalar largura estrutural a partir da largura real da porta da vista.
  const door = params.objects.find((object) => object?.isHouseDoor);
  const doorWidth = getObjectWidth(door);
  if (doorWidth > 0) {
    const scale = doorWidth / HOUSE_DIMENSIONS.openings.common.doorWidth;
    const isSideView =
      params.viewType === 'side1'
      || params.viewType === 'side2'
      || params.group.houseView === 'side';
    return (isSideView ? HOUSE_DIMENSIONS.footprint.depth : HOUSE_DIMENSIONS.footprint.width) * scale;
  }

  const groupWidth = params.group.width * params.group.scaleX;
  return groupWidth > 0 ? groupWidth : 0;
}
