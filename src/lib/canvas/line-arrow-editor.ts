export type LineArrowKind = "line" | "arrow";

interface FabricLikeObject {
  type?: string;
  myType?: string;
  stroke?: string;
  fill?: string;
  text?: string;
  getObjects?: () => FabricLikeObject[];
}

export interface LineArrowEditorState {
  currentColor: string;
  currentLabel: string;
}

export function readLineArrowEditorState(
  object: FabricLikeObject,
  kind: LineArrowKind,
): LineArrowEditorState {

  let currentColor = "#000000";
  let currentLabel = "";

  if (object.type === "group" && typeof object.getObjects === "function") {
    const groupChildren = object.getObjects();
    const labelChild = groupChildren.find((child) => child?.myType === "lineArrowLabel");
    const lineChild = groupChildren.find((child) => child?.type === "line");
    const arrowChild = groupChildren.find((child) => child?.type === "group");

    if (labelChild?.text) {
      currentLabel = labelChild.text.trim();
    }

    if (kind === "line" && lineChild?.stroke) {
      currentColor = lineChild.stroke;
    } else if (kind === "arrow" && arrowChild && typeof arrowChild.getObjects === "function") {
      const firstChild = arrowChild.getObjects()[0];
      currentColor = firstChild?.fill || "#333";
    } else if (kind === "arrow") {
      const firstChild = groupChildren[0];
      currentColor = firstChild?.fill || "#333";
    }
  } else if (kind === "line" && object.stroke) {
    currentColor = object.stroke;
  }

  return {currentColor, currentLabel};
}
