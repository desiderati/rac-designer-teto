import {describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {createElement, type ReactNode} from 'react';
import {createEditorPorts, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {useRacEditorSettingsActions} from '@/components/rac-editor/hooks/useRacEditorSettingsActions.ts';

function createWrapper(ports: EditorPorts) {
  return function wrapper({children}: { children: ReactNode }) {
    return createElement(RacEditorStoreProvider, {ports, children});
  };
}

describe('useRacEditorSettingsActions.ts', () => {
  it('usa o settings port injetado para aplicar efeitos derivados', () => {
    const defaultPorts = createEditorPorts();
    const refreshAutoStairsForCurrentSettings = vi.fn();
    const refreshPilotiNameLabelsForCurrentSettings = vi.fn();
    const refreshElevationNivelLabelsForCurrentSettings = vi.fn();
    const setShowZoomControls = vi.fn();
    const ports: EditorPorts = {
      ...defaultPorts,
      houseWritePort: {
        ...defaultPorts.houseWritePort,
        refreshAutoStairsForCurrentSettings,
        refreshPilotiNameLabelsForCurrentSettings,
        refreshElevationNivelLabelsForCurrentSettings,
      },
      settingsPort: {
        getSettings: () => ({
          autoNavigatePiloti: true,
          autoAdjustPilotiHeightsFromNivel: true,
          zoomEnabledByDefault: false,
          openEditorsAtFixedPosition: false,
          disableDrawModeAfterFreehand: true,
          showStairsOnTopView: true,
          showPilotiLabelsOnTopView: false,
        }),
        updateSetting: vi.fn(),
      },
    };

    const {result} = renderHook(
      () => useRacEditorSettingsActions({setShowZoomControls}),
      {wrapper: createWrapper(ports)},
    );

    act(() => {
      result.current.handleSettingsChange();
    });

    expect(setShowZoomControls).toHaveBeenCalledWith(false);
    expect(refreshAutoStairsForCurrentSettings).toHaveBeenCalledTimes(1);
    expect(refreshPilotiNameLabelsForCurrentSettings).toHaveBeenCalledTimes(1);
    expect(refreshElevationNivelLabelsForCurrentSettings).toHaveBeenCalledTimes(1);
  });
});
