import {RefObject, useEffect, useRef} from "react";
import {Canvas as FabricCanvas} from "fabric";

interface UseCanvasSelectionArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  isEditorOpen: boolean;
  isContraventamentoMode: boolean;
}

export function useCanvasSelection({
  fabricCanvasRef,
  isEditorOpen,
  isContraventamentoMode,
}: UseCanvasSelectionArgs) {
  const prevEditorOpenRef = useRef(isEditorOpen);

  useEffect(() => {
    const wasOpen = prevEditorOpenRef.current;
    prevEditorOpenRef.current = isEditorOpen;

    if (isContraventamentoMode) return;

    if (wasOpen && !isEditorOpen && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.getObjects().forEach((item: any) => {
        if (item.type === "group" && item.myType === "house") {
          item.getObjects().forEach((child: any) => {
            if (child.isPilotiCircle) {
              if (child.pilotiIsMaster) {
                child.set({stroke: "#8B4513", strokeWidth: 2});
              } else {
                child.set({stroke: "black", strokeWidth: 1.5 * 0.6});
              }
            }

            if (child.isPilotiRect) {
              if (child.pilotiIsMaster) {
                child.set({stroke: "#8B4513", strokeWidth: 3});
              } else {
                child.set({stroke: "#333", strokeWidth: 2});
              }
            }
          });
        }
      });
      canvas.requestRenderAll();
    }
  }, [fabricCanvasRef, isEditorOpen, isContraventamentoMode]);
}
