import {describe, expect, it} from "vitest";
import {
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  createTopDoorMarkerVisualPatch,
  resolveTopDoorMarkerSide,
  resolveTopDoorSourceViewType,
} from "./house-top-door-marker-use-cases.ts";

describe("house-top-door-marker use cases", () => {
  it("resolves source view type from door face and house type", () => {
    expect(resolveTopDoorSourceViewType({houseType: "tipo6", doorFace: "front"})).toBe("front");
    expect(resolveTopDoorSourceViewType({houseType: "tipo6", doorFace: "back"})).toBe("back");
    expect(resolveTopDoorSourceViewType({houseType: "tipo6", doorFace: "left"})).toBe("side1");
    expect(resolveTopDoorSourceViewType({houseType: "tipo3", doorFace: "right"})).toBe("side2");
  });

  it("resolves marker side using current side assignments", () => {
    expect(
      resolveTopDoorMarkerSide({
        houseType: "tipo6",
        doorFace: "front",
        sideAssignments: {top: "front", bottom: null, left: null, right: null},
      }),
    ).toBe("top");

    expect(
      resolveTopDoorMarkerSide({
        houseType: "tipo3",
        doorFace: "right",
        sideAssignments: {top: null, bottom: null, left: null, right: "side2"},
      }),
    ).toBe("right");
  });

  it("calculates marker coordinates for all sides and clamps door center", () => {
    expect(
      calculateTopDoorPlacement({
        markerSide: "top",
        doorX: 30,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({markerSide: "top", targetLeft: 60, targetTop: -50});

    expect(
      calculateTopDoorPlacement({
        markerSide: "bottom",
        doorX: 30,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({markerSide: "bottom", targetLeft: -60, targetTop: 50});

    expect(
      calculateTopDoorPlacement({
        markerSide: "left",
        doorX: -999,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({markerSide: "left", targetLeft: -100, targetTop: -50});

    expect(
      calculateTopDoorPlacement({
        markerSide: "right",
        doorX: 999,
        doorWidth: 20,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({markerSide: "right", targetLeft: 100, targetTop: -50});
  });

  it("returns null placement when marker side is unknown", () => {
    expect(
      calculateTopDoorPlacement({
        markerSide: null,
        doorX: 10,
        doorWidth: 10,
        bodyWidth: 200,
        bodyHeight: 100,
      }),
    ).toEqual({markerSide: null});
  });

  it("creates visual patch for active and inactive marker sides", () => {
    expect(
      createTopDoorMarkerVisualPatch({
        markerSide: "top",
        markerCandidateSide: "top",
        targetLeft: 10,
        targetTop: 20,
      }),
    ).toEqual({
      visible: true,
      left: 10,
      top: 20,
    });

    expect(
      createTopDoorMarkerVisualPatch({
        markerSide: "top",
        markerCandidateSide: "bottom",
        targetLeft: 10,
        targetTop: 20,
      }),
    ).toEqual({
      visible: false,
    });
  });

  it("calculates effective body size using scale and clamps to minimum", () => {
    expect(
      calculateTopDoorMarkerBodySize({
        width: 366,
        height: 132,
        scaleX: 0.5,
        scaleY: 2,
      }),
    ).toEqual({
      bodyWidth: 183,
      bodyHeight: 264,
    });

    expect(
      calculateTopDoorMarkerBodySize({
        width: 0,
        height: 0,
      }),
    ).toEqual({
      bodyWidth: 1,
      bodyHeight: 1,
    });
  });
});
