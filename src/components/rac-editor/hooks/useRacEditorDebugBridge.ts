import {Dispatch, MutableRefObject, SetStateAction, useEffect} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {useHouseSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorDebugBridgeParams {
  canvasRef: MutableRefObject<CanvasHandle | null>;
  showTipsRef: MutableRefObject<boolean>;
  showZoomControlsRef: MutableRefObject<boolean>;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
}

type RacDebugWindow = Window & { __racDebug?: Record<string, unknown> };
type CanvasPilotiObject = { pilotiId?: string; isPilotiCircle?: boolean; left?: number; top?: number };

export function useRacEditorDebugBridge(params: UseRacEditorDebugBridgeParams): void {

  const {
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  } = params;
  const houseSnapshot = useHouseSnapshot();
  const {houseReadPort, houseWritePort} = useEditorPorts();

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const getPilotiData = (pilotiId: string) =>
      houseReadPort.getPilotis()?.[pilotiId] ?? {...DEFAULT_HOUSE_PILOTI};

    const getPilotiScreenPosition = (pilotiId: string) => {
      const topGroup = houseSnapshot?.views.top?.[0]?.group;
      if (!topGroup) return null;

      const piloti = topGroup.getObjects().find((obj) => {
        const pilotiObject = obj as unknown as CanvasPilotiObject;
        return pilotiObject.pilotiId === pilotiId && pilotiObject.isPilotiCircle === true;
      }) as unknown as CanvasPilotiObject | undefined;

      if (!piloti) return null;

      const pilotiLeft = piloti.left || 0;
      const pilotiTop = piloti.top || 0;

      return canvasRef.current?.getGroupLocalPointScreenPosition(
        topGroup,
        {x: pilotiLeft, y: pilotiTop},
      ) ?? null;
    };

    (window as RacDebugWindow).__racDebug = {
      getHouse: () => houseSnapshot,

      getPilotiData,

      getHousePiloti: getPilotiData,

      updatePiloti: (pilotiId: string, payload: { isMaster?: boolean; height?: number; nivel?: number }) =>
        houseWritePort.updatePiloti(pilotiId, payload),

      getPilotiScreenPosition,

      openPilotiEditor: (pilotiId: string) => {
        const topGroup = houseSnapshot?.views.top?.[0]?.group;
        const pilotiData = getPilotiData(pilotiId);
        if (!topGroup || !pilotiData) return false;

        const screenPosition = getPilotiScreenPosition(pilotiId) ?? {x: 24, y: 24};
        setPilotiSelection({
          pilotiId,
          currentHeight: pilotiData.height,
          currentIsMaster: pilotiData.isMaster,
          currentNivel: pilotiData.nivel,
          editorSelection: {
            type: 'piloti',
            pilotiId,
            houseView: 'top',
            screenPosition,
          },
          pilotiIds: getAllPilotiIds(),
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
        const debugPort = canvasRef.current?.createDebugPort();
        if (!debugPort || !houseSnapshot) return false;

        const instances = houseSnapshot.views[viewType] ?? [];
        if (instances.length === 0) return false;

        const target =
          side
            ? instances.find((instance) => instance.side === side)
            : instances[instances.length - 1];
        if (!target) return false;

        debugPort.removeObject(target.group);
        houseWritePort.removeView(target.group);
        return true;
      },

      getCanvasScreenCenter: () => {
        return canvasRef.current?.createDebugPort()?.getCanvasScreenCenter() ?? null;
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
        return canvasRef.current?.createDebugPort()
          ?.selectObjectByMyType(myType, fromEnd, triggerInlineEditor) ?? false;
      },

      getActiveCanvasObjectSummary: () => {
        return canvasRef.current?.createDebugPort()?.getActiveObjectSummary() ?? null;
      },

      getCanvasObjectsSummary: () => {
        return canvasRef.current?.createDebugPort()?.getObjectsSummary() ?? null;
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
    houseReadPort,
    houseSnapshot,
    houseWritePort,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    showTipsRef,
    showZoomControlsRef,
  ]);
}
