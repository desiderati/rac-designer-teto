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

  it('insere a URL da ilustração gerada no Canvas', async () => {
    const insertImageSnapshot = vi.fn().mockResolvedValue(true);
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'toDataURL', {
      value: vi.fn(() => 'data:image/png;base64,3d-screenshot'),
    });
    const canvasRef = {
      current: {
        createSnapshotPort: () => ({insertImageSnapshot}),
      },
    };
    const houseIllustrationPort = {
      generateFromDataUrl: vi.fn().mockResolvedValue(
        'https://example.test/manus-storage/generated/house.png',
      ),
      resolveDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,illustrated-house'),
    };
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange: vi.fn(),
      canvasRef,
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: null,
      houseIllustrationPort,
    }));

    act(() => {
      result.current.handleCanvasCreated(canvas);
    });
    await act(async () => {
      await result.current.handleInsertOnCanvas();
    });

    expect(houseIllustrationPort.generateFromDataUrl).toHaveBeenCalledWith('data:image/png;base64,3d-screenshot');
    expect(houseIllustrationPort.resolveDataUrl).toHaveBeenCalledWith('https://example.test/manus-storage/generated/house.png');
    expect(insertImageSnapshot).toHaveBeenCalledWith('data:image/png;base64,illustrated-house');
  });
});
