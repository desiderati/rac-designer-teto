import {describe, expect, it} from "vitest";
import {createInitialHouseState} from "./house-state-factory-use-cases";

describe("house-state-factory use cases", () => {
  it("creates the initial house state snapshot with empty collections", () => {
    const state = createInitialHouseState<unknown, unknown>({
      id: "house_1",
      pilotiIds: ["piloti_0_0", "piloti_0_1"],
      defaultPiloti: {height: 1, isMaster: false, nivel: 0.2},
    });

    expect(state).toMatchObject({
      id: "house_1",
      houseType: null,
      preAssignedSlots: {},
      sideAssignments: {top: null, bottom: null, left: null, right: null},
    });
    expect(state.views).toEqual({
      top: [],
      front: [],
      back: [],
      side1: [],
      side2: [],
    });
    expect(Object.keys(state.pilotis)).toEqual(["piloti_0_0", "piloti_0_1"]);
    expect(state.elements).toEqual([]);
  });
});
