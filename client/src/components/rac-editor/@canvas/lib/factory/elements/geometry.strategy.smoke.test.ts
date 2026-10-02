import {describe, expect, it} from 'vitest';
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

  it('posiciona o rótulo abaixo da base do triângulo', () => {
    const group = triangleStrategy.create({width: 800, height: 600} as any);
    const triangle = group.getObjects().find((child) => child.myType === 'wallBody');
    const label = group.getObjects().find((child) => child.myType === 'wallLabel');
    expect((label?.top ?? 0) - (triangle?.top ?? 0)).toBeGreaterThan((triangle?.height ?? 0) / 2);
  });
});
