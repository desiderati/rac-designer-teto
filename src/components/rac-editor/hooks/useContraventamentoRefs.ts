import {RefObject, useEffect, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {PILOTI_MASTER_STYLE, PILOTI_STYLE} from '@/shared/config.ts';
import {isCanvasGroup} from "@/components/rac-editor/lib/canvas";

interface ContraventamentoRefs {
  isContraventamentoMode: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (col: number, row: number) => void;
  onContraventamentoCancel?: () => void;
}

interface UseCanvasContraventamentoArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  isContraventamentoMode: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (col: number, row: number) => void;
  onContraventamentoCancel?: () => void;
}

export function useContraventamentoRefs({
  fabricCanvasRef,
  isContraventamentoMode,
  isPilotiEligibleForContraventamento,
  onContraventamentoPilotiClick,
  onContraventamentoCancel,
}: UseCanvasContraventamentoArgs) {

  // Objeto ref único que mantém todas as props atualizadas sem re-render.
  const refs = useRef<ContraventamentoRefs>({
    isContraventamentoMode,
    isPilotiEligibleForContraventamento,
    onContraventamentoPilotiClick,
    onContraventamentoCancel,
  });

  // Um único useEffect sincroniza todas as props de uma vez.
  useEffect(() => {
    refs.current = {
      isContraventamentoMode,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoCancel,
    };
  });

  useEffect(() => {
    if (isContraventamentoMode) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas?.upperCanvasEl) return;

    canvas.upperCanvasEl.style.cursor = 'default';
  }, [fabricCanvasRef, isContraventamentoMode]);

  useEffect(() => {
    if (!isContraventamentoMode) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((item: any) => {
      if (!isCanvasGroup(item) || item.myType !== 'house' || item.houseView === 'top') return;
      item.getObjects().forEach((child: any) => {
        if (!child.isPilotiRect) return;
        if (child.pilotiIsMaster) {
          child.set({stroke: PILOTI_MASTER_STYLE.strokeColor, strokeWidth: PILOTI_MASTER_STYLE.strokeWidth});
        } else {
          child.set({stroke: PILOTI_STYLE.strokeColor, strokeWidth: PILOTI_STYLE.strokeWidthTopView});
        }
        (child as any).dirty = true;
      });
    });

    canvas.requestRenderAll();
  }, [fabricCanvasRef, isContraventamentoMode]);

  return {
    // Expõe refs individuais para compatibilidade com os consumidores existentes.
    isContraventamentoModeRef: {
      get current() {
        return refs.current.isContraventamentoMode;
      },
    },
    isPilotiEligibleForContraventamentoRef: {
      get current() {
        return refs.current.isPilotiEligibleForContraventamento;
      },
    },
    onContraventamentoPilotiClickRef: {
      get current() {
        return refs.current.onContraventamentoPilotiClick;
      },
    },
    onContraventamentoCancelRef: {
      get current() {
        return refs.current.onContraventamentoCancel;
      },
    },
  };
}
