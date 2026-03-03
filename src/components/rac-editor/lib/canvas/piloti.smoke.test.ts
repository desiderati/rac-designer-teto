import {describe, expect, it} from 'vitest';
import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {
  clampNivel,
  clampNivelByHeight,
  formatNivel, getAllPilotiIds,
  getPilotiName,
  getRecommendedHeight
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
    expect(getRecommendedHeight(0.2)).toBeGreaterThan(0);
  });

  it('normalizes terrain solidity and resolves rachão thickness', () => {
    expect(normalizeTerrainSolidityLevel(0)).toBe(1);
    expect(normalizeTerrainSolidityLevel(4)).toBe(4);
    expect(normalizeTerrainSolidityLevel(99)).toBe(5);
    expect(getTerrainRachaoThicknessCm(1)).toBe(TERRAIN_SOLIDITY.levels[1].rachao);
    expect(getTerrainRachaoThicknessCm(5)).toBe(TERRAIN_SOLIDITY.levels[5].rachao);
  });
});
