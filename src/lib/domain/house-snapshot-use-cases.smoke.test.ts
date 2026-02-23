import {describe, expect, it} from "vitest";
import {
  SNAPSHOT_MAX_CANVAS_RATIO,
  calculateSnapshotScale,
  create3DSnapshotImagePatch,
} from "./house-snapshot-use-cases";

describe("house-snapshot use cases", () => {
  it("exports canonical max ratio for snapshot insertion", () => {
    expect(SNAPSHOT_MAX_CANVAS_RATIO).toBe(0.45);
  });

  it("calculates scale capped at 1 for small images", () => {
    expect(
      calculateSnapshotScale({
        imageWidth: 200,
        imageHeight: 100,
        canvasWidth: 1300,
        canvasHeight: 1300,
      }),
    ).toBe(1);
  });

  it("calculates scale constrained by canvas bounds", () => {
    expect(
      calculateSnapshotScale({
        imageWidth: 3000,
        imageHeight: 1000,
        canvasWidth: 1200,
        canvasHeight: 800,
      }),
    ).toBeCloseTo(0.18, 4);
  });

  it("creates image patch for centered insertion on canvas", () => {
    expect(
      create3DSnapshotImagePatch({
        centerX: 150,
        centerY: 90,
        imageWidth: 1000,
        imageHeight: 500,
        canvasWidth: 1000,
        canvasHeight: 1000,
      }),
    ).toMatchObject({
      left: 150,
      top: 90,
      originX: "center",
      originY: "center",
      scaleX: 0.45,
      scaleY: 0.45,
      lockRotation: true,
      hasControls: true,
    });
  });
});
