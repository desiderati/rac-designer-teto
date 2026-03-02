import {MutableRefObject, useEffect, useRef} from 'react';
import {Canvas as FabricCanvas, PencilBrush} from 'fabric';
import {
  buildPilotiSelectionHandler,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PilotiCanvasSelection
} from '@/components/rac-editor/lib/canvas';
import {CanvasObject, CanvasPointerPayload} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {useCanvasSelectionActions} from './useCanvasSelectionActions.ts';
import {useCanvasKeyboardShortcuts} from './useCanvasKeyboardShortcuts.ts';
import {useCanvasEditorEvents} from './useCanvasEditorEvents.ts';
import {
  LinearCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection
} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {useContraventamentoEvents} from '@/components/rac-editor/hooks/useContraventamentoEvents.ts';

interface UseCanvasFabricSetupArgs {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  fabricCanvasRef: MutableRefObject<FabricCanvas | null>;
  saveHistory: () => void;
  onSelectionChange: (hint: string) => void;
  onPilotiSelect?: (selection: PilotiCanvasSelection | null) => void;
  onWallSelect?: (selection: WallCanvasSelection | null) => void;
  onLinearSelect?: (selection: LinearCanvasSelection | null) => void;
  onTerrainSelect?: (selection: TerrainCanvasSelection | null) => void;
  isAnyEditorOpenRef: MutableRefObject<boolean>;
  onDelete?: () => void;
  copy: () => void;
  paste: () => void;
  undo: () => void;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  isContraventamentoModeRef: MutableRefObject<boolean>;
  isPilotiEligibleForContraventamentoRef: MutableRefObject<((pilotiId: string) => boolean) | undefined>;
  onContraventamentoPilotiClickRef: MutableRefObject<((col: number, row: number) => void) | undefined>;
  onContraventamentoCancelRef: MutableRefObject<(() => void) | undefined>;
}

