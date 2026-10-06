import {describe, expect, it, vi} from 'vitest';
import {getGenericObjectEditorStrategy} from '../../generic-object-editor-strategy.ts';
import {circleStrategy, squareStrategy, triangleStrategy} from './geometry.strategy.ts';
import {readWallObjectState} from '../../generic-object-state.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';

describe('objetos geométricos', () => {
  it.each([
    ['square', squareStrategy, 'rect'],
    ['triangle', triangleStrategy, 'triangle'],
    ['circle', circleStrategy, 'circle'],
  ] as const)('%s preserva nome e cor no editor genérico', (kind, strategy, shape) => {
    const group = strategy.create({width: 800, height: 600} as any);
    expect(group.myType).toBe(kind);
    expect(group.getObjects().find((child) => child.myType === 'wallBody')?.type).toBe(shape);
    expect(readWallObjectState(group).currentColor).toBeTruthy();
    const document = createFabricCanvasDocumentPort({getObjects: () => [group]} as any).exportCanvasDocument();
    expect(document?.objects[0]).toMatchObject({kind, shape: 'group'});
    expect(document?.objects[0]?.children?.[0]).toMatchObject({shape, kind: 'wallBody'});
  });

  it.each([
    ['square', squareStrategy], ['circle', circleStrategy], ['triangle', triangleStrategy],
  ] as const)('mantém texto curto e de 50 caracteres dentro de %s, mesmo após editar uma posição antiga', (kind, strategy) => {
    const group = strategy.create({width: 800, height: 600} as any);
    const body = group.getObjects().find((child) => child.myType === 'wallBody')!;
    const label = group.getObjects().find((child) => child.myType === 'wallLabel')!;
    label.set({top: 200});
    for (const text of ['Texto', 'a'.repeat(50)]) {
      getGenericObjectEditorStrategy(kind).apply({canvas: {requestRenderAll: vi.fn()} as any, object: group, color: '#123456', label: text});
      const offsetY = label.top - body.top;
      expect(label.left).toBeCloseTo(body.left);
      expect(offsetY).toBeCloseTo(kind === 'triangle' ? body.getScaledHeight() * 0.22 : 0);
      expect(Math.abs(offsetY) + label.getScaledHeight() / 2).toBeLessThan(body.getScaledHeight() / 2);
      const availableWidth = kind === 'triangle'
        ? body.width * (0.5 + (offsetY - label.getScaledHeight() / 2) / body.height)
        : body.width;
      expect(label.getScaledWidth()).toBeLessThan(availableWidth);
      expect(label.visible).toBe(true);
    }
  });
});
