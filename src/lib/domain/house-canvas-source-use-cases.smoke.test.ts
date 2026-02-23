import {describe, expect, it} from "vitest";
import {
  collectHouseGroupCandidates,
  collectHouseGroupPilotiSources,
  collectHouseGroupRebuildSources,
  findTopViewGroupCandidate,
  isHouseGroupCandidate,
  isTopViewGroupCandidate,
  mapHouseGroupToRebuildSource,
} from "./house-canvas-source-use-cases";

describe("house-canvas-source use cases", () => {
  it("identifies house group candidates by type and myType", () => {
    expect(isHouseGroupCandidate({type: "group", myType: "house"})).toBe(true);
    expect(isHouseGroupCandidate({type: "group", myType: "line"})).toBe(false);
    expect(isHouseGroupCandidate({type: "rect", myType: "house"})).toBe(false);
  });

  it("identifies top-view house group candidates", () => {
    expect(isTopViewGroupCandidate({type: "group", myType: "house", houseView: "top"})).toBe(true);
    expect(isTopViewGroupCandidate({type: "group", myType: "house", houseView: "front"})).toBe(false);
  });

  it("collects only house group candidates from canvas objects", () => {
    const input = [
      {id: "g1", type: "group", myType: "house"},
      {id: "g2", type: "group", myType: "line"},
      {id: "r1", type: "rect", myType: "house"},
      {id: "g3", type: "group", myType: "house"},
    ];

    expect(collectHouseGroupCandidates(input).map((item) => item.id)).toEqual(["g1", "g3"]);
  });

  it("maps a house group into rebuild source metadata with normalized booleans", () => {
    const group = {
      id: "g1",
      type: "group",
      myType: "house",
      houseViewType: "back",
      houseView: "side",
      houseSide: "left",
      houseInstanceId: "back_1",
      isFlippedHorizontally: 1,
      isRightSide: 0,
    };

    expect(mapHouseGroupToRebuildSource(group)).toEqual({
      group,
      meta: {
        houseViewType: "back",
        houseView: "side",
        houseSide: "left",
        houseInstanceId: "back_1",
        isFlippedHorizontally: true,
        isRightSide: false,
      },
    });
  });

  it("collects rebuild sources from mixed canvas objects", () => {
    const house = {
      id: "g1",
      type: "group",
      myType: "house",
      houseViewType: "front",
      houseView: "front",
      houseSide: "top",
      houseInstanceId: "front_1",
      isFlippedHorizontally: false,
      isRightSide: false,
    };
    const notHouse = {id: "g2", type: "group", myType: "line"};

    const result = collectHouseGroupRebuildSources([house, notHouse]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      group: house,
      meta: {
        houseViewType: "front",
        houseView: "front",
        houseSide: "top",
        houseInstanceId: "front_1",
        isFlippedHorizontally: false,
        isRightSide: false,
      },
    });
  });

  it("collects piloti sources from house groups using getObjects", () => {
    const objectsA = [{id: "a"}];
    const objectsB = [{id: "b"}];
    const houseA = {id: "h1", type: "group", myType: "house", getObjects: () => objectsA};
    const line = {id: "l1", type: "group", myType: "line", getObjects: () => [{id: "line"}]};
    const houseB = {id: "h2", type: "group", myType: "house", getObjects: () => objectsB};

    expect(collectHouseGroupPilotiSources([houseA, line, houseB])).toEqual([
      {objects: objectsA},
      {objects: objectsB},
    ]);
  });

  it("finds the first top-view house group candidate", () => {
    const topGroup = {id: "top", type: "group", myType: "house", houseView: "top"};
    const list = [
      {id: "a", type: "group", myType: "house", houseView: "front"},
      topGroup,
      {id: "b", type: "group", myType: "line", houseView: "top"},
    ];

    expect(findTopViewGroupCandidate(list)).toBe(topGroup);
    expect(findTopViewGroupCandidate([{id: "x", type: "group", myType: "house", houseView: "front"}])).toBeNull();
  });
});
