import {CanvasRuntimeObject} from "@/lib/canvas/factory/elements-factory.ts";

export interface LineArrowDistanceEditorState {
  currentColor: string;
  currentLabel: string;
}

export function readLineArrowDistanceEditorState(
  object: CanvasRuntimeObject
): LineArrowDistanceEditorState {

  let currentColor = "#000000";
  let currentLabel = "";

  const groupChildren = object.getObjects();
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === "objLabel"
    );

  if (labelChild?.fill) {
    currentColor = labelChild.fill;
  }

  if (labelChild?.text) {
    currentLabel = labelChild.text.trim();
  }

  return {currentColor, currentLabel};
}
