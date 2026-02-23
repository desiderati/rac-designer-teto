import {canAddViewForType} from "./house-use-cases";
import type {DomainHouseType, DomainViewType} from "./house-use-cases";

export type DomainHouseSide = "top" | "bottom" | "left" | "right";
export type DomainPreAssignedSlots = Record<string, DomainHouseSide>;
export type DomainSideAssignments = Record<DomainHouseSide, DomainViewType | null>;
export type DomainViewInstances = Record<
  DomainViewType,
  Array<{
    side?: DomainHouseSide;
  }>
>;

export interface DomainPreAssignedSlotDisplay {
  label: string;
  side: DomainHouseSide;
  onCanvas: boolean;
}

export const SIDE_VIEW_MAPPING: Record<DomainHouseSide, DomainViewType[]> = {
  top: ["front", "back"],
  bottom: ["front", "back"],
  left: ["side1", "side2"],
  right: ["side1", "side2"],
};

export const OPPOSITE_SIDE: Record<DomainHouseSide, DomainHouseSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export const OPPOSITE_VIEW: Record<DomainViewType, DomainViewType | null> = {
  top: null,
  front: "back",
  back: "front",
  side1: "side2",
  side2: "side1",
};

export function getAvailableViewsForType(params: {
  houseType: DomainHouseType | null;
  views: DomainViewInstances;
}): DomainViewType[] {
  const {houseType, views} = params;
  if (!houseType) return [];

  const result: DomainViewType[] = [];
  (Object.keys(views) as DomainViewType[]).forEach((viewType) => {
    const currentCount = views[viewType].length;
    if (canAddViewForType(houseType, viewType, currentCount)) {
      result.push(viewType);
    }
  });

  return result;
}

export function hasOtherViews(views: DomainViewInstances): boolean {
  return (["front", "back", "side1", "side2"] as const).some((viewType) => views[viewType].length > 0);
}

export function canDeletePlant(views: DomainViewInstances): boolean {
  return !hasOtherViews(views);
}

export function getAvailableSides(params: {
  viewType: DomainViewType;
  sideAssignments: DomainSideAssignments;
}): DomainHouseSide[] {
  const possibleSides = (Object.keys(SIDE_VIEW_MAPPING) as DomainHouseSide[]).filter((side) =>
    SIDE_VIEW_MAPPING[side].includes(params.viewType),
  );

  return possibleSides.filter((side) => params.sideAssignments[side] === null);
}

export function needsSideSelection(params: {
  viewType: DomainViewType;
  sideAssignments: DomainSideAssignments;
}): boolean {
  if (params.viewType === "top") return false;
  return getAvailableSides(params).length > 0;
}

export type DomainViewInsertionDecision =
  | { type: "blocked_limit" }
  | { type: "add_direct"; side?: DomainHouseSide }
  | { type: "blocked_no_instance_slots" }
  | { type: "open_instance_selector"; slots: DomainPreAssignedSlotDisplay[] }
  | { type: "blocked_no_sides" }
  | { type: "open_side_selector" };

export function resolveViewInsertionRequest(params: {
  viewType: DomainViewType;
  isAtLimit: boolean;
  preAssignedSlots: DomainPreAssignedSlotDisplay[];
  availableSides: DomainHouseSide[];
}): DomainViewInsertionDecision {
  if (params.isAtLimit) {
    return {type: "blocked_limit"};
  }

  if (params.viewType === "top") {
    return {type: "add_direct"};
  }

  if (params.preAssignedSlots.length > 0) {
    const availableSlots = params.preAssignedSlots.filter((slot) => !slot.onCanvas);
    if (!availableSlots.length) {
      return {type: "blocked_no_instance_slots"};
    }

    if (availableSlots.length === 1) {
      return {type: "add_direct", side: availableSlots[0].side};
    }

    return {type: "open_instance_selector", slots: params.preAssignedSlots};
  }

  if (!params.availableSides.length) {
    return {type: "blocked_no_sides"};
  }

  if (params.availableSides.length === 1) {
    return {type: "add_direct", side: params.availableSides[0]};
  }

  return {type: "open_side_selector"};
}

export function getAutoSelectedSide(params: {
  viewType: DomainViewType;
  views: DomainViewInstances;
  sideAssignments: DomainSideAssignments;
}): DomainHouseSide | null {
  if (params.viewType === "top") return null;

  const availableSides = getAvailableSides({
    viewType: params.viewType,
    sideAssignments: params.sideAssignments,
  });
  if (availableSides.length === 1) return availableSides[0];
  if (!availableSides.length) return null;

  const oppositeView = OPPOSITE_VIEW[params.viewType];
  if (!oppositeView) return null;

  for (const instance of params.views[oppositeView]) {
    if (!instance.side) continue;
    const oppositeSide = OPPOSITE_SIDE[instance.side];
    if (availableSides.includes(oppositeSide)) {
      return oppositeSide;
    }
  }

  return null;
}

export function buildAutoAssignedSlots(params: {
  houseType: DomainHouseType;
  initialSide: DomainHouseSide;
}): DomainPreAssignedSlots {
  const {houseType, initialSide} = params;
  const slots: DomainPreAssignedSlots = {};

  if (houseType === "tipo6") {
    slots["front"] = initialSide;
    slots["back"] = OPPOSITE_SIDE[initialSide];

    if (initialSide === "top") {
      slots["side1_0"] = "right";
      slots["side1_1"] = "left";
    } else {
      slots["side1_0"] = "left";
      slots["side1_1"] = "right";
    }
  } else {
    slots["side2"] = initialSide;
    slots["side1"] = OPPOSITE_SIDE[initialSide];
    slots["back_0"] = "top";
    slots["back_1"] = "bottom";
  }

  return slots;
}

function getSideLabel(side: DomainHouseSide): string {
  switch (side) {
    case "top":
      return "Superior";

    case "bottom":
      return "Inferior";

    case "left":
      return "Esquerdo";

    case "right":
      return "Direito";
  }
}

export function getPreAssignedSlots(params: {
  viewType: DomainViewType;
  preAssignedSlots: DomainPreAssignedSlots;
  sideAssignments: DomainSideAssignments;
}): DomainPreAssignedSlotDisplay[] {
  const result: DomainPreAssignedSlotDisplay[] = [];

  for (const [key, side] of Object.entries(params.preAssignedSlots)) {
    if (key === params.viewType || key.startsWith(`${params.viewType}_`)) {
      result.push({
        label: getSideLabel(side),
        side,
        onCanvas: params.sideAssignments[side] === params.viewType,
      });
    }
  }

  result.sort((a, b) => {
    const order: Record<DomainHouseSide, number> = {
      left: 0,
      right: 1,
      top: 0,
      bottom: 1,
    };
    return order[a.side] - order[b.side];
  });

  return result;
}

export function hasPreAssignedSlots(preAssignedSlots: DomainPreAssignedSlots): boolean {
  return Object.keys(preAssignedSlots).length > 0;
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
