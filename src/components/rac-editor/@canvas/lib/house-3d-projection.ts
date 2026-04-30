import type {
  House3DElevationViewProjection,
  House3DProjection,
} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {
  HouseRuntimeViewInstance,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {getCanvasGroupObjects} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

/**
 * Monta uma projeção serializável da casa para o viewer 3D.
 *
 * A leitura de Fabric fica confinada aqui: o viewer recebe apenas números,
 * identificadores e metadados de domínio necessários para renderizar a cena.
 */
export function createHouse3DProjectionFromCanvasHouse(
  house: HouseRuntimeSnapshot | null,
): House3DProjection | null {
  if (!house) return null;

  const hasHouseViews =
    Object.values(house.views).some((instances) => instances.length > 0);
  const topGroup = house.views.top[0]?.group ?? null;

  return {
    houseType: house.houseType,
    pilotis: {...house.pilotis},
    sideMappings: house.sideMappings,
    hasHouseViews,
    topView: topGroup ? createTopViewProjection(topGroup) : null,
    elevationViews: collectElevationViews(house).map(createElevationViewProjection),
  };
}

function createTopViewProjection(group: CanvasGroup): House3DProjection['topView'] {
  return {
    contraventamentos: getCanvasGroupObjects(group)
      .filter((object) => object?.isContraventamento === true)
      .map((object) => ({
        id: typeof object.contraventamentoId === 'string'
          ? object.contraventamentoId
          : undefined,
        col: object.contraventamentoCol,
        startRow: object.contraventamentoStartRow,
        endRow: object.contraventamentoEndRow,
        side: object.contraventamentoSide,
        anchorPilotiId: typeof object.contraventamentoAnchorPilotiId === 'string'
          ? object.contraventamentoAnchorPilotiId
          : undefined,
      })),
  };
}

function collectElevationViews(house: HouseRuntimeSnapshot): Array<{
  viewType: HouseViewType;
  view: HouseRuntimeViewInstance<CanvasGroup>;
}> {
  return [
    ...house.views.front.map((view) => ({viewType: 'front' as HouseViewType, view})),
    ...house.views.back.map((view) => ({viewType: 'back' as HouseViewType, view})),
    ...house.views.side1.map((view) => ({viewType: 'side1' as HouseViewType, view})),
    ...house.views.side2.map((view) => ({viewType: 'side2' as HouseViewType, view})),
  ];
}

function createElevationViewProjection(params: {
  viewType: HouseViewType;
  view: HouseRuntimeViewInstance<CanvasGroup>;
}): House3DElevationViewProjection {
  const group = params.view.group;
  const objects = getCanvasGroupObjects(group);
  const body = objects.find((object) => object?.isHouseBody === true);
  const door = objects.find((object) => object?.isHouseDoor === true);
  const stairs = objects.find((object) => object?.isAutoStairs === true);

  return {
    viewType: params.viewType,
    instanceId: params.view.instanceId,
    houseView: typeof group.houseView === 'string' ? group.houseView : undefined,
    groupWidth: getGroupWidth(group),
    bodyWidth: getObjectWidth(body),
    doorWidth: getObjectWidth(door),
    stairs: stairs
      ? {
        width: getObjectWidth(stairs),
        left: Number(stairs.left ?? 0),
        heightMts: Number(stairs.stairsHeight ?? 0),
        stepCount: Number(stairs.stairsStepCount ?? 0),
      }
      : undefined,
  };
}

function getGroupWidth(group: CanvasGroup): number {
  const width = Number(group.width ?? 0) * Number(group.scaleX ?? 1);
  return Number.isFinite(width) && width > 0 ? width : 0;
}

function getObjectWidth(object: CanvasObject | undefined): number | undefined {
  if (!object) return undefined;

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

  return undefined;
}
