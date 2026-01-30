import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState, ReactNode } from 'react';
import { Canvas as FabricCanvas, PencilBrush, IText, ActiveSelection, Group, FabricObject, util as fabricUtil, Rect, Line } from 'fabric';
import { customProps, getHintForObject, CANVAS_WIDTH, CANVAS_HEIGHT, formatPilotiHeight, getPilotiFromGroup, getAllPilotiIds, refreshHouseGroupsOnCanvas } from '@/lib/canvas-utils';
import { houseManager, HouseSide, ViewType } from '@/lib/house-manager';

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
  isEditorOpen?: boolean;
  onDelete?: () => void;
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
  ({ onSelectionChange, onHistorySave, children, onZoomInteraction, onMinimapInteraction, tutorialHighlight, showTips = false, onPilotiSelect, onDistanceSelect, onObjectNameSelect, isEditorOpen = false, onDelete }, ref) => {
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
    
    // Keep refs in sync with state
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { viewportXRef.current = viewportX; }, [viewportX]);
    useEffect(() => { viewportYRef.current = viewportY; }, [viewportY]);
    useEffect(() => { containerSizeRef.current = containerSize; }, [containerSize]);
    useEffect(() => { isEditorOpenRef.current = isEditorOpen; }, [isEditorOpen]);

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

        // If a house is selected, highlight all its pilotis in yellow (all views)
        if (obj && obj.type === 'group' && (obj as any).myType === 'house') {
          (obj as Group).getObjects().forEach((child: any) => {
            if (child.isPilotiCircle || child.isPilotiRect) {
              child.set({
                stroke: '#facc15',
                strokeWidth: child.isPilotiRect ? 4 : 3,
              });
            }
          });
        }

        // Highlight the corresponding side in the plant view when an elevation view is selected
        updatePlantViewSideHighlight(canvas, obj);

        canvas.renderAll();
      };

      // Helper function to update side highlight in plant view
      const updatePlantViewSideHighlight = (canvas: FabricCanvas, selectedObj: FabricObject | undefined) => {
        // Find the plant view (top view) group
        const plantViewGroup = canvas.getObjects().find((o: any) => 
          o.type === 'group' && o.myType === 'house' && o.houseView === 'top'
        ) as Group | undefined;

        if (!plantViewGroup) return;

        // Remove existing side highlight from plant view
        const existingHighlight = plantViewGroup.getObjects().find((o: any) => o.isSideHighlight);
        if (existingHighlight) {
          plantViewGroup.remove(existingHighlight);
          plantViewGroup.setCoords();
        }

        // Check if selected object is an elevation view (not plant view)
        if (!selectedObj || selectedObj.type !== 'group' || (selectedObj as any).myType !== 'house') {
          return;
        }

        const selectedViewType = (selectedObj as any).houseViewType as ViewType | undefined;
        const selectedHouseView = (selectedObj as any).houseView as string | undefined;
        
        // If it's the plant view itself, don't highlight
        if (selectedHouseView === 'top' || selectedViewType === 'top') {
          return;
        }

        // Get the side assignment for this view from houseManager
        const house = houseManager.getHouse();
        if (!house) return;

        // Find which side this view is assigned to
        let assignedSide: HouseSide | null = null;
        
        // First try to get from the view data
        const viewType = selectedViewType || selectedHouseView as ViewType;
        if (viewType && house.views[viewType]) {
          assignedSide = house.views[viewType]?.side || null;
        }

        // If no assigned side found, can't highlight
        if (!assignedSide) return;

        // Get the house body to calculate line positions (relative to group center)
        const houseBody = plantViewGroup.getObjects().find((o: any) => o.isHouseBody) as any;
        if (!houseBody) return;

        // The house body is centered at (0,0) within the group
        const bodyWidth = houseBody.width || 0;
        const bodyHeight = houseBody.height || 0;
        const strokeWidth = 4;

        // Calculate line start/end points in group-local coordinates
        // In Fabric, Line uses x1,y1,x2,y2 but when added to group they need to be relative to group center
        let x1: number, y1: number, x2: number, y2: number;
        
        switch (assignedSide) {
          case 'top':
            x1 = -bodyWidth / 2;
            y1 = -bodyHeight / 2;
            x2 = bodyWidth / 2;
            y2 = -bodyHeight / 2;
            break;
          case 'bottom':
            x1 = -bodyWidth / 2;
            y1 = bodyHeight / 2;
            x2 = bodyWidth / 2;
            y2 = bodyHeight / 2;
            break;
          case 'left':
            x1 = -bodyWidth / 2;
            y1 = -bodyHeight / 2;
            x2 = -bodyWidth / 2;
            y2 = bodyHeight / 2;
            break;
          case 'right':
            x1 = bodyWidth / 2;
            y1 = -bodyHeight / 2;
            x2 = bodyWidth / 2;
            y2 = bodyHeight / 2;
            break;
          default:
            return;
        }

        // Create highlight line with coordinates relative to group center
        // For a Line in a group, we need to set left/top to position it correctly
        // The line's internal coordinates should be relative to its own center
        const lineWidth = Math.abs(x2 - x1) || strokeWidth;
        const lineHeight = Math.abs(y2 - y1) || strokeWidth;
        const lineCenterX = (x1 + x2) / 2;
        const lineCenterY = (y1 + y2) / 2;

        const highlightLine = new Line(
          [x1 - lineCenterX, y1 - lineCenterY, x2 - lineCenterX, y2 - lineCenterY],
          {
            left: lineCenterX,
            top: lineCenterY,
            stroke: '#3b82f6',
            strokeWidth: strokeWidth,
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
          }
        );
        (highlightLine as any).isSideHighlight = true;

        // Add to plant view group and refresh
        plantViewGroup.add(highlightLine);
        (plantViewGroup as any)._calcBounds?.();
        plantViewGroup.setCoords();
        (plantViewGroup as any).dirty = true;
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
        let pilotiNivel = 0.3;
        
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
          pilotiNivel = (subTarget as any).pilotiNivel ?? 0.3;
        }
        
        if (!piloti) return;
        
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
        
        // Calculate screen position of piloti using its fully transformed center
        // getCenterPoint() returns canvas coordinates with all transformations applied
        // (group scale, rotation, piloti's own scale, etc.)
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
          
           // Deixa TODOS os pilotis amarelos quando o popover abrir/selecionar
           // (e depois o piloti atual fica azul)
           group.getObjects().forEach((obj: any) => {
             if (obj.isPilotiCircle || obj.isPilotiRect) {
               obj.set({
                 stroke: '#facc15',
                 strokeWidth: obj.isPilotiRect ? 4 : 3,
               });
             }
           });
          
          // Highlight the selected piloti with thicker border
          const isPilotiRectType = (piloti as any).isPilotiRect;
          piloti.set({
            stroke: '#3b82f6',
            strokeWidth: isPilotiRectType ? 5 : 4,
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

      // Mobile: single tap on dimension (only if tap is near center)
      canvas.on('mouse:down', (e) => {
        const target = e.target;
        
        // Handle dimension on mobile - only open editor if tap is near center
        if (target && target.type === 'group' && (target as any).myType === 'dimension' && window.matchMedia('(max-width: 640px)').matches) {
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

        {/* Mobile: Minimap + InfoBar stacked in flex container */}
        <div className={`absolute left-2.5 bottom-2.5 right-2.5 flex flex-col items-start gap-2 sm:hidden ${tutorialHighlight === 'zoom-minimap' ? 'z-50' : 'z-10'}`}>
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
