import {describe, expect, it} from 'vitest';
import {canvasObjectProps, ensureCanvasObjectId, toCanvasObject} from './canvas.ts';

describe('canvas.ts', () => {
  it('handles null canvas object', () => {
    expect(toCanvasObject(null)).toBeNull();
  });

  it('exposes custom canvas object props', () => {
    expect(canvasObjectProps).toContain('myType');
    expect(canvasObjectProps).toContain('editorObjectId');
    expect(canvasObjectProps).toContain('contraventamentoId');
  });

  it('keeps an existing editor object id stable', () => {
    const object = {editorObjectId: 'element_existing'} as any;

    expect(ensureCanvasObjectId(object, () => 'element_new')).toBe('element_existing');
    expect(object.editorObjectId).toBe('element_existing');
  });

  it('assigns an editor object id when missing', () => {
    const object = {} as any;

    expect(ensureCanvasObjectId(object, () => 'element_created')).toBe('element_created');
    expect(object.editorObjectId).toBe('element_created');
  });
});

