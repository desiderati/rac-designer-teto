import {describe, expect, it} from 'vitest';
import {
  calculateBritaVolume,
  calculateRachaoVolume,
  calculateTotalVolumes
} from '@/components/rac-editor/lib/terrain-volume.ts';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';

describe('terrain volume helpers', () => {
  it('calcula volume total de rachão para todos os pilotis', () => {
    const expected = Math.PI * (0.25 ** 2) * 0.15 * 12 * TERRAIN_SOLIDITY.voidFactor;
    expect(calculateRachaoVolume(1)).toBeCloseTo(expected, 8);
  });

  it('calcula volume total de brita como diferença entre cilindros', () => {
    const expectedAreaDiff = Math.PI * ((0.25 ** 2) - (0.15 ** 2));
    const expectedVolume = expectedAreaDiff * (0.2 + 0.4) * TERRAIN_SOLIDITY.voidFactor;

    const result = calculateBritaVolume([
      {nivel: 0.2},
      {nivel: 0.4},
    ]);

    expect(result).toBeCloseTo(expectedVolume, 8);
  });

  it('retorna volumes agregados e ignora níveis inválidos', () => {
    const pilotis = [{nivel: 0.2}, {nivel: -1}, {nivel: Number.NaN}];
    const totals = calculateTotalVolumes(2, pilotis);

    expect(totals.rachaoM3).toBeCloseTo(calculateRachaoVolume(2), 8);
    expect(totals.britaM3).toBeCloseTo(calculateBritaVolume([{nivel: 0.2}]), 8);
  });
});
