import {useCallback, useEffect, useRef, type RefObject} from 'react';
import type {Canvas, FabricObject, TPointerEvent} from 'fabric';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import type {CanvasZoomGesture} from '@/components/rac-editor/@canvas/hooks/useCanvasViewport.ts';
import {INTERACTION_THRESHOLDS, TIMINGS, ZOOM_LIMITS} from '@/shared/config.ts';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from '@/shared/constants.ts';

interface MobileCanvasGesturesArgs {
  enabled: boolean;
  houseId?: string | null;
  readOnly: boolean;
  transforming?: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  fabricCanvasRef: RefObject<Canvas | null>;
  canvasToolMode: CanvasToolMode;
  onToolModeChange?: (mode: CanvasToolMode) => void;
  zoom: number;
  minimumZoom: number;
  viewportX: number;
  viewportY: number;
  handleViewportChange: (x: number, y: number) => void;
  handleZoomChange: (zoom: number, gesture?: CanvasZoomGesture) => void;
  onPanningChange?: (panning: boolean) => void;
  onObjectMovingChange?: (moving: boolean) => void;
  onObjectMove?: () => void;
}

/** Captura antes do Fabric: cada sequência pertence à viewport ou a um objeto, nunca aos dois. */
export function useMobileCanvasGestures(args: MobileCanvasGesturesArgs) {
  const latest = useRef(args);
  const handledEvents = useRef(new WeakSet<Event>());
  latest.current = args;
  const shouldSkipLegacyTouch = useCallback((event: Event) => handledEvents.current.has(event), []);
  useEffect(() => {
    const container = args.containerRef.current;
    if (!args.enabled || !container) return;
    let owned = false;
    let nativeCanvas: Canvas | undefined;
    let nativeEndEvent: TouchEvent | undefined;
    let held: ReturnType<typeof setTimeout> | undefined;
    let heldSelection: FabricObject | undefined;
    let drag: FabricObject | undefined;
    let moved = false;
    let start = {x: 0, y: 0};
    let last = start;
    let pinch: {distance: number; zoom: number; center: {x: number; y: number}} | undefined;
    let waitingForRelease = false;
    let pan = {x: 0, y: 0};
    let panning = false;
    let objectMoving = false;
    const setObjectMoving = (value: boolean) => {
      if (objectMoving === value) return;
      objectMoving = value;
      latest.current.onObjectMovingChange?.(value);
    };
    const setPanning = (value: boolean) => {
      if (panning === value) return;
      panning = value;
      latest.current.onPanningChange?.(value);
    };
    const clearHold = () => {clearTimeout(held); held = undefined;};
    // Fabric escuta touchend, mas não touchcancel. Finalizar pelo evento público também
    // libera seus listeners/mainTouchId sem depender de métodos privados da biblioteca.
    const cancelNativeGesture = () => {
      if (!nativeCanvas || !nativeEndEvent) return;
      const end = new TouchEvent('touchend', {bubbles: true, cancelable: true,
        touches: [], changedTouches: Array.from(nativeEndEvent.changedTouches)});
      handledEvents.current.add(end);
      nativeCanvas.upperCanvasEl.dispatchEvent(end);
      nativeCanvas = undefined;
      nativeEndEvent = undefined;
    };
    const point = (touch: Touch) => ({x: touch.clientX, y: touch.clientY});
    const finishObject = () => {
      setObjectMoving(false);
      if (drag && moved && !latest.current.readOnly) {
        drag.setCoords();
        latest.current.fabricCanvasRef.current?.fire('object:modified', {target: drag});
      }
      drag = undefined;
      moved = false;
    };
    const stop = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    };
    const onStart = (event: TouchEvent) => {
      const current = latest.current;
      const canvas = current.fabricCanvasRef.current;
      if (!owned && (!canvas || canvas.isDrawingMode || event.target !== canvas.upperCanvasEl)) return;
      owned = true;
      handledEvents.current.add(event);
      clearHold();
      setPanning(false);
      if (event.touches.length >= 2) {
        stop(event);
        finishObject();
        heldSelection = undefined;
        if (current.canvasToolMode === 'pan') {
          canvas?.discardActiveObject();
          canvas?.requestRenderAll();
        }
        const a = point(event.touches[0]), b = point(event.touches[1]);
        pinch = {distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom: current.zoom,
          center: {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}};
        waitingForRelease = true;
        return;
      }
      if (!canvas || waitingForRelease) {stop(event); return;}
      start = last = point(event.touches[0]);
      pan = {x: current.viewportX, y: current.viewportY};
      const transformControl = current.transforming && !current.readOnly
        && canvas.getActiveObject()?.findControl(canvas.getViewportPoint(event as TPointerEvent), true);
      if (current.canvasToolMode === 'select' || transformControl) {
        // Inclui a área vazia: o Fabric usa esse gesto para seleção múltipla
        // por retângulo. Seleção nunca transforma um dedo em pan da viewport.
        nativeCanvas = canvas;
        nativeEndEvent = event;
        return;
      }
      // skipTargetFind pertence à ferramenta Pan; a busca temporária não libera edição.
      const skip = canvas.skipTargetFind;
      canvas.skipTargetFind = false;
      const target = canvas.findTarget(event as TPointerEvent);
      canvas.skipTargetFind = skip;
      stop(event);
      if (target && target === heldSelection && canvas.getActiveObject() === target) {
        // O hold também vale depois de soltar: arrastar o item já selecionado
        // continua pertencendo ao objeto, sem reiniciar a espera ou fazer pan.
        if (!current.readOnly) drag = target;
        return;
      }
      heldSelection = undefined;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      if (target?.selectable) held = setTimeout(() => {
        held = undefined;
        // Seleção pontual dentro de Pan, sem trocar a ferramenta escolhida.
        // O próximo gesto livre continua sendo pan; dois dedos cancelam a espera.
        heldSelection = target;
        canvas.setActiveObject(target);
        if (!latest.current.readOnly) drag = target;
        canvas.requestRenderAll();
      }, TIMINGS.mobileLongPressDelayMs);
    };
    const onMove = (event: TouchEvent) => {
      if (!owned) return;
      handledEvents.current.add(event);
      if (nativeCanvas) nativeEndEvent = event;
      if (nativeCanvas && !waitingForRelease) return;
      stop(event);
      const current = latest.current;
      const canvas = current.fabricCanvasRef.current;
      if (event.touches.length >= 2 && pinch) {
        clearHold();
        const a = point(event.touches[0]), b = point(event.touches[1]);
        const center = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
        const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const zoom = Math.max(current.minimumZoom, Math.min(ZOOM_LIMITS.max, pinch.zoom * distance / pinch.distance));
        if (center.x !== pinch.center.x || center.y !== pinch.center.y) setPanning(true);
        const rect = container.getBoundingClientRect();
        current.handleZoomChange(zoom, {
          from: {x: pinch.center.x - rect.left, y: pinch.center.y - rect.top},
          to: {x: center.x - rect.left, y: center.y - rect.top},
        });
        pinch = {zoom, distance, center};
        return;
      }
      if (waitingForRelease || event.touches.length !== 1) return;
      const next = point(event.touches[0]);
      const dx = next.x - last.x, dy = next.y - last.y;
      if (Math.hypot(next.x - start.x, next.y - start.y) <= INTERACTION_THRESHOLDS.mobilePanActivation) return;
      clearHold();
      if (drag && canvas && !current.readOnly) {
        if (!drag.lockMovementX || !drag.lockMovementY) setObjectMoving(true);
        const rect = canvas.upperCanvasEl.getBoundingClientRect();
        if (!drag.lockMovementX) drag.set('left', drag.left + dx * canvas.getWidth() / rect.width);
        if (!drag.lockMovementY) drag.set('top', drag.top + dy * canvas.getHeight() / rect.height);
        drag.setCoords();
        if (!drag.lockMovementX || !drag.lockMovementY) current.onObjectMove?.();
        moved = true;
        canvas.requestRenderAll();
      } else if (!canvas?.getActiveObject()) {
        setPanning(true);
        const rect = container.getBoundingClientRect();
        pan = {
          x: Math.max(0, Math.min(pan.x - dx, Math.max(0, CANVAS_WIDTH * current.zoom - rect.width))),
          y: Math.max(0, Math.min(pan.y - dy, Math.max(0, CANVAS_HEIGHT * current.zoom - rect.height))),
        };
        current.handleViewportChange(pan.x, pan.y);
      }
      last = next;
    };
    const onEnd = (event: TouchEvent) => {
      if (!owned) return;
      setPanning(false);
      handledEvents.current.add(event);
      if (!nativeCanvas || event.type === 'touchcancel') stop(event);
      clearHold();
      finishObject();
      pinch = undefined;
      // Não transformar o dedo restante de uma pinça em arrasto ou pan.
      if (event.touches.length && event.type !== 'touchcancel') {waitingForRelease = true; return;}
      owned = false;
      waitingForRelease = false;
      if (event.type === 'touchcancel') {
        nativeEndEvent = event;
        cancelNativeGesture();
      } else {
        // O touchend original precisa chegar ao Fabric para finalizar seu transform.
        nativeCanvas = undefined;
        nativeEndEvent = undefined;
      }
    };
    const options = {capture: true, passive: false};
    container.addEventListener('touchstart', onStart, options);
    document.addEventListener('touchmove', onMove, options);
    document.addEventListener('touchend', onEnd, options);
    document.addEventListener('touchcancel', onEnd, options);
    return () => {
      clearHold();
      setPanning(false);
      setObjectMoving(false);
      cancelNativeGesture();
      container.removeEventListener('touchstart', onStart, options);
      document.removeEventListener('touchmove', onMove, options);
      document.removeEventListener('touchend', onEnd, options);
      document.removeEventListener('touchcancel', onEnd, options);
    };
  }, [args.enabled, args.houseId, args.containerRef, args.canvasToolMode]);
  return shouldSkipLegacyTouch;
}
