import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getSettings, updateSetting} from '@/components/rac-editor/store/editor-settings.ts';

describe('editor-settings.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns defaults when storage is empty', () => {
    expect(getSettings()).toEqual({
      autoNavigatePiloti: false,
      autoAdjustPilotiHeightsFromNivel: true,
      zoomEnabledByDefault: false,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
    });
  });

  it('persists setting updates without dropping defaults', () => {
    updateSetting('autoNavigatePiloti', true);
    expect(getSettings()).toEqual({
      autoNavigatePiloti: true,
      autoAdjustPilotiHeightsFromNivel: true,
      zoomEnabledByDefault: false,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
    });
  });

  it('does not throw when storage write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => updateSetting('autoNavigatePiloti', true)).not.toThrow();
    expect(getSettings()).toEqual({
      autoNavigatePiloti: false,
      autoAdjustPilotiHeightsFromNivel: true,
      zoomEnabledByDefault: false,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
    });
  });
});
