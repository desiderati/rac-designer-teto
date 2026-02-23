import {describe, expect, it} from 'vitest';
import {Line, Rect, Triangle} from 'fabric';
import {createArrow, createDistance, createLine} from './elements-factory';

const canvasMock = {
  width: 1200,
  height: 800,
} as never;

describe('elements-factory geometry regression', () => {
  it('creates line with placeholder label and keeps horizontal-only scaling', () => {
    const lineGroup = createLine(canvasMock);
    const children = lineGroup.getObjects() as Array<(Line | Rect | Triangle) & {myType?: string; text?: string}>;
    const line = children.find((child) => child.myType === 'lineBody') as Line | undefined;
    const label = children.find((child) => child.myType === 'lineArrowLabel') as
      ({left?: number; top?: number; text?: string} | undefined);
    const initialGroupWidth = lineGroup.width || 0;
    const initialLabelTop = label?.top;
    const expectedLength = initialGroupWidth * 1.8;

    expect((lineGroup as {myType?: string}).myType).toBe('line');
    expect(label?.text).toBe(' ');

    lineGroup.set({scaleX: 1.8, scaleY: 1.3});
    lineGroup.fire('scaling');

    expect((line?.x2 || 0) - (line?.x1 || 0)).toBeCloseTo(expectedLength, 2);
    expect(line?.y1).toBe(0);
    expect(line?.y2).toBe(0);
    expect(label?.left).toBe(0);
    expect(label?.top).toBe(initialLabelTop);
    expect(lineGroup.width).toBeCloseTo(expectedLength, 2);
    expect(lineGroup.scaleX).toBe(1);
    expect(lineGroup.scaleY).toBe(1);
  }, 30_000);

  it('keeps arrow head size fixed and label anchored while resizing', () => {
    const arrowGroup = createArrow(canvasMock);
    const initialWidth = arrowGroup.width || 0;
    const expectedWidth = initialWidth * 2;
    const children = arrowGroup.getObjects() as Array<(Line | Rect | Triangle) & {myType?: string; text?: string}>;
    const body = children.find((child) => child.myType === 'arrowBody') as Rect | undefined;
    const head = children.find((child) => child.myType === 'arrowHead') as Triangle | undefined;
    const label = children.find((child) => child.myType === 'lineArrowLabel') as
      ({left?: number; top?: number; text?: string} | undefined);
    const initialLabelTop = label?.top;

    expect(label?.text).toBe(' ');

    arrowGroup.set({scaleX: 2, scaleY: 1.6});
    arrowGroup.fire('scaling');

    expect(body?.height).toBe(2);
    expect(head?.width).toBe(15);
    expect(head?.height).toBe(15);
    expect(head?.left).toBeCloseTo(expectedWidth / 2 - 7.5, 5);
    expect(label?.left).toBe(0);
    expect(label?.top).toBe(initialLabelTop);
    expect(arrowGroup.scaleX).toBe(1);
    expect(arrowGroup.scaleY).toBe(1);
  });

  it('keeps dimension ticks aligned to line endpoints while resizing', () => {
    const dimensionGroup = createDistance(canvasMock, {x: 100, y: 100});
    const initialWidth = dimensionGroup.width || 0;
    const expectedWidth = initialWidth * 1.5;
    const children = dimensionGroup.getObjects() as Array<(Line | Rect | Triangle) & {myType?: string; text?: string}>;
    const mainLine = children.find((child) => child.myType === 'dimensionMainLine') as Line | undefined;
    const tickStart = children.find((child) => child.myType === 'dimensionTickStart') as Line | undefined;
    const tickEnd = children.find((child) => child.myType === 'dimensionTickEnd') as Line | undefined;
    const label = children.find((child) => child.myType === 'dimensionLabel') as
      ({left?: number; top?: number; text?: string} | undefined);

    dimensionGroup.set({scaleX: 1.5, scaleY: 1.4});
    dimensionGroup.fire('scaling');

    expect(mainLine?.x1).toBeCloseTo(-expectedWidth / 2, 5);
    expect(mainLine?.x2).toBeCloseTo(expectedWidth / 2, 5);
    expect(mainLine?.y1).toBe(0);
    expect(mainLine?.y2).toBe(0);
    expect(tickStart?.left).toBeCloseTo(-expectedWidth / 2, 5);
    expect(tickEnd?.left).toBeCloseTo(expectedWidth / 2, 5);
    expect(tickStart?.top).toBe(0);
    expect(tickEnd?.top).toBe(0);
    expect(tickStart?.y1).toBe(-5);
    expect(tickStart?.y2).toBe(5);
    expect(tickEnd?.y1).toBe(-5);
    expect(tickEnd?.y2).toBe(5);
    expect(label?.left).toBe(0);
    expect(label?.top).toBe(-20);
    expect(dimensionGroup.scaleX).toBe(1);
    expect(dimensionGroup.scaleY).toBe(1);
  });
});
