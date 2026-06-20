import type {
  ContraventamentoHorizontalSide,
  ContraventamentoOrientation,
  ContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {
  getAllowedHorizontalContraventamentoSidesForRow,
  canUseHorizontalContraventamentoSideInRow,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';
import type {House3DTopViewProjection} from '@/components/rac-editor/ports/House3DProjectionPort.ts';

export interface VerticalContraventamento3DData {
  id: string;
  orientation: 'vertical';
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoVerticalSide;
  anchorPilotiId: string;
}

export interface HorizontalContraventamento3DData {
  id: string;
  orientation: 'horizontal';
  row: number;
  startCol: number;
  endCol: number;
  side: ContraventamentoHorizontalSide;
  anchorPilotiId: string;
}

export type Contraventamento3DData = VerticalContraventamento3DData | HorizontalContraventamento3DData;

export function parseContraventamentosFromTopView(
  topView: House3DTopViewProjection | null | undefined
): Contraventamento3DData[] {
  if (!topView) return [];

  const parsedContraventamentos: Contraventamento3DData[] = [];
  topView.contraventamentos.forEach((item, index) => {
    const id = String(item.id ?? `contrav_3d_${index}`);
    const orientation: ContraventamentoOrientation =
      item.orientation === 'horizontal' ? 'horizontal' : 'vertical';

    if (orientation === 'horizontal') {
      const row = Number(item.row);
      const startColRaw = Number(item.startCol);
      const endColRaw = Number(item.endCol);
      if (!Number.isInteger(row) || row < 0 || row > 2) return;
      if (!Number.isInteger(startColRaw) || !Number.isInteger(endColRaw)) return;

      const startCol = Math.min(startColRaw, endColRaw);
      const endCol = Math.max(startColRaw, endColRaw);
      if (startCol === endCol || startCol < 0 || endCol > 3) return;

      const fallbackSide: ContraventamentoHorizontalSide =
        getAllowedHorizontalContraventamentoSidesForRow(row)[0] ?? 'bottom';
      const requestedSide = isContraventamentoHorizontalSide(item.side) ? item.side : null;
      const side = canUseHorizontalContraventamentoSideInRow({row, side: requestedSide})
        ? requestedSide
        : fallbackSide;

      const anchorPilotiId =
        typeof item.anchorPilotiId === 'string' && item.anchorPilotiId
          ? item.anchorPilotiId
          : `piloti_${startCol}_${row}`;

      parsedContraventamentos.push({id, orientation, row, startCol, endCol, side, anchorPilotiId});
      return;
    }

    const col = Number(item.col);
    const startRowRaw = Number(item.startRow);
    const endRowRaw = Number(item.endRow);
    if (!Number.isInteger(col) || col < 0 || col > 3) return;
    if (!Number.isInteger(startRowRaw) || !Number.isInteger(endRowRaw)) return;

    const startRow = Math.min(startRowRaw, endRowRaw);
    const endRow = Math.max(startRowRaw, endRowRaw);
    if (startRow === endRow || startRow < 0 || endRow > 2) return;

    const side = isContraventamentoVerticalSide(item.side)
      ? item.side
      : 'right';

    const anchorPilotiId =
      typeof item.anchorPilotiId === 'string' && item.anchorPilotiId
        ? item.anchorPilotiId
        : `piloti_${col}_${startRow}`;

    parsedContraventamentos.push({id, orientation, col, startRow, endRow, side, anchorPilotiId});
  });

  return parsedContraventamentos;
}
