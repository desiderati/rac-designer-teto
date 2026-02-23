import {describe, expect, it, vi} from "vitest";
import {createHouseGroupForView} from "./house-view-creation";

describe("house-view-creation utils", () => {
  it("delegates top/front/back creation with expected flags", () => {
    const canvas = {} as any;
    const topGroup = {id: "top"} as any;
    const frontGroup = {id: "front"} as any;
    const backGroup = {id: "back"} as any;

    const createHouseTop = vi.fn(() => topGroup);
    const createHouseFrontBack = vi.fn().mockImplementation((_canvas, isFront) =>
      (isFront ? frontGroup : backGroup));

    const createHouseSide = vi.fn();

    expect(
      createHouseGroupForView({
        canvas,
        viewType: "top",
        factories: {createHouseTop, createHouseFrontBack, createHouseSide},
      }),
    ).toBe(topGroup);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: "front",
        side: "top",
        factories: {createHouseTop, createHouseFrontBack, createHouseSide},
      }),
    ).toBe(frontGroup);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: "back",
        side: "bottom",
        factories: {createHouseTop, createHouseFrontBack, createHouseSide},
      }),
    ).toBe(backGroup);

    expect(createHouseFrontBack).toHaveBeenNthCalledWith(1, canvas, true, true);
    expect(createHouseFrontBack).toHaveBeenNthCalledWith(2, canvas, false, false);
  });

  it("delegates side creation with expected orientation flags", () => {
    const canvas = {} as any;
    const side1Group = {id: "side1"} as any;
    const side2Group = {id: "side2"} as any;

    const createHouseTop = vi.fn();
    const createHouseFrontBack = vi.fn();
    const createHouseSide = vi
      .fn()
      .mockImplementation((_canvas, isSide2) => (isSide2 ? side2Group : side1Group));

    expect(
      createHouseGroupForView({
        canvas,
        viewType: "side1",
        side: "right",
        factories: {createHouseTop, createHouseFrontBack, createHouseSide},
      }),
    ).toBe(side1Group);

    expect(
      createHouseGroupForView({
        canvas,
        viewType: "side2",
        side: "left",
        factories: {createHouseTop, createHouseFrontBack, createHouseSide},
      }),
    ).toBe(side2Group);

    expect(createHouseSide).toHaveBeenNthCalledWith(1, canvas, false, true);
    expect(createHouseSide).toHaveBeenNthCalledWith(2, canvas, true, false);
  });
});
