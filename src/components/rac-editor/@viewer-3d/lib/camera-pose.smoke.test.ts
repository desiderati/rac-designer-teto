import {beforeEach, describe, expect, it, vi} from 'vitest';
import {STORAGE_KEYS} from '@/shared/config.ts';
import {
  createHouse3DDoorFacingCameraPose,
  getHouse3DViewerCameraPoseStorageKey,
  readHouse3DViewerCameraPose,
  removeHouse3DViewerCameraPose,
  resolveHouse3DDoorFace,
  writeHouse3DViewerCameraPose,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  HOUSE_3D_CAMERA_FOV,
  HOUSE_3D_CAMERA_TARGET,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';

describe('camera-pose.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('resolve a face da porta pela mesma regra dos elementos 3D', () => {
    expect(resolveHouse3DDoorFace('tipo6', 'top', null)).toBe('front');
    expect(resolveHouse3DDoorFace('tipo6', 'bottom', null)).toBe('back');
    expect(resolveHouse3DDoorFace('tipo3', null, 'left')).toBe('left');
    expect(resolveHouse3DDoorFace('tipo3', null, 'right')).toBe('right');
    expect(resolveHouse3DDoorFace(null, null, null)).toBe('front');
  });

  it('cria enquadramento inicial olhando para a face da porta', () => {
    expect(createHouse3DDoorFacingCameraPose({doorFace: 'front', compact: false}).position)
      .toEqual([0, 140, 250]);
    expect(createHouse3DDoorFacingCameraPose({doorFace: 'back', compact: false}).position)
      .toEqual([0, 140, -250]);
    expect(createHouse3DDoorFacingCameraPose({doorFace: 'left', compact: false}).position)
      .toEqual([-250, 140, 0]);
    expect(createHouse3DDoorFacingCameraPose({doorFace: 'right', compact: false}).position)
      .toEqual([250, 140, 0]);

    expect(createHouse3DDoorFacingCameraPose({doorFace: 'front', compact: false}))
      .toMatchObject({
        target: [...HOUSE_3D_CAMERA_TARGET],
        fov: HOUSE_3D_CAMERA_FOV,
        zoom: 1,
      });
  });

  it('persiste a pose por casa ativa e ignora valores inválidos', () => {
    const storageKey = getHouse3DViewerCameraPoseStorageKey('house_1');
    expect(storageKey).toBe(`${STORAGE_KEYS.house3DViewerCameraPosePrefix}house_1`);

    const pose = {
      position: [10, 20, 30] as const,
      target: [1, 2, 3] as const,
      fov: 45,
      zoom: 1.2,
    };

    writeHouse3DViewerCameraPose(storageKey, pose);

    expect(readHouse3DViewerCameraPose(storageKey)).toEqual(pose);

    localStorage.setItem(storageKey!, JSON.stringify({
      version: 1,
      position: [10, Number.NaN, 30],
      target: [1, 2, 3],
      fov: 45,
      zoom: 1,
    }));

    expect(readHouse3DViewerCameraPose(storageKey)).toBeNull();
  });

  it('remove a pose salva no reset e nao quebra quando o storage falha', () => {
    const storageKey = getHouse3DViewerCameraPoseStorageKey('house_1');
    writeHouse3DViewerCameraPose(storageKey, {
      position: [10, 20, 30],
      target: [1, 2, 3],
      fov: 45,
      zoom: 1,
    });

    removeHouse3DViewerCameraPose(storageKey);

    expect(readHouse3DViewerCameraPose(storageKey)).toBeNull();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeHouse3DViewerCameraPose(storageKey, {
      position: [10, 20, 30],
      target: [1, 2, 3],
      fov: 45,
      zoom: 1,
    })).not.toThrow();
  });
});
