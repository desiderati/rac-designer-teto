export type Contraventamento3DSide = "left" | "right";

export interface Contraventamento3DData {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: Contraventamento3DSide;
  anchorPilotiId: string;
}

interface GroupLike {
  getObjects: () => unknown[];
}

export function parseContraventamentosFromTopGroup(topGroup: GroupLike | null | undefined): Contraventamento3DData[] {
  if (!topGroup) return [];

  const parsedContraventamentos: Contraventamento3DData[] = [];

  topGroup.getObjects().forEach((objRaw, index) => {
    const obj = objRaw as any;
    if (!obj?.isContraventamento) return;

    const col = Number(obj.contraventamentoCol);
    const startRowRaw = Number(obj.contraventamentoStartRow);
    const endRowRaw = Number(obj.contraventamentoEndRow);
    if (!Number.isInteger(col) || col < 0 || col > 3) return;
    if (!Number.isInteger(startRowRaw) || !Number.isInteger(endRowRaw)) return;

    const startRow = Math.min(startRowRaw, endRowRaw);
    const endRow = Math.max(startRowRaw, endRowRaw);
    if (startRow === endRow || startRow < 0 || endRow > 2) return;

    const side = obj.contraventamentoSide === "left" || obj.contraventamentoSide === "right"
      ? obj.contraventamentoSide
      : "right";

    const anchorPilotiId = typeof obj.contraventamentoAnchorPilotiId === "string" && obj.contraventamentoAnchorPilotiId
      ? obj.contraventamentoAnchorPilotiId
      : `piloti_${col}_${startRow}`;

    const id = String(obj.contraventamentoId ?? `contrav_3d_${index}`);
    parsedContraventamentos.push({id, col, startRow, endRow, side, anchorPilotiId});
  });

  return parsedContraventamentos;
}
