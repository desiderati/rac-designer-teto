import {describe, expect, it} from 'vitest';
import {stairsStrategy} from './stairs.strategy.ts';

describe('stairs.strategy.ts', () => {
  it('creates a vector group with a body and step path', () => {
    const group = stairsStrategy.create({width: 1000, height: 800, getObjects: () => []} as never);
    const children = group.getObjects();

    expect(typeof stairsStrategy.create).toBe('function');
    expect(group.myType).toBe('stairs');
    expect(children.some((child) => child.type === 'rect' && child.myType === 'stairsBody')).toBe(true);
    expect(children.some((child) => child.type === 'path' && child.myType === 'stairsSteps')).toBe(true);
  });
});
