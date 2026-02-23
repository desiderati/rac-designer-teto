import {describe, expect, it} from "vitest";
import {readLineArrowEditorState} from "./line-arrow-editor";

describe("line-arrow-editor utils", () => {
  it("reads color from standalone line", () => {
    expect(
      readLineArrowEditorState(
        {
          type: "line",
          stroke: "#123456",
        },
        "line",
      ),
    ).toEqual({
      currentColor: "#123456",
      currentLabel: "",
    });
  });

  it("reads label and line color from grouped line object", () => {
    expect(
      readLineArrowEditorState(
        {
          type: "group",
          getObjects: () => [
            {myType: "lineArrowLabel", text: " Linha A "},
            {type: "line", stroke: "#abcdef"},
          ],
        },
        "line",
      ),
    ).toEqual({
      currentColor: "#abcdef",
      currentLabel: "Linha A",
    });
  });

  it("reads arrow color from nested arrow child and label", () => {
    expect(
      readLineArrowEditorState(
        {
          type: "group",
          getObjects: () => [
            {myType: "lineArrowLabel", text: "Seta 1"},
            {
              type: "group",
              getObjects: () => [{fill: "#f59e0b"}],
            },
          ],
        },
        "arrow",
      ),
    ).toEqual({
      currentColor: "#f59e0b",
      currentLabel: "Seta 1",
    });
  });
});
