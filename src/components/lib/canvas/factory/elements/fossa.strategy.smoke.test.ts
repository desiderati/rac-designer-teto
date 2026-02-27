import {describe, expect, it} from 'vitest';
import {fossaStrategy} from './fossa.strategy.ts';

describe('fossaStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof fossaStrategy.create).toBe('function');
  });
});
