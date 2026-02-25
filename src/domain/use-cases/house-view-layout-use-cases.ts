import {canAddViewForType} from './house-use-cases.ts';
import {
  getHouseSideLabel,
  HOUSE_OPPOSITE_SIDE, HOUSE_OPPOSITE_VIEW,
  HOUSE_SIDE_VIEW_MAPPING, HousePreAssignedSideDisplay, HousePreAssignedSides,
  HouseSide, HouseSideAssignments,
  HouseTypeExcludeNull,
  HouseViewSide,
  HouseViewType
} from '@/shared/types/house.ts';

export type {HouseSideAssignments, HouseViewSide};

export function getAvailableViewsForType(params: {
  houseType: HouseTypeExcludeNull | null;
  views: HouseViewSide;
}): HouseViewType[] {
  const {houseType, views} = params;
  if (!houseType) return [];

  const result: HouseViewType[] = [];
  (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
    const currentCount = views[viewType].length;
    if (canAddViewForType(houseType, viewType, currentCount)) {
      result.push(viewType);
    }
  });

  return result;
}

export function hasOtherViews(views: HouseViewSide): boolean {
  return (['front', 'back', 'side1', 'side2'] as const).some((viewType) => views[viewType].length > 0);
}

export function canDeletePlant(views: HouseViewSide): boolean {
  return !hasOtherViews(views);
}

export function getAvailableSides(params: {
  viewType: HouseViewType;
  sideAssignments: HouseSideAssignments;
}): HouseSide[] {
  const possibleSides = (Object.keys(HOUSE_SIDE_VIEW_MAPPING) as HouseSide[]).filter((side) =>
    HOUSE_SIDE_VIEW_MAPPING[side].includes(params.viewType),
  );

  return possibleSides.filter((side) => params.sideAssignments[side] === null);
}

export function needsSideSelection(params: {
  viewType: HouseViewType;
  sideAssignments: HouseSideAssignments;
}): boolean {
  if (params.viewType === 'top') return false;
  return getAvailableSides(params).length > 0;
}

export type DomainViewInsertionDecision =
  | { type: 'blocked_limit' }
  | { type: 'add_direct'; side?: HouseSide }
  | { type: 'blocked_no_instance_slots' }
  | { type: 'open_instance_selector'; slots: HousePreAssignedSideDisplay[] }
  | { type: 'blocked_no_sides' }
  | { type: 'open_side_selector' };

export function resolveViewInsertionRequest(params: {
  viewType: HouseViewType;
  isAtLimit: boolean;
  preAssignedSides: HousePreAssignedSideDisplay[];
  availableSides: HouseSide[];
}): DomainViewInsertionDecision {
  if (params.isAtLimit) {
    return {type: 'blocked_limit'};
  }

  if (params.viewType === 'top') {
    return {type: 'add_direct'};
  }

  if (params.preAssignedSides.length > 0) {
    const availableSlots = params.preAssignedSides.filter((slot) => !slot.onCanvas);
    if (!availableSlots.length) {
      return {type: 'blocked_no_instance_slots'};
    }

    if (availableSlots.length === 1) {
      return {type: 'add_direct', side: availableSlots[0].side};
    }

    return {type: 'open_instance_selector', slots: params.preAssignedSides};
  }

  if (!params.availableSides.length) {
    return {type: 'blocked_no_sides'};
  }

  if (params.availableSides.length === 1) {
    return {type: 'add_direct', side: params.availableSides[0]};
  }

  return {type: 'open_side_selector'};
}

export function getAutoSelectedSide(params: {
  viewType: HouseViewType;
  views: HouseViewSide;
  sideAssignments: HouseSideAssignments;
}): HouseSide | null {
  if (params.viewType === 'top') return null;

  const availableSides = getAvailableSides({
    viewType: params.viewType,
    sideAssignments: params.sideAssignments,
  });
  if (availableSides.length === 1) return availableSides[0];
  if (!availableSides.length) return null;

  const oppositeView = HOUSE_OPPOSITE_VIEW[params.viewType];
  if (!oppositeView) return null;

  for (const instance of params.views[oppositeView]) {
    if (!instance.side) continue;
    const oppositeSide = HOUSE_OPPOSITE_SIDE[instance.side];
    if (availableSides.includes(oppositeSide)) {
      return oppositeSide;
    }
  }

  return null;
}

export function buildAutoAssignedSlots(params: {
  houseType: HouseTypeExcludeNull;
  initialSide: HouseSide;
}): HousePreAssignedSides {
  const {houseType, initialSide} = params;
  const slots: HousePreAssignedSides = {};

  if (houseType === 'tipo6') {
    slots['front'] = initialSide;
    slots['back'] = HOUSE_OPPOSITE_SIDE[initialSide];

    if (initialSide === 'top') {
      slots['side1_0'] = 'right';
      slots['side1_1'] = 'left';
    } else {
      slots['side1_0'] = 'left';
      slots['side1_1'] = 'right';
    }
  } else {
    slots['side2'] = initialSide;
    slots['side1'] = HOUSE_OPPOSITE_SIDE[initialSide];
    slots['back_0'] = 'top';
    slots['back_1'] = 'bottom';
  }

  return slots;
}

export function getPreAssignedSlots(params: {
  viewType: HouseViewType;
  preAssignedSides: HousePreAssignedSides;
  sideAssignments: HouseSideAssignments;
}): HousePreAssignedSideDisplay[] {
  const result: HousePreAssignedSideDisplay[] = [];

  for (const [key, side] of Object.entries(params.preAssignedSides)) {
    if (key === params.viewType || key.startsWith(`${params.viewType}_`)) {
      result.push({
        label: getHouseSideLabel(side),
        side,
        onCanvas: params.sideAssignments[side] === params.viewType,
      });
    }
  }

  result.sort((a, b) => {
    const order: Record<HouseSide, number> = {
      left: 0,
      right: 1,
      top: 0,
      bottom: 1,
    };
    return order[a.side] - order[b.side];
  });

  return result;
}

export function hasPreAssignedSlots(preAssignedSides: HousePreAssignedSides): boolean {
  return Object.keys(preAssignedSides).length > 0;
}

export function calculateStackedViewPositions(params: {
  centerY: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
}): { topY: number; bottomY: number } {
  const totalHeight = params.topHeight + params.gap + params.bottomHeight;
  return {
    topY: params.centerY - totalHeight / 2 + params.topHeight / 2,
    bottomY: params.centerY + totalHeight / 2 - params.bottomHeight / 2,
  };
}
