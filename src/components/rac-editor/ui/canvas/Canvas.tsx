import {forwardRef, ReactNode, useEffect, useImperativeHandle, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH, CanvasGroup, PilotiCanvasSelection} from '@/components/rac-editor/lib/canvas';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import {useCanvasClipboard} from '@/components/rac-editor/hooks/canvas/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from '@/components/rac-editor/hooks/canvas/useCanvasContainerLifecycle.ts';
import {useContraventamentoRefs} from '@/components/rac-editor/hooks/useContraventamentoRefs.ts';
import {useCanvasFabricSetup} from '@/components/rac-editor/hooks/canvas/useCanvasFabricSetup.ts';
import {useCanvasHistory} from '@/components/rac-editor/hooks/canvas/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from '@/components/rac-editor/hooks/canvas/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from '@/components/rac-editor/hooks/canvas/useCanvasPointerInteractions.ts';
import {useCanvasScreenProjection} from '@/components/rac-editor/hooks/canvas/useCanvasScreenProjection.ts';
import {useCanvasHouseSelection} from '@/components/rac-editor/hooks/canvas/useCanvasHouseSelection.ts';
import {useCanvasViewport} from '@/components/rac-editor/hooks/canvas/useCanvasViewport.ts';

export interface ContraventamentoCanvasSelection {
  group: CanvasGroup;
  contraventamentoId: string;
}

export interface WallCanvasSelection {
  object: CanvasGroup;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

export type LinearCanvasSelectionType = 'line' | 'arrow' | 'distance';

export interface LinearCanvasSelection {
  object: CanvasGroup;
  myType: LinearCanvasSelectionType;
  currentLabel: string;
  currentColor: string;
  screenPosition: { x: number; y: number };
}

export interface TerrainCanvasSelection {
  group: CanvasGroup;
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
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (col: number, row: number) => void;
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
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
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
        isPilotiEligibleForContraventamentoRef,
        onContraventamentoPilotiClickRef,
        onContraventamentoCancelRef,
      } = useContraventamentoRefs({
        fabricCanvasRef,
        isContraventamentoMode,
        isPilotiEligibleForContraventamento,
        onContraventamentoPilotiClick,
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
        isPilotiEligibleForContraventamentoRef,
        onContraventamentoPilotiClickRef,
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
