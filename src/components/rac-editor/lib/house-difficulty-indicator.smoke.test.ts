import {describe, expect, it} from 'vitest';
import {
  calculateHouseDifficultyIndicator,
  calculateTerrainComplexityFromDesnivelCm,
} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

describe('house difficulty indicator', () => {
  it('calcula dificuldade por solo, desnivel dos pilotis, obstaculos e media dos pilotis', () => {
    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'stable',
    })).toEqual({
      score: 0,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateHouseDifficultyIndicator({})).toEqual({
      score: 4,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'loose_clay',
    })).toEqual({
      score: 8,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(1, 30))).toEqual({
      score: 37,
      label: 'Média',
      level: 'medium',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(3, 30))).toEqual({
      score: 53,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbacks: true,
    }, createPilotisWithHeightAndDesnivel(3, 0))).toEqual({
      score: 56,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbacks: true,
    }, createPilotisWithHeightAndDesnivel(1, 120))).toEqual({
      score: 80,
      label: 'Crítica',
      level: 'critical',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbacks: true,
    }, createPilotisWithHeightAndDesnivel(3.5, 120))).toEqual({
      score: 100,
      label: 'Crítica',
      level: 'critical',
    });
  });

  it('deriva complexidade pelas faixas de desnivel do terreno', () => {
    expect(calculateTerrainComplexityFromDesnivelCm(null)).toBe('flat');
    expect(calculateTerrainComplexityFromDesnivelCm(0)).toBe('flat');
    expect(calculateTerrainComplexityFromDesnivelCm(29)).toBe('flat');
    expect(calculateTerrainComplexityFromDesnivelCm(30)).toBe('moderate');
    expect(calculateTerrainComplexityFromDesnivelCm(59)).toBe('moderate');
    expect(calculateTerrainComplexityFromDesnivelCm(60)).toBe('steep');
    expect(calculateTerrainComplexityFromDesnivelCm(89)).toBe('steep');
    expect(calculateTerrainComplexityFromDesnivelCm(90)).toBe('very_steep');
    expect(calculateTerrainComplexityFromDesnivelCm(119)).toBe('very_steep');
    expect(calculateTerrainComplexityFromDesnivelCm(120)).toBe('extreme');
  });

  it('mantém obstáculos sensíveis quando o solo é água no fundo', () => {
    const pilotis = createPilotisWithHeightAndDesnivel(3, 120);
    const withAllObstacles = calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbacks: true,
    }, pilotis);

    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasNeighborSetbacks: true,
    }, pilotis).score);
    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
    }, pilotis).score);
    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
      hasNeighborSetbacks: true,
    }, pilotis).score);
  });
});

function createPilotisWithHeightAndDesnivel(height: number, desnivelCm: number): Record<string, HousePiloti> {
  const maxNivel = desnivelCm / 100;

  return Object.fromEntries(
    getAllPilotiIds().map((pilotiId, index) => [
      pilotiId,
      {
        height,
        nivel: index === 0 ? 0 : maxNivel,
        isMaster: index === 0,
      },
    ]),
  );
}
