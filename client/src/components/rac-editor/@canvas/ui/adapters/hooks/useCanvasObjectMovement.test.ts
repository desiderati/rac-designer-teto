import {act, renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import type {Canvas} from 'fabric';
import {useCanvasObjectMovement} from './useCanvasObjectMovement.ts';

function setup() {
  const listeners = new Map<string, Set<() => void>>();
  const canvas = {
    on: (event: string, listener: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    off: (event: string, listener: () => void) => listeners.get(event)?.delete(listener),
  };
  const fabricCanvasRef = {current: canvas as unknown as Canvas};
  const hook = renderHook(({enabled, houseId}) => useCanvasObjectMovement({fabricCanvasRef, enabled, houseId}),
    {initialProps: {enabled: true, houseId: 'house-a'}});
  const fire = (event: string) => act(() => listeners.get(event)?.forEach(listener => listener()));
  return {...hook, fire, listeners};
}

describe('movimento temporário de objetos do Canvas', () => {
  it.each(['mouse:up', 'object:modified', 'selection:cleared'])('começa somente ao mover e termina em %s', (end) => {
    const {result, fire} = setup();
    fire('selection:created');
    expect(result.current.isObjectMoving).toBe(false);
    fire('object:moving'); // O mesmo evento representa um objeto ou ActiveSelection.
    expect(result.current.isObjectMoving).toBe(true);
    fire(end);
    expect(result.current.isObjectMoving).toBe(false);
  });

  it.each(['touchend', 'touchcancel', 'pointerup', 'pointercancel'])('encerra fora do Canvas em %s', (end) => {
    const {result, fire} = setup();
    fire('object:moving');
    act(() => {document.dispatchEvent(new Event(end));});
    expect(result.current.isObjectMoving).toBe(false);
  });

  it('integra o movimento manual e limpa na troca de casa e ao desabilitar', () => {
    const {result, rerender, fire} = setup();
    act(() => result.current.onObjectMovingChange(true));
    expect(result.current.isObjectMoving).toBe(true);
    rerender({enabled: true, houseId: 'house-b'});
    expect(result.current.isObjectMoving).toBe(false);
    fire('object:moving');
    rerender({enabled: false, houseId: 'house-b'});
    expect(result.current.isObjectMoving).toBe(false);
    act(() => result.current.onObjectMovingChange(true));
    expect(result.current.isObjectMoving).toBe(false);
  });

  it('encerra ao perder foco e remove listeners na desmontagem', () => {
    const {result, fire, unmount, listeners} = setup();
    fire('object:moving');
    act(() => {window.dispatchEvent(new Event('blur'));});
    expect(result.current.isObjectMoving).toBe(false);
    unmount();
    expect([...listeners.values()].every(group => group.size === 0)).toBe(true);
  });
});
