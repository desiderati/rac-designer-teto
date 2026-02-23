import {describe, expect, it} from "vitest";
import {
  calculateCornerNivelLabelTop,
  calculatePilotiSizeLabelPosition,
  calculatePilotiStripeGeometry,
  createPilotiNivelTextPatch,
} from "./house-piloti-render-use-cases";

describe("house-piloti-render use cases", () => {
  it("calculates corner nivel label top for top and bottom rows", () => {
    expect(
      calculateCornerNivelLabelTop({
        centerY: 100,
        radius: 9,
        offset: 7.2,
        isTopCorner: true,
      }),
    ).toBeCloseTo(83.8, 4);

    expect(
      calculateCornerNivelLabelTop({
        centerY: 100,
        radius: 9,
        offset: 7.2,
        isTopCorner: false,
      }),
    ).toBeCloseTo(116.2, 4);
  });

  it("calculates size label position from rect geometry", () => {
    expect(
      calculatePilotiSizeLabelPosition({
        rectLeft: 10,
        rectTop: 20,
        rectWidth: 30,
        rectHeight: 40,
        baseHeight: 60,
        basePilotiHeightPx: 60,
      }),
    ).toEqual({left: 25, top: 68});
  });

  it("calculates stripe geometry using 2/3 and 1/3 rule", () => {
    expect(
      calculatePilotiStripeGeometry({
        rectTop: 12,
        rectHeight: 90,
      }),
    ).toEqual({
      height: 60,
      top: 42,
    });
  });

  it("creates nivel text patch for corner and non-corner pilotis", () => {
    expect(
      createPilotiNivelTextPatch({
        isCorner: true,
        formattedNivel: "0,80",
        centerX: 10,
        centerY: 20,
        radius: 9,
        offset: 7.2,
        isTopCorner: true,
      }),
    ).toEqual({
      text: "Nível = 0,80",
      left: 10,
      top: 3.8,
      visible: true,
    });

    expect(
      createPilotiNivelTextPatch({
        isCorner: false,
        formattedNivel: "0,50",
        centerX: 0,
        centerY: 0,
        radius: 0,
        offset: 0,
        isTopCorner: false,
      }),
    ).toEqual({
      text: "",
      visible: false,
    });
  });
});
