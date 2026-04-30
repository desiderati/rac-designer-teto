import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import type {House3DTopViewProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';

export interface Contraventamento3DData {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
}

export function parseContraventamentosFromTopView(
  topView: House3DTopViewProjection | null | undefined
): Contraventamento3DData[] {
  if (!topView) return [];

  const parsedContraventamentos: Contraventamento3DData[] = [];
  topView.contraventamentos.forEach((item, index) => {
    const col = Number(item.col);
    const startRowRaw = Number(item.startRow);
    const endRowRaw = Number(item.endRow);
    if (!Number.isInteger(col) || col < 0 || col > 3) return;
    if (!Number.isInteger(startRowRaw) || !Number.isInteger(endRowRaw)) return;

    const startRow = Math.min(startRowRaw, endRowRaw);
    const endRow = Math.max(startRowRaw, endRowRaw);
    if (startRow === endRow || startRow < 0 || endRow > 2) return;

    const side = item.side === 'left' || item.side === 'right'
      ? item.side
      : 'right';

    const anchorPilotiId =
      typeof item.anchorPilotiId === 'string' && item.anchorPilotiId
        ? item.anchorPilotiId
        : `piloti_${col}_${startRow}`;

    const id = String(item.id ?? `contrav_3d_${index}`);
    parsedContraventamentos.push({id, col, startRow, endRow, side, anchorPilotiId});
  });

  return parsedContraventamentos;
}
