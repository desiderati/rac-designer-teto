import type {PerspectiveCamera as ThreePerspectiveCamera} from 'three';
import {STORAGE_KEYS} from '@/shared/config.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {
  HOUSE_3D_CAMERA_FOV,
  HOUSE_3D_CAMERA_POSITION,
  HOUSE_3D_CAMERA_TARGET,
  HOUSE_3D_COMPACT_CAMERA_FOV,
  HOUSE_3D_COMPACT_CAMERA_POSITION,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';
import {buildHouseElementsFromCanvasModel} from '@/components/rac-editor/@viewer-3d/lib/parsers/house-elements-parser.ts';

export type House3DDoorFace = 'front' | 'back' | 'left' | 'right';
export type House3DCameraVector = readonly [number, number, number];

export interface House3DViewerCameraPose {
  position: House3DCameraVector;
  target: House3DCameraVector;
  fov: number;
  zoom: number;
}

export type House3DViewerCameraPoseReader = () => House3DViewerCameraPose | null;

export interface House3DViewerLightingPreset {
  primaryPosition: House3DCameraVector;
  fillPosition: House3DCameraVector;
}

interface StoredHouse3DViewerCameraPose extends House3DViewerCameraPose {
  version: 1;
}

interface OrbitControlsLike {
  target?: {
    x?: unknown;
    y?: unknown;
    z?: unknown;
  };
}

const HOUSE_3D_VIEWER_CAMERA_POSE_VERSION = 1;
const DEFAULT_CAMERA_ZOOM = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeVector(value: unknown): House3DCameraVector | null {
  if (!Array.isArray(value) || value.length !== 3) return null;

  const [x, y, z] = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) return null;
  return [x, y, z];
}

function normalizePositiveNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) && value > 0 ? value : fallback;
}

export function resolveHouse3DDoorFace(
  houseType: HouseType,
  tipo6FrontSide: 'top' | 'bottom' | null,
  tipo3OpenSide: 'left' | 'right' | null,
): House3DDoorFace {
  const door = buildHouseElementsFromCanvasModel(houseType, tipo6FrontSide, tipo3OpenSide)
    .find((element) => element.type === 'door');

  return door?.face ?? 'front';
}

export function createHouse3DDoorFacingCameraPose(params: {
  doorFace: House3DDoorFace;
  compact: boolean;
}): House3DViewerCameraPose {
  const [, y, depthDistance] = params.compact
    ? HOUSE_3D_COMPACT_CAMERA_POSITION
    : HOUSE_3D_CAMERA_POSITION;

  const positionByFace: Record<House3DDoorFace, House3DCameraVector> = {
    front: [0, y, depthDistance],
    back: [0, y, -depthDistance],
    left: [-depthDistance, y, 0],
    right: [depthDistance, y, 0],
  };

  return {
    position: positionByFace[params.doorFace],
    target: [...HOUSE_3D_CAMERA_TARGET],
    fov: params.compact ? HOUSE_3D_COMPACT_CAMERA_FOV : HOUSE_3D_CAMERA_FOV,
    zoom: DEFAULT_CAMERA_ZOOM,
  };
}

export function createHouse3DDoorFacingLightingPreset(doorFace: House3DDoorFace): House3DViewerLightingPreset {
  const primaryPositionByFace: Record<House3DDoorFace, House3DCameraVector> = {
    front: [50, 100, 50],
    back: [-50, 100, -50],
    left: [-50, 100, 50],
    right: [50, 100, -50],
  };
  const fillPositionByFace: Record<House3DDoorFace, House3DCameraVector> = {
    front: [-50, 50, -50],
    back: [50, 50, 50],
    left: [50, 50, -50],
    right: [-50, 50, 50],
  };

  return {
    primaryPosition: primaryPositionByFace[doorFace],
    fillPosition: fillPositionByFace[doorFace],
  };
}

export function getHouse3DViewerCameraPoseStorageKey(activeHouseId: string | null | undefined): string | null {
  const normalizedHouseId = typeof activeHouseId === 'string' ? activeHouseId.trim() : '';
  return normalizedHouseId
    ? `${STORAGE_KEYS.house3DViewerCameraPosePrefix}${normalizedHouseId}`
    : null;
}

export function normalizeHouse3DViewerCameraPose(value: unknown): House3DViewerCameraPose | null {
  if (!isRecord(value)) return null;

  const position = normalizeVector(value.position);
  const target = normalizeVector(value.target);
  if (!position || !target) return null;

  return {
    position,
    target,
    fov: normalizePositiveNumber(value.fov, HOUSE_3D_CAMERA_FOV),
    zoom: normalizePositiveNumber(value.zoom, DEFAULT_CAMERA_ZOOM),
  };
}

export function readHouse3DViewerCameraPose(storageKey: string | null): House3DViewerCameraPose | null {
  if (!storageKey) return null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== HOUSE_3D_VIEWER_CAMERA_POSE_VERSION) return null;
    return normalizeHouse3DViewerCameraPose(parsed);
  } catch {
    return null;
  }
}

export function writeHouse3DViewerCameraPose(
  storageKey: string | null,
  pose: House3DViewerCameraPose | null,
): void {
  if (!storageKey || !pose) return;

  const normalizedPose = normalizeHouse3DViewerCameraPose(pose);
  if (!normalizedPose) return;

  const storedPose: StoredHouse3DViewerCameraPose = {
    ...normalizedPose,
    version: HOUSE_3D_VIEWER_CAMERA_POSE_VERSION,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(storedPose));
  } catch {
    // Mantem o viewer utilizavel quando Local Storage estiver indisponivel ou cheio.
  }
}

export function removeHouse3DViewerCameraPose(storageKey: string | null): void {
  if (!storageKey) return;

  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Mantem o reset da camera resiliente quando Local Storage falhar.
  }
}

function readControlsTarget(controls: OrbitControlsLike | null): House3DCameraVector {
  const target = controls?.target;
  const x = target?.x;
  const y = target?.y;
  const z = target?.z;
  return isFiniteNumber(x) && isFiniteNumber(y) && isFiniteNumber(z)
    ? [x, y, z]
    : [...HOUSE_3D_CAMERA_TARGET];
}

export function readHouse3DViewerCameraPoseFromRuntime(
  camera: ThreePerspectiveCamera,
  controls: OrbitControlsLike | null,
): House3DViewerCameraPose | null {
  const {position} = camera;
  if (!isFiniteNumber(position.x) || !isFiniteNumber(position.y) || !isFiniteNumber(position.z)) return null;

  return normalizeHouse3DViewerCameraPose({
    position: [position.x, position.y, position.z],
    target: readControlsTarget(controls),
    fov: camera.fov,
    zoom: camera.zoom,
  });
}
