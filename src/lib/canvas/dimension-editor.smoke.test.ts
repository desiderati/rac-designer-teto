import {describe, expect, it} from "vitest";
import {applyDimensionEditorPatch} from "./dimension-editor";

describe("dimension-editor utils", () => {
  it("applies value and color to dimension text and shapes", () => {
    const textState: Record<string, unknown> = {type: "i-text", text: "10m", fill: "#111111"};
    const lineState: Record<string, unknown> = {type: "line", stroke: "#111111"};
    const triState: Record<string, unknown> = {type: "triangle", fill: "#111111"};

    const group = {
      dirty: false,
      getObjects: () => [
        {...textState, set: (patch: Record<string, unknown>) => Object.assign(textState, patch)},
        {...lineState, set: (patch: Record<string, unknown>) => Object.assign(lineState, patch)},
        {...triState, set: (patch: Record<string, unknown>) => Object.assign(triState, patch)},
      ],
    };

    applyDimensionEditorPatch({
      group,
      value: "12m",
      color: "#22c55e",
    });

    expect(textState.text).toBe("12m");
    expect(textState.fill).toBe("#22c55e");
    expect(lineState.stroke).toBe("#22c55e");
    expect(triState.fill).toBe("#22c55e");
    expect(group.dirty).toBe(true);
  });

  it("uses blank placeholder when value is empty", () => {
    const textState: Record<string, unknown> = {type: "i-text", text: "X", fill: "#000000"};
    const group = {
      dirty: false,
      getObjects: () => [
        {...textState, set: (patch: Record<string, unknown>) => Object.assign(textState, patch)},
      ],
    };

    applyDimensionEditorPatch({
      group,
      value: "",
      color: "#ef4444",
    });

    expect(textState.text).toBe(" ");
    expect(textState.fill).toBe("#ef4444");
    expect(group.dirty).toBe(true);
  });
});
