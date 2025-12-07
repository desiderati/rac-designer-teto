import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, PencilBrush, IText, ActiveSelection } from 'fabric';
import { CANVAS_WIDTH, CANVAS_HEIGHT, customProps, getHintForObject } from '@/lib/canvas-utils';

interface CanvasProps {
  onSelectionChange: (hint: string) => void;
  onHistorySave: () => void;
}

export interface CanvasHandle {
  canvas: FabricCanvas | null;
  saveHistory: () => void;
  undo: () => void;
  copy: () => void;
  paste: () => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ onSelectionChange, onHistorySave }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<FabricCanvas | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyProcessingRef = useRef(false);
    const clipboardRef = useRef<any>(null);

    const saveHistory = () => {
      if (historyProcessingRef.current) return;
      if (historyRef.current.length > 50) historyRef.current.shift();
      historyRef.current.push(JSON.stringify(fabricCanvasRef.current));
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

    useImperativeHandle(ref, () => ({
      canvas: fabricCanvasRef.current,
      saveHistory,
      undo,
      copy,
      paste,
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

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

    return (
      <div className="flex-1 bg-muted overflow-auto flex items-center justify-center p-5">
        <div 
          className="bg-card shadow-xl"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
