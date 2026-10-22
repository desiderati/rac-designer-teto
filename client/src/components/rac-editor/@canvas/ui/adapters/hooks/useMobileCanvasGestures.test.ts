import {act, fireEvent, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Canvas} from 'fabric';
import {useMobileCanvasGestures} from './useMobileCanvasGestures.ts';
import {useCanvasViewport} from '@/components/rac-editor/@canvas/hooks/useCanvasViewport.ts';

function setup(readOnly = false, canvasToolMode: 'select' | 'pan' = 'pan', transforming = false) {
  const container = document.createElement('div');
  const upperCanvasEl = document.createElement('canvas');
  container.append(upperCanvasEl); document.body.append(container);
  container.getBoundingClientRect = () => ({left: 0, top: 0, width: 800, height: 340}) as DOMRect;
  upperCanvasEl.getBoundingClientRect = () => ({width: 1200, height: 800}) as DOMRect;
  const target = {left: 200, top: 200, selectable: true, lockMovementX: readOnly, lockMovementY: readOnly,
    findControl: vi.fn(() => ({key: 'mtr'})),
    set: vi.fn(function (this: {left: number; top: number}, key: 'left' | 'top', value: number) {this[key] = value;}), setCoords: vi.fn()};
  let active: typeof target | undefined = transforming ? target : undefined;
  const canvas = {upperCanvasEl, skipTargetFind: true, isDrawingMode: false, findTarget: vi.fn<() => typeof target | undefined>(() => target),
    getViewportPoint: vi.fn(() => ({x: 400, y: 170})),
    getActiveObject: () => active, setActiveObject: (object: typeof target) => {active = object;},
    discardActiveObject: () => {active = undefined;}, getWidth: () => 1200, getHeight: () => 800,
    requestRenderAll: vi.fn(), fire: vi.fn()};
  const onToolModeChange = vi.fn();
  const panningChanges = vi.fn();
  const objectMovingChanges = vi.fn();
  const onObjectMove = vi.fn();
  const containerRef = {current: container};
  const fabricCanvasRef = {current: canvas as unknown as Canvas};
  const hook = renderHook(() => {
    const viewport = useCanvasViewport({});
    const shouldSkipLegacyTouch = useMobileCanvasGestures({...viewport, enabled: true, readOnly, containerRef, fabricCanvasRef,
      canvasToolMode, transforming, onToolModeChange, onObjectMove, onObjectMovingChange: objectMovingChanges, onPanningChange: (panning) => {
        viewport.setIsPanning(panning);
        panningChanges(panning);
      }});
    return {...viewport, shouldSkipLegacyTouch};
  });
  act(() => {hook.result.current.setContainerSize({width: 800, height: 340});});
  act(() => {hook.result.current.handleViewportChange(300, 200);});
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', points: number[][]) =>
    fireEvent[type](upperCanvasEl, {touches: points.map(([clientX, clientY]) => ({clientX, clientY})), changedTouches: []});
  return {...hook, canvas, target, onToolModeChange, panningChanges, objectMovingChanges, onObjectMove, send, container, upperCanvasEl};
}
afterEach(() => {vi.useRealTimers(); localStorage.clear(); document.body.innerHTML = '';});

