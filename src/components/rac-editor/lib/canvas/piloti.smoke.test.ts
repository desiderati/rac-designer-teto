import {describe, expect, it} from 'vitest';
import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {
  clampNivel,
  clampNivelByHeight,
  formatNivel,
  getAllPilotiIds,
  getMaxNivelForPilotiHeight,
  getMinimumPilotiHeightForNivel,
  getPilotiName,
  getRecommendedHeight,
  isPilotiOutOfProportion,
  MAX_AVAILABLE_PILOTI_NIVEL
} from '@/shared/types/piloti.ts';
import {getTerrainRachaoThicknessCm} from '@/components/rac-editor/lib/canvas/terrain.ts';

describe('piloti helpers', () => {
  it('clamps nivel respecting min/max', () => {
    expect(clampNivel(0.1, 0.2, 1.5)).toBe(0.2);
    expect(clampNivel(2.0, 0.2, 1.5)).toBe(1.5);
  });

  it('clamps nivel based on piloti height', () => {
    expect(clampNivelByHeight(2, 1)).toBe(0.5);
  });

  it('supports max nivel 1.75 when max piloti height is 3.5', () => {
    expect(getMaxNivelForPilotiHeight(3.5)).toBe(1.75);
    expect(MAX_AVAILABLE_PILOTI_NIVEL).toBe(1.75);
    expect(clampNivel(2)).toBe(1.75);
  });

  it('formats nivel and piloti ids', () => {
    expect(formatNivel(0.2)).toBe('0,20');
    expect(getPilotiName('piloti_0_0')).toBe('A1');
    expect(getPilotiName('piloti_3_2')).toBe('C4');
  });

  it('returns all piloti ids in expected count', () => {
    const ids = getAllPilotiIds();
    expect(ids).toHaveLength(12);
    expect(ids[0]).toBe('piloti_0_0');
    expect(ids[ids.length - 1]).toBe('piloti_3_2');
  });

  it('computes recommended height from nivel', () => {
    expect(getMinimumPilotiHeightForNivel(0.2)).toBeCloseTo(0.6, 6);
    expect(getRecommendedHeight(0.2)).toBe(1.0);
    expect(getRecommendedHeight(1.75)).toBe(3.5);
  });

  it('detects out-of-proportion piloti using the same ratio as recommendation', () => {
    expect(isPilotiOutOfProportion(1.5, 0.5)).toBe(false);
    expect(isPilotiOutOfProportion(1.4, 0.5)).toBe(true);
  });

  it('applies contraventamento proportion rule with same structural ratio', () => {
    expect(getMinimumPilotiHeightForNivel(0.5)).toBe(1.5);
    expect(isPilotiOutOfProportion(1.0, 0.5)).toBe(true);
    expect(isPilotiOutOfProportion(1.5, 0.5)).toBe(false);
  });

  it('normalizes terrain solidity and resolves rachão thickness', () => {
    expect(normalizeTerrainSolidityLevel(0)).toBe(1);
    expect(normalizeTerrainSolidityLevel(4)).toBe(4);
    expect(normalizeTerrainSolidityLevel(99)).toBe(5);
    expect(getTerrainRachaoThicknessCm(1)).toBe(TERRAIN_SOLIDITY.levels[1].rachao);
    expect(getTerrainRachaoThicknessCm(5)).toBe(TERRAIN_SOLIDITY.levels[5].rachao);
  });
});
