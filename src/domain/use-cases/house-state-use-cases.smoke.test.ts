import {describe, expect, it} from "vitest";
import {createDefaultPilotis, createEmptySideAssignments, createEmptyViews} from "./house-state-use-cases.ts";

describe("house-state use cases", () => {
  it("creates default pilotis cloning default values for each id", () => {
    const defaultPiloti = {height: 1, isMaster: false, nivel: 0.2};
    const pilotis = createDefaultPilotis({
      pilotiIds: ["piloti_0_0", "piloti_0_1"],
      defaultPiloti,
    });

    expect(Object.keys(pilotis)).toEqual(["piloti_0_0", "piloti_0_1"]);
    expect(pilotis.piloti_0_0).toEqual(defaultPiloti);
    expect(pilotis.piloti_0_1).toEqual(defaultPiloti);

    pilotis.piloti_0_0.height = 2;
    expect(pilotis.piloti_0_1.height).toBe(1);
  });

  it("creates empty view and side-assignment structures", () => {
    const views = createEmptyViews<unknown>();
    const sides = createEmptySideAssignments();

    expect(views).toEqual({
      top: [],
      front: [],
      back: [],
      side1: [],
      side2: [],
    });
    expect(sides).toEqual({
      top: null,
      bottom: null,
      left: null,
      right: null,
    });
  });
});
