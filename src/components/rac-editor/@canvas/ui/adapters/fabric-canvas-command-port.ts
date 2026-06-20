import type {Canvas as FabricCanvas} from 'fabric';
import {
  type CanvasGroup,
  type CanvasObject,
  type ElementStrategyKey,
  getElementStrategy,
  getGenericObjectEditorStrategy,
  toCanvasGroup,
  toCanvasObject,
} from '@/components/rac-editor/@canvas/lib';
import type {
  GenericCanvasObjectEditorType,
  PilotiCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {HousePiloti, HouseSide, HouseViewInstanceId, HouseViewType} from '@/shared/types/house.ts';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {createHouseGroupForView} from '@/components/rac-editor/@canvas/lib/house-view-groups.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  applyPilotiEditorCloseVisuals,
  applyPilotiSelectionVisuals,
} from '@/components/rac-editor/@canvas/lib/piloti-visual-feedback.ts';
import {
  projectCanvasPointToScreenPoint,
  transformGroupLocalPointToCanvasPoint,
} from '@/components/rac-editor/@canvas/lib/piloti-screen-position.ts';
import {createViewGroupMetadataPatch} from '@/components/rac-editor/lib/house-view.ts';

export interface FabricCanvasCommandPort {
  createElementObject: (kind: ElementStrategyKey) => CanvasObject | null;
  createHouseViewGroup: (payload: {
    viewType: HouseViewType;
    instanceId: HouseViewInstanceId;
    side?: HouseSide;
    pilotis: Record<string, HousePiloti>;
    terrainType: number;
    showAllElevationNivelLabels?: boolean;
  }) => CanvasGroup | null;
  addObjectAtVisibleCenter: (object: CanvasObject) => boolean;
  setDrawingModeEnabled: (enabled: boolean) => boolean;
  resetSurface: () => void;
  renderAll: () => void;
  moveActiveImageLayer: (direction: 'front' | 'back') => boolean;
  getActiveObjectCount: () => number;
  deleteActiveObjects: (handlers?: {
    canDeleteTopView?: () => boolean;
    onTopViewDeleted?: () => void;
    onHouseViewRemoved?: (instanceId: HouseViewInstanceId | null) => void;
    onBlockedTopViewDelete?: () => void;
  }) => 'deleted' | 'blocked' | 'none';
  getGroupLocalPointScreenPosition: (
    group: CanvasGroup,
    localCanvasPoint: { x: number; y: number },
  ) => { x: number; y: number } | null;
  applyGenericObjectEdit: (payload: {
    kind: GenericCanvasObjectEditorType;
    objectId: string;
    color: string;
    label: string;
  }) => string | null;
  applyPilotiEditorCloseVisuals: () => void;
  applyPilotiSelectionVisuals: (pilotiId: string) => void;
  getPilotiScreenPosition: (
    pilotiId: string,
    houseView?: PilotiCanvasSelection['houseView'],
  ) => { x: number; y: number } | null;
}

interface FabricCanvasCommandPortArgs {
  canvas: FabricCanvas;
  getVisibleCenter: () => { x: number; y: number };
  getCanvasPointScreenPosition?: (point: { x: number; y: number }) => { x: number; y: number } | null;
  clearHistory: () => void;
  saveHistory: () => void;
}

interface FabricCanvasLayerApi {
  bringObjectToFront?: (object: CanvasObject) => void;
  sendObjectToBack?: (object: CanvasObject) => void;
  bringToFront?: (object: CanvasObject) => void;
  sendToBack?: (object: CanvasObject) => void;
  moveObjectTo?: (object: CanvasObject, index: number) => void;
}

function isImageCanvasObject(object: CanvasObject | null): object is CanvasObject {
  return object?.myType === 'image' || object?.type === 'image';
}

/**
 * Adapter de comandos imperativos do canvas Fabric usados pela UI do editor.
 */
