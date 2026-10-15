import {describe, expect, it} from 'vitest';
import {waterStrategy} from './water.strategy.ts';

describe('water.strategy.ts', () => {
  it('creates a vector wave path instead of a raster Pattern', () => {
    const group = waterStrategy.create({width: 1000, height: 800} as never);
    const children = group.getObjects();

    expect(typeof waterStrategy.create).toBe('function');
    expect(children.some((child) => child.type === 'path' && child.myType === 'waterWaves')).toBe(true);
    expect(children.some((child) => child.fill && typeof child.fill === 'object')).toBe(false);
  });
});
