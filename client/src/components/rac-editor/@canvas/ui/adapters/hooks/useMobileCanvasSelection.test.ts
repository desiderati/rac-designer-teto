import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {ActiveSelection, Circle, Group, Rect, type Canvas, type FabricObject} from 'fabric';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {useMobileCanvasSelection} from './useMobileCanvasSelection.ts';
import {createFabricCanvasDocumentPort} from '../fabric-canvas-document-port.ts';

function setup(locked = false) {
  const first = new Rect({width: 100, height: 100, lockScalingX: locked, lockScalingY: locked});
  const second = new Rect({width: 150, height: 80});
  // Exemplo de componente com resize só pelos cantos.
  first.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  let active: FabricObject | undefined = first;
  let activeObjects: FabricObject[] = [first];
  const listeners = new Map<string, () => void>();
  const canvas = {
    getActiveObject: () => active,
    getActiveObjects: () => activeObjects,
    getObjects: () => [first, second],
    on: (name: string, listener: () => void) => listeners.set(name, listener),
    off: (name: string) => listeners.delete(name),
    requestRenderAll: vi.fn(),
  } as unknown as Canvas;
  const fabricCanvasRef = {current: canvas};
  const port = createFabricCanvasDocumentPort(canvas);
  const before = port.exportCanvasDocument();
  const original = {controls: first.controls, cornerSize: first.cornerSize, borderColor: first.borderColor};
  const hook = renderHook(({enabled, houseId}) => useMobileCanvasSelection({enabled, houseId, fabricCanvasRef, zoom: 0.5}),
    {initialProps: {enabled: true, houseId: 'a'}});
  const select = (target?: FabricObject, count = target ? 1 : 0) => act(() => {
    active = target;
    activeObjects = target instanceof ActiveSelection ? target.getObjects() : target ? count === 1 ? [target] : [target, second] : [];
    listeners.get(target ? 'selection:updated' : 'selection:cleared')?.();
  });
  return {...hook, first, second, select, port, before, original, listeners};
}

describe('seleção mobile com modo mover e resize', () => {
  it('começa em mover, destaca alças no resize e não grava aparência no documento', () => {
    const {result, first, port, before, original, unmount} = setup();
    expect(result.current.count).toBe(1);
    expect(result.current.resizing).toBe(false);
    expect(first.controls).toEqual({});
    expect(result.current.canResize).toBe(true);
    act(() => result.current.toggleResizing());
    expect(first.controls.br).toBe(original.controls.br);
    expect(first.controls.mtr).toBeUndefined();
    expect(first.isControlVisible('mt')).toBe(false);
    expect(first.cornerSize * 0.5).toBe(16);
    expect(first.touchCornerSize * 0.5).toBe(44);
    expect(port.exportCanvasDocument()).toEqual(before);
    unmount();
    expect(first.controls).toBe(original.controls);
    expect(first.cornerSize).toBe(original.cornerSize);
    expect(first.borderColor).toBe(original.borderColor);
  });

  it('volta a mover ao trocar a seleção e restaura os controles ao sair do landscape', () => {
    const {result, first, second, original, select, rerender, listeners} = setup();
    act(() => result.current.toggleResizing());
    select(second);
    expect(result.current.resizing).toBe(false);
    expect(first.controls).toBe(original.controls);
    expect(second.controls).toEqual({});
    rerender({enabled: false, houseId: 'a'});
    expect(result.current.count).toBe(0);
    expect(second.controls.br).toBeDefined();
    expect(listeners.size).toBe(0);
  });

  it('preserva bloqueios de escala e limpa a barra ao remover a seleção', () => {
    const {result, first, select} = setup(true);
    expect(result.current.canResize).toBe(false);
    expect(first.lockScalingX).toBe(true);
    expect(first.lockScalingY).toBe(true);
    select();
    expect(result.current.count).toBe(0);
    expect(result.current.resizing).toBe(false);
  });

  it('habilita edição só para uma vista planta com pilotis reais', () => {
    const {result, select} = setup();
    const createPiloti = () => {
      const piloti = new Circle({radius: 10}) as CanvasObject;
      piloti.pilotiId = 'piloti_0_0';
      piloti.isPilotiCircle = true;
      return piloti;
    };
    const top = new Group([createPiloti()]) as CanvasGroup;
    top.houseView = 'top';
    const front = new Group([createPiloti()]) as CanvasGroup;
    front.houseView = 'front';

    expect(result.current.selectedTopView).toBeNull();
    select(front);
    expect(result.current.selectedTopView).toBeNull();
    select(top);
    expect(result.current.selectedTopView).toBe(top);
    select(top, 2);
    expect(result.current.selectedTopView).toBeNull();
  });

  it('respeita o eixo bloqueado de um membro sem alterar suas flags e restaura a seleção', () => {
    const {result, first, second, select, unmount} = setup();
    first.set({lockScalingY: true});
    const selection = new ActiveSelection([first, second]);
    const originalControls = selection.controls;
    select(selection);
    expect(result.current.count).toBe(2);
    expect(result.current.canResize).toBe(true);
    expect(selection.lockScalingX).toBe(false);
    expect(selection.lockScalingY).toBe(true);
    act(() => result.current.toggleResizing());
    expect(Object.keys(selection.controls).sort()).toEqual(['ml', 'mr']);
    expect(first.lockScalingY).toBe(true);
    expect(second.lockScalingY).toBe(false);
    unmount();
    expect(selection.lockScalingY).toBe(false);
    expect(selection.controls).toBe(originalControls);
    expect(first.lockScalingY).toBe(true);
  });

  it('atualiza os bloqueios ao mudar membros na mesma seleção', () => {
    const {result, first, second, select} = setup();
    first.set({lockScalingY: true});
    second.set({lockScalingX: true});
    const selection = new ActiveSelection([first, second]);
    select(selection);
    expect(result.current.canResize).toBe(false);
    selection.remove(second);
    select(selection);
    expect(selection.lockScalingX).toBe(false);
    expect(selection.lockScalingY).toBe(true);
    expect(selection.getObjects()).toEqual([first]);
    expect(result.current.canResize).toBe(true);
    act(() => result.current.toggleResizing());
    expect(Object.keys(selection.controls).sort()).toEqual(['ml', 'mr']);
  });
});
