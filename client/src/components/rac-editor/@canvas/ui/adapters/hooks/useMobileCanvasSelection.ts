import {useEffect, useRef, useState, type RefObject} from 'react';
import type {Canvas, FabricObject} from 'fabric';
import {getPilotiIdsFromGroup, toCanvasGroup, type CanvasGroup} from '@/components/rac-editor/@canvas/lib';

interface MobileCanvasSelectionArgs {
  enabled: boolean;
  houseId?: string | null;
  fabricCanvasRef: RefObject<Canvas | null>;
  zoom: number;
}

/** Aparência e controles transitórios: não alteram flags serializadas do documento. */
export function useMobileCanvasSelection({enabled, houseId, fabricCanvasRef, zoom}: MobileCanvasSelectionArgs) {
  const [count, setCount] = useState(0);
  const [resizing, setResizing] = useState(false);
  const [canResize, setCanResize] = useState(false);
  const [selectedTopView, setSelectedTopView] = useState<CanvasGroup | null>(null);
  const appearance = useRef({resizing, zoom});
  appearance.current = {resizing, zoom};
  const refresh = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!enabled || !canvas) {setCount(0); setResizing(false); setSelectedTopView(null); return;}
    let active: FabricObject | undefined;
    let restore: (() => void) | undefined;
    let controls: FabricObject['controls'] = {};
    let sourceControls: FabricObject['controls'] = {};
    let scalingLocks = {lockScalingX: false, lockScalingY: false};
    const paint = () => {
      if (!active) return;
      const scale = Math.max(0.01, appearance.current.zoom);
      active.set({
        borderColor: '#2563eb', borderScaleFactor: 2 / scale,
        cornerColor: '#ffffff', cornerStrokeColor: '#2563eb',
        cornerStyle: 'circle', transparentCorners: false,
        cornerSize: 16 / scale, touchCornerSize: 44 / scale, padding: 8 / scale,
      });
      active.controls = appearance.current.resizing ? controls : {};
      active.setCoords();
      canvas.requestRenderAll();
    };
    refresh.current = paint;
    const sync = () => {
      const next = canvas.getActiveObject();
      const selected = canvas.getActiveObjects();
      if (next !== active) {
        restore?.();
        active = next;
        restore = undefined;
        setResizing(false);
        appearance.current.resizing = false;
        if (active) {
          const target = active;
          const original = {
            controls: target.controls, borderColor: target.borderColor, borderScaleFactor: target.borderScaleFactor,
            cornerColor: target.cornerColor, cornerStrokeColor: target.cornerStrokeColor,
            cornerStyle: target.cornerStyle, transparentCorners: target.transparentCorners,
            cornerSize: target.cornerSize, touchCornerSize: target.touchCornerSize, padding: target.padding,
            ...(target.isType('ActiveSelection') ? {
              lockScalingX: target.lockScalingX, lockScalingY: target.lockScalingY,
            } : {}),
          };
          scalingLocks = {lockScalingX: target.lockScalingX, lockScalingY: target.lockScalingY};
          // Respeita a política de cada objeto (cantos ou extremidades); rotação não é resize.
          controls = Object.fromEntries(Object.entries(target.controls).filter(([key]) => key !== 'mtr'));
          sourceControls = controls;
          restore = () => {target.set(original); target.setCoords();};
        } else setCanResize(false);
      }
      if (active) {
        const target = active;
        // A seleção é transitória; as restrições dos membros continuam no documento original.
        if (target.isType('ActiveSelection')) {
          target.set({
            lockScalingX: scalingLocks.lockScalingX || selected.some(item => item.lockScalingX),
            lockScalingY: scalingLocks.lockScalingY || selected.some(item => item.lockScalingY),
          });
          controls = Object.fromEntries(Object.entries(sourceControls).filter(([key]) => {
            if (target.lockScalingX && !['mt', 'mb'].includes(key)) return false;
            if (target.lockScalingY && !['ml', 'mr'].includes(key)) return false;
            return true;
          }));
        }
        setCanResize(target.hasControls && !(target.lockScalingX && target.lockScalingY)
          && Object.entries(controls).some(([key, control]) => control.getVisibility(target, key)));
      }
      setCount(selected.length);
      const group = selected.length === 1 ? toCanvasGroup(selected[0]) : null;
      setSelectedTopView(group?.houseView === 'top' && getPilotiIdsFromGroup(group).length > 0 ? group : null);
      paint();
    };
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    sync();
    return () => {
      canvas.off('selection:created', sync);
      canvas.off('selection:updated', sync);
      canvas.off('selection:cleared', sync);
      restore?.();
      refresh.current = () => undefined;
      canvas.requestRenderAll();
    };
  }, [enabled, houseId, fabricCanvasRef]);

  useEffect(() => {refresh.current();}, [resizing, zoom]);
  return {count, resizing, canResize, selectedTopView, toggleResizing: () => setResizing(value => !value)};
}
