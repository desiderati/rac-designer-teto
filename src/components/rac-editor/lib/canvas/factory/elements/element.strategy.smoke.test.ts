import {describe, expect, it} from 'vitest';
import * as module from './element.strategy.ts';

describe('element strategy types', () => {
  it('loads module without runtime exports', () => {
    expect(module).toBeDefined();
  });
});
