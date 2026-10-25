import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {ActiveSelection, Circle, Group, Rect, type Canvas, type FabricObject} from 'fabric';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {useMobileCanvasSelection} from './useMobileCanvasSelection.ts';
import {createFabricCanvasDocumentPort} from '../fabric-canvas-document-port.ts';

function setup(locked = false) {
  const first = new Rect({width: 100, height: 100, lockScalingX: locked, lockScalingY: locked, lockRotation: locked});
  const second = new Rect({width: 150, height: 80});
  // Exemplo de componente com resize só pelos cantos.
  first.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  let active: FabricObject | undefined = first;
  let activeObjects: FabricObject[] = [first];
  const listeners = new Map<string, (event: {target?: FabricObject}) => void>();
  const canvas = {
    getActiveObject: () => active,
    getActiveObjects: () => activeObjects,
    getObjects: () => [first, second],
    on: (name: string, listener: (event: {target?: FabricObject}) => void) => listeners.set(name, listener),
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
    listeners.get(target ? 'selection:updated' : 'selection:cleared')?.({});
  });
  return {...hook, first, second, select, port, before, original, listeners};
}

describe('seleção mobile com modo mover e transformar', () => {
  it('oferece editor somente para um objeto suportado e limpa ao sair do modo mobile', () => {
    const {result, select, rerender, first} = setup();
    const fence = new Group([new Rect({width: 20, height: 20})]) as CanvasGroup;
    fence.myType = 'fence';
    select(fence);
    expect(result.current.selectedEditableObject).toBe(fence);
    select(fence, 2);
    expect(result.current.selectedEditableObject).toBeNull();
    select(first);
    expect(result.current.selectedEditableObject).toBeNull();
    select(fence);
    rerender({enabled: false, houseId: 'a'});
    expect(result.current.selectedEditableObject).toBeNull();
  });
  it('começa em mover, destaca alças de transformação e não grava aparência no documento', () => {
    const {result, first, port, before, original, unmount} = setup();
    expect(result.current.count).toBe(1);
    expect(result.current.transforming).toBe(false);
    expect(first.controls).toEqual({});
    expect(result.current.canTransform).toBe(true);
    act(() => result.current.toggleTransforming());
    expect(first.controls.br).toBe(original.controls.br);
    expect(first.controls.mtr).toBeDefined();
    expect(first.controls.mtr).not.toBe(original.controls.mtr);
    expect(first.controls.mtr.actionHandler).toBe(original.controls.mtr.actionHandler);
    expect(first.controls.mtr.touchSizeX * 0.5).toBe(44);
    expect(first.controls.mtr.offsetY * 0.5).toBe(-40);
    expect(first.isControlVisible('mt')).toBeFalsy();
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
    act(() => result.current.toggleTransforming());
    select(second);
    expect(result.current.transforming).toBe(false);
    expect(first.controls).toBe(original.controls);
    expect(second.controls).toEqual({});
    rerender({enabled: false, houseId: 'a'});
    expect(result.current.count).toBe(0);
    expect(second.controls.br).toBeDefined();
    expect(listeners.size).toBe(0);
  });

  it('preserva bloqueios de escala e limpa a barra ao remover a seleção', () => {
    const {result, first, select} = setup(true);
    expect(result.current.canTransform).toBe(false);
    expect(first.lockScalingX).toBe(true);
    expect(first.lockScalingY).toBe(true);
    select();
    expect(result.current.count).toBe(0);
    expect(result.current.transforming).toBe(false);
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

  it('permite somente girar quando os dois eixos de escala estão bloqueados', () => {
    const {first, second, result, select} = setup();
    first.set({lockScalingX: true, lockScalingY: true});
    select(second);
    select(first);
    expect(result.current.canTransform).toBe(true);
    act(() => result.current.toggleTransforming());
    expect(Object.keys(first.controls)).toEqual(['mtr']);
  });

  it('preserva rotação bloqueada ou oculta e hasControls sem liberar ações', () => {
    const {first, second, result, select} = setup();
    first.set({lockRotation: true});
    select(second); select(first);
    act(() => result.current.toggleTransforming());
    expect(first.controls.mtr).toBeUndefined();
    expect(first.controls.br).toBeDefined();
    select(second);
    first.set({lockRotation: false, lockScalingX: true, lockScalingY: true});
    first.setControlsVisibility({mtr: false});
    select(first);
    expect(result.current.canTransform).toBe(false);
    select(second);
    first.setControlsVisibility({mtr: true});
    first.set({hasControls: false});
    select(first);
    expect(result.current.canTransform).toBe(false);
  });

  it('mostra o ângulo normalizado somente durante rotação e acompanha o snap final', () => {
    const {first, second, result, select, listeners} = setup();
    const rotate = (angle: number) => act(() => {
      first.angle = angle;
      listeners.get('object:rotating')?.({target: first});
    });
    rotate(30);
    expect(result.current.rotationAngle).toBeNull();
    act(() => result.current.toggleTransforming());
    rotate(-45);
    expect(result.current.rotationAngle).toBe(315);
    act(() => {first.angle = 270; listeners.get('after:render')?.({});});
    expect(result.current.rotationAngle).toBe(270);
    act(() => listeners.get('mouse:up')?.({}));
    expect(result.current.rotationAngle).toBeNull();
    rotate(359.8);
    expect(result.current.rotationAngle).toBe(0);
    act(() => result.current.toggleTransforming());
    expect(result.current.rotationAngle).toBeNull();
    act(() => result.current.toggleTransforming());
    rotate(40);
    select(second);
    expect(result.current.rotationAngle).toBeNull();
  });

  it('bloqueia a rotação coletiva mesmo com todos os membros livres e mantém a escala', () => {
    const {first, second, result, select, port, before, unmount} = setup();
    const selection = new ActiveSelection([first, second]);
    select(selection);
    act(() => result.current.toggleTransforming());
    expect(selection.lockRotation).toBe(true);
    expect(selection.controls.mtr).toBeUndefined();
    expect(selection.controls.br).toBeDefined();
    expect(result.current.canTransform).toBe(true);
    expect(first.lockRotation).toBe(false);
    expect(second.lockRotation).toBe(false);
    expect(port.exportCanvasDocument()).toEqual(before);
    select(first);
    act(() => result.current.toggleTransforming());
    expect(first.controls.mtr).toBeDefined();
    unmount();
    expect(first.lockRotation).toBe(false);
    expect(second.lockRotation).toBe(false);
  });

  it('bloqueia a rotação da seleção sem alterar membros e restaura o estado original ao sair', () => {
    const {first, second, result, select, unmount} = setup();
    first.set({lockRotation: true});
    const selection = new ActiveSelection([first, second]);
    const originalControls = selection.controls;
    select(selection);
    act(() => result.current.toggleTransforming());
    expect(selection.lockRotation).toBe(true);
    expect(selection.controls.mtr).toBeUndefined();
    expect(selection.controls.br).toBeDefined();
    expect(first.lockRotation).toBe(true);
    expect(second.lockRotation).toBe(false);
    selection.remove(first);
    select(selection);
    expect(selection.lockRotation).toBe(true);
    expect(selection.controls.mtr).toBeUndefined();
    unmount();
    expect(selection.lockRotation).toBe(false);
    expect(selection.controls).toBe(originalControls);
    expect(first.lockRotation).toBe(true);
  });

  it('não libera em grupo a rotação ocultada pela política de um componente', () => {
    const {first, second, result, select} = setup();
    first.setControlsVisibility({mtr: false});
    const selection = new ActiveSelection([first, second]);
    select(selection);
    act(() => result.current.toggleTransforming());
    expect(selection.controls.mtr).toBeUndefined();
    expect(selection.controls.br).toBeDefined();
    expect(first.lockRotation).toBe(false);
  });

  it('não transforma coletivamente um membro que desabilitou todos os controles', () => {
    const {first, second, result, select} = setup();
    first.set({hasControls: false});
    select(new ActiveSelection([first, second]));
    expect(result.current.canTransform).toBe(false);
    expect(first.hasControls).toBe(false);
  });

  it('respeita o eixo bloqueado de um membro sem alterar suas flags e restaura a seleção', () => {
    const {result, first, second, select, unmount} = setup();
    first.set({lockScalingY: true});
    const selection = new ActiveSelection([first, second]);
    const originalControls = selection.controls;
    select(selection);
    expect(result.current.count).toBe(2);
    expect(result.current.canTransform).toBe(true);
    expect(selection.lockScalingX).toBe(false);
    expect(selection.lockScalingY).toBe(true);
    act(() => result.current.toggleTransforming());
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
    expect(result.current.canTransform).toBe(false);
    act(() => result.current.toggleTransforming());
    expect(Object.keys(selection.controls)).toEqual([]);
    selection.remove(second);
    select(selection);
    expect(selection.lockScalingX).toBe(false);
    expect(selection.lockScalingY).toBe(true);
    expect(selection.getObjects()).toEqual([first]);
    expect(result.current.canTransform).toBe(true);
    expect(Object.keys(selection.controls).sort()).toEqual(['ml', 'mr']);
  });
});
