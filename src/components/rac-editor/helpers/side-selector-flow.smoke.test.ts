import {describe, expect, it} from "vitest";
import {
  shouldResetHouseTypeOnSideSelectorCancel,
  shouldTransitionToNivelDefinition,
} from "./side-selector-flow.ts";

describe("side-selector-flow utils", () => {
  it("transitions to nivel definition only on initial positioning without pre-assigned slots", () => {
    expect(
      shouldTransitionToNivelDefinition({
        sideSelectorMode: "position",
        hasPreAssignedSlots: false,
      }),
    ).toBe(true);

    expect(
      shouldTransitionToNivelDefinition({
        sideSelectorMode: "position",
        hasPreAssignedSlots: true,
      }),
    ).toBe(false);

    expect(
      shouldTransitionToNivelDefinition({
        sideSelectorMode: "choose-instance",
        hasPreAssignedSlots: false,
      }),
    ).toBe(false);
  });

  it("resets house type on cancel only for initial positioning flow", () => {
    expect(
      shouldResetHouseTypeOnSideSelectorCancel({
        sideSelectorMode: "position",
        hasPreAssignedSlots: false,
      }),
    ).toBe(true);

    expect(
      shouldResetHouseTypeOnSideSelectorCancel({
        sideSelectorMode: "choose-instance",
        hasPreAssignedSlots: false,
      }),
    ).toBe(false);
  });
});
