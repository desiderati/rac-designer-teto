import {RefObject, useEffect, useRef} from 'react';
import {Canvas as FabricCanvas, Group} from 'fabric';
import {PILOTI_MASTER_STYLE, PILOTI_STYLE} from '@/shared/config.ts';

interface UseCanvasContraventamentoArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  isContraventamentoMode: boolean;
  isSelectingContraventamentoDestination: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (pilotiId: string, col: number, row: number, group: Group) => void;
  onContraventamentoSelect?: (selection: { group: Group; contraventamentoId: string } | null) => void;
  onContraventamentoCancel?: () => void;
}

interface ContraventamentoRefs {
  isContraventamentoMode: boolean;
  isSelectingContraventamentoDestination: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (pilotiId: string, col: number, row: number, group: Group) => void;
  onContraventamentoSelect?: (selection: { group: Group; contraventamentoId: string } | null) => void;
  onContraventamentoCancel?: () => void;
}

export function useCanvasContraventamento({
  fabricCanvasRef,
  isContraventamentoMode,
  isSelectingContraventamentoDestination,
  isPilotiEligibleForContraventamento,
  onContraventamentoPilotiClick,
  onContraventamentoSelect,
  onContraventamentoCancel,
}: UseCanvasContraventamentoArgs) {

  // Objeto ref único que mantém todas as props atualizadas sem re-render.
  const refs = useRef<ContraventamentoRefs>({
    isContraventamentoMode,
    isSelectingContraventamentoDestination,
    isPilotiEligibleForContraventamento,
    onContraventamentoPilotiClick,
    onContraventamentoSelect,
    onContraventamentoCancel,
  });

  // Um único useEffect sincroniza todas as props de uma vez.
  useEffect(() => {
    refs.current = {
      isContraventamentoMode,
      isSelectingContraventamentoDestination,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoSelect,
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
    if (!isSelectingContraventamentoDestination) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((item: any) => {
      if (item.type !== 'group' || item.myType !== 'house' || item.houseView === 'top') return;
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
  }, [fabricCanvasRef, isSelectingContraventamentoDestination]);

  return {
    // Expõe refs individuais para compatibilidade com os consumidores existentes.
    isContraventamentoModeRef: {
      get current() { return refs.current.isContraventamentoMode; },
    },
    isSelectingContraventamentoDestinationRef: {
      get current() { return refs.current.isSelectingContraventamentoDestination; },
    },
    isPilotiEligibleForContraventamentoRef: {
      get current() { return refs.current.isPilotiEligibleForContraventamento; },
    },
    onContraventamentoPilotiClickRef: {
      get current() { return refs.current.onContraventamentoPilotiClick; },
    },
    onContraventamentoSelectRef: {
      get current() { return refs.current.onContraventamentoSelect; },
    },
    onContraventamentoCancelRef: {
      get current() { return refs.current.onContraventamentoCancel; },
    },
  };
}
