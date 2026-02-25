import {RefObject, useEffect, useRef} from "react";
import {Canvas as FabricCanvas, Group} from "fabric";

interface UseCanvasContraventamentoArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
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

  const isContraventamentoModeRef = useRef(isContraventamentoMode);
  const isSelectingContraventamentoDestinationRef = useRef(isSelectingContraventamentoDestination);
  const isPilotiEligibleForContraventamentoRef = useRef(isPilotiEligibleForContraventamento);
  const onContraventamentoPilotiClickRef = useRef(onContraventamentoPilotiClick);
  const onContraventamentoSelectRef = useRef(onContraventamentoSelect);
  const onContraventamentoCancelRef = useRef(onContraventamentoCancel);

  useEffect(() => {
    isContraventamentoModeRef.current = isContraventamentoMode;
  }, [isContraventamentoMode]);

  useEffect(() => {
    isSelectingContraventamentoDestinationRef.current = isSelectingContraventamentoDestination;
  }, [isSelectingContraventamentoDestination]);

  useEffect(() => {
    isPilotiEligibleForContraventamentoRef.current = isPilotiEligibleForContraventamento;
  }, [isPilotiEligibleForContraventamento]);

  useEffect(() => {
    onContraventamentoPilotiClickRef.current = onContraventamentoPilotiClick;
  }, [onContraventamentoPilotiClick]);

  useEffect(() => {
    onContraventamentoSelectRef.current = onContraventamentoSelect;
  }, [onContraventamentoSelect]);

  useEffect(() => {
    onContraventamentoCancelRef.current = onContraventamentoCancel;
  }, [onContraventamentoCancel]);

  useEffect(() => {
    if (isContraventamentoMode) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas?.upperCanvasEl) return;
    canvas.upperCanvasEl.style.cursor = "default";
  }, [fabricCanvasRef, isContraventamentoMode]);

  useEffect(() => {
    if (!isSelectingContraventamentoDestination) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((item: any) => {
      if (item.type !== "group" || item.myType !== "house" || item.houseView === "top") return;
      item.getObjects().forEach((child: any) => {
        if (!child.isPilotiRect) return;
        if (child.pilotiIsMaster) {
          child.set({stroke: "#8B4513", strokeWidth: 3});
        } else {
          child.set({stroke: "#333", strokeWidth: 2});
        }
        (child as any).dirty = true;
      });
    });

    canvas.requestRenderAll();
  }, [fabricCanvasRef, isSelectingContraventamentoDestination]);

  return {
    isContraventamentoModeRef,
    isSelectingContraventamentoDestinationRef,
    isPilotiEligibleForContraventamentoRef,
    onContraventamentoPilotiClickRef,
    onContraventamentoSelectRef,
    onContraventamentoCancelRef,
  };
}
