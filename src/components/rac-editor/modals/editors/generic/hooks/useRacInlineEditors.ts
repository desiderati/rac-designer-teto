import {useState} from "react";
import type {
  ObjectCanvasSelection,
  LineArrowDistanceCanvasSelection,
} from "@/components/rac-editor/Canvas.tsx";

export function useRacInlineEditors() {

  const [objectSelection, setObjectSelection] =
    useState<ObjectCanvasSelection | null>(null);

  const [isObjectEditorOpen, setIsObjectEditorOpen] =
    useState(false);

  const [lineArrowDistanceSelection, setLineArrowDistanceSelection] =
    useState<LineArrowDistanceCanvasSelection | null>(null);

  const [isLineArrowDistanceEditorOpen, setIsLineArrowDistanceEditorOpen] =
    useState(false);

  const handleObjectSelect = (
    selection: ObjectCanvasSelection | null
  ) => {
    if (selection) {
      setObjectSelection(selection);
      setIsObjectEditorOpen(true);
    }
  };

  const closeObjectEditor = () => {
    setIsObjectEditorOpen(false);
    setObjectSelection(null);
  };

  const handleLineArrowDistanceSelect = (
    selection: LineArrowDistanceCanvasSelection | null
  ) => {
    if (selection) {
      setLineArrowDistanceSelection(selection);
      setIsLineArrowDistanceEditorOpen(true);
    }
  };

  const closeLineArrowDistanceEditor = () => {
    setIsLineArrowDistanceEditorOpen(false);
    setLineArrowDistanceSelection(null);
  };

  return {
    objectSelection,
    isObjectEditorOpen,
    handleObjectSelect,
    closeObjectEditor,

    lineArrowDistanceSelection,
    isLineArrowDistanceEditorOpen,
    handleLineArrowDistanceSelect,
    closeLineArrowDistanceEditor,
  };
}
