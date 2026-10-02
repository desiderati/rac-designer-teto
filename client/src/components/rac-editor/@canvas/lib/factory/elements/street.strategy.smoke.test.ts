import {describe, expect, it} from 'vitest';
import type {CanvasObject} from '../../canvas.ts';
import {
  streetCornerStrategy,
  dirtRoadStrategy,
  streetStraightStrategy,
} from './street.strategy.ts';
import {createFabricCanvasDocumentPort} from '@/components/rac-editor/@canvas/ui/adapters/fabric-canvas-document-port.ts';

const fakeCanvas = {width: 800, height: 600};

describe('street.strategy.ts', () => {
  it('exposes create functions for street variants', () => {
    expect(typeof streetStraightStrategy.create).toBe('function');
    expect(typeof streetCornerStrategy.create).toBe('function');
    expect(typeof dirtRoadStrategy.create).toBe('function');
  });

  it('cria estrada de chão distinguível da rua asfaltada', () => {
    const road = dirtRoadStrategy.create(fakeCanvas as any);
    expect(road.streetVariant).toBe('dirt');
    expect(road.getObjects().some((child) => child.myType === 'streetTexture')).toBe(true);
    expect(road.getObjects().some((child) => child.myType === 'streetMarking')).toBe(false);
    const document = createFabricCanvasDocumentPort({getObjects: () => [road]} as any).exportCanvasDocument();
    expect(document?.objects[0]?.metadata?.streetVariant).toBe('dirt');
  });

  it('creates a straight street with road borders and dashed center marking', () => {
    const street = streetStraightStrategy.create(fakeCanvas as any);
    const children = street.getObjects() as CanvasObject[];
    const body = children.find((child) => child.myType === 'streetBody');
    const border = children.find((child) => child.myType === 'streetBorder');
    const marking = children.find((child) => child.myType === 'streetMarking');

    expect(street.myType).toBe('street');
    expect(street.streetVariant).toBe('straight');
    expect(children.filter((child) => child.myType === 'streetBody')).toHaveLength(1);
    expect(children.filter((child) => child.myType === 'streetBorder')).toHaveLength(2);
    expect(children.filter((child) => child.myType === 'streetMarking')).toHaveLength(1);
    expect(body?.fill).toBe('#9ca3af');
    expect(border?.stroke).toBe('#6b7280');
    expect(border?.strokeWidth).toBe(1.5);
    expect(marking?.stroke).toBe('#f8fafc');
    expect(marking?.strokeWidth).toBe(4);
  });

  it('creates a corner street without the internal intersection border', () => {
    const street = streetCornerStrategy.create(fakeCanvas as any);
    const children = street.getObjects() as Array<CanvasObject & {
      x1?: number;
      x2?: number;
      y1?: number;
      y2?: number;
    }>;
    const borders = children.filter((child) => child.myType === 'streetBorder');
    const markings = children.filter((child) => child.myType === 'streetMarking');

    expect(street.myType).toBe('street');
    expect(street.streetVariant).toBe('corner');
    expect(children.filter((child) => child.myType === 'streetBody')).toHaveLength(2);
    expect(borders).toHaveLength(4);
    expect(markings).toHaveLength(2);
    expect(markings).toContainEqual(expect.objectContaining({x1: -56, x2: 86, y1: 0, y2: 0}));
    expect(markings).toContainEqual(expect.objectContaining({x1: -74, x2: -74, y1: 24, y2: 174}));
    expect(borders).not.toContainEqual(expect.objectContaining({x1: -110, x2: -38, y1: 36, y2: 36}));
    expect(borders).not.toContainEqual(expect.objectContaining({x1: -38, x2: -38, y1: -36, y2: 36}));
  });
});
