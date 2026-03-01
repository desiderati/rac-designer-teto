import {
  CANVAS_STYLE,
  HOUSE_DEFAULTS,
  PILOTI_CORNER_ID,
  PILOTI_CORNER_IDS,
  PILOTI_MASTER_STYLE
} from '@/shared/config.ts';
import {FabricObject, Group} from 'fabric';
import {
  CanvasObject,
  createDiagonalStripePattern,
  formatNivel,
  formatPilotiHeight,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
  PILOTI_MASTER_FILL_COLOR,
  PILOTI_MASTER_STROKE_COLOR,
  PilotiObjectLike,
  refreshHouseGroupRendering,
  toCanvasObject,
  updateGroundInGroup,
  updatePilotiHeight,
  updatePilotiMaster
} from '@/components/lib/canvas/index.ts';
import {HousePiloti, HouseViews} from '@/shared/types/house.ts';

export interface PilotiObjectIndexEntry<TObject> {
  circle?: TObject;
  rect?: TObject;
}

export type PilotiObjectIndex<TObject> = Record<string, PilotiObjectIndexEntry<TObject>>;

export interface PilotiNivelTextPatch {
  text: string;
  visible: boolean;
  left?: number;
  top?: number;
}

export interface PilotiVisualDataPatch {
  pilotiHeight: number;
  pilotiIsMaster: boolean;
  pilotiNivel: number;
  height?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function createPilotiVisualDataPatch(params: {
  height: number;
  isMaster: boolean;
  nivel: number;
  isRect: boolean;
  baseHeight: number;
  masterFill: string;
  masterStroke: string;
}): PilotiVisualDataPatch {
  return {
    pilotiHeight: params.height,
    pilotiIsMaster: params.isMaster,
    pilotiNivel: params.nivel,
    ...(params.isRect ? {height: params.baseHeight * params.height, scaleY: 1} : {}),
    ...(params.isMaster
      ? {
        fill: params.masterFill,
        stroke: params.masterStroke,
        strokeWidth: params.isRect ? PILOTI_MASTER_STYLE.strokeWidth : PILOTI_MASTER_STYLE.strokeWidthTopView,
      }
      : {}),
  };
}

export function createPilotiHeightTextPatch(formattedHeight: string): { text: string } {
  return {text: formattedHeight};
}

export function createPilotiSizeLabelPatch(
  formattedHeight: string
): { text: string; backgroundColor: string } {
  return {
    text: formattedHeight,
    backgroundColor: CANVAS_STYLE.backgroundColor,
  };
}

export function createNivelLabelBackgroundPatch(): { backgroundColor: string } {
  return {
    backgroundColor: CANVAS_STYLE.backgroundColor,
  };
}

// Apply current piloti data to a group (when creating a new view)
export function applyPilotiDataToGroup(group: Group, pilotis: Record<string, HousePiloti>): void {
  const objects = group.getObjects();
  const canvasObjects =
    objects.map((object) => toCanvasObject(object));

  const pilotiObjectIndex = buildPilotiObjectIndex(canvasObjects);
  applyPilotiDataFirstPass(canvasObjects, pilotiObjectIndex, pilotis);
  applyNivelLabelsBackground(canvasObjects);
  applyPilotiSizeLabelPositions(canvasObjects, pilotiObjectIndex);
  applyPilotiStripeOverlays(canvasObjects, pilotiObjectIndex);

  // Update ground line based on the applied nivel values
  updateGroundInGroup(group);
  refreshHouseGroupRendering(group);
}

function applyNivelLabelsBackground(objects: FabricObject[]): void {
  objects.forEach((obj: FabricObject) => {
    const canvasObject = toCanvasObject(obj);
    if (canvasObject.isNivelLabel) {
      canvasObject.set(createNivelLabelBackgroundPatch());
    }
  });
}

function applyPilotiDataFirstPass(
  objects: FabricObject[],
  pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
  pilotis: Record<string, HousePiloti>
): void {
  objects.forEach((obj: FabricObject) => {
    const canvasObject = toCanvasObject(obj);
    const pilotiId = canvasObject.pilotiId;
    if (!pilotiId) return;

    const data = pilotis[pilotiId];
    if (!data) return;

    if (canvasObject.isPilotiCircle || canvasObject.isPilotiRect) {
      const isRect = Boolean(canvasObject.isPilotiRect);
      canvasObject.set(
        createPilotiVisualDataPatch({
          height: data.height,
          isMaster: data.isMaster,
          nivel: data.nivel,
          isRect,
          baseHeight: canvasObject.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
          masterFill: PILOTI_MASTER_FILL_COLOR,
          masterStroke: PILOTI_MASTER_STROKE_COLOR,
        }),
      );

      if (isRect) {
        canvasObject.setCoords();
        canvasObject.dirty = true;
      }
    }

    if (canvasObject.isPilotiText) {
      canvasObject.set(createPilotiHeightTextPatch(formatPilotiHeight(data.height)));
    }

    if (canvasObject.isPilotiNivelText) {
      const isCorner = PILOTI_CORNER_IDS.includes(pilotiId);
      const pilotiCircle = pilotiObjectIndex[pilotiId]?.circle;
      const centerX = Number(pilotiCircle?.left ?? canvasObject.left ?? 0);
      const centerY = Number(pilotiCircle?.top ?? canvasObject.top ?? 0);
      const radius = Number(
        pilotiCircle?.radius ?? HOUSE_DEFAULTS.pilotiRadius * HOUSE_DEFAULTS.viewScale,
      );
      const offset = HOUSE_DEFAULTS.pilotiNivelLabelOffset * HOUSE_DEFAULTS.viewScale;
      const isTopCorner = pilotiId === PILOTI_CORNER_ID.topLeft || pilotiId === PILOTI_CORNER_ID.topRight;

      canvasObject.set(
        createPilotiNivelTextPatch({
          isCorner,
          formattedNivel: formatNivel(data.nivel),
          centerX,
          centerY,
          radius,
          offset,
          isTopCorner,
        }),
      );
    }

    if (canvasObject.isPilotiSizeLabel) {
      canvasObject.set(createPilotiSizeLabelPatch(formatPilotiHeight(data.height)));
    }
  });
}

function applyPilotiSizeLabelPositions(
  objects: FabricObject[],
  pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
): void {
  objects.forEach((obj: FabricObject) => {
    const canvasObject = toCanvasObject(obj);
    if (!canvasObject.isPilotiSizeLabel) return;

    const pilotiId = canvasObject.pilotiId;
    if (!pilotiId) return;

    const rect = pilotiObjectIndex[pilotiId]?.rect;
    if (!rect) return;

    const baseHeight = rect.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE;
    const rectWidth = Number(rect.width ?? 0);
    const rectHeight = Number(rect.height ?? 0);
    const position = calculatePilotiSizeLabelPosition({
      rectLeft: Number(rect.left ?? 0),
      rectTop: Number(rect.top ?? 0),
      rectWidth,
      rectHeight,
      baseHeight,
      basePilotiHeight: PILOTI_BASE_HEIGHT_PX,
    });

    canvasObject.set('left', position.left);
    canvasObject.set('top', position.top);
    canvasObject.setCoords?.();
    canvasObject.dirty = true;
  });
}

function applyPilotiStripeOverlays(
  objects: FabricObject[],
  pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
): void {
  objects.forEach((obj: FabricObject) => {
    const canvasObject = toCanvasObject(obj);
    if (!canvasObject.isPilotiStripe) return;

    const pilotiId = canvasObject.pilotiId;
    if (!pilotiId) return;

    const rect = pilotiObjectIndex[pilotiId]?.rect;
    if (!rect) return;

    const geometry = calculatePilotiStripeGeometry({
      rectTop: Number(rect.top ?? 0),
      rectHeight: Number(rect.height ?? 0),
    });
    canvasObject.set({height: geometry.height, top: geometry.top});
    canvasObject.set('fill', createDiagonalStripePattern());
    canvasObject.objectCaching = false;
    canvasObject.setCoords();
    canvasObject.dirty = true;
  });
}

export function calculateCornerNivelLabelTop(params: {
  centerY: number;
  radius: number;
  offset: number;
  isTopCorner: boolean;
}): number {
  return params.isTopCorner
    ? params.centerY - params.radius - params.offset
    : params.centerY + params.radius + params.offset;
}

export function createPilotiNivelTextPatch(params: {
  isCorner: boolean;
  formattedNivel: string;
  centerX: number;
  centerY: number;
  radius: number;
  offset: number;
  isTopCorner: boolean;
}): PilotiNivelTextPatch {
  if (!params.isCorner) {
    return {
      text: '',
      visible: false,
    };
  }

  return {
    text: `Nível = ${params.formattedNivel}`,
    left: params.centerX,
    top: calculateCornerNivelLabelTop({
      centerY: params.centerY,
      radius: params.radius,
      offset: params.offset,
      isTopCorner: params.isTopCorner,
    }),
    visible: true,
  };
}

export function calculatePilotiSizeLabelPosition(params: {
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
  baseHeight: number;
  basePilotiHeight: number;
}): { left: number; top: number } {
  const s = params.baseHeight / params.basePilotiHeight;
  const offset = 8 * s;
  return {
    left: params.rectLeft + params.rectWidth / 2,
    top: params.rectTop + params.rectHeight + offset,
  };
}

export function calculatePilotiStripeGeometry(params: {
  rectTop: number;
  rectHeight: number;
}): { top: number; height: number } {
  return {
    height: (params.rectHeight * 2) / 3,
    top: params.rectTop + params.rectHeight / 3,
  };
}

export function buildPilotiObjectIndex<TObject extends PilotiObjectLike>(
  objects: TObject[],
): PilotiObjectIndex<TObject> {
  return objects.reduce((acc, object) => {
    const pilotiId = typeof object.pilotiId === 'string' ? object.pilotiId : '';
    if (!pilotiId) return acc;

    const entry = acc[pilotiId] ?? {};
    if (object.isPilotiCircle && !entry.circle) {
      entry.circle = object;
    }
    if (object.isPilotiRect && !entry.rect) {
      entry.rect = object;
    }
    acc[pilotiId] = entry;
    return acc;
  }, {} as PilotiObjectIndex<TObject>);
}

function syncPilotiUpdateOnGroup(
  group: Group,
  pilotiId: string,
  pilotis: Record<string, HousePiloti>,
  pilotiData: Partial<HousePiloti>,
  clearedMasters: string[],
): void {
  if (clearedMasters.length) {
    clearedMasters.forEach((id) => {
      const p = pilotis[id];
      updatePilotiMaster(group, id, p.isMaster, p.nivel);
    });
  }

  const newData = pilotis[pilotiId];
  if (pilotiData.height !== undefined) {
    updatePilotiHeight(group, pilotiId, newData.height);
  }
  if (pilotiData.isMaster !== undefined || pilotiData.nivel !== undefined) {
    updatePilotiMaster(group, pilotiId, newData.isMaster, newData.nivel);
  }
  if ((pilotiData.height !== undefined || pilotiData.nivel !== undefined) && PILOTI_CORNER_IDS.includes(pilotiId)) {
    updateGroundInGroup(group);
  }

  refreshHouseGroupRendering(group);
}

export function syncPilotiUpdateAcrossViews(
  pilotiId: string,
  pilotis: Record<string, HousePiloti>,
  pilotiData: Partial<HousePiloti>,
  views: HouseViews<Group>,
  clearedMasters: string[],
): void {
  Object.values(views).forEach((instances) => {
    if (!instances || instances.length === 0) return;
    for (const instance of instances) {
      syncPilotiUpdateOnGroup(instance.group, pilotiId, pilotis, pilotiData, clearedMasters);
    }
  });
}
