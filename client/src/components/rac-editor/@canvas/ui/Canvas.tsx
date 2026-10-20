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
import {BringToFront, SendToBack} from 'lucide-react';
import {
  CanvasGroup,
  CanvasObject,
  ensureCanvasObjectId,
  getPilotiFromGroup,
  getPilotiIdsFromGroup,
  toCanvasObject,
} from '@/components/rac-editor/@canvas/lib';
import {CanvasOverlays} from './CanvasOverlays.tsx';
import {MobileCanvasSelectionBar} from './MobileCanvasSelectionBar.tsx';
import {useMobileCanvasSelection} from './adapters/hooks/useMobileCanvasSelection.ts';
import {createCanvasObjectEditorSelection} from '../lib/canvas-object-editor-selection.ts';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useCanvasClipboard} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasClipboard.ts';
import {useCanvasContainerLifecycle} from '@/components/rac-editor/@canvas/hooks/useCanvasContainerLifecycle.ts';
import {useCanvasContraventamentoRefs} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasContraventamentoRefs.ts';
import {useCanvasFabricSetup} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasFabricSetup.ts';
import {useCanvasHistory} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.ts';
import {useCanvasMinimapObjects} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasMinimapObjects.ts';
import {useCanvasPointerInteractions} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasPointerInteractions.ts';
import {useMobileCanvasGestures} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useMobileCanvasGestures.ts';
import {useCanvasObjectMovement} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasObjectMovement.ts';
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
import {bindReadOnlyCanvasInteraction} from '@/components/rac-editor/@canvas/lib/read-only-canvas-interaction.ts';
import {recoverCanvasObjects} from '@/components/rac-editor/@canvas/lib/recover-canvas-objects.ts';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';

interface CanvasProps {
  children?: ReactNode;
  activeHouseId?: string | null;
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
  showToolMenuLabels?: boolean;
  showTips?: boolean;
  difficultyIndicator?: HouseDifficultyIndicator | null;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: (input: Partial<SiteAssessment>) => void;

