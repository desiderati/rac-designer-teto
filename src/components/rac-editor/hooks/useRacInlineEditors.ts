import {useState} from "react";
import type {
  DistanceSelection,
  LineArrowCanvasSelection,
  ObjectNameSelection,
} from "@/components/rac-editor/Canvas";

export function useRacInlineEditors() {
  const [distanceSelection, setDistanceSelection] = useState<DistanceSelection | null>(null);
  const [isDistanceEditorOpen, setIsDistanceEditorOpen] = useState(false);
  const [objectNameSelection, setObjectNameSelection] = useState<ObjectNameSelection | null>(null);
  const [isObjectNameEditorOpen, setIsObjectNameEditorOpen] = useState(false);
  const [lineArrowSelection, setLineArrowSelection] = useState<LineArrowCanvasSelection | null>(null);
  const [isLineArrowEditorOpen, setIsLineArrowEditorOpen] = useState(false);

  const openDistanceEditor = (selection: DistanceSelection) => {
    setDistanceSelection(selection);
    setIsDistanceEditorOpen(true);
  };

  const handleDistanceSelect = (selection: DistanceSelection | null) => {
    setDistanceSelection(selection);
    if (selection) {
      setIsDistanceEditorOpen(true);
    }
  };

  const closeDistanceEditor = () => {
    setIsDistanceEditorOpen(false);
    setDistanceSelection(null);
  };

  const handleObjectNameSelect = (selection: ObjectNameSelection | null) => {
    setObjectNameSelection(selection);
    if (selection) {
      setIsObjectNameEditorOpen(true);
    }
  };

  const closeObjectNameEditor = () => {
    setIsObjectNameEditorOpen(false);
    setObjectNameSelection(null);
  };

  const handleLineArrowSelect = (selection: LineArrowCanvasSelection | null) => {
    if (selection) {
      setLineArrowSelection(selection);
      setIsLineArrowEditorOpen(true);
    }
  };

  const closeLineArrowEditor = () => {
    setIsLineArrowEditorOpen(false);
    setLineArrowSelection(null);
  };

  return {
    distanceSelection,
    isDistanceEditorOpen,
    objectNameSelection,
    isObjectNameEditorOpen,
    lineArrowSelection,
    isLineArrowEditorOpen,
    openDistanceEditor,
    handleDistanceSelect,
    closeDistanceEditor,
    handleObjectNameSelect,
    closeObjectNameEditor,
    handleLineArrowSelect,
    closeLineArrowEditor,
  };
}
