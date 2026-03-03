import {describe, expect, it} from 'vitest';
import {calculateBritaVolume, calculateRachaoVolume, calculateTotalVolumes} from './terrain-volume.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

describe('terrain-volume', () => {
  it('calculates rachão volume for level 1 (15 cm) with 12 pilotis', () => {
    const vol = calculateRachaoVolume(1, 12);
    // Cilindro: π × (0.25)² × 0.15 × 12
    const expected = Math.PI * 0.25 * 0.25 * 0.15 * 12;
    expect(vol).toBeCloseTo(expected, 6);
  });

  it('calculates rachão volume for level 4 (60 cm) with 12 pilotis', () => {
    const vol = calculateRachaoVolume(4, 12);
    const expected = Math.PI * 0.25 * 0.25 * 0.60 * 12;
    expect(vol).toBeCloseTo(expected, 6);
  });

  it('calculates brita volume for single piloti with nivel 0.60m', () => {
    const pilotis: Record<string, HousePiloti> = {
      p1: {height: 1.0, isMaster: false, nivel: 0.60},
    };
    const vol = calculateBritaVolume(pilotis);
    // outer = π × 0.25² × 0.60, inner = π × 0.15² × 0.60
    const outer = Math.PI * 0.25 * 0.25 * 0.60;
    const inner = Math.PI * 0.15 * 0.15 * 0.60;
    expect(vol).toBeCloseTo(outer - inner, 6);
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