  /** Modo ativo da ferramenta do canvas. `pan` desativa a multisseleção do Fabric. */
  canvasToolMode?: CanvasToolMode;
  onToolModeChange?: (mode: CanvasToolMode) => void;
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

type FabricCanvasTargetFinder = FabricCanvasRuntime & {
  findTarget?: (event: unknown, skipGroup?: boolean) => unknown;
};

function isImageCanvasObject(object: CanvasObject | null): object is CanvasObject {
  return object?.myType === 'image' || object?.type === 'image';
}

function isColorEditableObject(object: CanvasObject | null): object is CanvasObject {
  return object?.myType === 'text' || object?.myType === 'freehand' || object?.type === 'path';
}

export const Canvas =
  forwardRef<CanvasHandle, CanvasProps>(
    ({
      children,
      activeHouseId = null,
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
      showToolMenuLabels = false,
      showTips = false,
      difficultyIndicator = null,
      siteAssessment = null,
      onSiteAssessmentChange,
      canvasToolMode = 'select',
      onToolModeChange,
      onZoomChange,

      isContraventamentoMode = false,
      isPilotiEligibleForContraventamento,
      onContraventamentoPilotiClick,
      onContraventamentoCancel,
      onFreeDrawPathCreated,
    }, ref) => {
      const {mobile, landscape} = useCanvasMobileViewport();

      const containerRef = useRef<HTMLDivElement>(null);
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const fabricCanvasRef = useRef<FabricCanvasRuntime | null>(null);
      const documentRestoringRef = useRef(false);
      const imageLongPressRef = useRef<ImageLongPressState | null>(null);
      const [imageLayerMenu, setImageLayerMenu] = useState<ImageLayerMenuState | null>(null);
      const noop = useCallback(() => {}, []);
      const {houseDrawingDocumentPort, houseReadPort} = useEditorPorts();

      const {
        zoom,
        minimumZoom,
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
        isSingleFingerPanning,
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
        fitContentInView,
      } = useCanvasViewport({houseId: activeHouseId, onMinimapInteraction, onZoomInteraction});

      const {minimapObjects, updateMinimapObjects, scheduleMinimapUpdate} = useCanvasMinimapObjects(fabricCanvasRef, activeHouseId);
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
        fitContentInView: (force = false) => {
          const canvas = fabricCanvasRef.current;
          const objects = canvas?.getObjects() ?? [];
          if (objects.length === 0) return;

          objects.forEach((object) => object.setCoords?.());
          const bounds = objects.reduce<{left: number; top: number; right: number; bottom: number} | null>((current, object) => {
            const rect = object.getBoundingRect();
            const next = {
              left: rect.left,
              top: rect.top,
              right: rect.left + rect.width,
              bottom: rect.top + rect.height,
            };
            if (!current) return next;
            return {
              left: Math.min(current.left, next.left),
              top: Math.min(current.top, next.top),
              right: Math.max(current.right, next.right),
              bottom: Math.max(current.bottom, next.bottom),
            };
          }, null);
          if (!bounds || containerSize.width <= 0 || containerSize.height <= 0 || zoom <= 0) return;

          const {canvasX, canvasY} = getCanvasOffsetFromState({
            zoom,
            viewportX,
            viewportY,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height,
          });
          const visible = {
            left: -canvasX / zoom,
            top: -canvasY / zoom,
            right: (-canvasX + containerSize.width) / zoom,
            bottom: (-canvasY + containerSize.height) / zoom,
          };
          const padding = 24 / zoom;
          const contentIsWithinView = bounds.left >= visible.left + padding
            && bounds.top >= visible.top + padding
            && bounds.right <= visible.right - padding
            && bounds.bottom <= visible.bottom - padding;

          if (force || !contentIsWithinView) {
            fitContentInView({
              left: bounds.left,
              top: bounds.top,
              width: Math.max(1, bounds.right - bounds.left),
              height: Math.max(1, bounds.bottom - bounds.top),
            }, force);
          }
        },
        fitContent: () => {
          const canvas = fabricCanvasRef.current;
          const objects = canvas?.getObjects() ?? [];
          if (objects.length === 0) return;
          const {canvasX, canvasY} = getCanvasOffsetFromState({
            zoom, viewportX, viewportY,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height,
          });
          const recovered = recoverCanvasObjects(objects, CANVAS_WIDTH, CANVAS_HEIGHT, readOnly, {
            left: -canvasX / zoom,
            top: -canvasY / zoom,
            width: containerSize.width / zoom,
            height: containerSize.height / zoom,
          });
          if (recovered > 0) {
            canvas?.requestRenderAll();
            saveHistory();
            onSelectionChange(`${recovered} elemento(s) trazido(s) para a área visível. Use Ctrl-Z para desfazer.`);
          }
        },
      };
      }, [clearHistory, containerSize, copy, createCanvasDocumentPort, fitContentInView, fitToView, getCanvasOffsetFromState, getCurrentScreenPoint, getVisibleCenter, handleViewportChange, onSelectionChange, paste, readOnly, saveHistory, undo, viewportX, viewportY, zoom]);

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
          x: Math.min(Math.max(clientX - rect.left, 8), Math.max(rect.width - 216, 8)),
          y: Math.min(Math.max(clientY - rect.top, 8), Math.max(rect.height - 96, 8)),
        };
      }, []);

      const findObjectAtPointer = useCallback((event: unknown): CanvasObject | null => {
        const canvas = fabricCanvasRef.current as FabricCanvasTargetFinder | null;
        if (!canvas) return null;

        const target = toCanvasObject(canvas.findTarget?.(event, false));
        return target;
      }, []);

      const openColorEditor = useCallback((target: CanvasObject) => {
        if (!onWallSelect || isAnyEditorOpenRef.current) return;
        const center = target.getCenterPoint();
        const screenPoint = getCurrentScreenPoint({x: center.x, y: center.y});
        if (!screenPoint) return;
        const objectId = ensureCanvasObjectId(target);
        const editorType = target.myType === 'text' ? 'text' : 'freehand';
        const currentLabel = editorType === 'text' ? target.text ?? '' : '';
        const currentColor = editorType === 'text' ? target.fill : target.stroke;
        onWallSelect({
          objectId,
          editorType,
          currentLabel,
          currentColor: typeof currentColor === 'string' ? currentColor : '#333333',
          screenPosition: screenPoint,
          editorSelection: {type: 'wall', objectId, currentLabel, screenPosition: screenPoint},
        });
      }, [getCurrentScreenPoint, onWallSelect]);

      const openImageLayerMenu = useCallback((target: CanvasObject, clientX: number, clientY: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.setActiveObject(target);
        canvas.requestRenderAll();
        setImageLayerMenu(getImageLayerMenuPosition(clientX, clientY));
      }, [getImageLayerMenuPosition]);

      const handleImageContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        if (landscape) {event.preventDefault(); return;}
        if (readOnly) return;

        const target = findObjectAtPointer(event.nativeEvent);
        if (isColorEditableObject(target)) {
          event.preventDefault();
          event.stopPropagation();
          openColorEditor(target);
          return;
        }
        if (!target || !isImageCanvasObject(target)) {
          setImageLayerMenu(null);
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        openImageLayerMenu(target, event.clientX, event.clientY);
      }, [findObjectAtPointer, openColorEditor, openImageLayerMenu, readOnly, landscape]);

      const handleFreehandDoubleClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        if (readOnly || landscape || fabricCanvasRef.current?.isDrawingMode) return;
        const target = findObjectAtPointer(event.nativeEvent);
        if (target?.myType !== 'freehand' && target?.type !== 'path') return;
        event.preventDefault();
        openColorEditor(target);
      }, [findObjectAtPointer, openColorEditor, readOnly, landscape]);

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
        if (readOnly || landscape || event.touches.length !== 1) return;

        const touch = event.touches.item(0);
        if (!touch) return;

        const target = findObjectAtPointer(touch);
        if (!target || (!isImageCanvasObject(target) && !isColorEditableObject(target))) return;

        clearImageLongPress();
        imageLongPressRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          target,
          timeoutId: window.setTimeout(() => {
            imageLongPressRef.current = null;
            if (isImageCanvasObject(target)) openImageLayerMenu(target, touch.clientX, touch.clientY);
            else openColorEditor(target);
          }, TIMINGS.mobileLongPressDelayMs),
        };
      }, [clearImageLongPress, findObjectAtPointer, openColorEditor, openImageLayerMenu, readOnly, landscape]);

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

      const selection = useMobileCanvasSelection({enabled: landscape && !readOnly, houseId: activeHouseId, fabricCanvasRef, zoom});

      const openSelectedTopViewPilotis = () => {
        const group = selection.selectedTopView;
        if (!landscape || readOnly || isAnyEditorOpen || !group || !onPilotiSelect) return;
        const pilotiIds = getPilotiIdsFromGroup(group);
        const pilotiId = pilotiIds[0];
        const piloti = pilotiId ? getPilotiFromGroup(group, pilotiId) : null;
        if (!piloti) return;
        const center = piloti.circle.getCenterPoint();
        const screenPosition = getCurrentScreenPoint({x: center.x, y: center.y});
        if (!screenPosition) return;
        onPilotiSelect({
          pilotiId,
          pilotiIds,
          currentHeight: piloti.height,
          currentIsMaster: piloti.isMaster,
          currentNivel: piloti.nivel,
          editorSelection: {type: 'piloti', pilotiId, houseView: 'top', screenPosition},
          screenPosition,
          houseView: 'top',
          mobilePanel: true,
        });
      };

      const openSelectedEditor = () => {
        if (!landscape || readOnly || isAnyEditorOpen) return;
        if (selection.selectedTopView) {openSelectedTopViewPilotis(); return;}
        const object = selection.selectedEditableObject;
        if (!object) return;
        const center = object.getCenterPoint();
        const point = getCurrentScreenPoint({x: center.x, y: center.y});
        if (!point) return;
        const editor = createCanvasObjectEditorSelection(object, point, houseReadPort.getTerrainType());
        if (editor?.kind === 'wall') onWallSelect?.(editor.selection);
        if (editor?.kind === 'linear') onLinearSelect?.(editor.selection);
        if (editor?.kind === 'terrain') onTerrainSelect?.(editor.selection);
      };

      // Apply tool-mode side effects to the fabric canvas.
      // 'pan' disables multi-selection and switches to a grab cursor;
      // 'select' restores fabric defaults.
      useEffect(() => {
        const fabric = fabricCanvasRef.current;
        if (!fabric) return;

        if (readOnly && canvasToolMode !== 'pan') {
          fabric.selection = true;
          fabric.skipTargetFind = false;
          fabric.isDrawingMode = false;
          fabric.defaultCursor = 'default';
          fabric.hoverCursor = 'default';
          fabric.moveCursor = 'default';
          fabric.upperCanvasEl.style.cursor = 'default';
          fabric.lowerCanvasEl.style.cursor = 'default';
          fabric.wrapperEl.style.cursor = 'default';
        } else if (canvasToolMode === 'pan') {
          const panCursor = isPanning ? 'grabbing' : 'grab';
          fabric.selection = false;
          fabric.skipTargetFind = !(landscape && selection.resizing);
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
      }, [canvasToolMode, isPanning, readOnly, landscape, selection.resizing]);

      useCanvasFabricSetup({
        readOnly,
        inlineEditingDisabled: landscape,
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

      useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !readOnly) return;
        return bindReadOnlyCanvasInteraction(canvas);
      }, [readOnly]);


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
        minimumZoom,
        setViewportX,
        setViewportY,
      });

      const {isObjectMoving, onObjectMovingChange} = useCanvasObjectMovement({fabricCanvasRef, enabled: mobile && !readOnly, houseId: activeHouseId});
      const shouldSkipLegacyTouch = useMobileCanvasGestures({enabled: landscape && !isContraventamentoMode, houseId: activeHouseId, readOnly, containerRef,
        fabricCanvasRef, canvasToolMode, resizing: selection.resizing, onToolModeChange, zoom, minimumZoom, viewportX, viewportY,
        handleViewportChange, handleZoomChange, onPanningChange: setIsPanning, onObjectMovingChange,
        onObjectMove: () => scheduleMinimapUpdate(fabricCanvasRef.current)});

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
        if (shouldSkipLegacyTouch(event.nativeEvent)) return;
        handleTouchStart(event);
        scheduleImageLongPress(event);
      }, [handleTouchStart, scheduleImageLongPress, shouldSkipLegacyTouch]);

      const handleCanvasTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        if (shouldSkipLegacyTouch(event.nativeEvent)) return;
        handleTouchMove(event);
        cancelImageLongPressOnMove(event);
      }, [cancelImageLongPressOnMove, handleTouchMove, shouldSkipLegacyTouch]);

      const handleCanvasTouchEnd = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
        if (shouldSkipLegacyTouch(event.nativeEvent)) return;
        handleTouchEnd();
        clearImageLongPress();
      }, [clearImageLongPress, handleTouchEnd, shouldSkipLegacyTouch]);

      useEffect(() => () => clearImageLongPress(), [clearImageLongPress]);

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
          data-guided-tour-id='rac-canvas'
          className='relative h-full min-h-0 min-w-[360px] w-full overflow-hidden touch-none'
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
          onDoubleClick={handleFreehandDoubleClick}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
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
            isPanning={isPanning || isSingleFingerPanning}
            isObjectMoving={isObjectMoving}

            containerHeight={containerSize.height}
            containerWidth={containerSize.width}

            zoom={zoom}
            onZoomChange={handleZoomChange}
            showZoomControls={showZoomControls}
            showToolMenuLabels={showToolMenuLabels}
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
          {landscape && !readOnly && !isAnyEditorOpen ? <MobileCanvasSelectionBar
            count={selection.count} resizing={selection.resizing} canResize={selection.canResize}
            canEdit={Boolean(selection.selectedTopView || selection.selectedEditableObject)} onEdit={openSelectedEditor}
            onToggleResize={selection.toggleResizing} onDelete={onDelete}/> : null}
          {imageLayerMenu
            ? <div
                role='menu'
                className='absolute z-50 w-52 rounded-xl border border-slate-200 bg-white/95 p-1 text-slate-700 shadow-xl backdrop-blur-xl'
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
                  className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-100'
                  onClick={() => moveActiveImageLayer('back')}
                >
                  <SendToBack className='h-4 w-4 shrink-0 text-slate-500'/>
                  <span className='min-w-0 flex-1 truncate text-left'>Enviar para trás</span>
                </button>
                <button
                  type='button'
                  role='menuitem'
                  className='flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-100'
                  onClick={() => moveActiveImageLayer('front')}
                >
                  <BringToFront className='h-4 w-4 shrink-0 text-slate-500'/>
                  <span className='min-w-0 flex-1 truncate text-left'>Trazer para frente</span>
                </button>
              </div>
            : null}
        </div>
      );
    }
  );

Canvas.displayName = 'Canvas';
