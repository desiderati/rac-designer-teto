import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

/** Diâmetro do piloti em cm (px-base = cm neste contexto). */
const PILOTI_DIAMETER_CM = HOUSE_DIMENSIONS.piloti.widthMt3;

/** Largura de cada lateral de brita em cm. */
const SIDE_GRAVEL_CM = TERRAIN_SOLIDITY.sideGravelWidthMt3;

/** Diâmetro total do cilindro (piloti + 2× brita lateral) em cm. */
const EXTERNAL_DIAMETER_CM = PILOTI_DIAMETER_CM + (2 * SIDE_GRAVEL_CM);

/**
 * Retorna ambos os volumes calculados.
 */
export function calculateTotalVolumes(
  terrainLevel: number,
  pilotis: Record<string, HousePiloti>,
): { rachaoM3: number; britaM3: number } {
  const pilotiCount = Object.keys(pilotis).length || 12;
  return {
    rachaoM3: calculateRachaoVolume(terrainLevel, pilotiCount),
    britaM3: calculateBritaVolume(pilotis),
  };
}

/**
 * Volume total de rachão para a casa inteira.
 * Cada piloti recebe um cilindro de rachão com:
 *   - diâmetro = piloti.width + 2 × sideGravelWidth
 *   - altura = rachão do nível de solidez selecionado
 */
export function calculateRachaoVolume(
  terrainLevel: number,
  pilotiCount: number = 12,
): number {
  const level = normalizeTerrainSolidityLevel(terrainLevel);
  const rachaoHeightCm = TERRAIN_SOLIDITY.levels[level].rachaoMt3;
  const volumePerPiloti = cylinderVolumeM3(EXTERNAL_DIAMETER_CM, rachaoHeightCm);
  return volumePerPiloti * pilotiCount * TERRAIN_SOLIDITY.voidFactorRachao;
}

/**
 * Volume total de brita para todos os pilotis.
 * Para cada piloti:
 *   cilindro externo (alt. = nível em cm) − cilindro do piloti (mesma alt.)
 *
 * O nível (metros) é a parte enterrada do piloti.
 */
export function calculateBritaVolume(
  pilotis: Record<string, HousePiloti>,
): number {

  return Object.values(pilotis).reduce((total, p) => {
    const nivelCm = p.nivel * 100;
    if (nivelCm <= 0) return total;

    const outer = cylinderVolumeM3(EXTERNAL_DIAMETER_CM, nivelCm);
    const inner = cylinderVolumeM3(PILOTI_DIAMETER_CM, nivelCm);
    return total + (outer - inner) * TERRAIN_SOLIDITY.voidFactorGravel;
  }, 0);
}

/** Volume de um cilindro dado diâmetro (cm) e altura (cm), retornado em m³. */
function cylinderVolumeM3(diameterCm: number, heightCm: number): number {
  const radiusM = (diameterCm / 2) / 100;
  const heightM = heightCm / 100;
  return Math.PI * radiusM * radiusM * heightM;
}
