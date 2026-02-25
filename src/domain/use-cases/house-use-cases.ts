import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI_HEIGHTS,
  HOUSE_VIEW_LIMITS,
  HousePiloti,
  HouseTypeExcludeNull,
  HouseViewType,
} from '@/shared/types/house.ts';
import {PILOTI_CORNER_ID} from '@/config.ts';

export function getMaxViewCountForType(
  houseType: HouseTypeExcludeNull | null,
  viewType: HouseViewType,
): number {
  if (!houseType) return 0;
  return HOUSE_VIEW_LIMITS[houseType][viewType];
}

export function canAddViewForType(
  houseType: HouseTypeExcludeNull | null,
  viewType: HouseViewType,
  currentCount: number,
): boolean {
  if (!houseType) return false;
  return currentCount < getMaxViewCountForType(houseType, viewType);
}

export function isViewAtLimitForType(
  houseType: HouseTypeExcludeNull | null,
  viewType: HouseViewType,
  currentCount: number,
): boolean {
  if (!houseType) return true;
  return currentCount >= getMaxViewCountForType(houseType, viewType);
}

export function getAvailableViewsByCounts(params: {
  houseType: HouseTypeExcludeNull | null;
  counts: Record<HouseViewType, number>;
}): HouseViewType[] {
  return ALL_HOUSE_VIEW_TYPES.filter((viewType) =>
    !isViewAtLimitForType(params.houseType, viewType, params.counts[viewType]),
  );
}

interface ApplyPilotiUpdateWithSingleMasterRuleParams {
  pilotis: Record<string, HousePiloti>;
  pilotiId: string;
  patch: Partial<HousePiloti>;
  defaultPiloti: HousePiloti;
}

interface ApplyPilotiUpdateWithSingleMasterRuleResult {
  pilotis: Record<string, HousePiloti>;
  clearedMasters: string[];
}

export function applyPilotiUpdateWithSingleMasterRule({
  pilotis,
  pilotiId,
  patch,
  defaultPiloti,
}: ApplyPilotiUpdateWithSingleMasterRuleParams): ApplyPilotiUpdateWithSingleMasterRuleResult {
  const nextPilotis: Record<string, HousePiloti> = {...pilotis};
  const clearedMasters: string[] = [];

  if (patch.isMaster === true) {
    Object.entries(nextPilotis).forEach(([id, data]) => {
      if (id !== pilotiId && data.isMaster) {
        nextPilotis[id] = {...data, isMaster: false};
        clearedMasters.push(id);
      }
    });
  }

  const current = nextPilotis[pilotiId] ?? defaultPiloti;
  nextPilotis[pilotiId] = {...current, ...patch};

  return {pilotis: nextPilotis, clearedMasters};
}

interface CalculateRecommendedPilotiDataParams {
  pilotis: Record<string, HousePiloti>;
  defaultPiloti: HousePiloti;
}

export function calculateRecommendedPilotiData({
  pilotis,
  defaultPiloti,
}: CalculateRecommendedPilotiDataParams): Record<string, HousePiloti> {
  const nextPilotis: Record<string, HousePiloti> = {...pilotis};

  const a1 = pilotis[PILOTI_CORNER_ID.topLeft]?.nivel ?? defaultPiloti.nivel;
  const a4 = pilotis[PILOTI_CORNER_ID.topRight]?.nivel ?? defaultPiloti.nivel;
  const c1 = pilotis[PILOTI_CORNER_ID.bottomLeft]?.nivel ?? defaultPiloti.nivel;
  const c4 = pilotis[PILOTI_CORNER_ID.bottomRight]?.nivel ?? defaultPiloti.nivel;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const id = `piloti_${col}_${row}`;
      const u = col / 3;
      const v = row / 2;

      const nivel = (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
      const minHeight = nivel * 3;
      const height =
        DEFAULT_HOUSE_PILOTI_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;

      nextPilotis[id] = {
        ...(nextPilotis[id] ?? defaultPiloti),
        nivel: round2(nivel),
        height,
      };
    }
  }

  return nextPilotis;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
