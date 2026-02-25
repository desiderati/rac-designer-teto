import type {HouseElementDraft, HouseTypeExcludeNull} from "@/shared/types/house.ts";

export function getDefaultElementsForHouseType(houseType: HouseTypeExcludeNull): HouseElementDraft[] {
  if (houseType === "tipo6") {
    return [
      {
        type: "door",
        face: "front",
        x: 220,
        y: 22,
        width: 60,
        height: 110,
      },
      {
        type: "window",
        face: "front",
        x: 40,
        y: 30,
        width: 55,
        height: 45,
      },
      {
        type: "window",
        face: "front",
        x: 130,
        y: 30,
        width: 55,
        height: 45,
      },
      {
        type: "window",
        face: "back",
        x: 50,
        y: 30,
        width: 55,
        height: 45,
      },
      {
        type: "window",
        face: "back",
        x: 200,
        y: 30,
        width: 55,
        height: 45,
      },
    ];
  }

  return [
    {
      type: "window",
      face: "front",
      x: 140,
      y: 30,
      width: 70,
      height: 50,
    },
    {
      type: "window",
      face: "back",
      x: 140,
      y: 30,
      width: 70,
      height: 50,
    },
    {
      type: "door",
      face: "right",
      x: 96,
      y: 24,
      width: 60,
      height: 108,
    },
    {
      type: "window",
      face: "right",
      x: 21,
      y: 24,
      width: 54,
      height: 45,
    },
  ];
}
