import {describe, expect, it} from 'vitest';
import {canvasObjectProps, toCanvasChildrenObjects, toCanvasObject} from './canvas.ts';
import {Group} from 'fabric';

describe('canvas helpers', () => {
  it('handles null canvas object', () => {
    expect(toCanvasObject(null)).toBeNull();
  });

  it('exposes custom canvas object props', () => {
    expect(canvasObjectProps).toContain('myType');
    expect(canvasObjectProps).toContain('contraventamentoId');
  });
});
