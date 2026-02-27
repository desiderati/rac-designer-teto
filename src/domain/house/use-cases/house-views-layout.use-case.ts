import {
  getHouseSideLabel,
  HOUSE_OPPOSITE_SIDE,
  HOUSE_OPPOSITE_VIEW,
  HOUSE_SIDE_MAPPINGS,
  HOUSE_VIEW_INSERTION_DECISION_TYPES,
  HOUSE_VIEW_LIMITS,
  type HousePreAssignedSideDisplay,
  type HousePreAssignedSides,
  type HouseSide,
  type HouseSideMapping,
  type HouseTypeExcludeNull,
  type HouseViewInsertionDecision,
  type HouseViewSide,
  type HouseViewType,
} from '@/shared/types/house.ts';

export type {HouseSideMapping, HouseViewSide};

export function getAvailableViewsForType(params: {
  houseType: HouseTypeExcludeNull | null;
  views: HouseViewSide;
}): HouseViewType[] {
  const {houseType, views} = params;
  if (!houseType) return [];

  const result: HouseViewType[] = [];
  (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
    const currentCount = views[viewType].length;
    const maxCount = HOUSE_VIEW_LIMITS[houseType][viewType];
    if (currentCount < maxCount) {
      result.push(viewType);
    }
  });

  return result;
}

export function hasOtherViews(views: HouseViewSide): boolean {
  return (['front', 'back', 'side1', 'side2'] as const).some(
    (viewType) => views[viewType].length > 0
  );
}

export function canDeleteTopView(views: HouseViewSide): boolean {
  return !hasOtherViews(views);
}

export function getAvailableSides(params: {
  viewType: HouseViewType;
  sideMappings: HouseSideMapping;
}): HouseSide[] {
  const possibleSides = (Object.keys(HOUSE_SIDE_MAPPINGS) as HouseSide[]).filter((side) =>
    HOUSE_SIDE_MAPPINGS[side].includes(params.viewType),
  );

  return possibleSides.filter((side) => params.sideMappings[side] === null);
}

export function needsSideSelection(params: {
  viewType: HouseViewType;
  sideMappings: HouseSideMapping;
}): boolean {
  if (params.viewType === 'top') return false;
  return getAvailableSides(params).length > 0;
}

export function getAutoSelectedSide(params: {
  viewType: HouseViewType;
  views: HouseViewSide;
  sideMappings: HouseSideMapping;
}): HouseSide | null {
  if (params.viewType === 'top') return null;

  const availableSides = getAvailableSides({
    viewType: params.viewType,
    sideMappings: params.sideMappings,
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

export function buildAutoAssignedSides(params: {
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

export function getPreAssignedSides(params: {
  viewType: HouseViewType;
  preAssignedSides: HousePreAssignedSides;
  sideMappings: HouseSideMapping;
}): HousePreAssignedSideDisplay[] {
  const result: HousePreAssignedSideDisplay[] = [];

  for (const [key, side] of Object.entries(params.preAssignedSides)) {
    if (key === params.viewType || key.startsWith(`${params.viewType}_`)) {
      result.push({
        label: getHouseSideLabel(side),
        side,
        onCanvas: params.sideMappings[side] === params.viewType,
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

export function hasPreAssignedSides(preAssignedSides: HousePreAssignedSides): boolean {
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

export function resolveHouseViewInsertion(params: {
  viewType: HouseViewType;
  isAtLimit: boolean;
  preAssignedSides: HousePreAssignedSideDisplay[];
  availableSides: HouseSide[];
}): HouseViewInsertionDecision {
  if (params.isAtLimit) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByViewLimit};
  }

  if (params.viewType === 'top') {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly};
  }

  if (params.preAssignedSides.length > 0) {
    const availableSlots = params.preAssignedSides.filter((slot) => !slot.onCanvas);
    if (!availableSlots.length) {
      return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoFreeInstanceSlots};
    }

    if (availableSlots.length === 1) {
      return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly, side: availableSlots[0].side};
    }

    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.openInstanceSlotSelector, slots: params.preAssignedSides};
  }

  if (!params.availableSides.length) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.blockedByNoAvailableSides};
  }

  if (params.availableSides.length === 1) {
    return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.addViewDirectly, side: params.availableSides[0]};
  }

  return {type: HOUSE_VIEW_INSERTION_DECISION_TYPES.openSideSelector};
}

