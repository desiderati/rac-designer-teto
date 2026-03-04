import {describe, expect, it} from 'vitest';
import {calculateBritaVolume, calculateRachaoVolume, calculateTotalVolumes} from './terrain-volume.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

const PILOTI_DIAMETER_CM = HOUSE_DIMENSIONS.piloti.widthMt3;
const EXTERNAL_DIAMETER_CM = PILOTI_DIAMETER_CM + (2 * TERRAIN_SOLIDITY.sideGravelWidthMt3);

function cylinderVolumeM3(diameterCm: number, heightCm: number): number {
  const radiusM = (diameterCm / 2) / 100;
  const heightM = heightCm / 100;
  return Math.PI * radiusM * radiusM * heightM;
}

describe('terrain-volume.ts', () => {
  it('calculates rachão volume for level 1 with 12 pilotis', () => {
    const vol = calculateRachaoVolume(1, 12);
    const expected =
      cylinderVolumeM3(EXTERNAL_DIAMETER_CM, TERRAIN_SOLIDITY.levels[1].rachaoMt3)
      * 12
      * TERRAIN_SOLIDITY.voidFactorRachao;
    expect(vol).toBeCloseTo(expected, 6);
  });

  it('calculates rachão volume for level 4 with 12 pilotis', () => {
    const vol = calculateRachaoVolume(4, 12);
    const expected =
      cylinderVolumeM3(EXTERNAL_DIAMETER_CM, TERRAIN_SOLIDITY.levels[4].rachaoMt3)
      * 12
      * TERRAIN_SOLIDITY.voidFactorRachao;
    expect(vol).toBeCloseTo(expected, 6);
  });

  it('calculates brita volume for single piloti with nivel 0.60m', () => {
    const pilotis: Record<string, HousePiloti> = {
      p1: {height: 1.0, isMaster: false, nivel: 0.60},
    };
    const vol = calculateBritaVolume(pilotis);
    const outer = cylinderVolumeM3(EXTERNAL_DIAMETER_CM, 60);
    const inner = cylinderVolumeM3(PILOTI_DIAMETER_CM, 60);
    expect(vol).toBeCloseTo((outer - inner) * TERRAIN_SOLIDITY.voidFactorGravel, 6);
  });

  it('returns zero brita for pilotis with nivel 0', () => {
    const pilotis: Record<string, HousePiloti> = {
      p1: {height: 1.0, isMaster: false, nivel: 0},
    };
    expect(calculateBritaVolume(pilotis)).toBe(0);
  });

  it('calculateTotalVolumes returns both values', () => {
    const pilotis: Record<string, HousePiloti> = {
      p1: {height: 1.0, isMaster: false, nivel: 0.20},
    };
    const result = calculateTotalVolumes(3, pilotis);
    expect(result.rachaoM3).toBeGreaterThan(0);
    expect(result.britaM3).toBeGreaterThan(0);
  });
});

