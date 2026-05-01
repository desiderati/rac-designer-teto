import type {CanvasDebugHandle} from '@/components/rac-editor/@canvas/ports/CanvasDebugHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {DEFAULT_HOUSE_PILOTI, type HouseSide, type HouseViewType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

type RacDebugWindow = Window & { __racDebug?: Record<string, unknown> };
type CanvasPilotiObject = { pilotiId?: string; isPilotiCircle?: boolean; left?: number; top?: number };
type DebugCanvasHandle = CanvasDebugHandle & CanvasScreenProjectionHandle & CanvasViewportHandle;

interface RacEditorDebugBridgeArgs {
  getCanvasHandle: () => DebugCanvasHandle | null;
  getShowTips: () => boolean;
  getShowZoomControls: () => boolean;
  houseReadPort: Pick<HouseReadPort, 'getPilotis'>;
  houseWritePort: Pick<HouseWritePort, 'removeView' | 'updatePiloti'>;
  houseSnapshot: HouseRuntimeSnapshot<CanvasGroup> | null;
  setPilotiSelection(selection: PilotiCanvasSelection | null): void;
  setIsPilotiEditorOpen(isOpen: boolean): void;
}

export function installRacEditorDebugBridge(args: RacEditorDebugBridgeArgs): () => void {
  const getPilotiData = (pilotiId: string) =>
    args.houseReadPort.getPilotis()?.[pilotiId] ?? {...DEFAULT_HOUSE_PILOTI};

  const getPilotiScreenPosition = (pilotiId: string) => {
    const topGroup = args.houseSnapshot?.views.top?.[0]?.group;
    if (!topGroup) return null;

    const piloti = topGroup.getObjects().find((obj) => {
      const pilotiObject = obj as unknown as CanvasPilotiObject;
      return pilotiObject.pilotiId === pilotiId && pilotiObject.isPilotiCircle === true;
    }) as unknown as CanvasPilotiObject | undefined;

    if (!piloti) return null;

    return args.getCanvasHandle()?.getGroupLocalPointScreenPosition(
      topGroup,
      {x: piloti.left || 0, y: piloti.top || 0},
    ) ?? null;
  };

  (window as RacDebugWindow).__racDebug = {
    getHouse: () => args.houseSnapshot,

    getPilotiData,

    getHousePiloti: getPilotiData,

    updatePiloti: (pilotiId: string, payload: { isMaster?: boolean; height?: number; nivel?: number }) =>
      args.houseWritePort.updatePiloti(pilotiId, payload),

    getPilotiScreenPosition,

    openPilotiEditor: (pilotiId: string) => {
      const topGroup = args.houseSnapshot?.views.top?.[0]?.group;
      const pilotiData = getPilotiData(pilotiId);
      if (!topGroup || !pilotiData) return false;

      const screenPosition = getPilotiScreenPosition(pilotiId) ?? {x: 24, y: 24};
      args.setPilotiSelection({
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
      args.setIsPilotiEditorOpen(true);
      return true;
    },

    closePilotiEditor: () => {
      args.setIsPilotiEditorOpen(false);
      args.setPilotiSelection(null);
    },

    removeView: (viewType: HouseViewType, side?: HouseSide) => {
      const debugPort = args.getCanvasHandle()?.createDebugPort();
      if (!debugPort || !args.houseSnapshot) return false;

      const instances = args.houseSnapshot.views[viewType] ?? [];
      if (instances.length === 0) return false;

      const target =
        side
          ? instances.find((instance) => instance.side === side)
          : instances[instances.length - 1];
      if (!target) return false;

      debugPort.removeObject(target.group);
      args.houseWritePort.removeView(target.instanceId);
      return true;
    },

    getCanvasScreenCenter: () => {
      return args.getCanvasHandle()?.createDebugPort()?.getCanvasScreenCenter() ?? null;
    },

    getCanvasPosition: () => {
      return args.getCanvasHandle()?.getCanvasPosition() ?? null;
    },

    setCanvasPosition: (x: number, y: number) => {
      const handle = args.getCanvasHandle();
      if (!handle) return false;
      handle.setCanvasPosition(x, y);
      return true;
    },

    selectCanvasObjectByMyType: (myType: string, fromEnd = true, triggerInlineEditor = false) => {
      return args.getCanvasHandle()?.createDebugPort()
        ?.selectObjectByMyType(myType, fromEnd, triggerInlineEditor) ?? false;
    },

    getActiveCanvasObjectSummary: () => {
      return args.getCanvasHandle()?.createDebugPort()?.getActiveObjectSummary() ?? null;
    },

    getCanvasObjectsSummary: () => {
      return args.getCanvasHandle()?.createDebugPort()?.getObjectsSummary() ?? null;
    },

    getUiState: () => ({
      showTips: args.getShowTips(),
      showZoomControls: args.getShowZoomControls(),
    }),
  };

  return () => {
    delete (window as RacDebugWindow).__racDebug;
  };
}
