import {forwardRef, ReactNode, useEffect, useImperativeHandle, useRef} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group,} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH,} from '@/lib/canvas-utils';
import {CanvasOverlays} from './CanvasOverlays';
import {useCanvasClipboard} from './hooks/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from './hooks/useCanvasContainerLifecycle.ts';
import {useCanvasContraventamento} from './hooks/useCanvasContraventamento.ts';
import {useCanvasFabricSetup} from './hooks/useCanvasFabricSetup.ts';
import {useCanvasHistory} from './hooks/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from './hooks/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from './hooks/useCanvasPointerInteractions.ts';
import {useCanvasScreenProjection} from './hooks/useCanvasScreenProjection.ts';
import {useCanvasSelection} from './hooks/useCanvasSelection.ts';
import {useCanvasViewport} from './hooks/useCanvasViewport.ts';

export interface PilotiCanvasSelection {
  pilotiId: string;
  currentIsMaster: boolean;
  currentHeight: number;
  currentNivel: number;
  group: Group;
  screenPosition: { x: number; y: number };
  houseView: 'top' | 'front' | 'back' | 'side';
}

export interface ContraventamentoCanvasSelection {
  contraventamentoId: string;
  group: Group;
}

export interface ObjectCanvasSelection {
  object: FabricObject;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

export type LineArrowDistanceCanvasSelectionType = "line" | "arrow" | "distance";

export interface LineArrowDistanceCanvasSelection {
  object: FabricObject;
  myType: LineArrowDistanceCanvasSelectionType;
  currentLabel: string;
  currentColor: string;
  screenPosition: { x: number; y: number };
}

interface CanvasProps {
  children?: ReactNode;
  isEditorOpen?: boolean;

  onSelectionChange: (hint: string) => void;
  onDelete?: () => void;
  onHistorySave: () => void;
  onZoomInteraction?: () => void;
  onMinimapInteraction?: () => void;

  onPilotiSelect?: (selection: PilotiCanvasSelection | null) => void;
  onObjectSelect?: (selection: ObjectCanvasSelection | null) => void;
  onLineArrowDistanceSelect?: (selection: LineArrowDistanceCanvasSelection | null) => void;

  showZoomControls?: boolean;
  showTips?: boolean;

  tutorialHighlight?: 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;

  // Contraventamento
  isContraventamentoMode?: boolean;
  isSelectingContraventamentoDestination?: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (pilotiId: string, col: number, row: number, group: Group) => void;
  onContraventamentoSelect?: (selection: ContraventamentoCanvasSelection | null) => void;
  onContraventamentoCancel?: () => void;
}

export interface CanvasHandle {
  canvas: FabricCanvas | null;
  saveHistory: () => void;
  clearHistory: () => void;
  undo: () => void;
  copy: () => void;
  paste: () => void;
  getVisibleCenter: () => { x: number; y: number };
  getCanvasPosition: () => { x: number; y: number; zoom: number };
  setCanvasPosition: (x: number, y: number) => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({
    children,
    isEditorOpen = false,

    onSelectionChange,
    onDelete,
    onHistorySave,
    onZoomInteraction,
    onMinimapInteraction,

    onPilotiSelect,
    onObjectSelect,
    onLineArrowDistanceSelect,

    showZoomControls = true,
    showTips = false,
    tutorialHighlight,

    isContraventamentoMode = false,
    isSelectingContraventamentoDestination = false,
    isPilotiEligibleForContraventamento,
    onContraventamentoPilotiClick,
    onContraventamentoSelect,
    onContraventamentoCancel
  }, ref) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);

    const {
      zoom,
      viewportX,
      setViewportX,
      viewportY,
      setViewportY,
      containerSize,
      setContainerSize,
      isPanning,
      setIsPanning,
      isPinching,
      setIsPinching,
      setIsSingleFingerPanning,
      lastPanPoint,
      lastPinchDistance,
      lastPinchCenter,
      pinchTimeoutRef,
      singleFingerStartPoint,
      singleFingerMoved,
      zoomRef,
      viewportXRef,
      viewportYRef,
      containerSizeRef,
      handleViewportChange,
      handleZoomChange,
    } = useCanvasViewport({onMinimapInteraction, onZoomInteraction});

    const {minimapObjects, updateMinimapObjects} = useCanvasMinimapObjects();
    const isEditorOpenRef = useRef(isEditorOpen);

