import {DEFAULT_HOUSE_PILOTI_HEIGHTS, type HouseSide} from '@/shared/types/house.ts';
import {PILOTI_BASE_HEIGHT_PX, PILOTI_DEFAULT_NIVEL} from "../constants";

export const getPilotiIdsForSide =
  (side: HouseSide): string[] => {
    switch (side) {
      case 'top':
        return ['piloti_0_0', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0'];

      case 'bottom':
        return ['piloti_0_2', 'piloti_1_2', 'piloti_2_2', 'piloti_3_2'];

      case 'left':
        return ['piloti_0_0', 'piloti_0_1', 'piloti_0_2'];

      case 'right':
        return ['piloti_3_0', 'piloti_3_1', 'piloti_3_2'];

      default:
        return [];
    }
  };

export function resolveDoorSideCornerIds(
  side: HouseSide
): { leftId: string; rightId: string } {
  if (side === 'top') return {leftId: 'piloti_0_0', rightId: 'piloti_3_0'};
  if (side === 'bottom') return {leftId: 'piloti_0_2', rightId: 'piloti_3_2'};
  if (side === 'left') return {leftId: 'piloti_0_0', rightId: 'piloti_0_2'};
  return {leftId: 'piloti_3_0', rightId: 'piloti_3_2'};
}

export function parsePilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

export function isPilotiOutOfProportion(height: number, nivel: number): boolean {
  if (!Number.isFinite(height) || !Number.isFinite(nivel)) return false;
  if (height <= 0 || nivel <= 0) return false;

  // Regra estrutural base: nível = 1/3 da altura total do piloti.
  return height + 0.0001 < (nivel * 3);
}

export function clampNivelByHeight(nivel: number, pilotiHeight: number): number {
  const maxNivel = Math.round((pilotiHeight / 2) * 100) / 100;
  return clampNivel(nivel, PILOTI_DEFAULT_NIVEL, maxNivel);
}

export function clampNivel(nivel: number, minNivel: number = PILOTI_DEFAULT_NIVEL, maxNivel: number = 1.50): number {
  return Math.round(Math.max(minNivel, Math.min(nivel, maxNivel)) * 100) / 100;
}

export function formatPilotiHeight(height: number): string {
  return height.toFixed(1).replace('.', ',');
}

export function formatNivel(nivel: number): string {
  return nivel.toFixed(2).replace('.', ',');
}

export function getRecommendedHeight(nivel: number): number {
  // Nivel = 1/3 Piloti :)
  const minHeight = nivel * 3;
  return DEFAULT_HOUSE_PILOTI_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;
}

// Get piloti name from ID (e.g., "piloti_0_0" -> "A1")
export function getPilotiName(pilotiId: string): string {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return pilotiId;

  const col = parseInt(match[1], 10);
  const row = parseInt(match[2], 10);

  const rowLetter = String.fromCharCode(65 + row); // 0 -> A, 1 -> B, 2 -> C
  const colNumber = col + 1; // 0 -> 1, 1 -> 2, etc.

  return `${rowLetter}${colNumber}`;
}

// Get ordered list of all piloti IDs
export function getAllPilotiIds(): string[] {
  const ids: string[] = [];
  // Order: A1, A2, A3, A4, B1, B2, B3, B4, C1, C2, C3, C4
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ids.push(`piloti_${col}_${row}`);
    }
  }
  return ids;
}

// Calculate piloti visual height based on pilotiHeight value
export function getPilotiVisualHeight(pilotiHeight: number, scale: number): number {
  return PILOTI_BASE_HEIGHT_PX * pilotiHeight * scale;
}
