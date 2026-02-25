import {describe, expect, it} from "vitest";
import {buildPilotiObjectIndex} from "./house-piloti-object-index-use-cases.ts";

describe("house-piloti-object-index use cases", () => {
  it("indexes first circle/rect entries by piloti id", () => {
    const c1 = {id: "c1", pilotiId: "piloti_0_0", isPilotiCircle: true};
    const c2 = {id: "c2", pilotiId: "piloti_0_0", isPilotiCircle: true};
    const r1 = {id: "r1", pilotiId: "piloti_0_0", isPilotiRect: true};
    const r2 = {id: "r2", pilotiId: "piloti_0_0", isPilotiRect: true};

    const index = buildPilotiObjectIndex([c1, c2, r1, r2]);
    expect(index.piloti_0_0).toEqual({
      circle: c1,
      rect: r1,
    });
  });

  it("ignores entries without valid piloti id", () => {
    const index = buildPilotiObjectIndex([
      {id: "x1", isPilotiCircle: true},
      {id: "x2", pilotiId: 123, isPilotiRect: true},
      {id: "ok", pilotiId: "piloti_1_1", isPilotiRect: true},
    ]);

    expect(Object.keys(index)).toEqual(["piloti_1_1"]);
    expect(index.piloti_1_1?.rect).toMatchObject({id: "ok"});
  });
});
