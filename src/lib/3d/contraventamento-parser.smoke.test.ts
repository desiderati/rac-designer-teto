import {describe, expect, it} from "vitest";
import {parseContraventamentosFromTopGroup} from "@/lib/3d/contraventamento-parser";

describe("parseContraventamentosFromTopGroup", () => {
  it("parses and normalizes valid contraventamento objects", () => {
    const topGroup = {
      getObjects: () => [
        {
          isContraventamento: true,
          contraventamentoId: "c-1",
          contraventamentoCol: 2,
          contraventamentoStartRow: 2,
          contraventamentoEndRow: 0,
          contraventamentoSide: "left",
          contraventamentoAnchorPilotiId: "piloti_2_2",
        },
      ],
    };

    const parsed = parseContraventamentosFromTopGroup(topGroup);
    expect(parsed).toEqual([
      {
        id: "c-1",
        col: 2,
        startRow: 0,
        endRow: 2,
        side: "left",
        anchorPilotiId: "piloti_2_2",
      },
    ]);
  });

  it("ignores invalid objects and applies fallbacks", () => {
    const topGroup = {
      getObjects: () => [
        {
          isContraventamento: true,
          contraventamentoCol: 4,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 1,
        },
        {
          isContraventamento: true,
          contraventamentoCol: 1,
          contraventamentoStartRow: 1,
          contraventamentoEndRow: 1,
        },
        {
          isContraventamento: true,
          contraventamentoCol: 0,
          contraventamentoStartRow: 0,
          contraventamentoEndRow: 2,
          contraventamentoSide: "unknown",
        },
      ],
    };

    const parsed = parseContraventamentosFromTopGroup(topGroup);
    expect(parsed).toEqual([
      {
        id: "contrav_3d_2",
        col: 0,
        startRow: 0,
        endRow: 2,
        side: "right",
        anchorPilotiId: "piloti_0_0",
      },
    ]);
  });
});