export function useCanvasFabricSetup({
  canvasRef,
  containerRef,
  fabricCanvasRef,
  saveHistory,
  onSelectionChange,
  onPilotiSelect,
  onWallSelect,
  onLinearSelect,
  onTerrainSelect,
  isAnyEditorOpenRef,
  onDelete,
  copy,
  paste,
  undo,
  getCurrentScreenPoint,
  isContraventamentoModeRef,
  isPilotiEligibleForContraventamentoRef,
  onContraventamentoPilotiClickRef,
  onContraventamentoCancelRef,
}: UseCanvasFabricSetupArgs) {

  const latestArgsRef = useRef<UseCanvasFabricSetupArgs>({
    canvasRef,
    containerRef,
    fabricCanvasRef,
    saveHistory,
    onSelectionChange,
    onPilotiSelect,
    onWallSelect,
    onLinearSelect,
    onTerrainSelect,
    isAnyEditorOpenRef,
    onDelete,
    copy,
    paste,
    undo,
    getCurrentScreenPoint,
    isContraventamentoModeRef,
    isPilotiEligibleForContraventamentoRef,
    onContraventamentoPilotiClickRef,
    onContraventamentoCancelRef,
  });

  latestArgsRef.current = {
    canvasRef,
    containerRef,
    fabricCanvasRef,
    saveHistory,
    onSelectionChange,
    onPilotiSelect,
    onWallSelect,
    onLinearSelect,
    onTerrainSelect,
    isAnyEditorOpenRef,
    onDelete,
    copy,
    paste,
    undo,
    getCurrentScreenPoint,
    isContraventamentoModeRef,
    isPilotiEligibleForContraventamentoRef,
    onContraventamentoPilotiClickRef,
    onContraventamentoCancelRef,
  };

  const {bindSelectionActions} = useCanvasSelectionActions();
  const {bindContraventamentoEvents} = useContraventamentoEvents();
  const {bindKeyboardShortcuts} = useCanvasKeyboardShortcuts();
  const {bindInlineEditorEvents} = useCanvasEditorEvents();

  // Fabric events are registered once and read latest values from refs.
  useEffect(() => {
    const {
      canvasRef: currentCanvasRef,
      containerRef: currentContainerRef,
      fabricCanvasRef: currentFabricCanvasRef,
    } = latestArgsRef.current;

    if (!currentCanvasRef.current || !currentContainerRef.current) return;

    const canvas = new FabricCanvas(currentCanvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: CANVAS_STYLE.backgroundColor,
    });

    currentFabricCanvasRef.current = canvas;

    const getEventPayload = (event: unknown): CanvasPointerPayload => {
      return (event as CanvasPointerPayload | undefined) ?? {};
    };

    const isPilotiVisualTarget =
      (object: CanvasObject): boolean => {
        if (!object) return false;
        return object.isPilotiCircle === true || object.isPilotiRect === true;
      };

    const runSaveHistory = () => latestArgsRef.current.saveHistory();

    const emitSelectionChange =
      (hint: string) => latestArgsRef.current.onSelectionChange(hint);

    const emitPilotiSelection =
      (selection: PilotiCanvasSelection | null) => latestArgsRef.current.onPilotiSelect?.(selection);

    const emitWallSelection =
      (selection: WallCanvasSelection | null) => latestArgsRef.current.onWallSelect?.(selection);

    const emitLinearSelection =
      (selection: LinearCanvasSelection | null) => latestArgsRef.current.onLinearSelect?.(selection);

    const emitTerrainSelection =
      (selection: TerrainCanvasSelection | null) => latestArgsRef.current.onTerrainSelect?.(selection);

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
    canvas.freeDrawingBrush.width = CANVAS_ELEMENT_STYLE.strokeWidth;
    const brushWithDecimate = canvas.freeDrawingBrush as PencilBrush & { decimate?: number };
    brushWithDecimate.decimate = 8;

    // Save initial history
    runSaveHistory();

    // Event listeners
    canvas.on('object:added', runSaveHistory);
    canvas.on('object:modified', runSaveHistory);
    canvas.on('object:removed', runSaveHistory);

    const handlePilotiSelection = buildPilotiSelectionHandler({
      canvas,
      isPilotiVisualTarget,
      emitPilotiSelection,
      emitSelectionChange,
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
      isPilotiEligibleForContraventamento: (pilotiId: string) => {
        return latestArgsRef.current.isPilotiEligibleForContraventamentoRef.current?.(pilotiId) ?? false;
      },
      onContraventamentoCancel: () => {
        latestArgsRef.current.onContraventamentoCancelRef.current?.();
      },
      onContraventamentoPilotiClick: (col: number, row: number) => {
        latestArgsRef.current.onContraventamentoPilotiClickRef.current?.(col, row);
      },
      getCurrentScreenPoint: (canvasPoint) =>
        latestArgsRef.current.getCurrentScreenPoint(canvasPoint),
    });

    const unbindSelectionActions = bindSelectionActions({
      canvas,
      onSelectionChange: emitSelectionChange,
      clearPilotiSelection: () => emitPilotiSelection(null),
      isAnyEditorOpen: () => latestArgsRef.current.isAnyEditorOpenRef.current,
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
    });

    const unbindContraventamentoEvents = bindContraventamentoEvents({
      canvas,
      getEventPayload,
      handlePilotiSelection,
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
      isPilotiEligibleForContraventamento: (pilotiId: string) => {
        return latestArgsRef.current.isPilotiEligibleForContraventamentoRef.current?.(pilotiId) ?? false;
      },
      onContraventamentoCancel: () => {
        latestArgsRef.current.onContraventamentoCancelRef.current?.();
      },
      onSelectionChange: emitSelectionChange,
      isAnyEditorOpen: () => latestArgsRef.current.isAnyEditorOpenRef.current,
    });

    const unbindKeyboardShortcuts = bindKeyboardShortcuts({
      canvas,
      isAnyEditorOpen: () => latestArgsRef.current.isAnyEditorOpenRef.current,
      tryDelete: () => {
        if (!latestArgsRef.current.onDelete) return false;
        latestArgsRef.current.onDelete();
        return true;
      },
      onSelectionChange: emitSelectionChange,
      copy: () => latestArgsRef.current.copy(),
      paste: () => latestArgsRef.current.paste(),
      undo: () => latestArgsRef.current.undo(),
    });

    const unbindInlineEditorEvents = bindInlineEditorEvents({
      canvas,
      getEventPayload,
      handlePilotiSelection,
      onWallSelect: (selection) => emitWallSelection(selection),
      onLinearSelect: (selection) => emitLinearSelection(selection),
      onTerrainSelect: (selection) => emitTerrainSelection(selection),
      onSelectionChange: emitSelectionChange,
      getCurrentScreenPoint: (canvasPoint) =>
        latestArgsRef.current.getCurrentScreenPoint(canvasPoint),
      isAnyEditorOpen: () => latestArgsRef.current.isAnyEditorOpenRef.current,
    });

    return () => {
      unbindInlineEditorEvents();
      unbindKeyboardShortcuts();
      unbindContraventamentoEvents();
      unbindSelectionActions();
      canvas.dispose().then(_ => {
        /*/ Do nothing! */
      });
    };
  }, [bindContraventamentoEvents, bindInlineEditorEvents, bindKeyboardShortcuts, bindSelectionActions]);
}
