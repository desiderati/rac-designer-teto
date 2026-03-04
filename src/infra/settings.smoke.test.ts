import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getSettings, updateSetting} from '@/infra/settings.ts';

describe('settings.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns defaults when storage is empty', () => {
    expect(getSettings()).toEqual({
      autoNavigatePiloti: false,
      zoomEnabledByDefault: true,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      showStairsOnTopView: false,
    });
  });

  it('persists setting updates without dropping defaults', () => {
    updateSetting('autoNavigatePiloti', true);
    expect(getSettings()).toEqual({
      autoNavigatePiloti: true,
      zoomEnabledByDefault: true,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      showStairsOnTopView: false,
    });
  });

  it('does not throw when storage write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => updateSetting('autoNavigatePiloti', true)).not.toThrow();
    expect(getSettings()).toEqual({
      autoNavigatePiloti: false,
      zoomEnabledByDefault: true,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      showStairsOnTopView: false,
    });
  });
});

