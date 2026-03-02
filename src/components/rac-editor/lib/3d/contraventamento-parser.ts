import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {CanvasGroup, getCanvasGroupObjects} from '@/components/rac-editor/lib/canvas';

export interface Contraventamento3DData {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
}

export function parseContraventamentosFromTopView(
  topViewGroup: CanvasGroup | null | undefined
): Contraventamento3DData[] {
  if (!topViewGroup) return [];

  const parsedContraventamentos: Contraventamento3DData[] = [];
  getCanvasGroupObjects(topViewGroup).forEach((obj, index) => {
    if (!obj?.isContraventamento) return;

    const col = Number(obj.contraventamentoCol);
    const startRowRaw = Number(obj.contraventamentoStartRow);
    const endRowRaw = Number(obj.contraventamentoEndRow);
    if (!Number.isInteger(col) || col < 0 || col > 3) return;
    if (!Number.isInteger(startRowRaw) || !Number.isInteger(endRowRaw)) return;

    const startRow = Math.min(startRowRaw, endRowRaw);
    const endRow = Math.max(startRowRaw, endRowRaw);
    if (startRow === endRow || startRow < 0 || endRow > 2) return;

    const side = obj.contraventamentoSide === 'left' || obj.contraventamentoSide === 'right'
      ? obj.contraventamentoSide
      : 'right';

    const anchorPilotiId =
      typeof obj.contraventamentoAnchorPilotiId === 'string' && obj.contraventamentoAnchorPilotiId
        ? obj.contraventamentoAnchorPilotiId
        : `piloti_${col}_${startRow}`;

    const id = String(obj.contraventamentoId ?? `contrav_3d_${index}`);
    parsedContraventamentos.push({id, col, startRow, endRow, side, anchorPilotiId});
  });

  return parsedContraventamentos;
}
