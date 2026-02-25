import {describe, expect, it} from "vitest";
import {projectGroupLocalPointToScreen} from "./piloti-screen-position.ts";

describe("piloti-screen-position utils", () => {
  it("projects local point with explicit viewport transform", () => {
    expect(
      projectGroupLocalPointToScreen({
        groupMatrix: [2, 0, 0, 3, 100, 50],
        localPoint: {x: 10, y: 5},
        containerRect: {left: 20, top: 30},
        viewportTransform: [1.5, 0, 0, 1.5, -40, 60],
      }),
    ).toEqual({
      x: 160,
      y: 187.5,
    });
  });

  it("uses identity viewport when transform is omitted", () => {
    expect(
      projectGroupLocalPointToScreen({
        groupMatrix: [1, 0, 0, 1, 200, 120],
        localPoint: {x: 30, y: 40},
        containerRect: {left: 5, top: 10},
      }),
    ).toEqual({
      x: 235,
      y: 170,
    });
  });
});
