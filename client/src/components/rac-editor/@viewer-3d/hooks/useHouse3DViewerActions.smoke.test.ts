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

  it('insere a ilustração transparente e registra a URL do Storage no Canvas', async () => {
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
        {
          storageUrl: 'https://example.test/manus-storage/generated/house.png',
          dataUrl: 'data:image/png;base64,illustrated-house',
        },
      ),
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
    expect(insertImageSnapshot).toHaveBeenCalledWith(
      'data:image/png;base64,illustrated-house',
      {storageUrl: 'https://example.test/manus-storage/generated/house.png'},
    );
  });

  it('impede fechar o viewer enquanto a ilustração está sendo gerada', async () => {
    let resolveGeneration: ((value: {dataUrl: string; storageUrl: string}) => void) | null = null;
    const pendingGeneration = new Promise<{dataUrl: string; storageUrl: string}>((resolve) => {
      resolveGeneration = resolve;
    });
    const onOpenChange = vi.fn();
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'toDataURL', {
      value: vi.fn(() => 'data:image/png;base64,3d-screenshot'),
    });
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange,
      canvasRef: {current: {createSnapshotPort: () => ({insertImageSnapshot: vi.fn().mockResolvedValue(true)})}},
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: null,
      houseIllustrationPort: {generateFromDataUrl: vi.fn(() => pendingGeneration)},
    }));

    act(() => {
      result.current.handleCanvasCreated(canvas);
      void result.current.handleInsertOnCanvas();
    });

    expect(result.current.isGeneratingIllustration).toBe(true);
    act(() => result.current.handleClose());
    expect(onOpenChange).not.toHaveBeenCalled();

    await act(async () => {
      resolveGeneration?.({
        dataUrl: 'data:image/png;base64,illustrated-house',
        storageUrl: '/manus-storage/generated/house.png',
      });
      await pendingGeneration;
    });

    act(() => result.current.handleClose());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
