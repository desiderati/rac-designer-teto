import {HOUSE_DEFAULTS} from '@/shared/config.ts';

export interface HouseState<TGroup> {
  id: string;
  houseType: HouseType;
  pilotis: Record<string, HousePiloti>;
  terrainType: number;
  views: HouseViews<TGroup>;
  sideMappings: HouseSideMapping;
  preAssignedSides: Record<string, HouseSide>;
}

export type HouseType = 'tipo6' | 'tipo3' | null;

export type HouseTypeExcludeNull = Exclude<HouseType, null>;

export interface House3DElement {
  id: string;
  type: 'window' | 'door';
  face: House3DFace;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HouseSide = 'top' | 'bottom' | 'left' | 'right';

export type House3DFace = 'front' | 'back' | 'left' | 'right'

export type HouseSideMapping = Record<HouseSide, HouseViewType | null>;

export const HOUSE_SIDE_MAPPINGS: Record<HouseSide, HouseViewType[]> = {
  top: ['front', 'back'],
  bottom: ['front', 'back'],
  left: ['side1', 'side2'],
  right: ['side1', 'side2'],
};

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

export const HOUSE_OPPOSITE_VIEW: Record<HouseViewType, HouseViewType | null> = {
  top: null,
  front: 'back',
  back: 'front',
  side1: 'side2',
  side2: 'side1',
};

export const ALL_HOUSE_VIEW_TYPES: HouseViewType[] = ['top', 'front', 'back', 'side1', 'side2'];

export interface HouseViewInstance<TGroup> {
  instanceId: string;
  side?: HouseSide;
  group: TGroup;
}

export type HouseViews<TGroup> = Record<HouseViewType, HouseViewInstance<TGroup>[]>;

export type HouseViewSide = Record<HouseViewType, Array<{ side?: HouseSide; }>>;

/**
 * Resultado da decisão de inserção de uma nova vista de casa.
 *
 * Fluxo geral:
 * 1) Se houver bloqueio definitivo, retorna `blocked_*` e o UI só informa o motivo.
 * 2) Se houver caminho direto, retorna `add_direct` e a vista é adicionada sem modal.
 * 3) Se exigir escolha do usuário, retorna `open_*_selector` para abrir o modal correto.
 */
export const HOUSE_VIEW_INSERTION_DECISION_TYPES = {
  // Bloqueia quando o tipo de casa já atingiu o limite de vistas desse tipo.
  blockedByViewLimit: 'blocked_limit',

  // Adiciona imediatamente (não precisa escolher slot/instância ou lado).
  addViewDirectly: 'add_direct',

  // Bloqueia quando não há mais instâncias livres para o tipo de vista.
  blockedByNoFreeInstanceSlots: 'blocked_no_instance_slots',

  // Bloqueia quando não existe lado disponível para posicionar a vista.
  blockedByNoAvailableSides: 'blocked_no_sides',

  // Abre seletor para o usuário escolher qual instância/slot deseja usar.
  openInstanceSlotSelector: 'open_instance_selector',

  // Abre seletor para o usuário escolher o lado (left/right/top/bottom).
  openSideSelector: 'open_side_selector',
} as const;

export interface HousePiloti {
  height: number;
  isMaster: boolean;
  nivel: number;
}

export const DEFAULT_HOUSE_PILOTI: HousePiloti = {
  height: HOUSE_DEFAULTS.pilotiBaseHeight,
  isMaster: HOUSE_DEFAULTS.pilotiIsMaster,
  nivel: HOUSE_DEFAULTS.pilotiNivel,
};

export const DEFAULT_HOUSE_PILOTI_HEIGHTS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5] as const;

export interface HouseSnapshot<TGroup> {
  views: Record<HouseViewType, TGroup[]>;
  sideMappings: Record<HouseSide, HouseViewType | null>;
}
