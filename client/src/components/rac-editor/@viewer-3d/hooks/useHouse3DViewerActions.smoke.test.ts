import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {HOUSE_3D_WALL_COLOR_BY_NAME} from '@/shared/config.ts';
import {useHouse3DViewerActions} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerActions.ts';
import {
  getHouse3DViewerPreferencesStorageKey,
  readHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';

describe('useHouse3DViewerActions.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persiste cor e visibilidade abaixo do terreno ao fechar o viewer', () => {
    const onOpenChange = vi.fn();
    const preferencesStorageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange,
      canvasRef: {current: null},
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: preferencesStorageKey,
    }));

    act(() => {
      result.current.setWallColor(HOUSE_3D_WALL_COLOR_BY_NAME.Rosa);
      result.current.setHideBelowTerrain(true);
    });

    act(() => {
      result.current.handleClose();
    });

    expect(readHouse3DViewerPreferences(preferencesStorageKey)).toEqual({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa,
      hideBelowTerrain: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
