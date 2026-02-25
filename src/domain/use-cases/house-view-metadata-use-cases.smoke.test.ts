import {describe, expect, it} from "vitest";
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from "./house-view-metadata-use-cases.ts";

describe("house-view-metadata use cases", () => {
  it("creates group metadata patch with view type, instance id and side", () => {
    expect(
      createViewGroupMetadataPatch({
        viewType: "front",
        instanceId: "front_1",
        side: "top",
      }),
    ).toEqual({
      houseViewType: "front",
      houseInstanceId: "front_1",
      houseSide: "top",
    });
  });

  it("keeps side undefined when side is not provided", () => {
    expect(
      createViewGroupMetadataPatch({
        viewType: "top",
        instanceId: "top_1",
      }),
    ).toEqual({
      houseViewType: "top",
      houseInstanceId: "top_1",
      houseSide: undefined,
    });
  });

  it("creates controls visibility patch with all handles disabled", () => {
    expect(createViewGroupControlsVisibilityPatch()).toEqual({
      mt: false,
      mb: false,
      ml: false,
      mr: false,
    });
  });

  it("extracts typed removal hints from group metadata", () => {
    expect(
      extractViewGroupRemovalHints<"front" | "back">({
        houseViewType: "front",
        houseInstanceId: "front_10",
      }),
    ).toEqual({
      viewType: "front",
      instanceId: "front_10",
    });

    expect(
      extractViewGroupRemovalHints<"front" | "back">({
        houseViewType: 123,
        houseInstanceId: null,
      }),
    ).toEqual({
      viewType: undefined,
      instanceId: undefined,
    });
  });
});
