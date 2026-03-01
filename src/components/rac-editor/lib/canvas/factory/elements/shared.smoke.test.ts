import {describe, expect, it} from 'vitest';
import {setCanvasObjectMyType, withScalingGuard} from './shared.ts';

describe('element shared helpers', () => {
  it('sets myType on objects', () => {
    const obj: { myType?: string } = {};
    setCanvasObjectMyType(obj, 'line');
    expect(obj.myType).toBe('line');
  });

  it('guards scaling callbacks against reentrancy', () => {
    let handler: ((this: any) => void) | null = null;
    const group: any = {
      on: (_event: string, cb: () => void) => {
        handler = cb;
      },
    };

    let calls = 0;
    withScalingGuard(group, function () {
      calls += 1;
    });

    handler?.call(group);
    expect(calls).toBe(1);
    expect(group.__normalizingScale).toBe(false);
  });
});
