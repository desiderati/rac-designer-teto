import {FabricObject, Group as FabricGroup} from 'fabric';
import {HouseSide} from '@/shared/types/house.ts';
import {ContraventamentoOrientation, ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {createElementId} from '@/components/rac-editor/lib/house-identity.ts';

type CanvasProperties = {
  // Internal Fabric properties and methods
  _objects?: FabricObject[];
  _clearCache?: () => void;
  _calcBounds?: () => void;

  myType?: string;
  editorObjectId?: string;
  isMacroGroup?: boolean;

  text?: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  angle?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  baseWidth?: number;
  baseHeight?: number;

  radius?: number;
  fill?: string | FabricObject['fill'];
  stroke?: string | FabricObject['stroke'];

  set: (patch: Record<string, unknown>) => void;
  getCanvasObjects?: () => CanvasObject[];
  getObjects?: () => CanvasObject[];
  objectCaching?: boolean;

  houseInstanceId?: string;
  houseViewType?: string;
  houseView?: string;
  houseSide?: HouseSide;
  isFlippedHorizontally?: boolean;
  isRightSide?: boolean;
  showAllPilotiNivelLabels?: boolean;
  groundViewLeftX?: number;
  groundViewRightX?: number;
  isHouseBody?: boolean;
  isHouseBorderEdge?: boolean;
  edgeSide?: HouseSide;

  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  isPilotiText?: boolean;
  isPilotiHitArea?: boolean;
  isPilotiNivelText?: boolean;
  isPilotiNameLabel?: boolean;
  isPilotiSizeLabel?: boolean;
  isPilotiStripe?: boolean;
  pilotiId?: string;
  pilotiHeight?: number;
  pilotiBaseHeight?: number;
  pilotiIsMaster?: boolean;
  pilotiNivel?: number;

  isHouseDoor?: boolean;
  isTopDoorMarker?: boolean;
  doorMarkerSide?: HouseSide;
  isHouseViewReferenceMarker?: boolean;
  houseViewReferenceMarkerCode?: string;
  houseViewReferenceMarkerLabel?: string;
  houseViewReferenceMarkerSide?: HouseSide;

  isGroundElement?: boolean;
  isGroundLine?: boolean;
  isGroundSegment?: boolean;
  isGroundFill?: boolean;
  isNivelMarker?: boolean;
  isNivelLabel?: boolean;
  groundSeed?: number;
  groundTerrainType?: number;
  isTerrainRachao?: boolean;
  isTerrainSideGravel?: boolean;
  isTerrainEditTarget?: boolean;

  isAutoStairs?: boolean;
  stairsStepCount?: number;
  stairsHeight?: number;
  stairsNivelLeft?: number;
  stairsNivelRight?: number;

  isContraventamento?: boolean;
  isAutoContraventamento?: boolean;
  isContraventamentoElevation?: boolean;
  contraventamentoId?: string;
  contraventamentoOrientation?: ContraventamentoOrientation;
  contraventamentoCol?: number | string;
  contraventamentoRow?: number | string;
  contraventamentoStartRow?: number;
  contraventamentoEndRow?: number;
  contraventamentoStartCol?: number;
  contraventamentoEndCol?: number;
  contraventamentoAnchorPilotiId?: string;
  contraventamentoSourcePilotiId?: string;
  contraventamentoSide?: ContraventamentoSide;

  group?: FabricGroup;
  target?: FabricObject | null;
  e?: Event;

  dirty?: boolean;
  isContentEditable?: boolean;
};

//
// CanvasGroup
//

export type CanvasGroup = FabricGroup & CanvasProperties;

export function isCanvasGroup(
  object: FabricGroup | CanvasObject | unknown | null | undefined
): object is CanvasGroup {
  if (!object || typeof object !== 'object') return false;

  const candidate = object as { type?: unknown; getObjects?: unknown };
  return object instanceof FabricGroup
    || candidate.type === 'group'
    || typeof candidate.getObjects === 'function';
}

export function toCanvasGroup(object: FabricGroup): CanvasGroup;
export function toCanvasGroup(object: CanvasObject): CanvasGroup | null;
export function toCanvasGroup(object: unknown): CanvasGroup | null;
export function toCanvasGroup(object: null | undefined): null;
export function toCanvasGroup(object: FabricGroup | CanvasObject | unknown | null | undefined): CanvasGroup | null {
  if (!object) return null;

  const isGroup = isCanvasGroup(object)
  if (!isGroup) return null;

  // Normalize helper expected by house-related flows even when the source
  // group is a plain Fabric Group instance (e.g. after import/restore).
  const canvasGroup = object as CanvasGroup;
  if (typeof canvasGroup.getCanvasObjects !== 'function') {
    canvasGroup.getCanvasObjects = () => {
      if (typeof canvasGroup.getObjects === 'function') {
        return canvasGroup.getObjects().map(o => toCanvasObject(o));
      }
      const internalObjects = canvasGroup._objects;
      return Array.isArray(internalObjects) ? internalObjects.map(o => toCanvasObject(o)) : [];
    };
  }

  return canvasGroup;
}

export function getCanvasGroupObjects(
  group: CanvasGroup | CanvasObject | null | undefined,
): CanvasObject[] {
  const canvasGroup = toCanvasGroup(group);
  return canvasGroup?.getCanvasObjects?.() ?? [];
}

interface CanvasGroupMutationOptions {
  refresh?: boolean;
  recalculateBounds?: boolean;
  requestRender?: boolean;
  setObjectCoords?: boolean;
}

function getMutableCanvasGroupObjects(group: CanvasGroup): FabricObject[] | null {
  const internalObjects = group._objects;
  return Array.isArray(internalObjects) ? internalObjects : null;
}

function getCanvasGroupObjectListFallback(group: CanvasGroup): FabricObject[] | null {
  const canvasObjects = group.getCanvasObjects?.();
  if (Array.isArray(canvasObjects)) return canvasObjects;

  const fabricObjects = group.getObjects?.();
  return Array.isArray(fabricObjects) ? fabricObjects : null;
}

function canMutateCanvasGroupThroughFabricMethods(group: CanvasGroup): boolean {
  return typeof group.add === 'function';
}

export function refreshCanvasGroup(
  group: CanvasGroup,
  options: Omit<CanvasGroupMutationOptions, 'refresh' | 'setObjectCoords'> = {},
): void {
  if (options.recalculateBounds) {
    group._clearCache?.();
    group._calcBounds?.();
  }

  group.setCoords();
  group.dirty = true;

  if (options.requestRender) {
    group.canvas?.requestRenderAll();
  }
}

export function appendCanvasGroupObjects(
  group: CanvasGroup,
  objects: FabricObject[],
  options: CanvasGroupMutationOptions = {},
): boolean {
  if (!objects.length) return false;

  const internalObjects = getMutableCanvasGroupObjects(group);
  if (internalObjects) {
    objects.forEach((object) => {
      object.group = group;
      if (options.setObjectCoords) object.setCoords?.();
      internalObjects.push(object);
    });
  } else {
    if (options.setObjectCoords) {
      objects.forEach((object) => object.setCoords?.());
    }
    if (canMutateCanvasGroupThroughFabricMethods(group)) {
      group.add(...objects);
    } else {
      const fallbackObjects = getCanvasGroupObjectListFallback(group);
      if (!fallbackObjects) return false;
      objects.forEach((object) => {
        object.group = group;
        fallbackObjects.push(object);
      });
    }
  }

  if (options.refresh !== false) {
    refreshCanvasGroup(group, options);
  }

  return true;
}

export function insertCanvasGroupObjects(
  group: CanvasGroup,
  index: number,
  objects: FabricObject[],
  options: CanvasGroupMutationOptions = {},
): boolean {
  if (!objects.length) return false;

  const internalObjects = getMutableCanvasGroupObjects(group);
  if (internalObjects) {
    const targetIndex = Math.max(0, Math.min(index, internalObjects.length));
    objects.forEach((object) => {
      object.group = group;
      if (options.setObjectCoords) object.setCoords?.();
    });
    internalObjects.splice(targetIndex, 0, ...objects);
  } else {
    if (options.setObjectCoords) {
      objects.forEach((object) => object.setCoords?.());
    }
    if (canMutateCanvasGroupThroughFabricMethods(group)) {
      group.add(...objects);
    } else {
      const fallbackObjects = getCanvasGroupObjectListFallback(group);
      if (!fallbackObjects) return false;
      const targetIndex = Math.max(0, Math.min(index, fallbackObjects.length));
      objects.forEach((object) => {
        object.group = group;
      });
      fallbackObjects.splice(targetIndex, 0, ...objects);
    }
  }

  if (options.refresh !== false) {
    refreshCanvasGroup(group, options);
  }

  return true;
}

export function removeCanvasGroupObjectsWhere(
  group: CanvasGroup,
  predicate: (object: CanvasObject) => boolean,
  options: CanvasGroupMutationOptions = {},
): number {
  const internalObjects = getMutableCanvasGroupObjects(group);
  if (internalObjects) {
    const nextObjects: FabricObject[] = [];
    let removed = 0;

    internalObjects.forEach((object) => {
      if (predicate(toCanvasObject(object))) {
        object.group = undefined;
        removed += 1;
        return;
      }
      nextObjects.push(object);
    });

    if (removed === 0) return 0;
    group._objects = nextObjects;

    if (options.refresh !== false) {
      refreshCanvasGroup(group, options);
    }

    return removed;
  }

  const objectsToRemove = getCanvasGroupObjects(group).filter(predicate);
  if (!objectsToRemove.length) return 0;

  group.remove(...objectsToRemove);
  if (options.refresh !== false) {
    refreshCanvasGroup(group, options);
  }

  return objectsToRemove.length;
}

export function replaceCanvasGroupObjects(
  group: CanvasGroup,
  objects: FabricObject[],
  options: CanvasGroupMutationOptions = {},
): void {
  const internalObjects = getMutableCanvasGroupObjects(group);
  if (internalObjects) {
    internalObjects.length = 0;
    objects.forEach((object) => {
      object.group = group;
      if (options.setObjectCoords) object.setCoords?.();
      internalObjects.push(object);
    });
  } else {
    const fallbackObjects = getCanvasGroupObjectListFallback(group);
    const currentObjects = getCanvasGroupObjects(group);

    if (canMutateCanvasGroupThroughFabricMethods(group)) {
      if (currentObjects.length) group.remove(...currentObjects);
      if (options.setObjectCoords) {
        objects.forEach((object) => object.setCoords?.());
      }
      group.add(...objects);
    } else if (fallbackObjects) {
      fallbackObjects.forEach((object) => {
        object.group = undefined;
      });
      fallbackObjects.length = 0;
      objects.forEach((object) => {
        object.group = group;
        if (options.setObjectCoords) object.setCoords?.();
        fallbackObjects.push(object);
      });
    }
  }

  if (options.refresh !== false) {
    refreshCanvasGroup(group, options);
  }
}

//
// CanvasObject
//

export type CanvasObject = FabricObject & CanvasProperties;

// Extend FabricObject prototype to include custom properties in serialization
const originalToObject = FabricObject.prototype.toObject;
FabricObject.prototype.toObject = function (propertiesToInclude: string[] = []) {
  return originalToObject.call(this, [...canvasObjectProps, ...propertiesToInclude]);
};

export function toCanvasObject(object: FabricObject): CanvasObject;
export function toCanvasObject(object: unknown): CanvasObject;
export function toCanvasObject(object: null | undefined): null;
export function toCanvasObject(object: FabricObject | unknown | null | undefined): CanvasObject | null {
  if (!object) return null;
  return object as CanvasObject;
}

export type CanvasObjectProps = Exclude<keyof CanvasObject, keyof FabricObject>;

export const canvasObjectProps = [
  'myType',
  'editorObjectId',
  'isMacroGroup',

  'houseInstanceId',
  'houseViewType',
  'houseView',
  'houseSide',
  'isFlippedHorizontally',
  'isRightSide',
  'showAllPilotiNivelLabels',
  'groundViewLeftX',
  'groundViewRightX',
  'isHouseBody',
  'isHouseBorderEdge',
  'edgeSide',

  'isPilotiCircle',
  'isPilotiRect',
  'isPilotiText',
  'isPilotiHitArea',
  'isPilotiNivelText',
  'isPilotiNameLabel',
  'isPilotiSizeLabel',
  'isPilotiStripe',
  'pilotiId',
  'pilotiHeight',
  'pilotiBaseHeight',
  'pilotiIsMaster',
  'pilotiNivel',

  'isHouseDoor',
  'isTopDoorMarker',
  'doorMarkerSide',
  'isHouseViewReferenceMarker',
  'houseViewReferenceMarkerCode',
  'houseViewReferenceMarkerLabel',
  'houseViewReferenceMarkerSide',

  'isGroundElement',
  'isGroundLine',
  'isGroundSegment',
  'isGroundFill',
  'isNivelMarker',
  'isNivelLabel',
  'groundSeed',
  'groundTerrainType',
  'isTerrainRachao',
  'isTerrainSideGravel',
  'isTerrainEditTarget',

  'isAutoStairs',
  'stairsStepCount',
  'stairsHeight',
  'stairsNivelLeft',
  'stairsNivelRight',

  'isContraventamento',
  'isAutoContraventamento',
  'isContraventamentoElevation',
  'contraventamentoId',
  'contraventamentoOrientation',
  'contraventamentoCol',
  'contraventamentoRow',
  'contraventamentoStartRow',
  'contraventamentoEndRow',
  'contraventamentoStartCol',
  'contraventamentoEndCol',
  'contraventamentoAnchorPilotiId',
  'contraventamentoSourcePilotiId',
  'contraventamentoSide',
] as const satisfies readonly CanvasObjectProps[];

/**
 * Garante identidade serializável para um objeto vivo do canvas.
 *
 * O runtime Fabric ainda é a fonte dos objetos visuais, mas seleções públicas
 * e histórico não devem usar referência de objeto como identidade. Este helper
 * cria um identificador persistível quando o objeto ainda não possui um.
 */
export function ensureCanvasObjectId(
  object: CanvasObject | CanvasGroup,
  createId: () => string = createElementId,
): string {
  if (!object.editorObjectId) {
    object.editorObjectId = createId();
  }
  return object.editorObjectId;
}

export interface CanvasObjectSummary {
  type: string | null;
  myType: string | null;
}

export type CanvasMouseEvent = MouseEvent | PointerEvent | TouchEvent;

export interface CanvasPointerPayload {
  target?: CanvasGroup | CanvasObject | null;
  subTargets?: CanvasObject[];
  e?: CanvasMouseEvent;
}

export interface CanvasPosition {
  x: number;
  y: number;
  zoom: number;
}
