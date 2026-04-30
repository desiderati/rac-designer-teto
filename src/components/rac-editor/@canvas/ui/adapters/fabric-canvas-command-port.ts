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
import type {GenericCanvasObjectEditorType} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {createHouseGroupForView} from '@/components/rac-editor/@canvas/lib/house-view-groups.ts';
import {
  applyPilotiEditorCloseVisuals,
  applyPilotiSelectionVisuals,
} from '@/components/rac-editor/@canvas/lib/piloti-visual-feedback.ts';
import {projectCanvasPointToScreenPoint} from '@/components/rac-editor/@canvas/lib/piloti-screen-position.ts';

export interface FabricCanvasCommandPort {
  createElementObject: (kind: ElementStrategyKey) => CanvasObject | null;
  createHouseViewGroup: (payload: { viewType: HouseViewType; side?: HouseSide }) => CanvasGroup | null;
  addObjectAtVisibleCenter: (object: CanvasObject) => boolean;
  setDrawingModeEnabled: (enabled: boolean) => boolean;
  resetSurface: () => void;
  renderAll: () => void;
  getActiveObjectCount: () => number;
  deleteActiveObjects: (handlers?: {
    canDeleteTopView?: () => boolean;
    onTopViewDeleted?: () => void;
    onHouseViewRemoved?: (group: CanvasGroup | null) => void;
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
}

interface FabricCanvasCommandPortArgs {
  canvas: FabricCanvas;
  getVisibleCenter: () => { x: number; y: number };
  clearHistory: () => void;
  saveHistory: () => void;
}

/**
 * Adapter de comandos imperativos do canvas Fabric usados pela UI do editor.
 */
export function createFabricCanvasCommandPort({
  canvas,
  getVisibleCenter,
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

  return {
    createElementObject: (kind) => getElementStrategy(kind).create(canvas),

    createHouseViewGroup: ({viewType, side}) =>
      createHouseGroupForView({
        canvas,
        viewType,
        side,
      }),

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
          handlers?.onHouseViewRemoved?.(toCanvasGroup(object));
        }

        canvas.remove(object);
      }

      return 'deleted';
    },

    getGroupLocalPointScreenPosition: (group, localCanvasPoint) => {
      const container = canvas.getElement().parentElement;
      if (!container) return null;

      return projectCanvasPointToScreenPoint({
        groupMatrix: group.calcTransformMatrix(),
        localCanvasPoint,
        canvasContainer: container.getBoundingClientRect(),
        viewportTransform: canvas.viewportTransform ?? undefined,
      });
    },

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
  };
}