describe('gestos mobile com dono único', () => {
  it('delega a alça de rotação ao Fabric em Panning sem deslocar a viewport', () => {
    const {send, upperCanvasEl, result, target, canvas} = setup(false, 'pan', true);
    const received: string[] = [];
    const listener = (event: Event) => {
      received.push(event.type);
      expect(result.current.shouldSkipLegacyTouch(event)).toBe(true);
    };
    ['touchstart', 'touchmove', 'touchend'].forEach(type => upperCanvasEl.addEventListener(type, listener));
    const before = {x: result.current.viewportX, y: result.current.viewportY};
    send('touchStart', [[400, 170]]);
    send('touchMove', [[440, 190]]);
    send('touchEnd', []);
    expect(target.findControl).toHaveBeenCalled();
    expect(received).toEqual(['touchstart', 'touchmove', 'touchend']);
    expect(result.current.isPanning).toBe(false);
    expect({x: result.current.viewportX, y: result.current.viewportY}).toEqual(before);
    expect(canvas.findTarget).not.toHaveBeenCalled();
    expect(target.set).not.toHaveBeenCalled();
  });
  it.each(['touchEnd', 'touchCancel'] as const)('sinaliza panning apenas após deslocar e encerra em %s', (end) => {
    const {send, result} = setup();
    send('touchStart', [[400, 170]]);
    expect(result.current.isPanning).toBe(false);
    send('touchMove', [[399, 170]]);
    expect(result.current.isPanning).toBe(false);
    send('touchMove', [[350, 150]]);
    expect(result.current.isPanning).toBe(true);
    send(end, []);
    expect(result.current.isPanning).toBe(false);
  });

  it('encerra o panning ao desmontar a captura de gestos', () => {
    const {send, unmount, panningChanges} = setup();
    send('touchStart', [[400, 170]]);
    send('touchMove', [[350, 150]]);
    expect(panningChanges).toHaveBeenLastCalledWith(true);
    unmount();
    expect(panningChanges).toHaveBeenLastCalledWith(false);
  });

  it('encerra o panning em touchcancel não cancelável sem tentar prevenir o evento', () => {
    const {send, upperCanvasEl, result} = setup();
    send('touchStart', [[400, 170]]);
    send('touchMove', [[350, 150]]);
    const event = new TouchEvent('touchcancel', {bubbles: true, cancelable: false, touches: [], changedTouches: []});
    const prevent = vi.spyOn(event, 'preventDefault');
    act(() => {upperCanvasEl.dispatchEvent(event);});
    expect(result.current.isPanning).toBe(false);
    expect(prevent).not.toHaveBeenCalled();
  });

  it('sinaliza deslocamento com dois dedos, sem confundir com pinça parada', () => {
    const {send, result} = setup();
    send('touchStart', [[350, 170], [450, 170]]);
    send('touchMove', [[300, 170], [500, 170]]);
    expect(result.current.isPanning).toBe(false);
    send('touchMove', [[250, 150], [450, 150]]);
    expect(result.current.isPanning).toBe(true);
    send('touchEnd', [[250, 150]]);
    expect(result.current.isPanning).toBe(false);
    send('touchMove', [[200, 130]]);
    expect(result.current.isPanning).toBe(false);
    send('touchEnd', []);
  });
  it('delega o gesto de Seleção ao Fabric e impede processamento duplicado pela viewport', () => {
    const {send, upperCanvasEl, result, target, canvas} = setup(false, 'select');
    const received: string[] = [];
    const listener = (event: Event) => {
      received.push(event.type);
      expect(result.current.shouldSkipLegacyTouch(event)).toBe(true);
    };
    ['touchstart', 'touchmove', 'touchend'].forEach(type => upperCanvasEl.addEventListener(type, listener));
    send('touchStart', [[400, 170]]);
    send('touchMove', [[450, 190]]);
    expect(result.current.isPanning).toBe(false);
    send('touchEnd', []);
    expect(received).toEqual(['touchstart', 'touchmove', 'touchend']);
    expect(target.set).not.toHaveBeenCalled(); // resize/rotação/arrasto pertencem ao Fabric
    expect(canvas.fire).not.toHaveBeenCalled();
    expect(result.current.viewportX).toBe(300);
  });
  it('interrompe movimentos nativos durante pinça e entrega o fim ao Fabric', () => {
    const {send, upperCanvasEl, result} = setup(false, 'select');
    const move = vi.fn(), end = vi.fn();
    upperCanvasEl.addEventListener('touchmove', move);
    upperCanvasEl.addEventListener('touchend', end);
    send('touchStart', [[350, 170]]);
    send('touchStart', [[350, 170], [450, 170]]);
    send('touchMove', [[300, 170], [500, 170]]);
    expect(result.current.zoom).toBeCloseTo(2);
    expect(move).not.toHaveBeenCalled();
    send('touchEnd', [[300, 170]]);
    send('touchMove', [[250, 120]]);
    expect(move).not.toHaveBeenCalled();
    send('touchEnd', []);
    expect(end).toHaveBeenCalledTimes(2);
  });
  it.each(['cancel', 'unmount'])('finaliza a sequência delegada ao Fabric ao receber %s', (reason) => {
    const {send, upperCanvasEl, unmount, result} = setup(false, 'select');
    const end = vi.fn((event: Event) => {
      expect(result.current.shouldSkipLegacyTouch(event)).toBe(true);
      expect((event as TouchEvent).touches).toHaveLength(0);
    });
    upperCanvasEl.addEventListener('touchend', end);
    send('touchStart', [[400, 170]]);
    if (reason === 'cancel') send('touchCancel', []);
    else unmount();
    expect(end).toHaveBeenCalledTimes(1);
  });
  it('seleciona por toque prolongado partindo de Pan e move apenas o objeto', () => {
    vi.useFakeTimers();
    const {send, result, target, canvas, onToolModeChange, objectMovingChanges, onObjectMove} = setup();
    send('touchStart', [[400, 170]]);
    expect(canvas.getActiveObject()).toBeUndefined();
    act(() => {vi.advanceTimersByTime(500);});
    expect(canvas.getActiveObject()).toBe(target);
    expect(onToolModeChange).not.toHaveBeenCalled();
    expect(objectMovingChanges).not.toHaveBeenCalled();
    send('touchMove', [[450, 190]]);
    expect(objectMovingChanges).toHaveBeenLastCalledWith(true);
    expect(onObjectMove).toHaveBeenCalledOnce();
    expect(canvas.fire).not.toHaveBeenCalledWith('object:modified', expect.anything());
    send('touchEnd', []);
    expect(objectMovingChanges).toHaveBeenLastCalledWith(false);
    expect(target.left).toBe(250);
    expect(target.top).toBe(220);
    expect(result.current.viewportX).toBe(300);
    expect(result.current.viewportY).toBe(200);
    expect(canvas.fire).toHaveBeenCalledWith('object:modified', {target});
  });
  it('entrega a área vazia em Seleção ao Fabric para seleção múltipla, sem pan', () => {
    const {send, upperCanvasEl, result, canvas} = setup(false, 'select');
    canvas.findTarget.mockReturnValue(undefined);
    const received: string[] = [];
    ['touchstart', 'touchmove', 'touchend'].forEach(type => upperCanvasEl.addEventListener(type, () => received.push(type)));
    send('touchStart', [[400, 170]]);
    send('touchMove', [[450, 190]]);
    send('touchEnd', []);
    expect(received).toEqual(['touchstart', 'touchmove', 'touchend']);
    expect(result.current.viewportX).toBe(300);
    expect(result.current.viewportY).toBe(200);
  });
  it('mantém a seleção por espera para arrastar o item na próxima sequência em Pan', () => {
    vi.useFakeTimers();
    const {send, result, target, canvas} = setup();
    send('touchStart', [[400, 170]]);
    act(() => {vi.advanceTimersByTime(500);});
    send('touchEnd', []);
    expect(canvas.getActiveObject()).toBe(target);
    send('touchStart', [[400, 170]]);
    send('touchMove', [[450, 190]]);
    send('touchEnd', []);
    expect(target.left).toBe(250);
    expect(target.top).toBe(220);
    expect(result.current.viewportX).toBe(300);
    expect(result.current.viewportY).toBe(200);
  });
  it('acrescentar o segundo dedo durante a espera inicia pinça sem selecionar nem mover o objeto', () => {
    vi.useFakeTimers();
    const {send, result, canvas, target, onToolModeChange} = setup();
    send('touchStart', [[350, 170]]);
    act(() => {vi.advanceTimersByTime(300);});
    send('touchStart', [[350, 170], [450, 170]]);
    act(() => {vi.advanceTimersByTime(500);});
    send('touchMove', [[300, 170], [500, 170]]);
    send('touchEnd', []);
    expect(canvas.getActiveObject()).toBeUndefined();
    expect(onToolModeChange).not.toHaveBeenCalled();
    expect(target.left).toBe(200);
    expect(result.current.zoom).toBeCloseTo(2);
  });
  it('um movimento antes da espera cancela seleção e faz pan sem alterar o objeto', () => {
    vi.useFakeTimers();
    const {send, result, target, onToolModeChange} = setup();
    send('touchStart', [[400, 170]]);
    send('touchMove', [[350, 150]]);
    act(() => {vi.advanceTimersByTime(700);});
    send('touchEnd', []);
    expect(onToolModeChange).not.toHaveBeenCalled();
    expect(result.current.viewportX).toBe(350);
    expect(result.current.viewportY).toBe(220);
    expect(target.left).toBe(200);
  });
  it('pinça usa a proporção das distâncias mesmo com eventos na mesma renderização', () => {
    const {send, result} = setup();
    send('touchStart', [[350, 170], [450, 170]]);
    act(() => {
      send('touchMove', [[325, 170], [475, 170]]);
      send('touchMove', [[300, 170], [500, 170]]);
    });
    expect(result.current.zoom).toBeCloseTo(2);
    expect(result.current.viewportX).toBeCloseTo(1000);
    expect(result.current.viewportY).toBeCloseTo(570);
    send('touchEnd', [[300, 170]]);
    send('touchMove', [[250, 120]]);
    expect(result.current.viewportX).toBeCloseTo(1000);
    send('touchEnd', []);
  });
  it.each(['touchCancel', 'pinch', 'unmount'])('encerra feedback do arrasto manual em %s', (end) => {
    vi.useFakeTimers();
    const {send, unmount, objectMovingChanges} = setup();
    send('touchStart', [[400, 170]]);
    act(() => {vi.advanceTimersByTime(500);});
    send('touchMove', [[450, 190]]);
    expect(objectMovingChanges).toHaveBeenLastCalledWith(true);
    if (end === 'touchCancel') send('touchCancel', []);
    else if (end === 'pinch') send('touchStart', [[450, 190], [550, 190]]);
    else unmount();
    expect(objectMovingChanges).toHaveBeenLastCalledWith(false);
  });
  it('consulta permite seleção, pinça e pan sem mover nem salvar objetos', () => {
    vi.useFakeTimers();
    const {send, target, canvas, objectMovingChanges} = setup(true);
    send('touchStart', [[400, 170]]);
    act(() => {vi.advanceTimersByTime(500);});
    expect(canvas.getActiveObject()).toBe(target);
    send('touchMove', [[450, 190]]);
    send('touchEnd', []);
    expect(target.left).toBe(200);
    expect(canvas.fire).not.toHaveBeenCalled();
    expect(objectMovingChanges).not.toHaveBeenCalled();
  });
  it('cancelamento e desmontagem cancelam a seleção agendada', () => {
    vi.useFakeTimers();
    const {send, unmount, onToolModeChange} = setup();
    send('touchStart', [[400, 170]]);
    send('touchCancel', []);
    act(() => {vi.advanceTimersByTime(500);});
    send('touchStart', [[400, 170]]);
    unmount();
    act(() => {vi.advanceTimersByTime(500);});
    expect(onToolModeChange).not.toHaveBeenCalled();
  });
});
