import {describe, expect, it} from 'vitest';
import {canvasObjectProps, toCanvasChildrenObjects, toCanvasObject} from './canvas.ts';
import {Group} from 'fabric';

describe('canvas helpers', () => {
  it('handles null canvas object', () => {
    expect(toCanvasObject(null)).toBeNull();
  });

  it('returns children as canvas objects', () => {
    const group = {
      getObjects: () => [null, {myType: 'child'}],
    } as unknown as Group;
    const children = toCanvasChildrenObjects(group);
    expect(children).toHaveLength(1);
    expect(children[0]?.myType).toBe('child');
  });

  it('exposes custom canvas object props', () => {
    expect(canvasObjectProps).toContain('myType');
    expect(canvasObjectProps).toContain('contraventamentoId');
  });
});
