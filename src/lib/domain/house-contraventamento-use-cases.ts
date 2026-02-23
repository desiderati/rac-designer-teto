export type DomainContraventamentoSide = "left" | "right";

export interface DomainContraventamentoSidesOccupation {
  left: boolean;
  right: boolean;
}

export interface DomainContraventamentoEditorState {
  leftDisabled: boolean;
  rightDisabled: boolean;
  leftActive: boolean;
  rightActive: boolean;
}

const CONTRAVENTAMENTO_COLUMN_SPACING = 155 * 0.6;
const CONTRAVENTAMENTO_COLUMN_CENTERS = [
  -1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  -0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
];

export function parsePilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

export function canCreateContraventamentoForNivel(nivel: number): boolean {
  return nivel > 0.4;
}

export function getContraventamentoColumnCenterX(col: number): number {
  return CONTRAVENTAMENTO_COLUMN_CENTERS[col] ?? 0;
}

export function inferContraventamentoSideFromBeamGeometry(params: {
  col: number;
  left: number;
  width: number;
  scaleX?: number;
}): DomainContraventamentoSide {
  const centerX = params.left + params.width * (params.scaleX ?? 1) / 2;
  return centerX < getContraventamentoColumnCenterX(params.col) ? "left" : "right";
}

export function isContraventamentoDestinationEligible(params: {
  first: { col: number; row: number } | null;
  candidate: { col: number; row: number };
  nivel: number;
}): boolean {
  if (!params.first) return false;
  if (!canCreateContraventamentoForNivel(params.nivel)) return false;
  return params.candidate.col === params.first.col && params.candidate.row !== params.first.row;
}

export function getContraventamentoSideLabel(side: DomainContraventamentoSide): string {
  return side === "left" ? "esquerdo" : "direito";
}

export interface ContraventamentoObjectCandidate {
  isContraventamento?: unknown;
  contraventamentoCol?: unknown;
  contraventamentoSide?: unknown;
  left?: unknown;
  width?: unknown;
  scaleX?: unknown;
}

export function collectOccupiedContraventamentoSides(params: {
  objects: ContraventamentoObjectCandidate[];
  col: number;
  onResolvedSide?: (object: ContraventamentoObjectCandidate, side: DomainContraventamentoSide) => void;
}): DomainContraventamentoSidesOccupation {
  const occupied: DomainContraventamentoSidesOccupation = {left: false, right: false};

  params.objects.forEach((object) => {
    if (!object.isContraventamento) return;
    if (Number(object.contraventamentoCol) !== params.col) return;

    let side: DomainContraventamentoSide;
    if (object.contraventamentoSide === "left" || object.contraventamentoSide === "right") {
      side = object.contraventamentoSide;
    } else {
      side = inferContraventamentoSideFromBeamGeometry({
        col: params.col,
        left: Number(object.left ?? 0),
        width: Number(object.width ?? 0),
        scaleX: Number(object.scaleX ?? 1),
      });
      params.onResolvedSide?.(object, side);
    }

    occupied[side] = true;
  });

  return occupied;
}

export function createContraventamentoEditorState(params: {
  canReceiveContraventamento: boolean;
  occupiedSides: DomainContraventamentoSidesOccupation;
}): DomainContraventamentoEditorState {
  if (!params.canReceiveContraventamento) {
    return {
      leftDisabled: true,
      rightDisabled: true,
      leftActive: false,
      rightActive: false,
    };
  }

  return {
    leftDisabled: false,
    rightDisabled: false,
    leftActive: params.occupiedSides.left,
    rightActive: params.occupiedSides.right,
  };
}
