import {HOUSE_3D_WALL_COLOR_OPTIONS, HOUSE_3D_WALL_COLORS, STORAGE_KEYS} from '@/shared/config.ts';

export interface House3DViewerPreferences {
  wallColor: string;
  hideBelowTerrain: boolean;
}

interface StoredHouse3DViewerPreferences extends House3DViewerPreferences {
  version: 1;
}

const HOUSE_3D_VIEWER_PREFERENCES_VERSION = 1;
const ALLOWED_WALL_COLORS = new Set(HOUSE_3D_WALL_COLOR_OPTIONS.map((option) => option.value));

export const DEFAULT_HOUSE_3D_VIEWER_PREFERENCES: House3DViewerPreferences = {
  wallColor: HOUSE_3D_WALL_COLORS.viewerInitialColor,
  hideBelowTerrain: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeWallColor(value: unknown): string {
  return typeof value === 'string' && ALLOWED_WALL_COLORS.has(value)
    ? value
    : DEFAULT_HOUSE_3D_VIEWER_PREFERENCES.wallColor;
}

export function getHouse3DViewerPreferencesStorageKey(activeHouseId: string | null | undefined): string | null {
  const normalizedHouseId = typeof activeHouseId === 'string' ? activeHouseId.trim() : '';
  return normalizedHouseId
    ? `${STORAGE_KEYS.house3DViewerPreferencesPrefix}${normalizedHouseId}`
    : null;
}

export function normalizeHouse3DViewerPreferences(value: unknown): House3DViewerPreferences {
  if (!isRecord(value)) return {...DEFAULT_HOUSE_3D_VIEWER_PREFERENCES};

  return {
    wallColor: normalizeWallColor(value.wallColor),
    hideBelowTerrain: value.hideBelowTerrain === true,
  };
}

export function readHouse3DViewerPreferences(storageKey: string | null): House3DViewerPreferences {
  if (!storageKey) return {...DEFAULT_HOUSE_3D_VIEWER_PREFERENCES};

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {...DEFAULT_HOUSE_3D_VIEWER_PREFERENCES};

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== HOUSE_3D_VIEWER_PREFERENCES_VERSION) {
      return {...DEFAULT_HOUSE_3D_VIEWER_PREFERENCES};
    }

    return normalizeHouse3DViewerPreferences(parsed);
  } catch {
    return {...DEFAULT_HOUSE_3D_VIEWER_PREFERENCES};
  }
}

export function writeHouse3DViewerPreferences(
  storageKey: string | null,
  preferences: House3DViewerPreferences,
): void {
  if (!storageKey) return;

  const normalizedPreferences = normalizeHouse3DViewerPreferences(preferences);
  const storedPreferences: StoredHouse3DViewerPreferences = {
    ...normalizedPreferences,
    version: HOUSE_3D_VIEWER_PREFERENCES_VERSION,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(storedPreferences));
  } catch {
    // Mantem o viewer utilizavel quando Local Storage estiver indisponivel ou cheio.
  }
}
