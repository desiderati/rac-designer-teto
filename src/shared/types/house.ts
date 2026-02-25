export interface HouseState<TGroup = unknown> {
  id: string;
  houseType: HouseType;
  pilotis: Record<string, HousePiloti>;
  elements: HouseElement[];
  views: Record<HouseViewType, HouseViewInstance<TGroup>[]>;
  sideAssignments: Record<HouseSide, HouseViewType | null>;
  preAssignedSides: Record<string, HouseSide>;
}

export type HouseType = 'tipo6' | 'tipo3' | null;

export type HouseTypeExcludeNull = Exclude<HouseType, null>;

export type HouseSide = 'top' | 'bottom' | 'left' | 'right';

export type HouseSideAssignments = Record<HouseSide, HouseViewType | null>;

export type HousePreAssignedSides = Record<string, HouseSide>;

export interface HousePreAssignedSideDisplay {
  label: string;
  side: HouseSide;
  onCanvas: boolean;
}

export const HOUSE_OPPOSITE_SIDE: Record<HouseSide, HouseSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

export function getHouseSideLabel(side: HouseSide): string {
  switch (side) {
    case 'top':
      return 'Superior';

    case 'bottom':
      return 'Inferior';

    case 'left':
      return 'Esquerdo';

    case 'right':
      return 'Direito';
  }
}

export type HouseViewType = 'top' | 'front' | 'back' | 'side1' | 'side2';

export const HOUSE_VIEW_LIMITS: Record<HouseTypeExcludeNull, Record<HouseViewType, number>> = {
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

export const HOUSE_SIDE_VIEW_MAPPING: Record<HouseSide, HouseViewType[]> = {
  top: ['front', 'back'],
  bottom: ['front', 'back'],
  left: ['side1', 'side2'],
  right: ['side1', 'side2'],
};

export const HOUSE_OPPOSITE_VIEW: Record<HouseViewType, HouseViewType | null> = {
  top: null,
  front: 'back',
  back: 'front',
  side1: 'side2',
  side2: 'side1',
};

export const ALL_HOUSE_VIEW_TYPES: HouseViewType[] = ['top', 'front', 'back', 'side1', 'side2'];

export interface HouseViewInstance<TGroup = unknown> {
  instanceId: string;
  side?: HouseSide;
  group: TGroup;
}

export type HouseViewSide = Record<HouseViewType, Array<{ side?: HouseSide; }>>;

export interface HousePiloti {
  height: number;
  isMaster: boolean;
  nivel: number;
}

export const DEFAULT_HOUSE_PILOTI: HousePiloti = {
  height: 1.0,
  isMaster: false,
  nivel: 0.2,
};

export const HOUSE_PILOTI_STANDARD_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0] as const;

export type HouseElementType = 'window' | 'door';
export type HouseElementFace = 'front' | 'back' | 'left' | 'right';

export interface HouseElementDraft {
  type: HouseElementType;
  face: HouseElementFace;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HouseElement extends HouseElementDraft {
  id: string;
}

export interface HouseSnapshot {
  views: Record<HouseViewType, unknown[]>;
  sideAssignments: Record<HouseSide, HouseViewType | null>;
}
