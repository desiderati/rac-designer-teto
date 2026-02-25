import {RefObject, useEffect, useRef} from "react";
import {Canvas as FabricCanvas} from "fabric";
import {MASTER_PILOTI_STROKE_COLOR, PILOTI_STROKE_COLOR} from "@/components/lib/canvas";

interface UseCanvasHouseSelectionArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  isAnyEditorOpen: boolean;
  isContraventamentoMode: boolean;
}

export function useCanvasHouseSelection({
  fabricCanvasRef,
  isAnyEditorOpen,
  isContraventamentoMode,
}: UseCanvasHouseSelectionArgs) {
  const prevEditorOpenRef = useRef(isAnyEditorOpen);

  useEffect(() => {
    const wasOpen = prevEditorOpenRef.current;
    prevEditorOpenRef.current = isAnyEditorOpen;

    if (isContraventamentoMode) return;

    if (wasOpen && !isAnyEditorOpen && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.getObjects().forEach((item: any) => {
        if (item.myType === "house") {
          item.getObjects().forEach((child: any) => {
            if (child.isPilotiCircle) {
              if (child.pilotiIsMaster) {
                child.set({stroke: MASTER_PILOTI_STROKE_COLOR, strokeWidth: 2});
              } else {
                child.set({stroke: PILOTI_STROKE_COLOR, strokeWidth: 1.5 * 0.6});
              }
            }

            if (child.isPilotiRect) {
              if (child.pilotiIsMaster) {
                child.set({stroke: MASTER_PILOTI_STROKE_COLOR, strokeWidth: 3});
              } else {
                child.set({stroke: PILOTI_STROKE_COLOR, strokeWidth: 2});
              }
            }
          });
        }
      });
      canvas.requestRenderAll();
    }
  }, [fabricCanvasRef, isAnyEditorOpen, isContraventamentoMode]);
}
