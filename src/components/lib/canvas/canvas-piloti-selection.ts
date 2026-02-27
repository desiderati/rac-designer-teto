import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {formatPilotiHeight, getPilotiFromGroup, toCanvasObject} from '@/components/lib/canvas/index.ts';
import {applyPilotiSelectionVisuals} from '@/components/lib/canvas/piloti-visual-feedback.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';

interface PilotiCanvasObject extends FabricObject {
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
  screenPosition: { x: number; y: number };
  houseView: 'top' | 'front' | 'back' | 'side';
}

interface BuildPilotiSelectionHandlerArgs {
  canvas: FabricCanvas;
  isPilotiVisualTarget: (object: FabricObject | null | undefined) => object is PilotiCanvasObject;
  emitPilotiSelection: (selection: PilotiSelectionPayload | null) => void;
  emitSelectionChange: (hint: string) => void;
  clearContraventamentoSelection: () => void;
  isContraventamentoMode: () => boolean;
  isSelectingContraventamentoDestination: () => boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onContraventamentoCancel: () => void;
  onContraventamentoPilotiClick: (pilotiId: string, col: number, row: number, group: Group) => void;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
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
    const runtimeSubTarget = toCanvasObject(subTarget);
    const pilotiId = typeof runtimeSubTarget?.pilotiId === 'string' ? runtimeSubTarget.pilotiId : '';
    if (!pilotiId) return;

    let piloti: FabricObject | null = null;
    let pilotiHeight = DEFAULT_HOUSE_PILOTI.height;
    let pilotiIsMaster = DEFAULT_HOUSE_PILOTI.isMaster;
    let pilotiNivel = DEFAULT_HOUSE_PILOTI.nivel;

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
      pilotiHeight = runtimeSubTarget?.pilotiHeight || DEFAULT_HOUSE_PILOTI.height;
      pilotiIsMaster = runtimeSubTarget?.pilotiIsMaster || false;
      pilotiNivel = runtimeSubTarget?.pilotiNivel ?? DEFAULT_HOUSE_PILOTI.nivel;
    }

    if (!piloti) return;

    clearContraventamentoSelection();

    const groupRuntime = toCanvasObject(group);
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
