import {describe, expect, it} from "vitest";
import {customProps} from "@/lib/canvas-utils";

describe("canvas serialization contract smoke", () => {
  it("keeps required custom properties for JSON import/export compatibility", () => {
    expect(customProps).toEqual(
      expect.arrayContaining([
        "houseViewType",
        "houseInstanceId",
        "houseSide",
        "pilotiId",
        "pilotiHeight",
        "pilotiIsMaster",
        "pilotiNivel",
        "isContraventamento",
        "contraventamentoId",
      ]),
    );
  });
});
