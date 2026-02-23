import {MutableRefObject, useEffect, useRef} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group, PencilBrush,} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH,} from '@/lib/canvas-utils';
import {buildPilotiSelectionHandler} from './canvas-piloti-selection';
import {CanvasPointerPayload, CanvasRuntimeObject} from './canvas-fabric-runtime-types';
import {useCanvasSelectionEvents} from './useCanvasSelectionEvents';
import {useCanvasContraventamentoEvents} from './useCanvasContraventamentoEvents';
import {useCanvasKeyboardShortcuts} from './useCanvasKeyboardShortcuts';
import {useCanvasInlineEditorEvents} from './useCanvasInlineEditorEvents';
import {
  LineArrowDistanceCanvasSelection,
  ObjectCanvasSelection,
  PilotiCanvasSelection
} from "@/components/rac-editor/Canvas.tsx";

interface UseCanvasFabricSetupArgs {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  fabricCanvasRef: MutableRefObject<FabricCanvas | null>;
  saveHistory: () => void;
  onSelectionChange: (hint: string) => void;
  onPilotiSelect?: (selection: PilotiCanvasSelection | null) => void;
  onObjectSelect?: (selection: ObjectCanvasSelection | null) => void;
  onLineArrowDistanceSelect?: (selection: LineArrowDistanceCanvasSelection | null) => void;
  isEditorOpenRef: MutableRefObject<boolean>;
  onDelete?: () => void;
  copy: () => void;
  paste: () => void;
  undo: () => void;
  getCurrentScreenPoint: (canvasPoint: { x: number; y: number }) => { x: number; y: number } | null;
  isContraventamentoModeRef: MutableRefObject<boolean>;
  isSelectingContraventamentoDestinationRef: MutableRefObject<boolean>;
  isPilotiEligibleForContraventamentoRef: MutableRefObject<((pilotiId: string) => boolean) | undefined>;
  onContraventamentoPilotiClickRef: MutableRefObject<((pilotiId: string, col: number, row: number, group: Group) => void) | undefined>;
  onContraventamentoSelectRef: MutableRefObject<((selection: { group: Group; contraventamentoId: string } | null) => void) | undefined>;
  onContraventamentoCancelRef: MutableRefObject<(() => void) | undefined>;
}

