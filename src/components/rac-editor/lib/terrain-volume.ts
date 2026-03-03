import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

export interface TerrainVolumePilotiInput {
  nivel: number;
}

export interface TerrainVolumesResult {
  rachaoM3: number;
  britaM3: number;
}

const CENTIMETERS_PER_METER = 100;
// No contexto do editor, dimensões base em px deste módulo são tratadas como cm para orçamento de volume.
const PILOTI_DIAMETER_CM = HOUSE_DIMENSIONS.piloti.width;
const SIDE_GRAVEL_WIDTH_CM = TERRAIN_SOLIDITY.sideGravelWidth;
const EXTERNAL_DIAMETER_CM = PILOTI_DIAMETER_CM + (SIDE_GRAVEL_WIDTH_CM * 2);
const VOID_FACTOR = TERRAIN_SOLIDITY.voidFactor;

function toMeters(centimeters: number): number {
  return centimeters / CENTIMETERS_PER_METER;
}

function toPositiveNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getCylinderVolumeM3(diameterCm: number, heightCm: number): number {
  const diameterM = toMeters(toPositiveNumber(diameterCm));
  const heightM = toMeters(toPositiveNumber(heightCm));
  const radiusM = diameterM / 2;
  return Math.PI * radiusM * radiusM * heightM;
}

function toNivelCentimeters(nivel: number): number {
  return toPositiveNumber(nivel) * CENTIMETERS_PER_METER;
}

export function calculateRachaoVolume(terrainLevel: number, pilotiCount = 12): number {
  const normalizedLevel = normalizeTerrainSolidityLevel(terrainLevel);
  const rachaoHeightCm = TERRAIN_SOLIDITY.levels[normalizedLevel].rachao;
  const normalizedCount = Math.max(0, Math.trunc(toPositiveNumber(pilotiCount)));
  return getCylinderVolumeM3(EXTERNAL_DIAMETER_CM, rachaoHeightCm) * normalizedCount * VOID_FACTOR;
}

export function calculateBritaVolume(pilotis: TerrainVolumePilotiInput[]): number {
  return pilotis.reduce((total, piloti) => {
    const heightCm = toNivelCentimeters(Number(piloti?.nivel ?? 0));
    if (heightCm <= 0) return total;

    const externalVolume = getCylinderVolumeM3(EXTERNAL_DIAMETER_CM, heightCm);
    const pilotiVolume = getCylinderVolumeM3(PILOTI_DIAMETER_CM, heightCm);
    return total + Math.max(0, externalVolume - pilotiVolume) * VOID_FACTOR;
  }, 0);
}

export function calculateTotalVolumes(
  terrainLevel: number,
  pilotis: TerrainVolumePilotiInput[],
): TerrainVolumesResult {
  return {
    rachaoM3: calculateRachaoVolume(terrainLevel),
    britaM3: calculateBritaVolume(pilotis),
  };
}
