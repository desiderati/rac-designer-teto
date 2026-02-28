import {forwardRef, ReactNode, useEffect, useImperativeHandle, useRef} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH, PilotiCanvasSelection} from '@/components/lib/canvas';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import {useCanvasClipboard} from '@/components/rac-editor/canvas/canvas/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from '@/components/rac-editor/canvas/canvas/useCanvasContainerLifecycle.ts';
import {useCanvasContraventamento} from '@/components/rac-editor/canvas/canvas/useCanvasContraventamento.ts';
import {useCanvasFabricSetup} from '@/components/rac-editor/canvas/canvas/useCanvasFabricSetup.ts';
import {useCanvasHistory} from '@/components/rac-editor/canvas/canvas/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from '@/components/rac-editor/canvas/canvas/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from '@/components/rac-editor/canvas/canvas/useCanvasPointerInteractions.ts';
import {useCanvasScreenProjection} from '@/components/rac-editor/canvas/canvas/useCanvasScreenProjection.ts';
import {useCanvasHouseSelection} from '@/components/rac-editor/canvas/canvas/useCanvasHouseSelection.ts';
import {useCanvasViewport} from '@/components/rac-editor/canvas/canvas/useCanvasViewport.ts';

export interface ContraventamentoCanvasSelection {
  contraventamentoId: string;
  group: Group;
}

export interface WallCanvasSelection {
  object: FabricObject;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

export type LinearCanvasSelectionType = 'line' | 'arrow' | 'distance';

export interface LinearCanvasSelection {
  object: FabricObject;
  myType: LinearCanvasSelectionType;
  currentLabel: string;
  currentColor: string;
  screenPosition: { x: number; y: number };
}

export interface TerrainCanvasSelection {
  group: Group;
  terrainType: number;
  screenPosition: { x: number; y: number };
}

interface CanvasProps {
  children?: ReactNode;
  isAnyEditorOpen?: boolean;

  onSelectionChange: (hint: string) => void;
  onDelete?: () => void;
  onHistorySave: () => void;
  onZoomInteraction?: () => void;
  onMinimapInteraction?: () => void;

  onPilotiSelect?: (selection: PilotiCanvasSelection | null) => void;
  onWallSelect?: (selection: WallCanvasSelection | null) => void;
  onLinearSelect?: (selection: LinearCanvasSelection | null) => void;
  onTerrainSelect?: (selection: TerrainCanvasSelection | null) => void;

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

export const Canvas =
  forwardRef<CanvasHandle, CanvasProps>(
    ({
      children,
      isAnyEditorOpen = false,

      onSelectionChange,
      onDelete,
      onHistorySave,
      onZoomInteraction,
      onMinimapInteraction,

      onPilotiSelect,
      onWallSelect,
      onLinearSelect,
      onTerrainSelect,

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
      const isAnyEditorOpenRef = useRef(isAnyEditorOpen);

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

      useCanvasHouseSelection({
        fabricCanvasRef,
        isAnyEditorOpen,
        isContraventamentoMode,
      });

      useEffect(() => {
        isAnyEditorOpenRef.current = isAnyEditorOpen;
      }, [isAnyEditorOpen]);

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

        isAnyEditorOpenRef,
        onSelectionChange,
        onDelete,
        onPilotiSelect,
        onWallSelect: onWallSelect,
        onLinearSelect: onLinearSelect,
        onTerrainSelect,

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
          data-testid='rac-canvas-container'
          className='w-full h-full overflow-hidden relative bg-muted touch-none'
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
            className='absolute shadow-xl bg-card'
            style={{
              transform: `translate(${canvasX}px, ${canvasY}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
          >
            <canvas ref={canvasRef} data-testid='rac-editor-canvas-element'/>
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
