import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState, ReactNode } from 'react';
import { Canvas as FabricCanvas, PencilBrush, IText, ActiveSelection, Group, FabricObject, util as fabricUtil, Rect, Line } from 'fabric';
import { houseManager, HouseSide } from '@/lib/house-manager';
import { customProps, getHintForObject, CANVAS_WIDTH, CANVAS_HEIGHT, formatPilotiHeight, getPilotiFromGroup, getAllPilotiIds, refreshHouseGroupsOnCanvas, refreshHouseGroupRendering } from '@/lib/canvas-utils';

import { useIsMobile } from '@/hooks/use-mobile';
import { Minimap, ZoomSlider } from './Minimap';

export interface PilotiSelection {
  pilotiId: string;
  currentHeight: number;
  currentIsMaster: boolean;
  currentNivel: number;
  group: Group;
  screenPosition: { x: number; y: number };
  houseView: 'top' | 'front' | 'back' | 'side';
}

export interface DistanceSelection {
  group: Group;
  currentValue: string;
  screenPosition: { x: number; y: number };
}

export interface ObjectNameSelection {
  object: Rect;
  currentValue: string;
  screenPosition: { x: number; y: number };
}

export interface LineArrowCanvasSelection {
  object: FabricObject;
  myType: 'line' | 'arrow';
  currentColor: string;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

interface CanvasProps {
  onSelectionChange: (hint: string) => void;
  onHistorySave: () => void;
  children?: ReactNode;
  onZoomInteraction?: () => void;
  onMinimapInteraction?: () => void;
  tutorialHighlight?: 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;
  showTips?: boolean;
  onPilotiSelect?: (selection: PilotiSelection | null) => void;
  onDistanceSelect?: (selection: DistanceSelection | null) => void;
  onObjectNameSelect?: (selection: ObjectNameSelection | null) => void;
  onLineArrowSelect?: (selection: LineArrowCanvasSelection | null) => void;
  isEditorOpen?: boolean;
  onDelete?: () => void;
  showZoomControls?: boolean;
  // Contraventamento
  isContraventamentoMode?: boolean;
  isPilotiEligibleForContraventamento?: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick?: (pilotiId: string, col: number, row: number, group: Group) => void;
}

export interface CanvasHandle {
  canvas: FabricCanvas | null;
  saveHistory: () => void;
  clearHistory: () => void;
  undo: () => void;
  copy: () => void;
  paste: () => void;
  getCanvasPosition: () => { x: number; y: number; zoom: number };
  getVisibleCenter: () => { x: number; y: number };
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ onSelectionChange, onHistorySave, children, onZoomInteraction, onMinimapInteraction, tutorialHighlight, showTips = false, onPilotiSelect, onDistanceSelect, onObjectNameSelect, onLineArrowSelect, isEditorOpen = false, onDelete, showZoomControls = true, isContraventamentoMode = false, isPilotiEligibleForContraventamento, onContraventamentoPilotiClick }, ref) => {
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyProcessingRef = useRef(false);
    const clipboardRef = useRef<any>(null);
    
    // Viewport state
    const [zoom, setZoom] = useState(1);
    const [viewportX, setViewportX] = useState(0);
    const [viewportY, setViewportY] = useState(0);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const [isSingleFingerPanning, setIsSingleFingerPanning] = useState(false);
    const [minimapObjects, setMinimapObjects] = useState<Array<{
      left: number;
      top: number;
      width: number;
      height: number;
      angle: number;
      type: string;
    }>>([]);
    const lastPanPoint = useRef({ x: 0, y: 0 });
    const lastPinchDistance = useRef<number | null>(null);
    const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
    const pinchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const singleFingerStartPoint = useRef<{ x: number; y: number } | null>(null);
    const singleFingerMoved = useRef(false);
    
    // Refs for accessing viewport state in event handlers
    const zoomRef = useRef(zoom);
    const viewportXRef = useRef(viewportX);
    const viewportYRef = useRef(viewportY);
    const containerSizeRef = useRef(containerSize);
    const isEditorOpenRef = useRef(isEditorOpen);
    // Refs for contraventamento mode (props that change but are accessed inside static event handlers)
    const isContraventamentoModeRef = useRef(isContraventamentoMode);
    const isPilotiEligibleForContraventamentoRef = useRef(isPilotiEligibleForContraventamento);
    const onContraventamentoPilotiClickRef = useRef(onContraventamentoPilotiClick);
    
    // Keep refs in sync with state
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { viewportXRef.current = viewportX; }, [viewportX]);
    useEffect(() => { viewportYRef.current = viewportY; }, [viewportY]);
    useEffect(() => { containerSizeRef.current = containerSize; }, [containerSize]);
    useEffect(() => { isEditorOpenRef.current = isEditorOpen; }, [isEditorOpen]);
    useEffect(() => { isContraventamentoModeRef.current = isContraventamentoMode; }, [isContraventamentoMode]);
    useEffect(() => { isPilotiEligibleForContraventamentoRef.current = isPilotiEligibleForContraventamento; }, [isPilotiEligibleForContraventamento]);
    useEffect(() => { onContraventamentoPilotiClickRef.current = onContraventamentoPilotiClick; }, [onContraventamentoPilotiClick]);
    
    // Reset all piloti highlights when editor closes
    const prevEditorOpenRef = useRef(isEditorOpen);
    useEffect(() => {
      const wasOpen = prevEditorOpenRef.current;
      prevEditorOpenRef.current = isEditorOpen;
      
      // Only reset when editor transitions from open to closed
      if (wasOpen && !isEditorOpen && fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        canvas.getObjects().forEach((item: any) => {
          if (item.type === 'group' && item.myType === 'house') {
            item.getObjects().forEach((child: any) => {
              if (child.isPilotiCircle) {
                if (child.pilotiIsMaster) {
                  child.set({ stroke: '#8B4513', strokeWidth: 2 });
                } else {
                  child.set({ stroke: 'black', strokeWidth: 1.5 * 0.6 });
                }
              }
              if (child.isPilotiRect) {
                if (child.pilotiIsMaster) {
                  child.set({ stroke: '#8B4513', strokeWidth: 3 });
                } else {
                  child.set({ stroke: '#333', strokeWidth: 2 });
                }
              }
            });
          }
        });
        canvas.requestRenderAll();
      }
    }, [isEditorOpen]);

    // Check if minimap should be visible
    const canvasFitsInViewport = 
      CANVAS_WIDTH * zoom <= containerSize.width && 
      CANVAS_HEIGHT * zoom <= containerSize.height;
    
    // Update minimap objects
    const updateMinimapObjects = useCallback(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      const objects = canvas.getObjects().map((obj: any) => ({
        left: obj.left - (obj.width * obj.scaleX) / 2,
        top: obj.top - (obj.height * obj.scaleY) / 2,
        width: obj.width * obj.scaleX,
        height: obj.height * obj.scaleY,
        angle: obj.angle || 0,
        type: obj.type || 'unknown',
      }));
      setMinimapObjects(objects);
    }, []);

    const saveHistory = () => {
      if (historyProcessingRef.current) return;
      if (historyRef.current.length > 50) historyRef.current.shift();
      historyRef.current.push(JSON.stringify(fabricCanvasRef.current));
      updateMinimapObjects();
      onHistorySave();
    };

    const clearHistory = () => {
      historyRef.current = [];
      updateMinimapObjects();
    };

    const undo = () => {
      if (historyRef.current.length > 1 && fabricCanvasRef.current) {
        historyProcessingRef.current = true;
        historyRef.current.pop();
        const prevState = historyRef.current[historyRef.current.length - 1];
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.loadFromJSON(prevState).then(() => {
          // IMPORTANT: after loadFromJSON, Fabric groups may keep a stale cache and clip resized pilotis.
          // Force-refresh all house groups before rendering.
          refreshHouseGroupsOnCanvas(fabricCanvasRef.current!);

          fabricCanvasRef.current?.renderAll();
          updateMinimapObjects();
          historyProcessingRef.current = false;
          onSelectionChange('Desfazer realizado.');
        });
      }
    };

    const copy = async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      const activeObj = canvas.getActiveObject();
      if (!activeObj) return;
      
      const cloned = await activeObj.clone();
      clipboardRef.current = cloned;
      onSelectionChange('Objeto copiado.');
    };

    const paste = async () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !clipboardRef.current) return;
      
      const clonedObj = await clipboardRef.current.clone();
      canvas.discardActiveObject();
      clonedObj.set({
        left: (clonedObj.left || 0) + 20,
        top: (clonedObj.top || 0) + 20,
        evented: true,
      });
      
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        (clonedObj as ActiveSelection).forEachObject((obj: any) => {
          canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      
      if (clipboardRef.current) {
        clipboardRef.current.top = (clipboardRef.current.top || 0) + 20;
        clipboardRef.current.left = (clipboardRef.current.left || 0) + 20;
      }
      
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      saveHistory();
      onSelectionChange('Objeto colado.');
    };

    // Handle viewport change from minimap
    const handleViewportChange = useCallback((x: number, y: number) => {
      setViewportX(x);
      setViewportY(y);
      onMinimapInteraction?.();
    }, [onMinimapInteraction]);

    // Handle zoom change from slider
    const handleZoomChange = useCallback((newZoom: number) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Calculate center point before zoom
      const centerX = viewportX + containerSize.width / 2;
      const centerY = viewportY + containerSize.height / 2;

      // Calculate new viewport position to keep center consistent
      const zoomRatio = newZoom / zoom;
      const newViewportX = centerX * zoomRatio - containerSize.width / 2;
      const newViewportY = centerY * zoomRatio - containerSize.height / 2;

      setZoom(newZoom);
      
      // Clamp viewport to valid range
      const maxX = Math.max(0, CANVAS_WIDTH * newZoom - containerSize.width);
      const maxY = Math.max(0, CANVAS_HEIGHT * newZoom - containerSize.height);
      setViewportX(Math.max(0, Math.min(newViewportX, maxX)));
      setViewportY(Math.max(0, Math.min(newViewportY, maxY)));
      
      onZoomInteraction?.();
    }, [zoom, viewportX, viewportY, containerSize, onZoomInteraction]);

    useImperativeHandle(ref, () => ({
      canvas: fabricCanvasRef.current,
      saveHistory,
      clearHistory,
      undo,
      copy,
      paste,
      getCanvasPosition: () => ({ x: viewportX, y: viewportY, zoom }),
      getVisibleCenter: () => {
        const currentZoom = zoomRef.current;
        const currentViewportX = viewportXRef.current;
        const currentViewportY = viewportYRef.current;
        const { width: containerWidth, height: containerHeight } = containerSizeRef.current;

        if (!containerWidth || !containerHeight) {
          return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
        }

        const scaledWidth = CANVAS_WIDTH * currentZoom;
        const scaledHeight = CANVAS_HEIGHT * currentZoom;

        const canvasX = scaledWidth <= containerWidth
          ? (containerWidth - scaledWidth) / 2
          : -currentViewportX;
        const canvasY = scaledHeight <= containerHeight
          ? (containerHeight - scaledHeight) / 2
          : -currentViewportY;

        const screenCenterX = containerWidth / 2;
        const screenCenterY = containerHeight / 2;

        const centerX = (screenCenterX - canvasX) / currentZoom;
        const centerY = (screenCenterY - canvasY) / currentZoom;

        return {
          x: Math.max(0, Math.min(CANVAS_WIDTH, centerX)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT, centerY)),
        };
      },
    }));

    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff',
      });

      fabricCanvasRef.current = canvas;

      // Initialize drawing brush
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'black';
      canvas.freeDrawingBrush.width = 2;
      (canvas.freeDrawingBrush as any).decimate = 8;

      // Save initial history
      saveHistory();

      // Event listeners
      canvas.on('object:added', saveHistory);
      canvas.on('object:modified', saveHistory);
      canvas.on('object:removed', saveHistory);

      // === Helper: Get piloti IDs that belong to a specific side ===
      // Based on view-piloti-mapping-logic:
      // - top (front position): A1-A4 (row 0) = piloti_0_0, piloti_1_0, piloti_2_0, piloti_3_0
      // - bottom (back position): C1-C4 (row 2) = piloti_0_2, piloti_1_2, piloti_2_2, piloti_3_2
      // - left: A1, B1, C1 (column 0) = piloti_0_0, piloti_0_1, piloti_0_2
      // - right: A4, B4, C4 (column 3) = piloti_3_0, piloti_3_1, piloti_3_2
      const getPilotiIdsForSide = (side: HouseSide): string[] => {
        switch (side) {
          case 'top':
            return ['piloti_0_0', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0'];
          case 'bottom':
            return ['piloti_0_2', 'piloti_1_2', 'piloti_2_2', 'piloti_3_2'];
          case 'left':
            return ['piloti_0_0', 'piloti_0_1', 'piloti_0_2'];
          case 'right':
            return ['piloti_3_0', 'piloti_3_1', 'piloti_3_2'];
          default:
            return [];
        }
      };

      // === Side Highlight Logic (isolated) ===
      // Changes the stroke of the border line on the Plant (top) view to indicate
      // which side corresponds to the currently selected elevation view.
      // Uses the 4 permanent border lines (isHouseBorderEdge) instead of adding/removing objects.
      // Also highlights only the pilotis on that side in yellow on the Plant view.
      const syncPlantSideHighlight = (activeObject: FabricObject | null) => {
        // 1) Find the Plant (top view) group on the canvas
        const topGroup = canvas.getObjects().find(
          (o: any) => o.type === 'group' && o.myType === 'house' && o.houseView === 'top'
        ) as Group | undefined;

        if (!topGroup) {
          canvas.requestRenderAll();
          return;
        }

        // 2) Find the 4 border lines inside the group
        const borderLines = topGroup.getObjects().filter(
          (o: any) => o.isHouseBorderEdge === true
        ) as Line[];

        // 3) Reset all borders to default style (black)
        const defaultStroke = 'black';
        const defaultStrokeWidth = 2 * 0.6; // 2 * s where s = 0.6
        borderLines.forEach((line: any) => {
          line.set({ stroke: defaultStroke, strokeWidth: defaultStrokeWidth });
          (line as any).dirty = true;
        });

        // 4) Determine if we should highlight a side
        if (!activeObject || activeObject.type !== 'group') {
          topGroup.setCoords();
          canvas.requestRenderAll();
          return;
        }

        // Robust detection: try houseViewType first, then houseView as fallback
        const rawView = (activeObject as any).houseViewType ?? (activeObject as any).houseView;
        if (!rawView || rawView === 'top') {
          topGroup.setCoords();
          canvas.requestRenderAll();
          return;
        }

        // 5) Get the side from houseManager - now views is an array of ViewInstance
        const house = houseManager.getHouse();
        // Find the instance that matches this specific group by instanceId
        const instanceId = (activeObject as any).houseInstanceId;
        const viewInstances = house?.views[rawView];
        let side: HouseSide | undefined;
        
        if (viewInstances && viewInstances.length > 0) {
          if (instanceId) {
            // Find by instanceId
            const matchingInstance = viewInstances.find((inst: any) => inst.instanceId === instanceId);
            side = matchingInstance?.side;
          } else {
            // Fallback: find by group reference
            const matchingInstance = viewInstances.find((inst: any) => inst.group === activeObject);
            side = matchingInstance?.side;
          }
          // Last fallback: use first instance's side
          if (!side && viewInstances[0]?.side) {
            side = viewInstances[0].side;
          }
        }
        
        if (!side) {
          topGroup.setCoords();
          canvas.requestRenderAll();
          return;
        }

        // 6) Find the matching border line and apply highlight style
        const highlightStroke = '#3b82f6';
        const highlightStrokeWidth = 4;
        const targetBorder = borderLines.find((line: any) => line.edgeSide === side);
        if (targetBorder) {
          (targetBorder as any).set({ stroke: highlightStroke, strokeWidth: highlightStrokeWidth });
          (targetBorder as any).dirty = true;
        }

        // 7) Highlight only the pilotis on that side in the Plant view (yellow)
        const pilotiIdsForSide = getPilotiIdsForSide(side);
        topGroup.getObjects().forEach((child: any) => {
          if (child.isPilotiCircle && pilotiIdsForSide.includes(child.pilotiId)) {
            child.set({
              stroke: '#facc15',
              strokeWidth: 3,
            });
            (child as any).dirty = true;
          }
        });

        // 8) Refresh group and render
        topGroup.setCoords();
        canvas.requestRenderAll();
      };

      const updateHint = () => {
        const obj = canvas.getActiveObject();
        onSelectionChange(getHintForObject(obj));

        // Clear piloti selection only when no editor is open.
        // When the editor is open, selection events (object:modified / selection:updated)
        // can fire and would otherwise wipe the editor's "group" reference,
        // breaking < > navigation and Apply.
        if (!isEditorOpenRef.current) {
          onPilotiSelect?.(null);
        }

        // Reset piloti styles for all house groups
        canvas.getObjects().forEach((item: any) => {
          if (item.type === 'group' && item.myType === 'house') {
            item.getObjects().forEach((child: any) => {
              if (child.isPilotiCircle) {
                if (child.pilotiIsMaster) {
                  child.set({ stroke: '#8B4513', strokeWidth: 2 });
                } else {
                  child.set({ stroke: 'black', strokeWidth: 1.5 * 0.6 });
                }
              }
              if (child.isPilotiRect) {
                if (child.pilotiIsMaster) {
                  child.set({ stroke: '#8B4513', strokeWidth: 3 });
                } else {
                  child.set({ stroke: '#333', strokeWidth: 2 });
                }
              }
            });
          }
        });

        // If a house (elevation view) is selected, highlight its pilotis in yellow
        if (obj && obj.type === 'group' && (obj as any).myType === 'house') {
          const viewType = (obj as any).houseViewType ?? (obj as any).houseView;
          
          // For elevation views (not plant), only highlight the pilotis in that elevation
          if (viewType && viewType !== 'top') {
            (obj as Group).getObjects().forEach((child: any) => {
              if (child.isPilotiRect) {
                child.set({
                  stroke: '#facc15',
                  strokeWidth: 4,
                });
              }
            });
          }
          
          // For plant view, highlight all pilotis in the selected plant group
          if (viewType === 'top') {
            (obj as Group).getObjects().forEach((child: any) => {
              if (child.isPilotiCircle) {
                child.set({
                  stroke: '#facc15',
                  strokeWidth: 3,
                });
              }
            });
          }
        }

        // Sync the side highlight on the Plant view (isolated logic)
        // This also highlights only the pilotis on that side in the Plant view
        syncPlantSideHighlight(obj);

        canvas.renderAll();
      };

      canvas.on('selection:created', updateHint);
      canvas.on('selection:updated', updateHint);
      canvas.on('selection:cleared', updateHint);

      // Helper function to handle piloti selection
      const handlePilotiSelection = (subTarget: FabricObject, target: FabricObject) => {
        const group = target as Group;
        let pilotiId = (subTarget as any).pilotiId;
        let piloti: FabricObject | null = null;
        let pilotiHeight = 1.0;
        let pilotiIsMaster = false;
        let pilotiNivel = 0.2;
        
        // If clicked on hit area, find the actual piloti circle/rect
        if ((subTarget as any).isPilotiHitArea) {
          const pilotiData = getPilotiFromGroup(group, pilotiId);
          if (pilotiData) {
            piloti = pilotiData.circle;
            pilotiHeight = pilotiData.height;
            pilotiIsMaster = pilotiData.isMaster;
            pilotiNivel = pilotiData.nivel;
          }
        } else if ((subTarget as any).isPilotiCircle || (subTarget as any).isPilotiRect) {
          piloti = subTarget;
          pilotiHeight = (subTarget as any).pilotiHeight || 1.0;
          pilotiIsMaster = (subTarget as any).pilotiIsMaster || false;
          pilotiNivel = (subTarget as any).pilotiNivel ?? 0.2;
        }
        
        if (!piloti) return;

        // ── Contraventamento mode intercept ────────────────────────────────
        // Only intercept top-view piloti circles (top view has houseView === 'top')
        if (isContraventamentoModeRef.current && (group as any).houseView === 'top' && (subTarget as any).isPilotiCircle) {
          const eligible = isPilotiEligibleForContraventamentoRef.current?.(pilotiId) ?? false;
          if (!eligible) return; // ignore ineligible pilotis

          const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
          if (!match) return;
          const col = parseInt(match[1], 10);
          const row = parseInt(match[2], 10);
          onContraventamentoPilotiClickRef.current?.(pilotiId, col, row, group);
          return; // don't open piloti editor
        }
        // ──────────────────────────────────────────────────────────────────
        
        // Calculate screen position of piloti using refs
        const currentZoom = zoomRef.current;
        const currentViewportX = viewportXRef.current;
        const currentViewportY = viewportYRef.current;
        const currentContainerSize = containerSizeRef.current;
        
        const scaledWidth = CANVAS_WIDTH * currentZoom;
        const scaledHeight = CANVAS_HEIGHT * currentZoom;
        
        const currentCanvasX = scaledWidth <= currentContainerSize.width 
          ? (currentContainerSize.width - scaledWidth) / 2 
          : -currentViewportX;
        const currentCanvasY = scaledHeight <= currentContainerSize.height 
          ? (currentContainerSize.height - scaledHeight) / 2 
          : -currentViewportY;
        
        const pilotiCenter = piloti.getCenterPoint();
        const canvasPoint = {
          x: pilotiCenter.x,
          y: pilotiCenter.y,
        };
        
        // Convert to screen coordinates
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const screenX = containerRect.left + (canvasPoint.x * currentZoom) + currentCanvasX;
          const screenY = containerRect.top + (canvasPoint.y * currentZoom) + currentCanvasY;
          
           // Highlight pilotis across ALL house views (cross-view sync)
           canvas.getObjects().forEach((obj: any) => {
             if (obj.type === 'group' && obj.myType === 'house') {
               obj.getObjects().forEach((child: any) => {
                 if (child.isPilotiCircle || child.isPilotiRect) {
                   child.set({
                     stroke: '#facc15',
                     strokeWidth: child.isPilotiRect ? 4 : 3,
                   });
                 }
               });
             }
           });
          
          // Now highlight the selected piloti in ALL views (same pilotiId)
          canvas.getObjects().forEach((obj: any) => {
            if (obj.type === 'group' && obj.myType === 'house') {
              obj.getObjects().forEach((child: any) => {
                if ((child.isPilotiCircle || child.isPilotiRect) && child.pilotiId === pilotiId) {
                  child.set({
                    stroke: '#3b82f6',
                    strokeWidth: child.isPilotiRect ? 5 : 4,
                  });
                }
              });
            }
          });
          canvas.renderAll();
          
          onPilotiSelect?.({
            pilotiId,
            currentHeight: pilotiHeight,
            currentIsMaster: pilotiIsMaster,
            currentNivel: pilotiNivel,
            group,
            screenPosition: { x: screenX, y: screenY },
            houseView: (group as any).houseView || 'top',
          });
          
          onSelectionChange(`Piloti selecionado – Altura atual: ${formatPilotiHeight(pilotiHeight)} m.`);
        }
      };

      // Mobile: single tap on piloti or hit area
      // Use both mouse:down and touch:gesture events for better mobile compatibility
      const handleMobilePilotiTap = (e: any) => {
        // Check if mobile using the same breakpoint as useIsMobile hook (768px)
        const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
        if (!isMobileDevice) return;
        
        // Skip if editor is already open to avoid re-triggering
        if (isEditorOpenRef.current) return;
        
        const target = e.target;
        const subTargets = (e as any).subTargets || [];
        
        // Find piloti or hit area in subtargets
        const pilotiTarget = subTargets.find((st: any) => 
          st.myType === 'piloti' || st.myType === 'pilotiHitArea'
        );
        
        if (pilotiTarget && target) {
          // Small delay to ensure touch event is properly processed
          setTimeout(() => {
            handlePilotiSelection(pilotiTarget, target);
          }, 50);
        }
      };
      
      canvas.on('mouse:down', handleMobilePilotiTap);

      // Helper function to handle distance selection
      const handleDistanceSelection = (group: Group) => {
        const currentZoom = zoomRef.current;
        const currentViewportX = viewportXRef.current;
        const currentViewportY = viewportYRef.current;
        const currentContainerSize = containerSizeRef.current;
        
        const scaledWidth = CANVAS_WIDTH * currentZoom;
        const scaledHeight = CANVAS_HEIGHT * currentZoom;
        
        const currentCanvasX = scaledWidth <= currentContainerSize.width 
          ? (currentContainerSize.width - scaledWidth) / 2 
          : -currentViewportX;
        const currentCanvasY = scaledHeight <= currentContainerSize.height 
          ? (currentContainerSize.height - scaledHeight) / 2 
          : -currentViewportY;
        
        // Get the text value from the dimension group
        const textObj = group.getObjects().find(obj => obj.type === 'i-text') as any;
        const currentValue = textObj?.text?.trim() || '';
        
        // Calculate screen position of the group
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const groupLeft = group.left || 0;
          const groupTop = group.top || 0;
          
          const screenX = containerRect.left + (groupLeft * currentZoom) + currentCanvasX;
          const screenY = containerRect.top + (groupTop * currentZoom) + currentCanvasY;
          
          onDistanceSelect?.({
            group,
            currentValue,
            screenPosition: { x: screenX, y: screenY },
          });
          
          onSelectionChange('Editando distância.');
        }
      };

      // Helper function to handle wall/object name selection
      const handleObjectNameSelection = (wall: Rect) => {
        const currentZoom = zoomRef.current;
        const currentViewportX = viewportXRef.current;
        const currentViewportY = viewportYRef.current;
        const currentContainerSize = containerSizeRef.current;
        
        const scaledWidth = CANVAS_WIDTH * currentZoom;
        const scaledHeight = CANVAS_HEIGHT * currentZoom;
        
        const currentCanvasX = scaledWidth <= currentContainerSize.width 
          ? (currentContainerSize.width - scaledWidth) / 2 
          : -currentViewportX;
        const currentCanvasY = scaledHeight <= currentContainerSize.height 
          ? (currentContainerSize.height - scaledHeight) / 2 
          : -currentViewportY;
        
        // Check if there's already a label for this wall
        const existingLabel = canvas.getObjects().find(
          (obj: any) => obj.myType === 'wallLabel' && obj.labelFor === wall
        ) as IText | undefined;
        const currentValue = existingLabel?.text?.trim() || '';
        
        // Calculate screen position of the wall
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const wallLeft = wall.left || 0;
          const wallTop = wall.top || 0;
          
          const screenX = containerRect.left + (wallLeft * currentZoom) + currentCanvasX;
          const screenY = containerRect.top + (wallTop * currentZoom) + currentCanvasY;
          
          onObjectNameSelect?.({
            object: wall,
            currentValue,
            screenPosition: { x: screenX, y: screenY },
          });
          
          onSelectionChange('Editando nome do objeto.');
        }
      };

      // Helper function to handle line/arrow selection
      const handleLineArrowSelection = (obj: FabricObject, myType: 'line' | 'arrow') => {
        const currentZoom = zoomRef.current;
        const currentViewportX = viewportXRef.current;
        const currentViewportY = viewportYRef.current;
        const currentContainerSize = containerSizeRef.current;
        
        const scaledWidth = CANVAS_WIDTH * currentZoom;
        const scaledHeight = CANVAS_HEIGHT * currentZoom;
        
        const currentCanvasX = scaledWidth <= currentContainerSize.width 
          ? (currentContainerSize.width - scaledWidth) / 2 
          : -currentViewportX;
        const currentCanvasY = scaledHeight <= currentContainerSize.height 
          ? (currentContainerSize.height - scaledHeight) / 2 
          : -currentViewportY;

        // Get current color and label - handle both standalone and grouped objects
        let currentColor = '#000000';
        let currentLabel = '';

        // Check if the object is itself a group containing a lineArrowLabel
        if (obj.type === 'group') {
          const groupChildren = (obj as Group).getObjects();
          const labelChild = groupChildren.find((o: any) => o.myType === 'lineArrowLabel') as any;
          const lineChild = groupChildren.find((o: any) => o.type === 'line') as any;
          const arrowChild = groupChildren.find((o: any) => o.type === 'group') as any;

          if (labelChild) {
            currentLabel = labelChild.text?.trim() || '';
          }
          if (myType === 'line' && lineChild) {
            currentColor = lineChild.stroke as string || '#000000';
          } else if (myType === 'arrow' && arrowChild) {
            const firstChild = arrowChild.getObjects()[0] as any;
            currentColor = firstChild?.fill as string || '#333';
          } else if (myType === 'arrow') {
            // Arrow without nested label - direct group
            const firstChild = groupChildren[0] as any;
            currentColor = firstChild?.fill as string || '#333';
          }
        } else if (myType === 'line') {
          currentColor = (obj as Line).stroke as string || '#000000';
        }

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const center = obj.getCenterPoint();
          const screenX = containerRect.left + (center.x * currentZoom) + currentCanvasX;
          const screenY = containerRect.top + (center.y * currentZoom) + currentCanvasY;
          
          onLineArrowSelect?.({
            object: obj,
            myType,
            currentColor,
            currentLabel,
            screenPosition: { x: screenX, y: screenY },
          });
        }
      };

      // Desktop: double-click on piloti or dimension or wall
      canvas.on('mouse:dblclick', (e) => {
        // Skip on mobile (use same breakpoint as useIsMobile hook - 768px)
        if (window.matchMedia('(max-width: 767px)').matches) return;
        
        const target = e.target;
        if (!target) return;
        
        // Check if target is a dimension group
        if (target.type === 'group' && (target as any).myType === 'dimension') {
          // Prevent entering text edit mode
          e.e.preventDefault();
          e.e.stopPropagation();
          handleDistanceSelection(target as Group);
          return;
        }
        
        // Check if target is a wall/object
        if (target.type === 'rect' && (target as any).myType === 'wall') {
          handleObjectNameSelection(target as Rect);
          return;
        }
        
        // Check if target is a line
        if ((target as any).myType === 'line') {
          handleLineArrowSelection(target, 'line');
          return;
        }
        
        // Check if target is an arrow group
        if (target.type === 'group' && (target as any).myType === 'arrow') {
          handleLineArrowSelection(target, 'arrow');
          return;
        }
        
        // Check subTargets for IText inside dimension group
        const subTargets = (e as any).subTargets || [];
        for (const subTarget of subTargets) {
          if (subTarget.type === 'i-text') {
            // Find parent group
            const parent = subTarget.group;
            if (parent && (parent as any).myType === 'dimension') {
              e.e.preventDefault();
              e.e.stopPropagation();
              handleDistanceSelection(parent as Group);
              return;
            }
          }
        }
        
        // Check if target is a group (house)
        if (target.type === 'group') {
          const group = target as Group;
          const pointer = canvas.getPointer(e.e);
          
          // Find piloti at click position within the group
          const groupMatrix = group.calcTransformMatrix();
          const invertedMatrix = fabricUtil.invertTransform(groupMatrix);
          const localPoint = fabricUtil.transformPoint(
            { x: pointer.x, y: pointer.y },
            invertedMatrix
          );
          
          // Search for piloti or hit area at this position
          const objects = group.getObjects();
          for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i] as any;
            if (obj.myType === 'piloti' || obj.myType === 'pilotiHitArea') {
              // Top view: circles/hit areas
              if (obj.isPilotiCircle || obj.isPilotiHitArea) {
                const objLeft = obj.left || 0;
                const objTop = obj.top || 0;
                const radius = obj.radius || (obj.width / 2) || 10;

                const dist = Math.sqrt(
                  Math.pow(localPoint.x - objLeft, 2) + Math.pow(localPoint.y - objTop, 2),
                );

                if (dist <= radius) {
                  handlePilotiSelection(obj, target);
                  return;
                }
              }

              // Front/back/side/squares: rectangles
              if (obj.isPilotiRect) {
                const left = obj.left || 0;
                const top = obj.top || 0;
                const w = (obj.width || 0) * (obj.scaleX || 1);
                const h = (obj.height || 0) * (obj.scaleY || 1);

                const withinX = localPoint.x >= left && localPoint.x <= left + w;
                const withinY = localPoint.y >= top && localPoint.y <= top + h;

                if (withinX && withinY) {
                  handlePilotiSelection(obj, target);
                  return;
                }
              }
            }
          }
        }
      });

      // Mobile: single tap on dimension, wall, line, arrow
      canvas.on('mouse:down', (e) => {
        const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
        const target = e.target;
        
        if (!isMobileDevice || !target) return;
        if (isEditorOpenRef.current) return;

        // Handle wall on mobile
        if (target.type === 'rect' && (target as any).myType === 'wall') {
          setTimeout(() => {
            if (canvas.getActiveObject() === target) {
              handleObjectNameSelection(target as Rect);
            }
          }, 300);
          return;
        }

        // Handle line on mobile
        if ((target as any).myType === 'line') {
          setTimeout(() => {
            if (canvas.getActiveObject() === target) {
              handleLineArrowSelection(target, 'line');
            }
          }, 300);
          return;
        }

        // Handle arrow on mobile
        if (target.type === 'group' && (target as any).myType === 'arrow') {
          setTimeout(() => {
            if (canvas.getActiveObject() === target) {
              handleLineArrowSelection(target, 'arrow');
            }
          }, 300);
          return;
        }

        // Handle dimension on mobile - only open editor if tap is near center
        if (target.type === 'group' && (target as any).myType === 'dimension') {
          const pointer = canvas.getPointer(e.e);
          const group = target as Group;
          
          // Calculate distance from tap to group center
          const groupCenterX = group.left || 0;
          const groupCenterY = group.top || 0;
          const distanceFromCenter = Math.sqrt(
            Math.pow(pointer.x - groupCenterX, 2) + Math.pow(pointer.y - groupCenterY, 2)
          );
          
          // Only open editor if tap is within 30px of center
          const centerThreshold = 30;
          if (distanceFromCenter <= centerThreshold) {
            // Use a timeout to differentiate single tap from drag start
            setTimeout(() => {
              if (canvas.getActiveObject() === target) {
                handleDistanceSelection(group);
              }
            }, 300);
          }
        }
      });

      // Rotation snapping
      canvas.on('object:rotating', (e) => {
        const obj = e.target;
        if (!obj) return;
        if ((obj as any).myType === 'line') return;
        
        const snapAngle = 10;
        let angle = (obj.angle || 0) % 360;
        if (angle < 0) angle += 360;
        
        if (angle < snapAngle || angle > 360 - snapAngle) {
          obj.angle = 0;
        } else if (Math.abs(angle - 90) < snapAngle) {
          obj.angle = 90;
        } else if (Math.abs(angle - 180) < snapAngle) {
          obj.angle = 180;
        } else if (Math.abs(angle - 270) < snapAngle) {
          obj.angle = 270;
        }
      });

      // Keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Never hijack keys when user is typing in an input/textarea/select/contenteditable
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isTypingTarget =
          !!target &&
          (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target as any).isContentEditable);
        if (isTypingTarget) return;

        // Don't process Delete/Backspace when editor is open
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (isEditorOpenRef.current) return;

          const activeObj = canvas.getActiveObject();
          if (!activeObj || (activeObj.type !== 'i-text' || !(activeObj as IText).isEditing)) {
            // Delegate deletion to parent when available (so it can sync houseManager)
            if (onDelete) {
              e.preventDefault();
              onDelete();
              return;
            }

            // Fallback (legacy behavior)
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length) {
              canvas.discardActiveObject();
              activeObjects.forEach((obj) => canvas.remove(obj));
              onSelectionChange('Objeto excluído.');
            }
          }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          copy();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          paste();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          undo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        canvas.dispose();
      };
    }, []);

    // Update container size on resize
    useEffect(() => {
      if (!containerRef.current) return;

      const updateSize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      updateSize();

      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }, []);

    // Clamp viewport when container or zoom changes
    useEffect(() => {
      const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
      const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);
      
      setViewportX(prev => Math.max(0, Math.min(prev, maxX)));
      setViewportY(prev => Math.max(0, Math.min(prev, maxY)));
    }, [containerSize, zoom]);

    // Prevent browser zoom on Ctrl + wheel
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const preventBrowserZoom = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };

      container.addEventListener('wheel', preventBrowserZoom, { passive: false });

      return () => {
        container.removeEventListener('wheel', preventBrowserZoom);
      };
    }, []);

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      // Only start panning with middle mouse button or when holding space
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isPanning) return;

      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };

      const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
      const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

      setViewportX(prev => Math.max(0, Math.min(prev - deltaX, maxX)));
      setViewportY(prev => Math.max(0, Math.min(prev - deltaY, maxY)));
    }, [isPanning, zoom, containerSize]);

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    // Mouse wheel - zoom with Ctrl, pan without
    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // Zoom (25% to 200%)
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(2, zoom + delta));
        handleZoomChange(newZoom);
      } else {
        // Pan
        const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
        const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);
        
        setViewportX(prev => Math.max(0, Math.min(prev + e.deltaX, maxX)));
        setViewportY(prev => Math.max(0, Math.min(prev + e.deltaY, maxY)));
      }
    }, [zoom, handleZoomChange, containerSize]);

    // Pinch-to-zoom and pan handlers for touch devices
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      // Check if mobile
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      
      if (e.touches.length === 2) {
        e.preventDefault();
        // Cancel single finger panning if we switch to two fingers
        setIsSingleFingerPanning(false);
        singleFingerStartPoint.current = null;
        singleFingerMoved.current = false;
        
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
        
        // Store pinch center for panning
        lastPinchCenter.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        
        setIsPinching(true);
        
        // Disable selection during pinch
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          canvas.discardActiveObject();
          canvas.selection = false;
          canvas.renderAll();
        }
        
        // Clear any existing timeout
        if (pinchTimeoutRef.current) {
          clearTimeout(pinchTimeoutRef.current);
        }
      } else if (e.touches.length === 1 && isMobileDevice) {
        // Single finger on mobile: start panning mode
        singleFingerStartPoint.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastPanPoint.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        singleFingerMoved.current = false;
        
        // Disable canvas selection/interaction during pan
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          canvas.selection = false;
        }
      }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      // Check if mobile
      const isMobileDevice = window.matchMedia('(max-width: 767px)').matches;
      
      if (e.touches.length === 2 && lastPinchDistance.current !== null && lastPinchCenter.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate current pinch center
        const currentCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        
        // Pan based on center movement
        const panDeltaX = lastPinchCenter.current.x - currentCenter.x;
        const panDeltaY = lastPinchCenter.current.y - currentCenter.y;
        
        const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
        const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);
        
        setViewportX(prev => Math.max(0, Math.min(prev + panDeltaX, maxX)));
        setViewportY(prev => Math.max(0, Math.min(prev + panDeltaY, maxY)));
        
        // Zoom based on pinch distance (25% to 200%)
        const delta = (currentDistance - lastPinchDistance.current) * 0.005;
        const newZoom = Math.max(0.25, Math.min(2, zoom + delta));
        
        if (newZoom !== zoom) {
          handleZoomChange(newZoom);
        }
        
        lastPinchDistance.current = currentDistance;
        lastPinchCenter.current = currentCenter;
      } else if (e.touches.length === 1 && singleFingerStartPoint.current && isMobileDevice) {
        // Single finger pan on mobile
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastPanPoint.current.x;
        const deltaY = touch.clientY - lastPanPoint.current.y;
        
        // Check if we've moved enough to consider it a pan (threshold: 5px)
        const totalDeltaX = Math.abs(touch.clientX - singleFingerStartPoint.current.x);
        const totalDeltaY = Math.abs(touch.clientY - singleFingerStartPoint.current.y);
        
        if (totalDeltaX > 5 || totalDeltaY > 5) {
          singleFingerMoved.current = true;
          setIsSingleFingerPanning(true);
          e.preventDefault();
          
          const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
          const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);
          
          setViewportX(prev => Math.max(0, Math.min(prev - deltaX, maxX)));
          setViewportY(prev => Math.max(0, Math.min(prev - deltaY, maxY)));
        }
        
        lastPanPoint.current = { x: touch.clientX, y: touch.clientY };
      }
    }, [zoom, handleZoomChange, containerSize]);

    const handleTouchEnd = useCallback(() => {
      lastPinchDistance.current = null;
      lastPinchCenter.current = null;
      singleFingerStartPoint.current = null;
      
      // Re-enable selection after touch ends
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.selection = true;
      }
      
      // Reset single finger panning state
      setIsSingleFingerPanning(false);
      singleFingerMoved.current = false;
      
      // Delay hiding the indicator for smooth UX
      pinchTimeoutRef.current = setTimeout(() => {
        setIsPinching(false);
      }, 500);
    }, []);

    // Calculate canvas position - center it when it fits, otherwise use viewport offset
    const scaledWidth = CANVAS_WIDTH * zoom;
    const scaledHeight = CANVAS_HEIGHT * zoom;
    
    const canvasX = scaledWidth <= containerSize.width 
      ? (containerSize.width - scaledWidth) / 2 
      : -viewportX;
    const canvasY = scaledHeight <= containerSize.height 
      ? (containerSize.height - scaledHeight) / 2 
      : -viewportY;

    return (
      <div 
        ref={containerRef}
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
          <canvas ref={canvasRef} />
        </div>

        {/* Pinch-zoom feedback indicator */}
        {isPinching && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-foreground/80 text-background px-4 py-2 rounded-full text-lg font-medium shadow-lg animate-scale-in">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        )}

        {/* Desktop: Minimap fixed position */}
        {showZoomControls && (
          <div className={`absolute left-2.5 bottom-2.5 flex-col items-start gap-1 transition-all duration-200 hidden sm:flex ${tutorialHighlight === 'zoom-minimap' ? 'z-50' : 'z-10'}`}>
            <div className={tutorialHighlight === 'zoom-minimap' ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg' : ''}>
              <ZoomSlider
                zoom={zoom}
                onZoomChange={handleZoomChange}
                highlight={false}
              />
            </div>
            <Minimap
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
              viewportWidth={containerSize.width}
              viewportHeight={containerSize.height}
              viewportX={viewportX}
              viewportY={viewportY}
              zoom={zoom}
              onViewportChange={handleViewportChange}
              visible={!canvasFitsInViewport}
              objects={minimapObjects}
              highlight={tutorialHighlight === 'zoom-minimap'}
            />
          </div>
        )}

        {/* Mobile: Minimap + InfoBar stacked in flex container */}
        <div className={`absolute left-2.5 bottom-2.5 right-2.5 flex flex-col items-start gap-2 sm:hidden ${tutorialHighlight === 'zoom-minimap' ? 'z-50' : 'z-10'}`}>
          {showZoomControls && (
            <>
              <div className={tutorialHighlight === 'zoom-minimap' ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg' : ''}>
                <ZoomSlider
                  zoom={zoom}
                  onZoomChange={handleZoomChange}
                  highlight={false}
                />
              </div>
              <Minimap
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                viewportWidth={containerSize.width}
                viewportHeight={containerSize.height}
                viewportX={viewportX}
                viewportY={viewportY}
                zoom={zoom}
                onViewportChange={handleViewportChange}
                visible={!canvasFitsInViewport}
                objects={minimapObjects}
                highlight={tutorialHighlight === 'zoom-minimap'}
              />
            </>
          )}
          {/* Mobile InfoBar rendered here */}
          {showTips && children}
        </div>

        {/* Desktop: Children (InfoBar) - centered at bottom */}
        <div className="hidden sm:block">
          {children}
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
