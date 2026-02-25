import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, Line} from 'fabric';
import {getHintForObject} from "@/components/lib/canvas";
import {findTopViewGroupCandidate} from '@/domain/use-cases/house-canvas-source-use-cases.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import type {HouseSide, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {CanvasObject} from "@/components/lib/canvas/canvas.ts";

interface BindSelectionEventsArgs {
  canvas: FabricCanvas;
  onSelectionChange: (hint: string) => void;
  clearPilotiSelection: () => void;
  isAnyEditorOpen: () => boolean;
  isContraventamentoMode: () => boolean;
}

function toRuntimeObject(object: FabricObject | null | undefined): CanvasObject | null {
  if (!object) return null;
  return object as CanvasObject;
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
        const runtime = toRuntimeObject(object);
        const rawView = runtime?.houseViewType ?? runtime?.houseView;
        return typeof rawView === 'string' ? rawView : null;
      };

    const resolveHouseSideForSelection = (
      viewType: string,
      selectedObject: FabricObject | null,
    ): HouseSide | undefined => {
      const house = houseManager.getHouse();
      const instanceId = toRuntimeObject(selectedObject)?.houseInstanceId;
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
            if (toRuntimeObject(child)?.isPilotiRect) {
              child.set({
                stroke: '#facc15',
                strokeWidth: 4,
              });
            }
          });
          return;
        }

        group.getObjects().forEach((child) => {
          if (toRuntimeObject(child)?.isPilotiCircle) {
            child.set({
              stroke: '#facc15',
              strokeWidth: 3,
            });
          }
        });
      };

    const applyDefaultPilotiStyles = (child: FabricObject) => {
      const runtimeChild = toRuntimeObject(child);
      if (!runtimeChild) return;

      if (runtimeChild.isPilotiCircle) {
        if (runtimeChild.pilotiIsMaster) {
          runtimeChild.set({stroke: '#8B4513', strokeWidth: 2});
        } else {
          runtimeChild.set({stroke: 'black', strokeWidth: 1.5 * 0.6});
        }
      }

      if (runtimeChild.isPilotiRect) {
        if (runtimeChild.pilotiIsMaster) {
          runtimeChild.set({stroke: '#8B4513', strokeWidth: 3});
        } else {
          runtimeChild.set({stroke: '#333', strokeWidth: 2});
        }
      }
    };

    const resetAllHousePilotiStyles = () => {
      canvas.getObjects().forEach((item) => {
        if (item.type !== 'group' || toRuntimeObject(item)?.myType !== 'house') return;
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
          return toRuntimeObject(object)?.isHouseBorderEdge === true;
        }) as Line[];

        borderLines.forEach((line) => {
          const runtimeLine = toRuntimeObject(line);
          line.set({stroke: 'black', strokeWidth: 2 * 0.6});
          if (runtimeLine) runtimeLine.dirty = true;
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
          borderLines.find((line) => toRuntimeObject(line)?.edgeSide === side);
        if (targetBorder) {
          targetBorder.set({stroke: '#3b82f6', strokeWidth: 4});
          const runtimeTargetBorder = toRuntimeObject(targetBorder);
          if (runtimeTargetBorder) runtimeTargetBorder.dirty = true;
        }

        const pilotiIdsForSide = getPilotiIdsForSide(side);
        topGroup.getObjects().forEach((child) => {
          const runtimeChild = toRuntimeObject(child);
          if (!runtimeChild) return;
          if (runtimeChild.isPilotiCircle
            && typeof runtimeChild.pilotiId === 'string'
            && pilotiIdsForSide.includes(runtimeChild.pilotiId)
          ) {
            child.set({
              stroke: '#facc15',
              strokeWidth: 3,
            });
            runtimeChild.dirty = true;
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

      if (object && object.type === 'group' && toRuntimeObject(object)?.myType === 'house') {
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
