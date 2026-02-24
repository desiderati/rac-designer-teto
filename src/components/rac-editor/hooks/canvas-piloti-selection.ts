import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {formatPilotiHeight, getPilotiFromGroup} from '@/lib/canvas-utils';
import {applyPilotiSelectionVisuals} from '@/lib/canvas/piloti-visual-feedback';
import {CanvasRuntimeObject} from "@/components/rac-editor/hooks/canvas-fabric-runtime-types.ts";

interface PilotiRuntimeObject extends FabricObject {
  houseView?: string;
  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  isPilotiHitArea?: boolean;
  pilotiId?: string;
  pilotiHeight?: number;
  pilotiIsMaster?: boolean;
  pilotiNivel?: number;
}

interface PilotiSelectionPayload {
  pilotiId: string;
  currentHeight: number;
  currentIsMaster: boolean;
  currentNivel: number;
  group: Group;
  screenPosition: {x: number; y: number};
  houseView: 'top' | 'front' | 'back' | 'side';
}

interface BuildPilotiSelectionHandlerArgs {
  canvas: FabricCanvas;
  isPilotiVisualTarget: (object: FabricObject | null | undefined) => object is PilotiRuntimeObject;
  emitPilotiSelection: (selection: PilotiSelectionPayload | null) => void;
  emitSelectionChange: (hint: string) => void;
  clearContraventamentoSelection: () => void;
  isContraventamentoMode: () => boolean;
  isSelectingContraventamentoDestination: () => boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onContraventamentoCancel: () => void;
  onContraventamentoPilotiClick: (pilotiId: string, col: number, row: number, group: Group) => void;
  getCurrentScreenPoint: (canvasPoint: {x: number; y: number}) => {x: number; y: number} | null;
}

function normalizeHouseView(value: string | undefined): PilotiSelectionPayload['houseView'] {
  if (value === 'front' || value === 'back' || value === 'side' || value === 'top') {
    return value;
  }
  return 'top';
}

export function buildPilotiSelectionHandler({
  canvas,
  isPilotiVisualTarget,
  emitPilotiSelection,
  emitSelectionChange,
  clearContraventamentoSelection,
  isContraventamentoMode,
  isSelectingContraventamentoDestination,
  isPilotiEligibleForContraventamento,
  onContraventamentoCancel,
  onContraventamentoPilotiClick,
  getCurrentScreenPoint,
}: BuildPilotiSelectionHandlerArgs) {
  return (subTarget: FabricObject, target: FabricObject) => {
    const group = target as Group;
    const runtimeSubTarget = subTarget as CanvasRuntimeObject
    const pilotiId = typeof runtimeSubTarget?.pilotiId === 'string' ? runtimeSubTarget.pilotiId : '';
    if (!pilotiId) return;

    let piloti: FabricObject | null = null;
    let pilotiHeight = 1.0;
    let pilotiIsMaster = false;
    let pilotiNivel = 0.2;

    if (runtimeSubTarget?.isPilotiHitArea) {
      const pilotiData = getPilotiFromGroup(group, pilotiId);
      if (pilotiData) {
        piloti = pilotiData.circle;
        pilotiHeight = pilotiData.height;
        pilotiIsMaster = pilotiData.isMaster;
        pilotiNivel = pilotiData.nivel;
      }
    } else if (isPilotiVisualTarget(subTarget)) {
      piloti = subTarget;
      pilotiHeight = runtimeSubTarget?.pilotiHeight || 1.0;
      pilotiIsMaster = runtimeSubTarget?.pilotiIsMaster || false;
      pilotiNivel = runtimeSubTarget?.pilotiNivel ?? 0.2;
    }

    if (!piloti) return;

    clearContraventamentoSelection();

    const groupRuntime = group as CanvasRuntimeObject;
    if (
      isContraventamentoMode() &&
      groupRuntime?.houseView === 'top' &&
      (runtimeSubTarget?.isPilotiCircle || runtimeSubTarget?.isPilotiHitArea)
    ) {
      const eligible = isPilotiEligibleForContraventamento(pilotiId);
      if (!eligible) {
        if (isSelectingContraventamentoDestination()) {
          onContraventamentoCancel();
        }
        return;
      }

      const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
      if (!match) return;

      const col = parseInt(match[1], 10);
      const row = parseInt(match[2], 10);
      onContraventamentoPilotiClick(pilotiId, col, row, group);
      return;
    }

    const pilotiCenter = piloti.getCenterPoint();
    const screenPoint = getCurrentScreenPoint({
      x: pilotiCenter.x,
      y: pilotiCenter.y,
    });
    if (!screenPoint) return;

    applyPilotiSelectionVisuals(canvas.getObjects(), pilotiId);
    canvas.renderAll();

    emitPilotiSelection({
      pilotiId,
      currentHeight: pilotiHeight,
      currentIsMaster: pilotiIsMaster,
      currentNivel: pilotiNivel,
      group,
      screenPosition: screenPoint,
      houseView: normalizeHouseView(groupRuntime?.houseView),
    });

    emitSelectionChange(`Piloti selecionado – Altura atual: ${formatPilotiHeight(pilotiHeight)} m.`);
  };
}
