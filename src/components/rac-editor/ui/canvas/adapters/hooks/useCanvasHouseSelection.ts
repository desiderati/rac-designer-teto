import {RefObject, useEffect, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {CanvasGroup, getCanvasGroupObjects, isCanvasGroup,} from '@/components/rac-editor/lib/canvas';
import {PILOTI_MASTER_STYLE, PILOTI_STYLE} from '@/shared/config.ts';
import {PILOTI_MASTER_STROKE_COLOR, PILOTI_STROKE_COLOR} from '@/shared/constants.ts';

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
      canvas.getObjects()
        .filter((o): o is CanvasGroup => isCanvasGroup(o))
        .forEach((item) => {
          if (item.myType === 'house') {
            getCanvasGroupObjects(item).forEach(child => {
              if (child.isPilotiCircle) {
                if (child.pilotiIsMaster) {
                  child.set({
                    stroke: PILOTI_MASTER_STROKE_COLOR,
                    strokeWidth: PILOTI_MASTER_STYLE.strokeWidthTopView
                  });
                } else {
                  child.set({
                    stroke: PILOTI_STROKE_COLOR,
                    strokeWidth: PILOTI_STYLE.strokeWidthTopView
                  });
                }
              }

              if (child.isPilotiRect) {
                if (child.pilotiIsMaster) {
                  child.set({
                    stroke: PILOTI_MASTER_STROKE_COLOR,
                    strokeWidth: PILOTI_MASTER_STYLE.strokeWidth
                  });
                } else {
                  child.set({
                    stroke: PILOTI_STROKE_COLOR,
                    strokeWidth: PILOTI_STYLE.strokeWidth
                  });
                }
              }
            });
          }
        });
      canvas.requestRenderAll();
    }
  }, [fabricCanvasRef, isAnyEditorOpen, isContraventamentoMode]);
}

