import {forwardRef, ReactNode, useEffect, useImperativeHandle, useRef} from 'react';
import {
  CanvasGroup,
  CanvasObject,
  PilotiCanvasSelection,
} from '@/components/rac-editor/lib/canvas';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import type {CanvasToolMode} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
import {useCanvasClipboard} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from '@/components/rac-editor/hooks/canvas/useCanvasContainerLifecycle.ts';
import {useContraventamentoRefs} from '@/components/rac-editor/ui/canvas/adapters/hooks/useContraventamentoRefs.ts';
import {useCanvasFabricSetup} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasFabricSetup.ts';
import {useCanvasHistory} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasPointerInteractions.ts';
import {useCanvasScreenProjection} from '@/components/rac-editor/hooks/canvas/useCanvasScreenProjection.ts';
import {useCanvasHouseSelection} from '@/components/rac-editor/ui/canvas/adapters/hooks/useCanvasHouseSelection.ts';
import {useCanvasViewport} from '@/components/rac-editor/hooks/canvas/useCanvasViewport.ts';
import {createHouseManagerCanvasPort} from '@/components/rac-editor/ui/canvas/adapters/fabric-house-manager-canvas-port.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {CANVAS_WORKSPACE_STYLE} from './workspace-style.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/ui/canvas/adapters/fabric-canvas-document-port.ts';
import {createFabricCanvasDebugPort} from '@/components/rac-editor/ui/canvas/adapters/fabric-canvas-debug-port.ts';
import {createFabricCanvasCommandPort} from '@/components/rac-editor/ui/canvas/adapters/fabric-canvas-command-port.ts';
import type {FabricCanvasRuntime} from '@/components/rac-editor/ui/canvas/adapters/fabric-canvas-runtime.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasHandle} from '@/components/rac-editor/store/CanvasInteractionPort.ts';
import type {
  ContraventamentoCanvasSelection,
  LinearCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection,
} from '@/components/rac-editor/store/CanvasSelectionPort.ts';

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

  /** Active canvas tool mode. 'pan' disables fabric multi-selection. */
  canvasToolMode?: CanvasToolMode;
  /** Notifies the parent whenever the internal zoom changes. */
  onZoomChange?: (zoom: number) => void;

  tutorialHighlight?: 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;

  // Contraventamento
  isContraventamentoMode?: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (col: number, row: number) => void;
  onContraventamentoCancel?: () => void;
  onFreeDrawPathCreated?: () => void;
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
      canvasToolMode = 'select',
      onZoomChange,
      tutorialHighlight,

      isContraventamentoMode = false,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoCancel,
      onFreeDrawPathCreated,
    }, ref) => {

      const containerRef = useRef<HTMLDivElement>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const fabricCanvasRef = useRef<FabricCanvasRuntime | null>(null);
      const {houseWritePort} = useEditorPorts();

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
        fitToView,
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
        houseWritePort,
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

      useImperativeHandle(ref, () => {
        const createCommandPort = () => {
          const canvas = fabricCanvasRef.current;
          return canvas
            ? createFabricCanvasCommandPort({
              canvas,
              getVisibleCenter,
              clearHistory,
              saveHistory,
            })
            : null;
        };
        return {
        createHouseManagerCanvasPort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createHouseManagerCanvasPort(canvas) : null;
        },
        createDocumentPort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createFabricCanvasDocumentPort(canvas) : null;
        },
        createDebugPort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createFabricCanvasDebugPort(canvas) : null;
        },
        saveHistory,
        clearHistory,
        undo,
        copy,
        paste,
        createElementObject: (kind) => createCommandPort()?.createElementObject(kind) ?? null,
        createHouseViewGroup: (payload) => createCommandPort()?.createHouseViewGroup(payload) ?? null,
        addObjectAtVisibleCenter: (object) => createCommandPort()?.addObjectAtVisibleCenter(object) ?? false,
        setDrawingModeEnabled: (enabled) => createCommandPort()?.setDrawingModeEnabled(enabled) ?? false,
        resetSurface: () => createCommandPort()?.resetSurface(),
        renderAll: () => createCommandPort()?.renderAll(),
        getActiveObjectCount: () => createCommandPort()?.getActiveObjectCount() ?? 0,
        deleteActiveObjects: (handlers) => createCommandPort()?.deleteActiveObjects(handlers) ?? 'none',
        getCanvasPointScreenPosition: (point) => getCurrentScreenPoint(point),
        getGroupLocalPointScreenPosition: (group, localCanvasPoint) =>
          createCommandPort()?.getGroupLocalPointScreenPosition(group, localCanvasPoint) ?? null,
        applyGenericObjectEdit: (payload) => createCommandPort()?.applyGenericObjectEdit(payload) ?? null,
        applyPilotiEditorCloseVisuals: (group) => createCommandPort()?.applyPilotiEditorCloseVisuals(group),
        applyPilotiSelectionVisuals: (pilotiId) => createCommandPort()?.applyPilotiSelectionVisuals(pilotiId),
        getCanvasPosition: () => ({x: viewportX, y: viewportY, zoom}),
        setCanvasPosition: (x: number, y: number) => {
          handleViewportChange(x, y);
        },
        getVisibleCenter,
        fitToView,
      };
      }, [clearHistory, copy, fitToView, getCurrentScreenPoint, getVisibleCenter, handleViewportChange, paste, saveHistory, undo, viewportX, viewportY, zoom]);

      // Surface zoom changes back to the parent so the top-bar zoom indicator
      // can stay in sync with wheel/pinch interactions.
      useEffect(() => {
        onZoomChange?.(zoom);
      }, [onZoomChange, zoom]);

      // Apply tool-mode side effects to the fabric canvas.
      // 'pan' disables multi-selection and switches to a grab cursor;
      // 'select' restores fabric defaults.
      useEffect(() => {
        const fabric = fabricCanvasRef.current;
        if (!fabric) return;

        if (canvasToolMode === 'pan') {
          const panCursor = isPanning ? 'grabbing' : 'grab';
          fabric.selection = false;
          fabric.skipTargetFind = true;
          fabric.defaultCursor = panCursor;
          fabric.hoverCursor = panCursor;
          fabric.moveCursor = panCursor;
          fabric.upperCanvasEl.style.cursor = panCursor;
          fabric.lowerCanvasEl.style.cursor = panCursor;
          fabric.wrapperEl.style.cursor = panCursor;
        } else {
          fabric.selection = true;
          fabric.skipTargetFind = false;
          fabric.defaultCursor = 'default';
          fabric.hoverCursor = 'move';
          fabric.moveCursor = 'move';
          fabric.upperCanvasEl.style.cursor = 'default';
          fabric.lowerCanvasEl.style.cursor = 'default';
          fabric.wrapperEl.style.cursor = 'default';
        }
        fabric.requestRenderAll();
      }, [canvasToolMode, isPanning]);

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
        onFreeDrawPathCreated,
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
        canvasToolMode,

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

      const canvasCursor = canvasToolMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : undefined;

      return (
        <div
          ref={containerRef}
          data-testid='rac-canvas-container'
          className='w-full h-full overflow-hidden relative touch-none'
          style={{
            ...CANVAS_WORKSPACE_STYLE,
            cursor: canvasCursor,
          }}
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
            data-testid='rac-canvas-surface'
            className='absolute overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-slate-200/80'
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
