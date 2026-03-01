import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {CanvasObject, formatPilotiHeight, getPilotiFromGroup, toCanvasObject} from '@/components/rac-editor/lib/canvas/index.ts';
import {applyPilotiSelectionVisuals} from '@/components/rac-editor/lib/canvas/piloti-visual-feedback.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';

export interface PilotiCanvasSelection {
  pilotiId: string;
  currentIsMaster: boolean;
  currentHeight: number;
  currentNivel: number;
  group: Group;
  screenPosition: { x: number; y: number };
  houseView: 'top' | 'front' | 'back' | 'side';
}

interface BuildPilotiSelectionHandlerArgs {
  canvas: FabricCanvas;
  isPilotiVisualTarget: (object: FabricObject | null | undefined) => object is CanvasObject;
  emitPilotiSelection: (selection: PilotiCanvasSelection | null) => void;
  emitSelectionChange: (hint: string) => void;
  isContraventamentoMode: () => boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onContraventamentoCancel: () => void;
  onContraventamentoPilotiClick: (col: number, row: number) => void;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
}

export function buildPilotiSelectionHandler({
  canvas,
  isPilotiVisualTarget,
  emitPilotiSelection,
  emitSelectionChange,
  isContraventamentoMode,
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

    const groupRuntime = toCanvasObject(group);
    if (
      isContraventamentoMode() &&
      groupRuntime?.houseView === 'top' &&
      (runtimeSubTarget?.isPilotiCircle || runtimeSubTarget?.isPilotiHitArea)
    ) {
      const eligible = isPilotiEligibleForContraventamento(pilotiId);
      if (!eligible) {
        if (isContraventamentoMode()) {
          onContraventamentoCancel();
        }
        return;
      }

      const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
      if (!match) return;

      const col = parseInt(match[1], 10);
      const row = parseInt(match[2], 10);
      onContraventamentoPilotiClick(col, row);
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

function normalizeHouseView(value: string | undefined): PilotiCanvasSelection['houseView'] {
  if (value === 'front' || value === 'back' || value === 'side' || value === 'top') {
    return value;
  }
  return 'top';
}
