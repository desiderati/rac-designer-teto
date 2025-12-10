import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState, ReactNode } from 'react';
import { Canvas as FabricCanvas, PencilBrush, IText, ActiveSelection } from 'fabric';
import { customProps, getHintForObject, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/canvas-utils';
import { Minimap, ZoomSlider } from './Minimap';

interface CanvasProps {
  onSelectionChange: (hint: string) => void;
  onHistorySave: () => void;
  children?: ReactNode;
  onZoomInteraction?: () => void;
  onMinimapInteraction?: () => void;
  tutorialHighlight?: 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null;
  showTips?: boolean;
}

export interface CanvasHandle {
  canvas: FabricCanvas | null;
  saveHistory: () => void;
  undo: () => void;
  copy: () => void;
  paste: () => void;
  getCanvasPosition: () => { x: number; y: number; zoom: number };
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ onSelectionChange, onHistorySave, children, onZoomInteraction, onMinimapInteraction, tutorialHighlight, showTips = false }, ref) => {
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

    const undo = () => {
      if (historyRef.current.length > 1 && fabricCanvasRef.current) {
        historyProcessingRef.current = true;
        historyRef.current.pop();
        const prevState = historyRef.current[historyRef.current.length - 1];
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.loadFromJSON(prevState).then(() => {
          fabricCanvasRef.current?.renderAll();
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
      undo,
      copy,
      paste,
      getCanvasPosition: () => ({ x: viewportX, y: viewportY, zoom }),
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
      };

      canvas.on('selection:created', updateHint);
      canvas.on('selection:updated', updateHint);
      canvas.on('selection:cleared', updateHint);

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
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObj = canvas.getActiveObject();
          if (!activeObj || (activeObj.type !== 'i-text' || !(activeObj as IText).isEditing)) {
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
      if (e.touches.length === 2) {
        e.preventDefault();
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
      }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
      }
    }, [zoom, handleZoomChange, containerSize]);

    const handleTouchEnd = useCallback(() => {
      lastPinchDistance.current = null;
      lastPinchCenter.current = null;
      
      // Re-enable selection after pinch ends
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.selection = true;
      }
      
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
