import type {HousePiloti} from '@/shared/types/house.ts';
import {PILOTI_CORNER_ID, PILOTI_CORNER_IDS} from '@/shared/config.ts';
import {getRecommendedHeight} from '@/shared/types/piloti.ts';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Recalcula níveis e alturas recomendadas dos pilotis pela interpolação
 * bilinear dos quatro cantos estruturais da casa.
 */
export function recalculateRecommendedPilotiData(params: {
  pilotis: Record<string, HousePiloti>;
  defaultPiloti: HousePiloti;
  recalculateHeight?: boolean;
  availableHeights?: readonly number[];
}): Record<string, HousePiloti> {
  const nextPilotis: Record<string, HousePiloti> = {...params.pilotis};
  const recalculateHeight = params.recalculateHeight ?? true;

  const a1 = params.pilotis[PILOTI_CORNER_ID.topLeft]?.nivel ?? params.defaultPiloti.nivel;
  const a4 = params.pilotis[PILOTI_CORNER_ID.topRight]?.nivel ?? params.defaultPiloti.nivel;
  const c1 = params.pilotis[PILOTI_CORNER_ID.bottomLeft]?.nivel ?? params.defaultPiloti.nivel;
  const c4 = params.pilotis[PILOTI_CORNER_ID.bottomRight]?.nivel ?? params.defaultPiloti.nivel;

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const id = `piloti_${col}_${row}`;
      const u = col / 3;
      const v = row / 2;

      const nivel = (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
      const height = getRecommendedHeight(nivel, params.availableHeights);

      nextPilotis[id] = {
        ...(nextPilotis[id] ?? params.defaultPiloti),
        nivel: round2(nivel),
        ...(recalculateHeight ? {height} : {}),
      };
    }
  }

  return nextPilotis;
}

/**
 * Decide quais efeitos lógicos uma alteração de piloti deve acionar.
 *
 * A decisão é independente de canvas: quem chama escolhe como sincronizar a
 * representação visual depois que o domínio informa o impacto da mudança.
 */
export function resolvePilotiUpdateEffects(params: {
  pilotiId: string;
  pilotiData: Partial<HousePiloti>;
  previousPiloti: HousePiloti | null;
  hasTopView: boolean;
}): {
  hasNivelChange: boolean;
  shouldRefreshAutoContraventamento: boolean;
  shouldRecalculateInterpolatedNiveis: boolean;
} {
  const hasNivelChange =
    params.pilotiData.nivel !== undefined
    && params.previousPiloti?.nivel !== Number(params.pilotiData.nivel);

  return {
    hasNivelChange,
    shouldRefreshAutoContraventamento: hasNivelChange && params.hasTopView,
    shouldRecalculateInterpolatedNiveis:
      PILOTI_CORNER_IDS.includes(params.pilotiId)
      && hasNivelChange,
  };
}
