import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, Line} from 'fabric';
import {getHintForObject, toCanvasObject} from '@/components/lib/canvas';
import {findTopViewGroupCandidate} from '@/domain/use-cases/house-canvas-source-use-cases.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import type {HouseSide, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {HOUSE_2D_STYLE, PILOTI_MASTER_STYLE, PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/config.ts';

interface BindSelectionEventsArgs {
  canvas: FabricCanvas;
  onSelectionChange: (hint: string) => void;
  clearPilotiSelection: () => void;
  isAnyEditorOpen: () => boolean;
  isContraventamentoMode: () => boolean;
}

export function useCanvasSelectionEvents() {
  const bindSelectionEvents = useCallback(({
    canvas,
    onSelectionChange,
    clearPilotiSelection,
    isAnyEditorOpen,
    isContraventamentoMode,
  }: BindSelectionEventsArgs) => {

    const getPilotiIdsForSide = (side: HouseSide): string[] => {
      switch (side) {
        case 'top':
          return ['piloti_0_0', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0'];

        case 'bottom':
          return ['piloti_0_2', 'piloti_1_2', 'piloti_2_2', 'piloti_3_2'];

        case 'left':
          return ['piloti_0_0', 'piloti_0_1', 'piloti_0_2'];

        case 'right':
          return ['piloti_3_0', 'piloti_3_1', 'piloti_3_2'];

        default:
          return [];
      }
    };

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

    const applySelectedHousePilotiHighlight =
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

    const applyDefaultPilotiStyles = (child: FabricObject) => {
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

    const resetAllHousePilotiStyles = () => {
      canvas.getObjects().forEach((item) => {
        if (item.type !== 'group' || toCanvasObject(item)?.myType !== 'house') return;
        (item as Group).getObjects().forEach(
          (child) => applyDefaultPilotiStyles(child)
        );
      });
    };

    const syncPlantSideHighlight =
      (activeObject: FabricObject | null) => {
        const topGroup = findTopViewGroupCandidate(canvas.getObjects() as FabricObject[]) as Group | null;
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

      if (object && object.type === 'group' && toCanvasObject(object)?.myType === 'house') {
        const viewType = resolveHouseGroupView(object);
        applySelectedHousePilotiHighlight(object as Group, viewType);
      }

      syncPlantSideHighlight(object);
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

  return {bindSelectionEvents};
}

