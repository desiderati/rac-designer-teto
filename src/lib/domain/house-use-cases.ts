export type DomainHouseType = "tipo6" | "tipo3";
export type DomainViewType = "top" | "front" | "back" | "side1" | "side2";
export const ALL_VIEW_TYPES: DomainViewType[] = ["top", "front", "back", "side1", "side2"];

export interface DomainPilotiData {
  height: number;
  isMaster: boolean;
  nivel: number;
}

export const HOUSE_VIEW_LIMITS: Record<DomainHouseType, Record<DomainViewType, number>> = {
  tipo6: {
    top: 1,
    front: 1,
    back: 1,
    side1: 2,
    side2: 0,
  },
  tipo3: {
    top: 1,
    front: 0,
    back: 2,
    side1: 1,
    side2: 1,
  },
};

export const STANDARD_PILOTI_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0] as const;

export function getMaxViewCountForType(
  houseType: DomainHouseType | null,
  viewType: DomainViewType,
): number {
  if (!houseType) return 0;
  return HOUSE_VIEW_LIMITS[houseType][viewType];
}

export function canAddViewForType(
  houseType: DomainHouseType | null,
  viewType: DomainViewType,
  currentCount: number,
): boolean {
  if (!houseType) return false;
  return currentCount < getMaxViewCountForType(houseType, viewType);
}

export function isViewAtLimitForType(
  houseType: DomainHouseType | null,
  viewType: DomainViewType,
  currentCount: number,
): boolean {
  if (!houseType) return true;
  return currentCount >= getMaxViewCountForType(houseType, viewType);
}

export function getAvailableViewsByCounts(params: {
  houseType: DomainHouseType | null;
  counts: Record<DomainViewType, number>;
}): DomainViewType[] {
  return ALL_VIEW_TYPES.filter((viewType) =>
    !isViewAtLimitForType(params.houseType, viewType, params.counts[viewType]),
  );
}

interface ApplyPilotiUpdateParams {
  pilotis: Record<string, DomainPilotiData>;
  pilotiId: string;
  patch: Partial<DomainPilotiData>;
  defaultPiloti: DomainPilotiData;
}

interface ApplyPilotiUpdateResult {
  pilotis: Record<string, DomainPilotiData>;
  clearedMasters: string[];
}

export function applyPilotiUpdateWithSingleMasterRule({
  pilotis,
  pilotiId,
  patch,
  defaultPiloti,
}: ApplyPilotiUpdateParams): ApplyPilotiUpdateResult {
  const nextPilotis: Record<string, DomainPilotiData> = {...pilotis};
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
  pilotis: Record<string, DomainPilotiData>;
  defaultPiloti: DomainPilotiData;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateRecommendedPilotiData({
  pilotis,
  defaultPiloti,
}: CalculateRecommendedPilotiDataParams): Record<string, DomainPilotiData> {
  const nextPilotis: Record<string, DomainPilotiData> = {...pilotis};

  const a1 = pilotis["piloti_0_0"]?.nivel ?? defaultPiloti.nivel;
  const a4 = pilotis["piloti_3_0"]?.nivel ?? defaultPiloti.nivel;
  const c1 = pilotis["piloti_0_2"]?.nivel ?? defaultPiloti.nivel;
  const c4 = pilotis["piloti_3_2"]?.nivel ?? defaultPiloti.nivel;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const id = `piloti_${col}_${row}`;
      const u = col / 3;
      const v = row / 2;

      const nivel = (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
      const minHeight = nivel * 3;
      const height = STANDARD_PILOTI_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;

      nextPilotis[id] = {
        ...(nextPilotis[id] ?? defaultPiloti),
        nivel: round2(nivel),
        height,
      };
    }
  }

  return nextPilotis;
}
