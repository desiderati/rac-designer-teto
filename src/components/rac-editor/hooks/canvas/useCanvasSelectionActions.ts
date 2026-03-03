import {useCallback} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {
  CanvasGroup,
  CanvasObject,
  getCanvasGroupObjects,
  getHintForObject,
  isCanvasGroup,
  toCanvasGroup,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas';
import {findTopViewGroupCandidate} from '@/components/rac-editor/lib/canvas/canvas-rebuild.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HouseSide, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {
  HOUSE_2D_STYLE,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
  PILOTI_VISUAL_FEEDBACK_COLORS,
  TERRAIN_STYLE
} from '@/shared/config.ts';
import {getPilotiIdsForSide} from '@/shared/types/piloti.ts';

interface BindSelectionActionsArgs {
  canvas: FabricCanvas;
  onSelectionChange: (hint: string) => void;
  clearPilotiSelection: () => void;
  isAnyEditorOpen: () => boolean;
  isContraventamentoMode: () => boolean;
}

export function useCanvasSelectionActions() {

  const bindSelectionActions = useCallback(({
    canvas,
    onSelectionChange,
    clearPilotiSelection,
    isAnyEditorOpen,
    isContraventamentoMode,
  }: BindSelectionActionsArgs) => {

    const resolveHouseGroupView =
      (object: CanvasObject | null): string | null => {
        if (!isCanvasGroup(object)) return null;

        const canvasGroup = toCanvasGroup(object);
        const rawView = canvasGroup?.houseViewType ?? canvasGroup?.houseView;
        return typeof rawView === 'string' ? rawView : null;
      };

    const resolveHouseSideForSelection = (
      viewType: string,
      selectedObject: CanvasObject | null,
    ): HouseSide | undefined => {

      const house = houseManager.getHouse();
      const instanceId = selectedObject?.houseInstanceId;
      const typedView = viewType as HouseViewType;
      const viewInstances = (house?.views[typedView] ?? []) as HouseViewInstance<CanvasGroup>[];
      if (viewInstances.length === 0) return undefined;

      if (instanceId) {
        const matchingInstance =
          viewInstances.find((instance) => instance.instanceId === instanceId);
        if (matchingInstance?.side) return matchingInstance.side;
      } else {
        const matchingInstance =
          viewInstances.find((instance) => instance.group === selectedObject);
        if (matchingInstance?.side) return matchingInstance.side;
      }

      return viewInstances[0]?.side;
    };

    const applySelectedHousePilotiHighlightStyle =
      (group: CanvasGroup, viewType: string | null) => {
        if (!viewType) return;

        if (viewType !== 'top') {
          getCanvasGroupObjects(group).forEach((child) => {
            if (child?.isPilotiRect) {
              child.set({
                stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
                strokeWidth: PILOTI_STYLE.selectedStrokeWidth
              });
            }
          });
          return;
        }

        getCanvasGroupObjects(group).forEach((child) => {
          if (child?.isPilotiCircle) {
            child.set({
              stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
              strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView
            });
          }
        });
      };

    const applyDefaultHousePilotiStyles = (canvasObjectChild: CanvasObject) => {
      if (!canvasObjectChild) return;

      if (canvasObjectChild.isPilotiCircle) {
        if (canvasObjectChild.pilotiIsMaster) {
          canvasObjectChild.set({
            stroke: PILOTI_MASTER_STYLE.strokeColor,
            strokeWidth: PILOTI_MASTER_STYLE.strokeWidthTopView
          });
        } else {
          canvasObjectChild.set({
            stroke: PILOTI_STYLE.strokeColor,
            strokeWidth: PILOTI_STYLE.strokeWidthTopView
          });
        }
      }

      if (canvasObjectChild.isPilotiRect) {
        if (canvasObjectChild.pilotiIsMaster) {
          canvasObjectChild.set({
            stroke: PILOTI_MASTER_STYLE.strokeColor,
            strokeWidth: PILOTI_MASTER_STYLE.strokeWidth
          });
        } else {
          canvasObjectChild.set({
            stroke: PILOTI_STYLE.strokeColor,
            strokeWidth: PILOTI_STYLE.strokeWidth
          });
        }
      }
    };

    const applyTerrainStyles = (child: CanvasObject) => {
      applyDefaultTerrainStyles(child, TERRAIN_STYLE.fillColor, TERRAIN_STYLE.strokeColor);
    };

    const applySelectedTerrainHighlightStyles =
      (group: CanvasGroup, viewType: string | null) => {
        if (!viewType || viewType === 'top') return;

        getCanvasGroupObjects(group).forEach((child) => {
          applyDefaultTerrainStyles(child, TERRAIN_STYLE.selectedFillColor, TERRAIN_STYLE.selectedStrokeColor);
        });
      };

    const applyDefaultTerrainStyles =
      (canvasObjectChild: CanvasObject, fillColor: string, strokeColor: string) => {
        if (!canvasObjectChild) return;

        if (
          canvasObjectChild.isGroundFill
          && !canvasObjectChild.isTerrainRachao
          && !canvasObjectChild.isTerrainSideGravel
        ) {
          canvasObjectChild.set({fill: fillColor});
          canvasObjectChild.dirty = true;
        }

        if (canvasObjectChild.isGroundLine || canvasObjectChild.isNivelMarker) {
          canvasObjectChild.set({stroke: strokeColor});
          canvasObjectChild.dirty = true;
        }

        if (canvasObjectChild.isNivelLabel) {
          canvasObjectChild.set({fill: strokeColor});
          canvasObjectChild.dirty = true;
        }
      };

    const resetAllHousePilotiStyles = () => {
      canvas.getObjects().forEach((item) => {
        const group = toCanvasGroup(item);
        if (!group || group.myType !== 'house') return;
        getCanvasGroupObjects(group).forEach(
          (child) => applyDefaultHousePilotiStyles(child)
        );
      });
    };

    const resetAllTerrainStyles = () => {
      canvas.getObjects().forEach((item) => {
        const group = toCanvasGroup(item);
        if (!group || group.myType !== 'house') return;
        getCanvasGroupObjects(group).forEach(
          (child) => applyTerrainStyles(child)
        );
      });
    };

    const syncHouseTopSideHighlight =
      (activeObject: CanvasObject | null) => {
        const topGroup = findTopViewGroupCandidate(
          canvas.getObjects().filter((item) => isCanvasGroup(item))
        );

        if (!topGroup) {
          canvas.requestRenderAll();
          return;
        }

        const refreshTopGroup = () => {
          topGroup.setCoords();
          canvas.requestRenderAll();
        };

        const borderLines = getCanvasGroupObjects(topGroup).filter((object) => {
          return object?.isHouseBorderEdge === true;
        });

        borderLines.forEach((lineObject) => {
          lineObject.set({
            stroke: HOUSE_2D_STYLE.outlineStrokeColor,
            strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth
          });
          if (lineObject) lineObject.dirty = true;
        });

        const rawView = resolveHouseGroupView(activeObject);
        if (!rawView || rawView === 'top') {
          refreshTopGroup();
          return;
        }

        const side = resolveHouseSideForSelection(rawView, activeObject);
        if (!side) {
          refreshTopGroup();
          return;
        }

        const runtimeTargetBorder =
          borderLines.find((line) => line?.edgeSide === side);
        if (runtimeTargetBorder) {
          runtimeTargetBorder.set({
            stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
            strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView
          });
          if (runtimeTargetBorder) runtimeTargetBorder.dirty = true;
        }

        const pilotiIdsForSide = getPilotiIdsForSide(side);
        getCanvasGroupObjects(topGroup).forEach((canvasObjectChild) => {
          if (!canvasObjectChild) return;

          if (canvasObjectChild.isPilotiCircle
            && typeof canvasObjectChild.pilotiId === 'string'
            && pilotiIdsForSide.includes(canvasObjectChild.pilotiId)
          ) {
            canvasObjectChild.set({
              stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
              strokeWidth: 3,
            });
            canvasObjectChild.dirty = true;
          }
        });

        refreshTopGroup();
      };

    const updateHint = () => {
      const activeObjectGetter = (canvas as unknown as { getActiveObject?: () => unknown }).getActiveObject;
      const activeObjectRaw =
        (typeof activeObjectGetter === 'function' ? activeObjectGetter.call(canvas) : null)
        ?? (canvas.getObjects().find((item) => isCanvasGroup(item)) ?? null);
      const object = toCanvasObject(activeObjectRaw) ?? null;
      onSelectionChange(getHintForObject(object));

      if (isContraventamentoMode()) {
        return;
      }

      if (!isAnyEditorOpen()) {
        clearPilotiSelection();
      }

      resetAllHousePilotiStyles();
      resetAllTerrainStyles();

      if (isCanvasGroup(object) && object?.myType === 'house') {
        const viewType = resolveHouseGroupView(object);
        const group = toCanvasGroup(object);
        if (group) {
          applySelectedHousePilotiHighlightStyle(group, viewType);
          applySelectedTerrainHighlightStyles(group, viewType);
        }
      }

      syncHouseTopSideHighlight(object);
      canvas.renderAll();
    };

    canvas.on('selection:created', updateHint);
    canvas.on('selection:updated', updateHint);
    canvas.on('selection:cleared', updateHint);

    return () => {
      canvas.off('selection:created', updateHint);
      canvas.off('selection:updated', updateHint);
      canvas.off('selection:cleared', updateHint);
    };
  }, []);

  return {bindSelectionActions};
}




