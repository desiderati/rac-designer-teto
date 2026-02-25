import {describe, expect, it} from 'vitest';
import {createElementId, createHouseId, createViewInstanceId} from './house-identity-use-cases.ts';

describe('house-identity use cases', () => {
  it('creates deterministic house and view ids with injected clock', () => {
    expect(createHouseId(() => 123)).toBe('house_123');
    expect(createViewInstanceId('front', () => 456)).toBe('front_456');
  });

  it('creates deterministic element id with injected clock and random', () => {
    const id = createElementId(
      () => 123,
      () => 0.123456789,
    );
    expect(id.startsWith('element_123_')).toBe(true);
  });
});
