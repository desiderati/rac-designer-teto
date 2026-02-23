import {Dispatch, MutableRefObject, SetStateAction, useEffect} from "react";
import {houseManager, HouseSide, ViewType} from "@/lib/house-manager";
import {projectGroupLocalPointToScreen} from "@/lib/canvas/piloti-screen-position";
import type {CanvasHandle, PilotiSelection} from "@/components/rac-editor/Canvas";

interface UseRacDebugBridgeParams {
  canvasRef: MutableRefObject<CanvasHandle | null>;
  showTipsRef: MutableRefObject<boolean>;
  showZoomControlsRef: MutableRefObject<boolean>;
  setPilotiSelection: Dispatch<SetStateAction<PilotiSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacDebugBridge(params: UseRacDebugBridgeParams): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const getPilotiScreenPosition = (pilotiId: string) => {
      const canvas = params.canvasRef.current?.canvas;
      const house = houseManager.getHouse();
      const topGroup = house?.views.top?.[0]?.group;
      if (!canvas || !topGroup) return null;

      const piloti = topGroup.getObjects().find((obj: any) =>
        obj.pilotiId === pilotiId && obj.isPilotiCircle) as any;

      if (!piloti) return null;

      const groupMatrix = topGroup.calcTransformMatrix();
      const pilotiLeft = piloti.left || 0;
      const pilotiTop = piloti.top || 0;

      const container = canvas.getElement().parentElement;
      if (!container) return null;

      return projectGroupLocalPointToScreen({
        groupMatrix,
        localPoint: {x: pilotiLeft, y: pilotiTop},
        containerRect: container.getBoundingClientRect(),
        viewportTransform: canvas.viewportTransform ?? undefined,
      });
    };

    (window as any).__racDebug = {
      getHouse: () => houseManager.getHouse(),

      getPilotiData: (pilotiId: string) => houseManager.getPilotiData(pilotiId),

      updatePiloti: (pilotiId: string, payload: { isMaster?: boolean; height?: number; nivel?: number }) =>
        houseManager.updatePiloti(pilotiId, payload),

      getPilotiScreenPosition,

      openPilotiEditor: (pilotiId: string) => {
        const house = houseManager.getHouse();
        const topGroup = house?.views.top?.[0]?.group;
        const pilotiData = houseManager.getPilotiData(pilotiId);
        if (!topGroup || !pilotiData) return false;

        const screenPosition = getPilotiScreenPosition(pilotiId) ?? {x: 24, y: 24};
        params.setPilotiSelection({
          pilotiId,
          currentHeight: pilotiData.height,
          currentIsMaster: pilotiData.isMaster,
          currentNivel: pilotiData.nivel,
          group: topGroup,
          screenPosition,
          houseView: "top",
        });
        params.setIsPilotiEditorOpen(true);
        return true;
      },

      closePilotiEditor: () => {
        params.setIsPilotiEditorOpen(false);
        params.setPilotiSelection(null);
      },

      removeView: (viewType: ViewType, side?: HouseSide) => {
        const canvas = params.canvasRef.current?.canvas;
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
        const canvas = params.canvasRef.current?.canvas;
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
        const handle = params.canvasRef.current;
        if (!handle) return null;
        return handle.getCanvasPosition();
      },

      setCanvasPosition: (x: number, y: number) => {
        const handle = params.canvasRef.current;
        if (!handle) return false;
        handle.setCanvasPosition(x, y);
        return true;
      },

      selectCanvasObjectByMyType: (myType: string, fromEnd = true) => {
        const canvas = params.canvasRef.current?.canvas;
        if (!canvas) return false;

        const objects =
          canvas.getObjects().filter((obj: any) => obj.myType === myType);
        if (objects.length === 0) return false;

        const target = fromEnd ? objects[objects.length - 1] : objects[0];
        canvas.setActiveObject(target);
        canvas.requestRenderAll();
        return true;
      },

      getCanvasObjectsSummary: () => {
        const canvas = params.canvasRef.current?.canvas;
        if (!canvas) return null;
        return canvas.getObjects().map((obj: any) => ({
          type: obj.type ?? null,
          myType: obj.myType ?? null,
        }));
      },

      getUiState: () => ({
        showTips: params.showTipsRef.current,
        showZoomControls: params.showZoomControlsRef.current,
      }),
    };

    return () => {
      delete (window as any).__racDebug;
    };
  }, [
    params.canvasRef,
    params.showTipsRef,
    params.showZoomControlsRef,
    params.setPilotiSelection,
    params.setIsPilotiEditorOpen,
  ]);
}
