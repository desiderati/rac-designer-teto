import {Canvas, IText} from 'fabric';
import {describe, expect, it, vi} from 'vitest';
import {bindEmptyFreeTextCleanup, removeEmptyFreeTextObject} from './free-text-cleanup.ts';
import type {CanvasObject} from './canvas.ts';

function createTextObject(text: string, myType = 'text'): CanvasObject {
  return {
    type: 'i-text',
    myType,
    text,
  } as CanvasObject;
}

function createCanvas(activeObject: CanvasObject | null) {
  return {
    remove: vi.fn(),
    discardActiveObject: vi.fn(),
    requestRenderAll: vi.fn(),
    getActiveObject: vi.fn(() => activeObject),
  };
}

describe('free-text-cleanup.ts', () => {
  it('remove texto livre vazio ao encerrar a edição', () => {
    const text = createTextObject('   ');
    const canvas = createCanvas(text);

    const removed = removeEmptyFreeTextObject(canvas as never, text);

    expect(removed).toBe(true);
    expect(canvas.discardActiveObject).toHaveBeenCalledOnce();
    expect(canvas.remove).toHaveBeenCalledWith(text);
    expect(canvas.requestRenderAll).toHaveBeenCalledOnce();
  });

  it('mantém texto livre com conteúdo', () => {
    const text = createTextObject('Observação');
    const canvas = createCanvas(text);

    expect(removeEmptyFreeTextObject(canvas as never, text)).toBe(false);
    expect(canvas.remove).not.toHaveBeenCalled();
  });

  it('não remove rótulos internos vazios', () => {
    const label = createTextObject('', 'objLabel');
    const canvas = createCanvas(label);

    expect(removeEmptyFreeTextObject(canvas as never, label)).toBe(false);
    expect(canvas.remove).not.toHaveBeenCalled();
  });

  it('agenda a limpeza após o evento de saída de edição de texto', async () => {
    const text = createTextObject('');
    const handlers = new Map<string, (event: unknown) => void>();
    const canvas = {
      ...createCanvas(text),
      on: vi.fn((eventName: string, handler: (event: unknown) => void) => {
        handlers.set(eventName, handler);
      }),
      off: vi.fn((eventName: string, handler: (event: unknown) => void) => {
        if (handlers.get(eventName) === handler) handlers.delete(eventName);
      }),
    };

    const unbind = bindEmptyFreeTextCleanup(canvas as never);

    handlers.get('text:editing:exited')?.({target: text});
    expect(canvas.remove).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(canvas.remove).toHaveBeenCalledWith(text);

    unbind();
    expect(canvas.off).toHaveBeenCalledWith('text:editing:exited', expect.any(Function));
    expect(handlers.has('text:editing:exited')).toBe(false);
  });

  it('permite que o Fabric conclua a saída de IText vazio antes de removê-lo', async () => {
    const element = document.createElement('canvas');
    const canvas = new Canvas(element, {width: 240, height: 160, renderOnAddRemove: false});
    const text = new IText('rascunho', {left: 16, top: 16});
    Object.assign(text, {myType: 'text'});
    canvas.add(text);
    const unbind = bindEmptyFreeTextCleanup(canvas);

    try {
      text.enterEditing();
      text.set('text', '');

      expect(() => text.exitEditing()).not.toThrow();
      expect(canvas.getObjects()).toContain(text);

      await Promise.resolve();

      expect(canvas.getObjects()).not.toContain(text);
    } finally {
      unbind();
      await canvas.dispose();
    }
  });
});
