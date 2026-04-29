import {describe, expect, it, vi} from 'vitest';
import {createFabricCanvasDebugPort} from './fabric-canvas-debug-port.ts';

describe('fabric-canvas-debug-port.ts', () => {
  it('seleciona objeto por myType sem devolver o canvas ao bridge de debug', () => {
    const target = {myType: 'wall'};
    const canvas = {
      getObjects: vi.fn(() => [{myType: 'tree'}, target]),
      discardActiveObject: vi.fn(),
      setActiveObject: vi.fn(),
      fire: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const port = createFabricCanvasDebugPort(canvas as any);

    expect(port.selectObjectByMyType('wall')).toBe(true);
    expect(canvas.setActiveObject).toHaveBeenCalledWith(target);
    expect(canvas.fire).toHaveBeenCalledWith('selection:created', {
      target,
      selected: [target],
    });
  });

  it('resume o objeto ativo usando apenas dados serializáveis', () => {
    const canvas = {
      getActiveObject: vi.fn(() => ({
        type: 'group',
        myType: 'wall',
        getObjects: () => [
          {myType: 'wallLabel', text: 'Parede'},
          {myType: 'wallBody', stroke: '#111111'},
        ],
      })),
    };

    const port = createFabricCanvasDebugPort(canvas as any);

    expect(port.getActiveObjectSummary()).toEqual({
      type: 'group',
      myType: 'wall',
      labelText: 'Parede',
      color: '#111111',
    });
  });

  it('remove objeto via operação limitada de debug', () => {
    const object = {myType: 'tree'};
    const canvas = {
      remove: vi.fn(),
      discardActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
    };

    const port = createFabricCanvasDebugPort(canvas as any);

    expect(port.removeObject(object as any)).toBe(true);
    expect(canvas.remove).toHaveBeenCalledWith(object);
    expect(canvas.requestRenderAll).toHaveBeenCalled();
  });
});