    const {
      isContraventamentoModeRef,
      isSelectingContraventamentoDestinationRef,
      isPilotiEligibleForContraventamentoRef,
      onContraventamentoPilotiClickRef,
      onContraventamentoSelectRef,
      onContraventamentoCancelRef,
    } = useCanvasContraventamento({
      fabricCanvasRef,
      isContraventamentoMode,
      isSelectingContraventamentoDestination,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoSelect,
      onContraventamentoCancel,
    });

    useCanvasSelection({
      fabricCanvasRef,
      isEditorOpen,
      isContraventamentoMode,
    });

    useEffect(() => {
      isEditorOpenRef.current = isEditorOpen;
    }, [isEditorOpen]);

    // Check if minimap should be visible
    const canvasFitsInViewport =
      CANVAS_WIDTH * zoom <= containerSize.width &&
      CANVAS_HEIGHT * zoom <= containerSize.height;

    const {
      saveHistory,
      clearHistory,
      undo,
    } = useCanvasHistory({
      fabricCanvasRef,
      updateMinimapObjects: () => updateMinimapObjects(fabricCanvasRef.current),
      onHistorySave,
      onSelectionChange,
    });

    const {copy, paste} = useCanvasClipboard({
      fabricCanvasRef,
      saveHistory,
      onSelectionChange,
    });

    const {
      getCanvasOffsetFromState,
      getCurrentScreenPoint,
      getVisibleCenter,
    } = useCanvasScreenProjection({
      containerRef,
      containerSizeRef,
      zoomRef,
      viewportXRef,
      viewportYRef,
    });

    useImperativeHandle(ref, () => ({
      canvas: fabricCanvasRef.current,
      saveHistory,
      clearHistory,
      undo,
      copy,
      paste,
      getCanvasPosition: () => ({x: viewportX, y: viewportY, zoom}),
      setCanvasPosition: (x: number, y: number) => {
        handleViewportChange(x, y);
      },
      getVisibleCenter,
    }), [clearHistory, copy, getVisibleCenter, handleViewportChange, paste, saveHistory, undo, viewportX, viewportY, zoom]);

    useCanvasFabricSetup({
      canvasRef,
      containerRef,
      fabricCanvasRef,

      isEditorOpenRef,
      onSelectionChange,
      onDelete,
      onPilotiSelect,
      onObjectSelect,
      onLineArrowDistanceSelect,

      copy,
      paste,
      undo,
      saveHistory,
      getCurrentScreenPoint,

      isContraventamentoModeRef,
      isSelectingContraventamentoDestinationRef,
      isPilotiEligibleForContraventamentoRef,
      onContraventamentoPilotiClickRef,
      onContraventamentoSelectRef,
      onContraventamentoCancelRef,
    });

    useCanvasContainerLifecycle({
      containerRef,
      containerSize,
      setContainerSize,
      zoom,
      setViewportX,
      setViewportY,
    });

    const {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    } = useCanvasPointerInteractions({
      fabricCanvasRef,
      containerSize,
      containerRef,

      isPanning,
      setIsPanning,
      setIsSingleFingerPanning,
      lastPanPoint,

      setIsPinching,
      lastPinchDistance,
      lastPinchCenter,
      singleFingerStartPoint,
      singleFingerMoved,
      pinchTimeoutRef,

      zoom,
      handleZoomChange,
      setViewportX,
      setViewportY,
    });

    // Calculate canvas position - center it when it fits, otherwise use viewport offset
    const {canvasX, canvasY} = getCanvasOffsetFromState({
      zoom,
      viewportX,
      viewportY,
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
    });

    return (
      <div
        ref={containerRef}
        data-testid="rac-canvas-container"
        className="w-full h-full overflow-hidden relative bg-muted touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas */}
        <div
          className="absolute shadow-xl bg-card"
          style={{
            transform: `translate(${canvasX}px, ${canvasY}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
        >
          <canvas ref={canvasRef} data-testid="rac-editor-canvas-element"/>
        </div>

        <CanvasOverlays
          isPinching={isPinching}

          containerHeight={containerSize.height}
          containerWidth={containerSize.width}

          zoom={zoom}
          onZoomChange={handleZoomChange}
          showZoomControls={showZoomControls}
          minimapObjects={minimapObjects}

          viewportX={viewportX}
          viewportY={viewportY}
          onViewportChange={handleViewportChange}
          canvasFitsInViewport={canvasFitsInViewport}

          showTips={showTips}
          tutorialHighlight={tutorialHighlight}
        >
          {children}
        </CanvasOverlays>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
