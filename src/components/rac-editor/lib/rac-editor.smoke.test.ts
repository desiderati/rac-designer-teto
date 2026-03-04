import {describe, expect, it} from 'vitest';
import * as module from './rac-editor.ts';

describe('rac-editor.ts', () => {
  it('loads module without runtime exports', () => {
    expect(module).toBeDefined();
    expect(Object.keys(module)).toHaveLength(0);
  });
});