export function createFabricCanvasCommandPort({
  canvas,
  getVisibleCenter,
  getCanvasPointScreenPosition,
  clearHistory,
  saveHistory,
}: FabricCanvasCommandPortArgs): FabricCanvasCommandPort {

  const findObjectByEditorId = (objectId: string): CanvasObject | null => {
    for (const object of canvas.getObjects()) {
      const runtime = toCanvasObject(object);
      if (runtime?.editorObjectId === objectId) return runtime;
    }
    return null;
  };

  const getPilotiLocalCenterPoint = (piloti: CanvasObject): { x: number; y: number } => {
    const left = Number(piloti.left ?? 0);
    const top = Number(piloti.top ?? 0);

    if (piloti.isPilotiRect) {
      return {
        x: left + Number(piloti.width ?? 0) / 2,
        y: top + Number(piloti.height ?? 0) / 2,
      };
    }

    return {x: left, y: top};
  };

  const projectGroupLocalPointToScreen = (
    group: CanvasGroup,
    localCanvasPoint: { x: number; y: number },
  ): { x: number; y: number } | null => {
    const canvasPoint = transformGroupLocalPointToCanvasPoint({
      groupMatrix: group.calcTransformMatrix(),
      localCanvasPoint,
    });
    const projectedByEditorViewport = getCanvasPointScreenPosition?.(canvasPoint);
    if (projectedByEditorViewport) return projectedByEditorViewport;

    const container = canvas.getElement().parentElement;
    if (!container) return null;

    return projectCanvasPointToScreenPoint({
      groupMatrix: group.calcTransformMatrix(),
      localCanvasPoint,
      canvasContainer: container.getBoundingClientRect(),
      viewportTransform: canvas.viewportTransform ?? undefined,
    });
  };

  const getHouseGroups = (houseView?: PilotiCanvasSelection['houseView']): CanvasGroup[] => {
    const groups = canvas.getObjects()
      .map((object) => toCanvasGroup(object))
      .filter((group): group is CanvasGroup => group?.myType === 'house');

    if (!houseView) return groups;

    return [
      ...groups.filter((group) => group.houseView === houseView),
      ...groups.filter((group) => group.houseView !== houseView),
    ];
  };

  return {
    createElementObject: (kind) => getElementStrategy(kind).create(canvas),

    createHouseViewGroup: ({viewType, instanceId, side, pilotis, terrainType, showAllElevationNivelLabels}) => {
      const group = createHouseGroupForView({
        canvas,
        viewType,
        side,
      });
      Object.assign(
        group,
        createViewGroupMetadataPatch<HouseViewType, HouseSide>({
          viewType,
          instanceId,
          side,
        }),
      );
      group.groundTerrainType = terrainType;
      applyPilotiDataToGroup(group, pilotis, {showAllElevationNivelLabels});
      return group;
    },

    addObjectAtVisibleCenter: (object) => {
      const center = getVisibleCenter();
      object.set({left: center.x, top: center.y});
      canvas.add(object);
      canvas.setActiveObject(object);
      return true;
    },

    setDrawingModeEnabled: (enabled) => {
      canvas.isDrawingMode = enabled;
      canvas.selection = !enabled;
      return true;
    },

    resetSurface: () => {
      canvas.clear();
      canvas.backgroundColor = CANVAS_STYLE.backgroundColor;
      canvas.renderAll();
      clearHistory();
      saveHistory();
    },

    renderAll: () => {
      canvas.renderAll();
    },

    moveActiveImageLayer: (direction) => {
      const activeObject = toCanvasObject(canvas.getActiveObject());
      if (!isImageCanvasObject(activeObject)) return false;

      const layerApi = canvas as FabricCanvas & FabricCanvasLayerApi;
      if (direction === 'front') {
        if (layerApi.bringObjectToFront) {
          layerApi.bringObjectToFront(activeObject);
        } else if (layerApi.bringToFront) {
          layerApi.bringToFront(activeObject);
        } else if (layerApi.moveObjectTo) {
          layerApi.moveObjectTo(activeObject, Math.max(canvas.getObjects().length - 1, 0));
        } else {
          return false;
        }
      } else if (layerApi.sendObjectToBack) {
        layerApi.sendObjectToBack(activeObject);
      } else if (layerApi.sendToBack) {
        layerApi.sendToBack(activeObject);
      } else if (layerApi.moveObjectTo) {
        layerApi.moveObjectTo(activeObject, 0);
      } else {
        return false;
      }

      canvas.setActiveObject(activeObject);
      activeObject.setCoords?.();
      canvas.requestRenderAll?.();
      saveHistory();
      return true;
    },

    getActiveObjectCount: () => canvas.getActiveObjects().length,

    deleteActiveObjects: (handlers) => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) return 'none';

      canvas.discardActiveObject();
      for (const object of activeObjects) {
        const typedObject = toCanvasObject(object);
        if (!typedObject) continue;

        if (typedObject.myType === 'house') {
          const rawView = typedObject.houseViewType ?? typedObject.houseView;
          if (rawView === 'top') {
            if (handlers?.canDeleteTopView && !handlers.canDeleteTopView()) {
              handlers.onBlockedTopViewDelete?.();
              canvas.setActiveObject(object);
              return 'blocked';
            }
            handlers?.onTopViewDeleted?.();
          }
          const houseGroup = toCanvasGroup(object);
          handlers?.onHouseViewRemoved?.(
            typeof houseGroup?.houseInstanceId === 'string' ? houseGroup.houseInstanceId : null,
          );
        }

        canvas.remove(object);
      }

      canvas.requestRenderAll?.();
      saveHistory();
      return 'deleted';
    },

    getGroupLocalPointScreenPosition: projectGroupLocalPointToScreen,

    applyGenericObjectEdit: ({kind, objectId, color, label}) => {
      const object = findObjectByEditorId(objectId);
      if (!object) return null;

      const strategy = getGenericObjectEditorStrategy(kind);
      strategy.apply({canvas, object, color, label});
      saveHistory();
      return strategy.getInfoMessage();
    },

    applyPilotiEditorCloseVisuals: () => {
      const group = toCanvasGroup(canvas.getActiveObject());
      if (!group) return;

      applyPilotiEditorCloseVisuals({
        groupObjects: group.getCanvasObjects(),
        houseStillSelected: canvas.getActiveObject() === group,
      });
      canvas.renderAll();
    },

    applyPilotiSelectionVisuals: (pilotiId) => {
      applyPilotiSelectionVisuals(canvas.getObjects(), pilotiId);
      canvas.renderAll();
    },

    getPilotiScreenPosition: (pilotiId, houseView) => {
      for (const group of getHouseGroups(houseView)) {
        const piloti = group.getCanvasObjects().find((object) =>
          object.pilotiId === pilotiId && (object.isPilotiCircle || object.isPilotiRect),
        );
        if (!piloti) continue;

        return projectGroupLocalPointToScreen(group, getPilotiLocalCenterPoint(piloti));
      }

      return null;
    },
  };
}
