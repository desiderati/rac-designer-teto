import {describe, expect, it} from "vitest";
import type {SideAssignmentsRecord, ViewsRecord} from "@/lib/domain/house-views-repository";
import {
  countViewInstances,
  collectAllViewGroups,
  cleanupStaleViewInstances,
  hasAnyViewInstances,
  rebuildSideAssignmentsFromViews,
  registerViewInstance,
  removeAllViewInstancesByType,
  removeViewInstance,
  removeViewInstanceByGroup,
} from "@/lib/domain/house-views-use-cases";

type ViewType = "top" | "front" | "back" | "side1" | "side2";
type Side = "top" | "bottom" | "left" | "right";
type GroupRef = { id: string };

function createViews(): ViewsRecord<ViewType, GroupRef, Side> {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

function createAssignments(): SideAssignmentsRecord<Side, ViewType> {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}

describe("house views domain use cases", () => {
  it("registers a view instance and assigns its side", () => {
    const result = registerViewInstance({
      views: createViews(),
      sideAssignments: createAssignments(),
      viewType: "front",
      group: {id: "g1"},
      instanceId: "front_1",
      side: "top",
    });

    expect(result.views.front).toHaveLength(1);
    expect(result.sideAssignments.top).toBe("front");
  });

  it("removes a view by type/instance and clears side assignment", () => {
    const initialViews = createViews();
    initialViews.front.push({group: {id: "g1"}, instanceId: "front_1", side: "top"});

    const result = removeViewInstance({
      views: initialViews,
      sideAssignments: {...createAssignments(), top: "front"},
      viewType: "front",
      instanceId: "front_1",
    });

    expect(result.removed?.instanceId).toBe("front_1");
    expect(result.views.front).toHaveLength(0);
    expect(result.sideAssignments.top).toBeNull();
  });

  it("removes a view by group reference across all view types", () => {
    const group = {id: "g2"};
    const initialViews = createViews();
    initialViews.side1.push({group, instanceId: "side1_1", side: "left"});

    const result = removeViewInstanceByGroup({
      views: initialViews,
      sideAssignments: {...createAssignments(), left: "side1"},
      group,
    });

    expect(result.removedViewType).toBe("side1");
    expect(result.views.side1).toHaveLength(0);
    expect(result.sideAssignments.left).toBeNull();
  });

  it("cleans up stale views and rebuilds side assignments", () => {
    const g1 = {id: "g1"};
    const g2 = {id: "g2"};
    const initialViews = createViews();
    initialViews.back.push({group: g1, instanceId: "back_1", side: "top"});
    initialViews.back.push({group: g2, instanceId: "back_2", side: "bottom"});

    const cleaned = cleanupStaleViewInstances({
      views: initialViews,
      sideAssignments: {...createAssignments(), top: "back", bottom: "back"},
      viewType: "back",
      isAlive: (group) => group.id === "g2",
    });

    expect(cleaned.removedCount).toBe(1);
    expect(cleaned.views.back).toHaveLength(1);
    expect(cleaned.sideAssignments.top).toBeNull();
    expect(cleaned.sideAssignments.bottom).toBe("back");

    const rebuilt = rebuildSideAssignmentsFromViews({
      views: cleaned.views,
      sideAssignmentsTemplate: cleaned.sideAssignments,
    });
    expect(rebuilt.bottom).toBe("back");
  });

  it("removes all instances of a view type", () => {
    const initialViews = createViews();
    initialViews.side1.push({group: {id: "g1"}, instanceId: "side1_1", side: "left"});
    initialViews.side1.push({group: {id: "g2"}, instanceId: "side1_2", side: "right"});

    const result = removeAllViewInstancesByType({
      views: initialViews,
      sideAssignments: {...createAssignments(), left: "side1", right: "side1"},
      viewType: "side1",
    });

    expect(result.removedCount).toBe(2);
    expect(result.views.side1).toHaveLength(0);
    expect(result.sideAssignments.left).toBeNull();
    expect(result.sideAssignments.right).toBeNull();
  });

  it("checks if any view exists and collects all groups", () => {
    const views = createViews();
    expect(hasAnyViewInstances(views)).toBe(false);

    const g1 = {id: "g1"};
    const g2 = {id: "g2"};
    views.front.push({group: g1, instanceId: "front_1", side: "top"});
    views.side1.push({group: g2, instanceId: "side1_1", side: "left"});

    expect(hasAnyViewInstances(views)).toBe(true);
    expect(collectAllViewGroups(views)).toEqual([g1, g2]);
    expect(countViewInstances(views)).toEqual({
      top: 0,
      front: 1,
      back: 0,
      side1: 1,
      side2: 0,
    });
  });
});
