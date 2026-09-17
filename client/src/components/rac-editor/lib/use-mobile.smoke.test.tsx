import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useIsMobile} from './use-mobile.tsx';
import {VIEWPORT} from '@/shared/config.ts';

describe('use-mobile.tsx', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as any;
  });

  it('returns true when viewport is below breakpoint', async () => {
    window.innerWidth = VIEWPORT.mobileBreakpoint - 1;
    const {result} = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});

