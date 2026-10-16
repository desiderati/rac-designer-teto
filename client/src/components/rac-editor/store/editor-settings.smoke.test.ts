import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {STORAGE_KEYS} from '@/shared/config.ts';
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
      openEditorsAtFixedPosition: true,
      disableDrawModeAfterFreehand: true,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
      showToolMenuLabels: true,
    });
  });

  it('persists setting updates without dropping defaults', () => {
    updateSetting('autoNavigatePiloti', true);
    expect(getSettings()).toEqual({
      autoNavigatePiloti: true,
      autoAdjustPilotiHeightsFromNivel: true,
      zoomEnabledByDefault: false,
      openEditorsAtFixedPosition: true,
      disableDrawModeAfterFreehand: true,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
      showToolMenuLabels: true,
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
      openEditorsAtFixedPosition: true,
      disableDrawModeAfterFreehand: true,
      configureCornerPilotiNiveisOnHouseInsert: true,
      allowPilotiHeightDefinitionOnHouseInsert: false,
      showStairsOnTopView: false,
      showPilotiLabelsOnTopView: true,
      showToolMenuLabels: true,
    });
  });
  it('habilita rótulos de ferramentas ao ler preferências anteriores sem essa opção', () => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({showPilotiLabelsOnTopView: false}));
    expect(getSettings().showToolMenuLabels).toBe(true);
    expect(getSettings().showPilotiLabelsOnTopView).toBe(false);
  });

  it('persiste a preferência explícita de rótulos entre leituras e permite desligar', () => {
    updateSetting('showToolMenuLabels', true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!)).toMatchObject({showToolMenuLabels: true});
    expect(getSettings().showToolMenuLabels).toBe(true);
    updateSetting('showToolMenuLabels', false);
    expect(getSettings().showToolMenuLabels).toBe(false);
  });

});
