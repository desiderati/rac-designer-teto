import {forwardRef, ReactNode, useEffect, useImperativeHandle, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {
  CanvasGroup,
  CanvasObject,
  ElementStrategyKey,
  getElementStrategy,
  PilotiCanvasSelection
} from '@/components/rac-editor/lib/canvas';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import type {
  EditorLinearSelection,
  EditorTerrainSelection,
  EditorWallSelection,
} from '@/components/rac-editor/canvas/types.ts';
import type {CanvasToolMode} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
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
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {CANVAS_STYLE} from '@/shared/config.ts';
import {CANVAS_WORKSPACE_STYLE} from './workspace-style.ts';
import {
  applyPilotiEditorCloseVisuals,
  applyPilotiSelectionVisuals
} from '@/components/rac-editor/lib/canvas/piloti-visual-feedback.ts';
import {projectCanvasPointToScreenPoint} from '@/components/rac-editor/lib/canvas/piloti-screen-position.ts';
import {
  GenericObjectEditorType,
  getGenericObjectEditorStrategy
} from '@/components/rac-editor/lib/canvas/generic-object-editor-strategy.ts';

export interface ContraventamentoCanvasSelection {
  group: CanvasGroup;
  contraventamentoId: string;
}

export interface WallCanvasSelection {
  object: CanvasGroup;
  editorSelection: EditorWallSelection;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

export type LinearCanvasSelectionType = 'line' | 'arrow' | 'distance';

export interface LinearCanvasSelection {
  object: CanvasGroup;
  editorSelection: EditorLinearSelection;
  myType: LinearCanvasSelectionType;
  currentLabel: string;
  currentColor: string;
  screenPosition: { x: number; y: number };
}

export interface TerrainCanvasSelection {
  group: CanvasGroup;
  editorSelection: EditorTerrainSelection;
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

export interface CanvasHandle {
  canvas: FabricCanvas | null;
  saveHistory: () => void;
  clearHistory: () => void;
  undo: () => void;
  copy: () => void;
  paste: () => void;
  createElementObject: (kind: ElementStrategyKey) => CanvasObject | null;
  addObjectAtVisibleCenter: (object: CanvasObject) => boolean;
  setDrawingModeEnabled: (enabled: boolean) => boolean;
  resetSurface: () => void;
  renderAll: () => void;
  getActiveObjectCount: () => number;
  getCanvasPointScreenPosition: (point: { x: number; y: number }) => { x: number; y: number } | null;
  getGroupLocalPointScreenPosition: (
    group: CanvasGroup,
    localCanvasPoint: { x: number; y: number },
  ) => { x: number; y: number } | null;
  applyGenericObjectEdit: (payload: {
    kind: GenericObjectEditorType;
    object: CanvasObject;
    color: string;
    label: string;
  }) => string | null;
  applyPilotiEditorCloseVisuals: (group: CanvasGroup | null | undefined) => void;
  applyPilotiSelectionVisuals: (pilotiId: string) => void;
  getVisibleCenter: () => { x: number; y: number };
  getCanvasPosition: () => { x: number; y: number; zoom: number };
  setCanvasPosition: (x: number, y: number) => void;
  /** Reset zoom + viewport so the canvas fits the visible container. */
  fitToView: () => void;
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
        createElementObject: (kind) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return null;

          return getElementStrategy(kind).create(canvas);
        },
        addObjectAtVisibleCenter: (object) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return false;

          const center = getVisibleCenter();
          object.set({left: center.x, top: center.y});
          canvas.add(object);
          canvas.setActiveObject(object);
          return true;
        },
        setDrawingModeEnabled: (enabled) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return false;

          canvas.isDrawingMode = enabled;
          canvas.selection = !enabled;
          return true;
        },
        resetSurface: () => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return;

          canvas.clear();
          canvas.backgroundColor = CANVAS_STYLE.backgroundColor;
          canvas.renderAll();
          clearHistory();
          saveHistory();
        },
        renderAll: () => {
          fabricCanvasRef.current?.renderAll();
        },
        getActiveObjectCount: () => fabricCanvasRef.current?.getActiveObjects().length ?? 0,
        getCanvasPointScreenPosition: (point) => getCurrentScreenPoint(point),
        getGroupLocalPointScreenPosition: (group, localCanvasPoint) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return null;

          const container = canvas.getElement().parentElement;
          if (!container) return null;

          return projectCanvasPointToScreenPoint({
            groupMatrix: group.calcTransformMatrix(),
            localCanvasPoint,
            canvasContainer: container.getBoundingClientRect(),
            viewportTransform: canvas.viewportTransform ?? undefined,
          });
        },
        applyGenericObjectEdit: ({kind, object, color, label}) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return null;

          const strategy = getGenericObjectEditorStrategy(kind);
          strategy.apply({canvas, object, color, label});
          saveHistory();
          return strategy.getInfoMessage();
        },
        applyPilotiEditorCloseVisuals: (group) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas || !group) return;

          applyPilotiEditorCloseVisuals({
            groupObjects: group.getCanvasObjects(),
            houseStillSelected: canvas.getActiveObject() === group,
          });
          canvas.renderAll();
        },
        applyPilotiSelectionVisuals: (pilotiId) => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return;

          applyPilotiSelectionVisuals(canvas.getObjects(), pilotiId);
          canvas.renderAll();
        },
        getCanvasPosition: () => ({x: viewportX, y: viewportY, zoom}),
        setCanvasPosition: (x: number, y: number) => {
          handleViewportChange(x, y);
        },
        getVisibleCenter,
        fitToView,
      }), [clearHistory, copy, fitToView, getCurrentScreenPoint, getVisibleCenter, handleViewportChange, paste, saveHistory, undo, viewportX, viewportY, zoom]);

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
