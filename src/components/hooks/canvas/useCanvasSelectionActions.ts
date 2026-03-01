import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, Line} from 'fabric';
import {CanvasObject, getHintForObject, getPilotiIdsForSide, toCanvasObject} from '@/components/lib/canvas';
import {findTopViewGroupCandidate} from '@/components/lib/canvas/canvas-rebuild.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import type {HouseSide, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {
  HOUSE_2D_STYLE,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
  PILOTI_VISUAL_FEEDBACK_COLORS,
  TERRAIN_STYLE
} from '@/shared/config.ts';

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
      (object: FabricObject | null): string | null => {
        if (!object || object.type !== 'group') return null;

        const canvasObject = toCanvasObject(object);
        const rawView = canvasObject?.houseViewType ?? canvasObject?.houseView;
        return typeof rawView === 'string' ? rawView : null;
      };

    const resolveHouseSideForSelection = (
      viewType: string,
      selectedObject: FabricObject | null,
    ): HouseSide | undefined => {

      const house = houseManager.getHouse();
      const instanceId = toCanvasObject(selectedObject)?.houseInstanceId;
      const typedView = viewType as HouseViewType;
      const viewInstances = (house?.views[typedView] ?? []) as HouseViewInstance[];
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
      (group: Group, viewType: string | null) => {
        if (!viewType) return;

        if (viewType !== 'top') {
          group.getObjects().forEach((child) => {
            if (toCanvasObject(child)?.isPilotiRect) {
              child.set({
                stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
                strokeWidth: PILOTI_STYLE.selectedStrokeWidth
              });
            }
          });
          return;
        }

        group.getObjects().forEach((child) => {
          if (toCanvasObject(child)?.isPilotiCircle) {
            child.set({
              stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
              strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView
            });
          }
        });
      };

    const applyDefaultHousePilotiStyles = (child: FabricObject) => {
      const canvasObjectChild = toCanvasObject(child);
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

    const applyTerrainStyles = (child: FabricObject) => {
      applyDefaultTerrainStyles(child, TERRAIN_STYLE.fillColor, TERRAIN_STYLE.strokeColor);
    };

    const applySelectedTerrainHighlightStyles =
      (group: Group, viewType: string | null) => {
        if (!viewType || viewType === 'top') return;

        group.getObjects().forEach((child) => {
          applyDefaultTerrainStyles(group, TERRAIN_STYLE.selectedFillColor, TERRAIN_STYLE.selectedStrokeColor);
        });
      };

    const applyDefaultTerrainStyles =
      (child: FabricObject, fillColor: string, strokeColor: string) => {
        const canvasObjectChild = toCanvasObject(child);
        if (!canvasObjectChild) return;

        if (
          canvasObjectChild.isGroundFill
          && !canvasObjectChild.isTerrainRachao
          && !canvasObjectChild.isTerrainSideGravel
        ) {
          child.set({fill: fillColor});
          canvasObjectChild.dirty = true;
        }

        if (canvasObjectChild.isGroundLine || canvasObjectChild.isNivelMarker) {
          child.set({stroke: strokeColor});
          canvasObjectChild.dirty = true;
        }

        if (canvasObjectChild.isNivelLabel) {
          child.set({fill: strokeColor});
          canvasObjectChild.dirty = true;
        }
      };

    const resetAllHousePilotiStyles = () => {
      canvas.getObjects().forEach((item) => {
        if (item.type !== 'group' || toCanvasObject(item)?.myType !== 'house') return;
        (item as Group).getObjects().forEach(
          (child) => applyDefaultHousePilotiStyles(child)
        );
      });
    };

    const resetAllTerrainStyles = () => {
      canvas.getObjects().forEach((item) => {
        if (item.type !== 'group' || toCanvasObject(item)?.myType !== 'house') return;
        (item as Group).getObjects().forEach(
          (child) => applyTerrainStyles(child)
        );
      });
    };

    const syncHouseTopSideHighlight =
      (activeObject: FabricObject | null) => {
        const topGroup = findTopViewGroupCandidate(canvas.getObjects() as CanvasObject[]) as Group | null;
        if (!topGroup) {
          canvas.requestRenderAll();
          return;
        }

        const refreshTopGroup = () => {
          topGroup.setCoords();
          canvas.requestRenderAll();
        };

        const borderLines = topGroup.getObjects().filter((object) => {
          return toCanvasObject(object)?.isHouseBorderEdge === true;
        }) as Line[];

        borderLines.forEach((line) => {
          const lineObject = toCanvasObject(line);
          line.set({stroke: HOUSE_2D_STYLE.outlineStrokeColor, strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth});
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

        const targetBorder =
          borderLines.find((line) => toCanvasObject(line)?.edgeSide === side);
        if (targetBorder) {
          targetBorder.set({
            stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
            strokeWidth: PILOTI_STYLE.selectedStrokeWidthTopView
          });
          const runtimeTargetBorder = toCanvasObject(targetBorder);
          if (runtimeTargetBorder) runtimeTargetBorder.dirty = true;
        }

        const pilotiIdsForSide = getPilotiIdsForSide(side);
        topGroup.getObjects().forEach((child) => {
          const canvasObjectChild = toCanvasObject(child);
          if (!canvasObjectChild) return;
          if (canvasObjectChild.isPilotiCircle
            && typeof canvasObjectChild.pilotiId === 'string'
            && pilotiIdsForSide.includes(canvasObjectChild.pilotiId)
          ) {
            child.set({
              stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
              strokeWidth: 3,
            });
            canvasObjectChild.dirty = true;
          }
        });

        refreshTopGroup();
      };

    const updateHint = () => {
      const object = canvas.getActiveObject() ?? null;
      onSelectionChange(getHintForObject(object));

      if (isContraventamentoMode()) {
        return;
      }

      if (!isAnyEditorOpen()) {
        clearPilotiSelection();
      }

      resetAllHousePilotiStyles();
      resetAllTerrainStyles();

      if (object && object.type === 'group' && toCanvasObject(object)?.myType === 'house') {
        const viewType = resolveHouseGroupView(object);
        applySelectedHousePilotiHighlightStyle(object as Group, viewType);
        applySelectedTerrainHighlightStyles(object as Group, viewType);
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

