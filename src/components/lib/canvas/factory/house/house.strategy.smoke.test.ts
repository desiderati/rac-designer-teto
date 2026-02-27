import {describe, expect, it} from 'vitest';
import * as module from './house.strategy.ts';

describe('house strategy types', () => {
  it('loads module without runtime exports', () => {
    expect(module).toBeDefined();
  });
});
