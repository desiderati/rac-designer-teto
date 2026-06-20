import {
  forwardRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  CanvasGroup,
  CanvasObject,
  toCanvasObject,
} from '@/components/rac-editor/@canvas/lib';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useCanvasClipboard} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from '@/components/rac-editor/@canvas/hooks/useCanvasContainerLifecycle.ts';
import {useCanvasContraventamentoRefs} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasContraventamentoRefs.ts';
import {useCanvasFabricSetup} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasFabricSetup.ts';
import {useCanvasHistory} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasPointerInteractions.ts';
import {useCanvasScreenProjection} from '@/components/rac-editor/@canvas/hooks/useCanvasScreenProjection.ts';
import {useCanvasHouseSelection} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHouseSelection.ts';
import {useCanvasViewport} from '@/components/rac-editor/@canvas/hooks/useCanvasViewport.ts';
import {createCanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-house-runtime-port.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {CANVAS_WORKSPACE_STYLE} from './workspace-style.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';
import {createFabricCanvasDebugPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-debug-port.ts';
import {createFabricCanvasCommandPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-command-port.ts';
import {createFabricCanvasSnapshotPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-snapshot-port.ts';
import type {FabricCanvasRuntime} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-runtime.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/@canvas/lib';
import type {
  ContraventamentoCanvasSelection,
  LinearCanvasSelection,
  PilotiCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {HouseDifficultyIndicator} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import type {SiteAssessment} from '@/shared/types/construction-site.ts';
import {INTERACTION_THRESHOLDS, TIMINGS} from '@/shared/config.ts';

interface CanvasProps {
  children?: ReactNode;
  isAnyEditorOpen?: boolean;
  readOnly?: boolean;

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
  difficultyIndicator?: HouseDifficultyIndicator | null;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: (input: Partial<SiteAssessment>) => void;

  /** Modo ativo da ferramenta do canvas. `pan` desativa a multisseleção do Fabric. */
  canvasToolMode?: CanvasToolMode;
  /** Notifica o componente pai sempre que o zoom interno muda. */
  onZoomChange?: (zoom: number) => void;

  // Contraventamento
  isContraventamentoMode?: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (col: number, row: number) => void;
  onContraventamentoCancel?: () => void;
  onFreeDrawPathCreated?: () => void;
}

interface ImageLayerMenuState {
  x: number;
  y: number;
}

interface ImageLongPressState {
  timeoutId: number;
  startX: number;
  startY: number;
  target: CanvasObject;
}

interface FabricCanvasTargetFinder extends FabricCanvasRuntime {
  findTarget?: (event: unknown, skipGroup?: boolean) => unknown;
}

function isImageCanvasObject(object: CanvasObject | null): object is CanvasObject {
  return object?.myType === 'image' || object?.type === 'image';
}

export const Canvas =
  forwardRef<CanvasHandle, CanvasProps>(
    ({
      children,
      isAnyEditorOpen = false,
      readOnly = false,

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
      difficultyIndicator = null,
      siteAssessment = null,
      onSiteAssessmentChange,
      canvasToolMode = 'select',
      onZoomChange,

      isContraventamentoMode = false,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoCancel,
      onFreeDrawPathCreated,
    }, ref) => {

      const containerRef = useRef<HTMLDivElement>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const fabricCanvasRef = useRef<FabricCanvasRuntime | null>(null);
      const documentRestoringRef = useRef(false);
      const imageLongPressRef = useRef<ImageLongPressState | null>(null);
      const [imageLayerMenu, setImageLayerMenu] = useState<ImageLayerMenuState | null>(null);
      const noop = useCallback(() => {}, []);
      const {houseDrawingDocumentPort} = useEditorPorts();

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
      } = useCanvasContraventamentoRefs({
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

      const createCanvasDocumentPort = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return null;

        const documentPort = createFabricCanvasDocumentPort(canvas);
        return {
          ...documentPort,
          loadCanvasDocument: async (...args: Parameters<typeof documentPort.loadCanvasDocument>) => {
            documentRestoringRef.current = true;
            try {
              return await documentPort.loadCanvasDocument(...args);
            } finally {
              documentRestoringRef.current = false;
            }
          },
        };
      }, []);

      const {
        saveHistory,
        clearHistory,
        undo,
      } = useCanvasHistory({
        createCanvasDocumentPort,
        houseDrawingDocumentPort,
        updateMinimapObjects: () => updateMinimapObjects(fabricCanvasRef.current),
        onHistorySave,
        onSelectionChange,
        onCanvasDocumentLoaded: () => {
          const canvas = fabricCanvasRef.current;
          if (!canvas) return;
          refreshHouseGroupsOnCanvas(canvas);
          canvas.renderAll();
        },
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
              getCanvasPointScreenPosition: getCurrentScreenPoint,
              clearHistory,
              saveHistory,
            })
            : null;
        };
        return {
        createCanvasHouseRuntimePort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createCanvasHouseRuntimePort(canvas) : null;
        },
        createDocumentPort: () => {
          return createCanvasDocumentPort();
        },
        createDebugPort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createFabricCanvasDebugPort(canvas) : null;
        },
        createSnapshotPort: () => {
          const canvas = fabricCanvasRef.current;
          return canvas ? createFabricCanvasSnapshotPort(canvas) : null;
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
        moveActiveImageLayer: (direction) => createCommandPort()?.moveActiveImageLayer(direction) ?? false,
        getActiveObjectCount: () => createCommandPort()?.getActiveObjectCount() ?? 0,
        deleteActiveObjects: (handlers) => createCommandPort()?.deleteActiveObjects(handlers) ?? 'none',
        getCanvasPointScreenPosition: (point) => getCurrentScreenPoint(point),
        getGroupLocalPointScreenPosition: (group, localCanvasPoint) =>
          createCommandPort()?.getGroupLocalPointScreenPosition(group, localCanvasPoint) ?? null,
        applyGenericObjectEdit: (payload) => createCommandPort()?.applyGenericObjectEdit(payload) ?? null,
        applyPilotiEditorCloseVisuals: () => createCommandPort()?.applyPilotiEditorCloseVisuals(),
        applyPilotiSelectionVisuals: (pilotiId) => createCommandPort()?.applyPilotiSelectionVisuals(pilotiId),
        getPilotiScreenPosition: (pilotiId, houseView) =>
          createCommandPort()?.getPilotiScreenPosition(pilotiId, houseView) ?? null,
        getCanvasPosition: () => ({x: viewportX, y: viewportY, zoom}),
        setCanvasPosition: (x: number, y: number) => {
          handleViewportChange(x, y);
        },
        getVisibleCenter,
        fitToView,
      };
      }, [clearHistory, copy, createCanvasDocumentPort, fitToView, getCurrentScreenPoint, getVisibleCenter, handleViewportChange, paste, saveHistory, undo, viewportX, viewportY, zoom]);

      const clearImageLongPress = useCallback(() => {
        const pendingLongPress = imageLongPressRef.current;
        if (!pendingLongPress) return;

        window.clearTimeout(pendingLongPress.timeoutId);
        imageLongPressRef.current = null;
      }, []);

      const getImageLayerMenuPosition = useCallback((clientX: number, clientY: number): ImageLayerMenuState => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return {x: clientX, y: clientY};

        return {
          x: Math.min(Math.max(clientX - rect.left, 8), Math.max(rect.width - 176, 8)),
          y: Math.min(Math.max(clientY - rect.top, 8), Math.max(rect.height - 96, 8)),
        };
      }, []);

      const findImageObjectAtPointer = useCallback((event: unknown): CanvasObject | null => {
        const canvas = fabricCanvasRef.current as FabricCanvasTargetFinder | null;
        if (!canvas) return null;

        const target = toCanvasObject(canvas.findTarget?.(event, false));
        return isImageCanvasObject(target) ? target : null;
      }, []);

      const openImageLayerMenu = useCallback((target: CanvasObject, clientX: number, clientY: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.setActiveObject(target);
        canvas.requestRenderAll();
        setImageLayerMenu(getImageLayerMenuPosition(clientX, clientY));
      }, [getImageLayerMenuPosition]);

      const handleImageContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        if (readOnly) return;

        const target = findImageObjectAtPointer(event.nativeEvent);
        if (!target) {
          setImageLayerMenu(null);
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        openImageLayerMenu(target, event.clientX, event.clientY);
      }, [findImageObjectAtPointer, openImageLayerMenu, readOnly]);

      const moveActiveImageLayer = useCallback((direction: 'front' | 'back') => {
        if (readOnly) return;

        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const moved = createFabricCanvasCommandPort({
          canvas,
          getVisibleCenter,
          getCanvasPointScreenPosition: getCurrentScreenPoint,
          clearHistory,
          saveHistory,
        }).moveActiveImageLayer(direction);
        if (moved) setImageLayerMenu(null);
      }, [clearHistory, getCurrentScreenPoint, getVisibleCenter, readOnly, saveHistory]);

      const scheduleImageLongPress = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        if (readOnly || event.touches.length !== 1) return;

        const touch = event.touches.item(0);
        if (!touch) return;

        const target = findImageObjectAtPointer(touch);
        if (!target) return;

        clearImageLongPress();
        imageLongPressRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          target,
          timeoutId: window.setTimeout(() => {
            imageLongPressRef.current = null;
            openImageLayerMenu(target, touch.clientX, touch.clientY);
          }, TIMINGS.mobileLongPressDelayMs),
        };
      }, [clearImageLongPress, findImageObjectAtPointer, openImageLayerMenu, readOnly]);

      const cancelImageLongPressOnMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        const pendingLongPress = imageLongPressRef.current;
        if (!pendingLongPress || event.touches.length !== 1) return;

        const touch = event.touches.item(0);
        if (!touch) return;

        const movement = Math.hypot(
          touch.clientX - pendingLongPress.startX,
          touch.clientY - pendingLongPress.startY,
        );
        if (movement > INTERACTION_THRESHOLDS.mobilePanActivation) clearImageLongPress();
      }, [clearImageLongPress]);

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

        if (readOnly) {
          fabric.discardActiveObject();
          fabric.selection = false;
          fabric.skipTargetFind = true;
          fabric.isDrawingMode = false;
          fabric.defaultCursor = 'not-allowed';
          fabric.hoverCursor = 'not-allowed';
          fabric.moveCursor = 'not-allowed';
          fabric.upperCanvasEl.style.cursor = 'not-allowed';
          fabric.lowerCanvasEl.style.cursor = 'not-allowed';
          fabric.wrapperEl.style.cursor = 'not-allowed';
        } else if (canvasToolMode === 'pan') {
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
      }, [canvasToolMode, isPanning, readOnly]);

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
        paste: readOnly ? noop : paste,
        undo: readOnly ? noop : undo,
        saveHistory,
        documentRestoringRef,
        getCurrentScreenPoint,

        isContraventamentoModeRef,
        isPilotiEligibleForContraventamentoRef,
        onContraventamentoPilotiClickRef,
        onContraventamentoCancelRef,
        onFreeDrawPathCreated: readOnly ? undefined : onFreeDrawPathCreated,
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

      const handleCanvasMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        setImageLayerMenu(null);
        handleMouseDown(event);
      }, [handleMouseDown]);

      const handleCanvasWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
        setImageLayerMenu(null);
        handleWheel(event);
      }, [handleWheel]);

      const handleCanvasTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        setImageLayerMenu(null);
        handleTouchStart(event);
        scheduleImageLongPress(event);
      }, [handleTouchStart, scheduleImageLongPress]);

      const handleCanvasTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        handleTouchMove(event);
        cancelImageLongPressOnMove(event);
      }, [cancelImageLongPressOnMove, handleTouchMove]);

      const handleCanvasTouchEnd = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        handleTouchEnd(event);
        clearImageLongPress();
      }, [clearImageLongPress, handleTouchEnd]);

      useEffect(() => () => clearImageLongPress(), [clearImageLongPress]);

      // Calculate canvas position - center it when it fits, otherwise use viewport offset
      const {canvasX, canvasY} = getCanvasOffsetFromState({
        zoom,
        viewportX,
        viewportY,
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
      });

      const canvasCursor = readOnly
        ? 'not-allowed'
        : canvasToolMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : undefined;

      return (
        <div
          ref={containerRef}
          data-testid='rac-canvas-container'
          data-guided-tour-id='rac-canvas'
          className='w-full h-full overflow-hidden relative touch-none'
          style={{
            ...CANVAS_WORKSPACE_STYLE,
            cursor: canvasCursor,
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleCanvasWheel}
          onContextMenu={handleImageContextMenu}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
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
            difficultyIndicator={difficultyIndicator}
            siteAssessment={siteAssessment}
            onSiteAssessmentChange={onSiteAssessmentChange}

            viewportX={viewportX}
            viewportY={viewportY}
            onViewportChange={handleViewportChange}

            showTips={showTips}
          >
            {children}
          </CanvasOverlays>
          {imageLayerMenu
            ? <div
                role='menu'
                className='absolute z-50 min-w-[168px] overflow-hidden rounded-md border border-border bg-popover py-1 text-sm text-popover-foreground shadow-md'
                style={{
                  left: imageLayerMenu.x,
                  top: imageLayerMenu.y,
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type='button'
                  role='menuitem'
                  className='block w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none'
                  onClick={() => moveActiveImageLayer('back')}
                >
                  Enviar para trás
                </button>
                <button
                  type='button'
                  role='menuitem'
                  className='block w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none'
                  onClick={() => moveActiveImageLayer('front')}
                >
                  Trazer para frente
                </button>
              </div>
            : null}
        </div>
      );
    }
  );

Canvas.displayName = 'Canvas';
