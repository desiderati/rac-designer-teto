import {describe, expect, it} from "vitest";
import {getDefaultElementsForHouseType} from "@/lib/domain/house-elements-use-cases";

describe("house-elements use cases", () => {
  it("returns expected default openings for tipo6", () => {
    const elements = getDefaultElementsForHouseType("tipo6");

    expect(elements).toHaveLength(5);
    expect(elements.filter((element) => element.type === "door")).toHaveLength(1);
    expect(elements.filter((element) => element.type === "window")).toHaveLength(4);
    expect(elements.filter((element) => element.face === "front")).toHaveLength(3);
    expect(elements.filter((element) => element.face === "back")).toHaveLength(2);
    expect(elements[0]).toEqual({
      type: "door",
      face: "front",
      x: 220,
      y: 22,
      width: 60,
      height: 110,
    });
  });

  it("returns expected default openings for tipo3", () => {
    const elements = getDefaultElementsForHouseType("tipo3");

    expect(elements).toHaveLength(4);
    expect(elements.filter((element) => element.face === "front")).toHaveLength(1);
    expect(elements.filter((element) => element.face === "back")).toHaveLength(1);
    expect(elements.filter((element) => element.face === "right")).toHaveLength(2);
    expect(elements.some((element) => element.type === "door" && element.face === "right")).toBe(true);
  });
});