export function useCanvasFabricSetup({
  canvasRef,
  containerRef,
  fabricCanvasRef,
  saveHistory,
  onSelectionChange,
  onPilotiSelect,
  onObjectSelect,
  onLineArrowDistanceSelect,
  isEditorOpenRef,
  onDelete,
  copy,
  paste,
  undo,
  getCurrentScreenPoint,
  isContraventamentoModeRef,
  isSelectingContraventamentoDestinationRef,
  isPilotiEligibleForContraventamentoRef,
  onContraventamentoPilotiClickRef,
  onContraventamentoSelectRef,
  onContraventamentoCancelRef,
}: UseCanvasFabricSetupArgs) {
  const latestArgsRef = useRef<UseCanvasFabricSetupArgs>({
    canvasRef,
    containerRef,
    fabricCanvasRef,
    saveHistory,
    onSelectionChange,
    onPilotiSelect,
    onObjectSelect,
    onLineArrowDistanceSelect,
    isEditorOpenRef,
    onDelete,
    copy,
    paste,
    undo,
    getCurrentScreenPoint,
    isContraventamentoModeRef,
    isSelectingContraventamentoDestinationRef,
    isPilotiEligibleForContraventamentoRef,
    onContraventamentoPilotiClickRef,
    onContraventamentoSelectRef,
    onContraventamentoCancelRef,
  });

  latestArgsRef.current = {
    canvasRef,
    containerRef,
    fabricCanvasRef,
    saveHistory,
    onSelectionChange,
    onPilotiSelect,
    onObjectSelect,
    onLineArrowDistanceSelect,
    isEditorOpenRef,
    onDelete,
    copy,
    paste,
    undo,
    getCurrentScreenPoint,
    isContraventamentoModeRef,
    isSelectingContraventamentoDestinationRef,
    isPilotiEligibleForContraventamentoRef,
    onContraventamentoPilotiClickRef,
    onContraventamentoSelectRef,
    onContraventamentoCancelRef,
  };

  const {bindSelectionEvents} = useCanvasSelectionEvents();
  const {bindContraventamentoEvents} = useCanvasContraventamentoEvents();
  const {bindKeyboardShortcuts} = useCanvasKeyboardShortcuts();
  const {bindInlineEditorEvents} = useCanvasInlineEditorEvents();

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
      backgroundColor: '#ffffff',
    });

    currentFabricCanvasRef.current = canvas;

    const getEventPayload = (event: unknown): CanvasPointerPayload => {
      return (event as CanvasPointerPayload | undefined) ?? {};
    };

    const toRuntimeObject = (object: FabricObject | null | undefined): CanvasRuntimeObject | null => {
      if (!object) return null;
      return object as CanvasRuntimeObject;
    };

    const isPilotiVisualTarget = (object: FabricObject | null | undefined): object is CanvasRuntimeObject => {
      const runtime = toRuntimeObject(object);
      if (!runtime) return false;
      return runtime.isPilotiCircle === true || runtime.isPilotiRect === true;
    };

    const runSaveHistory = () => latestArgsRef.current.saveHistory();
    const emitSelectionChange = (hint: string) => latestArgsRef.current.onSelectionChange(hint);
    const emitPilotiSelection = (selection: PilotiCanvasSelection | null) => latestArgsRef.current.onPilotiSelect?.(selection);
    const emitObjectSelection = (selection: ObjectCanvasSelection | null) => latestArgsRef.current.onObjectSelect?.(selection);
    const emitLineArrowDistanceSelection = (selection: LineArrowDistanceCanvasSelection | null) => latestArgsRef.current.onLineArrowDistanceSelect?.(selection);

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = 'black';
    canvas.freeDrawingBrush.width = 2;
    const brushWithDecimate = canvas.freeDrawingBrush as PencilBrush & {decimate?: number};
    brushWithDecimate.decimate = 8;

    // Save initial history
    runSaveHistory();

    // Event listeners
    canvas.on('object:added', runSaveHistory);
    canvas.on('object:modified', runSaveHistory);
    canvas.on('object:removed', runSaveHistory);

    const handlePilotiSelection = buildPilotiSelectionHandler({
      canvas,
      toRuntimeObject,
      isPilotiVisualTarget,
      emitPilotiSelection,
      emitSelectionChange,
      clearContraventamentoSelection: () => {
        latestArgsRef.current.onContraventamentoSelectRef.current?.(null);
      },
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
      isSelectingContraventamentoDestination: () => latestArgsRef.current.isSelectingContraventamentoDestinationRef.current,
      isPilotiEligibleForContraventamento: (pilotiId: string) => {
        return latestArgsRef.current.isPilotiEligibleForContraventamentoRef.current?.(pilotiId) ?? false;
      },
      onContraventamentoCancel: () => {
        latestArgsRef.current.onContraventamentoCancelRef.current?.();
      },
      onContraventamentoPilotiClick: (pilotiId: string, col: number, row: number, group: Group) => {
        latestArgsRef.current.onContraventamentoPilotiClickRef.current?.(pilotiId, col, row, group);
      },
      getCurrentScreenPoint: (canvasPoint) => latestArgsRef.current.getCurrentScreenPoint(canvasPoint),
    });

    const unbindSelectionEvents = bindSelectionEvents({
      canvas,
      toRuntimeObject,
      onSelectionChange: emitSelectionChange,
      clearPilotiSelection: () => emitPilotiSelection(null),
      isEditorOpen: () => latestArgsRef.current.isEditorOpenRef.current,
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
    });

    const unbindContraventamentoEvents = bindContraventamentoEvents({
      canvas,
      toRuntimeObject,
      getEventPayload,
      handlePilotiSelection,
      isContraventamentoMode: () => latestArgsRef.current.isContraventamentoModeRef.current,
      isSelectingContraventamentoDestination: () => latestArgsRef.current.isSelectingContraventamentoDestinationRef.current,
      isPilotiEligibleForContraventamento: (pilotiId: string) => {
        return latestArgsRef.current.isPilotiEligibleForContraventamentoRef.current?.(pilotiId) ?? false;
      },
      onContraventamentoPilotiClick: (pilotiId: string, col: number, row: number, group: Group) => {
        latestArgsRef.current.onContraventamentoPilotiClickRef.current?.(pilotiId, col, row, group);
      },
      onContraventamentoSelect: (selection: {group: Group; contraventamentoId: string} | null) => {
        latestArgsRef.current.onContraventamentoSelectRef.current?.(selection);
      },
      onContraventamentoCancel: () => {
        latestArgsRef.current.onContraventamentoCancelRef.current?.();
      },
      onSelectionChange: emitSelectionChange,
      isEditorOpen: () => latestArgsRef.current.isEditorOpenRef.current,
    });

    const unbindKeyboardShortcuts = bindKeyboardShortcuts({
      canvas,
      isEditorOpen: () => latestArgsRef.current.isEditorOpenRef.current,
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
      toRuntimeObject,
      getEventPayload,
      handlePilotiSelection,
      onObjectSelect: (selection) => emitObjectSelection(selection),
      onLineArrowDistanceSelect: (selection) => emitLineArrowDistanceSelection(selection),
      onSelectionChange: emitSelectionChange,
      getCurrentScreenPoint: (canvasPoint) => latestArgsRef.current.getCurrentScreenPoint(canvasPoint),
      isEditorOpen: () => latestArgsRef.current.isEditorOpenRef.current,
    });

    return () => {
      unbindInlineEditorEvents();
      unbindKeyboardShortcuts();
      unbindContraventamentoEvents();
      unbindSelectionEvents();
      canvas.dispose();
    };
  }, [bindContraventamentoEvents, bindInlineEditorEvents, bindKeyboardShortcuts, bindSelectionEvents]);
}
