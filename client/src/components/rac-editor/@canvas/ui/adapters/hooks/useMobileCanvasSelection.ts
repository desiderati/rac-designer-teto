import {useEffect, useRef, useState, type RefObject} from 'react';
import {Control, type Canvas, type FabricObject} from 'fabric';
import {getPilotiIdsFromGroup, toCanvasGroup, toCanvasObject, type CanvasGroup, type CanvasObject} from '@/components/rac-editor/@canvas/lib';
import {getCanvasObjectEditorKind} from '../../../lib/canvas-object-editor-selection.ts';

interface MobileCanvasSelectionArgs {
  enabled: boolean;
  houseId?: string | null;
  fabricCanvasRef: RefObject<Canvas | null>;
  zoom: number;
}

const renderRotationControl: Control['render'] = function (ctx, left, top, _style, object) {
  const size = this.sizeX || object.cornerSize;
  ctx.save();
  ctx.translate(left, top);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 5, Math.PI / 4, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, -5);
  ctx.lineTo(5, -2);
  ctx.lineTo(6, -6);
  ctx.stroke();
  ctx.restore();
};

/** Aparência e controles transitórios: não alteram flags serializadas do documento. */
export function useMobileCanvasSelection({enabled, houseId, fabricCanvasRef, zoom}: MobileCanvasSelectionArgs) {
  const [count, setCount] = useState(0);
  const [transforming, setTransforming] = useState(false);
  const [canTransform, setCanTransform] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<number | null>(null);
  const [selectedTopView, setSelectedTopView] = useState<CanvasGroup | null>(null);
  const [selectedEditableObject, setSelectedEditableObject] = useState<CanvasObject | null>(null);
  const appearance = useRef({transforming, zoom});
  appearance.current = {transforming, zoom};
  const refresh = useRef<() => void>(() => undefined);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!enabled || !canvas) {setCount(0); setTransforming(false); setCanTransform(false); setRotationAngle(null); setSelectedTopView(null); setSelectedEditableObject(null); return;}
    let active: FabricObject | undefined;
    let restore: (() => void) | undefined;
    let controls: FabricObject['controls'] = {};
    let sourceControls: FabricObject['controls'] = {};
    let locks = {lockScalingX: false, lockScalingY: false, lockRotation: false};
    let rotating = false;
    const endRotation = () => {rotating = false; setRotationAngle(null);};
    const updateRotationAngle = () => {
      if (rotating && active) setRotationAngle(Math.round(((active.angle % 360) + 360) % 360) % 360);
    };
    const onRotating = ({target}: {target?: FabricObject}) => {
      if (!appearance.current.transforming || target !== active || active?.lockRotation) return;
      rotating = true;
      updateRotationAngle();
    };
    const paint = () => {
      if (!active) return;
      const scale = Math.max(0.01, appearance.current.zoom);
      active.set({
        borderColor: '#2563eb', borderScaleFactor: 2 / scale,
        cornerColor: '#ffffff', cornerStrokeColor: '#2563eb',
        cornerStyle: 'circle', transparentCorners: false,
        cornerSize: 16 / scale, touchCornerSize: 44 / scale, padding: 8 / scale,
      });
      if (controls.mtr) Object.assign(controls.mtr, {
        offsetY: -40 / scale, sizeX: 24 / scale, sizeY: 24 / scale,
        touchSizeX: 44 / scale, touchSizeY: 44 / scale,
      });
      active.controls = appearance.current.transforming ? controls : {};
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
        setTransforming(false);
        endRotation();
        appearance.current.transforming = false;
        if (active) {
          const target = active;
          const original = {
            controls: target.controls, borderColor: target.borderColor, borderScaleFactor: target.borderScaleFactor,
            cornerColor: target.cornerColor, cornerStrokeColor: target.cornerStrokeColor,
            cornerStyle: target.cornerStyle, transparentCorners: target.transparentCorners,
            cornerSize: target.cornerSize, touchCornerSize: target.touchCornerSize, padding: target.padding,
            ...(target.isType('ActiveSelection') ? {
              lockScalingX: target.lockScalingX, lockScalingY: target.lockScalingY, lockRotation: target.lockRotation,
            } : {}),
          };
          locks = {lockScalingX: target.lockScalingX, lockScalingY: target.lockScalingY, lockRotation: target.lockRotation};
          // Copia somente a alça de rotação para não alterar controles compartilhados do Fabric.
          sourceControls = {...target.controls, ...(target.controls.mtr ? {
            mtr: new Control({...target.controls.mtr, render: renderRotationControl}),
          } : {})};
          restore = () => {target.set(original); target.setCoords();};
        } else setCanTransform(false);
      }
      if (active) {
        const target = active;
        // A seleção é transitória; as restrições dos membros continuam no documento original.
        if (target.isType('ActiveSelection')) {
          target.set({
            lockScalingX: locks.lockScalingX || selected.some(item => item.lockScalingX || !item.hasControls),
            lockScalingY: locks.lockScalingY || selected.some(item => item.lockScalingY || !item.hasControls),
            lockRotation: true,
          });
        }
        controls = Object.fromEntries(Object.entries(sourceControls).filter(([key, control]) => {
          if (!control.getVisibility(target, key)) return false;
          if (key === 'mtr') return !target.lockRotation;
          if (target.lockScalingX && !['mt', 'mb'].includes(key)) return false;
          if (target.lockScalingY && !['ml', 'mr'].includes(key)) return false;
          return true;
        }));
        setCanTransform(target.hasControls && Object.keys(controls).length > 0);
      }
      setCount(selected.length);
      const group = selected.length === 1 ? toCanvasGroup(selected[0]) : null;
      setSelectedTopView(group?.houseView === 'top' && getPilotiIdsFromGroup(group).length > 0 ? group : null);
      const object = selected.length === 1 ? toCanvasObject(selected[0]) : null;
      setSelectedEditableObject(object && getCanvasObjectEditorKind(object) ? object : null);
      paint();
    };
    canvas.on('selection:created', sync);
    canvas.on('selection:updated', sync);
    canvas.on('selection:cleared', sync);
    canvas.on('object:rotating', onRotating);
    // Lê também após renderizar para refletir o snap de ângulo existente no editor.
    canvas.on('after:render', updateRotationAngle);
    canvas.on('mouse:up', endRotation);
    canvas.on('object:modified', endRotation);
    sync();
    return () => {
      canvas.off('selection:created', sync);
      canvas.off('selection:updated', sync);
      canvas.off('selection:cleared', sync);
      canvas.off('object:rotating', onRotating);
      canvas.off('after:render', updateRotationAngle);
      canvas.off('mouse:up', endRotation);
      canvas.off('object:modified', endRotation);
      endRotation();
      restore?.();
      refresh.current = () => undefined;
      canvas.requestRenderAll();
    };
  }, [enabled, houseId, fabricCanvasRef]);

  useEffect(() => {if (!transforming) setRotationAngle(null); refresh.current();}, [transforming, zoom]);
  return {count, transforming, canTransform, rotationAngle, selectedTopView, selectedEditableObject,
    toggleTransforming: () => setTransforming(value => !value)};
}
