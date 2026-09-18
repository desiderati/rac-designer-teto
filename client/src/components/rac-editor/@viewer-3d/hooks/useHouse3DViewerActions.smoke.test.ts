import {act, renderHook} from '@testing-library/react';
import {createElement, type ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {HOUSE_3D_WALL_COLOR_BY_NAME} from '@/shared/config.ts';
import {useHouse3DViewerActions} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerActions.ts';
import {House3DImageInsertionProvider} from '@/contexts/House3DImageInsertionContext.tsx';
import {
  getHouse3DViewerPreferencesStorageKey,
  readHouse3DViewerPreferences,
  writeHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';

function wrapper({children}: {children: ReactNode}) {
  return createElement(House3DImageInsertionProvider, null, children);
}

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
    }), {wrapper});

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

  it('reenquadra a câmera sem apagar preferências do viewer', () => {
    const onOpenChange = vi.fn();
    const cameraStorageKey = 'rac-house-3d-camera-pose:v2:house_1';
    const preferencesStorageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    writeHouse3DViewerPreferences(preferencesStorageKey, {
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa,
      hideBelowTerrain: false,
    });
    localStorage.setItem(cameraStorageKey, JSON.stringify({
      version: 1,
      position: [420, 260, 480],
      target: [12, 70, -8],
      fov: 55,
      zoom: 1.2,
    }));

    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange,
      canvasRef: {current: null},
      cameraPoseStorageKey: cameraStorageKey,
      viewerPreferencesStorageKey: preferencesStorageKey,
    }), {wrapper});

    act(() => result.current.handleReset());

    expect(localStorage.getItem(cameraStorageKey)).toBeNull();
    expect(readHouse3DViewerPreferences(preferencesStorageKey)).toEqual({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa,
      hideBelowTerrain: false,
    });
    expect(result.current.resetKey).toBe(1);
  });

  it('preserva a ilustração pronta sem inserir automaticamente e permite inseri-la depois', async () => {
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
      generateFromDataUrl: vi.fn().mockResolvedValue({
        storageUrl: 'https://example.test/manus-storage/temp/house-3d/illustration.png',
        dataUrl: 'data:image/png;base64,illustrated-house',
      }),
    };
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange: vi.fn(),
      canvasRef,
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: null,
      houseIllustrationPort,
    }), {wrapper});

    act(() => result.current.handleCanvasCreated(canvas));
    await act(async () => {
      await result.current.handleInsertOnCanvas();
    });

    expect(houseIllustrationPort.generateFromDataUrl).toHaveBeenCalledWith('data:image/png;base64,3d-screenshot');
    expect(insertImageSnapshot).not.toHaveBeenCalled();
    expect(result.current.hasPendingIllustration).toBe(true);

    await act(async () => {
      await result.current.handleInsertOnCanvas();
    });

    expect(insertImageSnapshot).toHaveBeenCalledWith(
      'data:image/png;base64,illustrated-house',
      {storageUrl: 'https://example.test/manus-storage/temp/house-3d/illustration.png'},
    );
    expect(result.current.hasPendingIllustration).toBe(false);
  });

  it('mantém a imagem pronta quando o Canvas não está disponível', async () => {
    const houseIllustrationPort = {
      generateFromDataUrl: vi.fn().mockResolvedValue({
        storageUrl: '/manus-storage/temp/house-3d/illustration.png',
        dataUrl: 'data:image/png;base64,illustrated-house',
      }),
    };
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'toDataURL', {
      value: vi.fn(() => 'data:image/png;base64,3d-screenshot'),
    });
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange: vi.fn(),
      canvasRef: {current: null},
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: null,
      houseIllustrationPort,
    }), {wrapper});

    act(() => result.current.handleCanvasCreated(canvas));
    await act(async () => {
      await result.current.handleInsertOnCanvas();
    });
    await act(async () => {
      await result.current.handleInsertOnCanvas();
    });

    expect(result.current.hasPendingIllustration).toBe(true);
  });

  it('permite fechar o viewer enquanto a ilustração continua sendo gerada', async () => {
    let resolveGeneration: ((value: {dataUrl: string; storageUrl: string}) => void) | null = null;
    const pendingGeneration = new Promise<{dataUrl: string; storageUrl: string}>((resolve) => {
      resolveGeneration = resolve;
    });
    const onOpenChange = vi.fn();
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'toDataURL', {
      value: vi.fn(() => 'data:image/png;base64,3d-screenshot'),
    });
    const insertImageSnapshot = vi.fn().mockResolvedValue(true);
    const {result} = renderHook(() => useHouse3DViewerActions({
      houseType: 'tipo6',
      hasHouseViews: true,
      onOpenChange,
      canvasRef: {current: {createSnapshotPort: () => ({insertImageSnapshot})}},
      cameraPoseStorageKey: null,
      viewerPreferencesStorageKey: null,
      houseIllustrationPort: {generateFromDataUrl: vi.fn(() => pendingGeneration)},
    }), {wrapper});

    act(() => {
      result.current.handleCanvasCreated(canvas);
      void result.current.handleInsertOnCanvas();
    });

    expect(result.current.isGeneratingIllustration).toBe(true);
    act(() => result.current.handleDialogOpenChange(false));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    await act(async () => {
      resolveGeneration?.({
        dataUrl: 'data:image/png;base64,illustrated-house',
        storageUrl: '/manus-storage/temp/house-3d/illustration.png',
      });
      await pendingGeneration;
    });

    expect(result.current.isGeneratingIllustration).toBe(false);
    expect(result.current.hasPendingIllustration).toBe(true);
    expect(insertImageSnapshot).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
