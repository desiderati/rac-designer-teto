import {Dispatch, MutableRefObject, SetStateAction, useEffect} from 'react';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {projectCanvasPointToScreenPoint} from '@/components/rac-editor/lib/canvas/piloti-screen-position.ts';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {PilotiCanvasSelection} from "@/components/rac-editor/lib/canvas";

interface UseRacEditorDebugBridgeParams {
  canvasRef: MutableRefObject<CanvasHandle | null>;
  showTipsRef: MutableRefObject<boolean>;
  showZoomControlsRef: MutableRefObject<boolean>;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
}

type RacDebugWindow = Window & { __racDebug?: Record<string, unknown> };
type CanvasPilotiObject = { pilotiId?: string; isPilotiCircle?: boolean; left?: number; top?: number };
type CanvasSummaryObject = { type?: string; myType?: string };
type CanvasChildObject = { text?: string; fill?: string; stroke?: string; myType?: string };
type CanvasGroupObject = { getObjects?: () => unknown[]; myType?: string; type?: string };

export function useRacEditorDebugBridge(params: UseRacEditorDebugBridgeParams): void {

  const {
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  } = params;

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const getPilotiScreenPosition = (pilotiId: string) => {
      const canvas = canvasRef.current?.canvas;
      const house = houseManager.getHouse();
      const topGroup = house?.views.top?.[0]?.group;
      if (!canvas || !topGroup) return null;

      const piloti = topGroup.getObjects().find((obj) => {
        const pilotiObject = obj as unknown as CanvasPilotiObject;
        return pilotiObject.pilotiId === pilotiId && pilotiObject.isPilotiCircle === true;
      }) as unknown as CanvasPilotiObject | undefined;

      if (!piloti) return null;

      const groupMatrix = topGroup.calcTransformMatrix();
      const pilotiLeft = piloti.left || 0;
      const pilotiTop = piloti.top || 0;

      const container = canvas.getElement().parentElement;
      if (!container) return null;

      return projectCanvasPointToScreenPoint({
        groupMatrix,
        localCanvasPoint: {x: pilotiLeft, y: pilotiTop},
        canvasContainer: container.getBoundingClientRect(),
        viewportTransform: canvas.viewportTransform ?? undefined,
      });
    };

    (window as RacDebugWindow).__racDebug = {
      getHouse: () => houseManager.getHouse(),

      getPilotiData: (pilotiId: string) => houseManager.getPilotiData(pilotiId),

      getHousePiloti: (pilotiId: string) => houseManager.getPilotiData(pilotiId),

      updatePiloti: (pilotiId: string, payload: { isMaster?: boolean; height?: number; nivel?: number }) =>
        houseManager.updatePiloti(pilotiId, payload),

      getPilotiScreenPosition,

      openPilotiEditor: (pilotiId: string) => {
        const house = houseManager.getHouse();
        const topGroup = house?.views.top?.[0]?.group;
        const pilotiData = houseManager.getPilotiData(pilotiId);
        if (!topGroup || !pilotiData) return false;

        const screenPosition = getPilotiScreenPosition(pilotiId) ?? {x: 24, y: 24};
        setPilotiSelection({
          pilotiId,
          currentHeight: pilotiData.height,
          currentIsMaster: pilotiData.isMaster,
          currentNivel: pilotiData.nivel,
          group: topGroup,
          screenPosition,
          houseView: 'top',
        });
        setIsPilotiEditorOpen(true);
        return true;
      },

      closePilotiEditor: () => {
        setIsPilotiEditorOpen(false);
        setPilotiSelection(null);
      },

      removeView: (viewType: HouseViewType, side?: HouseSide) => {
        const canvas = canvasRef.current?.canvas;
        const house = houseManager.getHouse();
        if (!canvas || !house) return false;

        const instances = house.views[viewType] ?? [];
        if (instances.length === 0) return false;

        const target =
          side
            ? instances.find((instance) => instance.side === side)
            : instances[instances.length - 1];
        if (!target) return false;

        canvas.remove(target.group);
        houseManager.removeView(target.group);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        return true;
      },

      getCanvasScreenCenter: () => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return null;
        const container = canvas.getElement().parentElement;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      },

      getCanvasPosition: () => {
        const handle = canvasRef.current;
        if (!handle) return null;
        return handle.getCanvasPosition();
      },

      setCanvasPosition: (x: number, y: number) => {
        const handle = canvasRef.current;
        if (!handle) return false;
        handle.setCanvasPosition(x, y);
        return true;
      },

      selectCanvasObjectByMyType: (myType: string, fromEnd = true, triggerInlineEditor = false) => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return false;

        const objects =
          canvas.getObjects().filter((obj) => {
            const canvasObject = obj as unknown as CanvasSummaryObject;
            return canvasObject.myType === myType;
          });
        if (objects.length === 0) return false;

        const target = fromEnd ? objects[objects.length - 1] : objects[0];
        canvas.discardActiveObject();
        canvas.setActiveObject(target);
        if (triggerInlineEditor) {
          canvas.fire('mouse:dblclick', {
            target,
            subTargets: [target],
          } as never);
        }
        canvas.fire('selection:created', {
          target,
          selected: [target],
        } as never);
        canvas.requestRenderAll();
        return true;
      },

      getActiveCanvasObjectSummary: () => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return null;

        const activeObject = canvas.getActiveObject() as CanvasGroupObject | undefined;
        if (!activeObject) return null;

        const children = activeObject.getObjects?.() ?? [];
        const labelObject = children.find((child) => {
          const c = child as CanvasChildObject;
          return c.myType === 'objLabel' || c.myType === 'wallLabel';
        }) as CanvasChildObject | undefined;

        const colorObject = children.find((child) => {
          const c = child as CanvasChildObject;
          return c.myType !== 'objLabel' && c.myType !== 'wallLabel';
        }) as CanvasChildObject | undefined;

        return {
          type: activeObject.type ?? null,
          myType: activeObject.myType ?? null,
          labelText: labelObject?.text ?? null,
          color: colorObject?.stroke ?? colorObject?.fill ?? null,
        };
      },

      getCanvasObjectsSummary: () => {
        const canvas = canvasRef.current?.canvas;
        if (!canvas) return null;
        return canvas.getObjects().map((obj) => {
          const canvasObject = obj as unknown as CanvasSummaryObject;
          return {
            type: canvasObject.type ?? null,
            myType: canvasObject.myType ?? null,
          };
        });
      },

      getUiState: () => ({
        showTips: showTipsRef.current,
        showZoomControls: showZoomControlsRef.current,
      }),
    };

    return () => {
      delete (window as RacDebugWindow).__racDebug;
    };
  }, [
    canvasRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    showTipsRef,
    showZoomControlsRef,
  ]);
}
