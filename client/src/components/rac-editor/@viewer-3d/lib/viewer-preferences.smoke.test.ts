import {beforeEach, describe, expect, it, vi} from 'vitest';
import {HOUSE_3D_WALL_COLOR_BY_NAME, STORAGE_KEYS} from '@/shared/config.ts';
import {
  getHouse3DViewerPreferencesStorageKey,
  readHouse3DViewerPreferences,
  writeHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';

describe('viewer-preferences.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persiste preferências 3D por casa ativa', () => {
    const storageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    expect(storageKey).toBe(`${STORAGE_KEYS.house3DViewerPreferencesPrefix}house_1`);

    writeHouse3DViewerPreferences(storageKey, {
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Verde,
      hideBelowTerrain: true,
    });

    expect(readHouse3DViewerPreferences(storageKey)).toEqual({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Verde,
      hideBelowTerrain: true,
    });
  });

  it('ignora valores inválidos e mantém fallback seguro', () => {
    const storageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    localStorage.setItem(storageKey!, JSON.stringify({
      version: 1,
      wallColor: '#000000',
      hideBelowTerrain: 'yes',
    }));

    expect(readHouse3DViewerPreferences(storageKey)).toEqual({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Azul,
      hideBelowTerrain: false,
    });
  });

  it('não quebra quando o storage falha', () => {
    const storageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeHouse3DViewerPreferences(storageKey, {
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Azul,
      hideBelowTerrain: true,
    })).not.toThrow();
  });
});
