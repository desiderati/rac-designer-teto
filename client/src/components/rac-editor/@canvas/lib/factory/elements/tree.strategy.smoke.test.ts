import {describe, expect, it} from 'vitest';
import {treeStrategy} from './tree.strategy.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';

describe('tree.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof treeStrategy.create).toBe('function');
  });

  it('desenha copa, folhagem e galhos vetoriais', () => {
    const tree = treeStrategy.create({width: 800, height: 600} as any);
    const children = tree.getObjects();
    expect(children.some((child) => child.myType === 'treeBody' && child.type === 'path')).toBe(true);
    expect(children.filter((child) => child.myType === 'treeFoliage').length).toBeGreaterThan(5);
    expect(children.filter((child) => child.myType === 'treeBranch').length).toBeGreaterThan(3);
    const document = createFabricCanvasDocumentPort({getObjects: () => [tree]} as any).exportCanvasDocument();
    expect(document?.objects[0]?.children?.some((child) => child.shape === 'path')).toBe(true);
  }, 15000);
});

