import {describe, expect, it} from "vitest";
import {buildOpeningsFromCanvasModel} from "@/components/lib/3d/openings-mapper.ts";

describe("buildOpeningsFromCanvasModel", () => {
  it("maps tipo6 front/back faces according to selected front side", () => {
    const openings = buildOpeningsFromCanvasModel("tipo6", [], "bottom", null);
    const frontDoor = openings.find((o) => o.id === "canvas-front-door");
    const backWindow = openings.find((o) => o.id === "canvas-back-window");

    expect(frontDoor?.face).toBe("back");
    expect(backWindow?.face).toBe("front");
  });

  it("maps tipo3 open side with inferred door side fallback", () => {
    const openings = buildOpeningsFromCanvasModel("tipo3", [
      {id: "door-left", type: "door", face: "left", x: 0, y: 0, width: 10, height: 10},
    ]);

    const door = openings.find((o) => o.type === "door");
    expect(door?.face).toBe("left");
  });
});
