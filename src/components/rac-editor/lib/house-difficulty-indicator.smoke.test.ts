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
      soilProfile: 'stable_clay',
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
      soilProfile: 'firm_hard',
    })).toEqual({
      score: 8,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'alluvial',
    })).toEqual({
      score: 17,
      label: 'Baixa',
      level: 'low',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(1, 30))).toEqual({
      score: 34,
      label: 'Média',
      level: 'medium',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasElevatedObstacles: true,
    }, createPilotisWithHeightAndDesnivel(3, 30))).toEqual({
      score: 74,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, createPilotisWithHeightAndDesnivel(3, 0))).toEqual({
      score: 85,
      label: 'Crítica',
      level: 'critical',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, createPilotisWithHeightAndDesnivel(1, 120))).toEqual({
      score: 75,
      label: 'Crítica',
      level: 'critical',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
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
    const pilotis = createPilotisWithHeightAndDesnivel(3, 30);
    const withAllObstacles = calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, pilotis);

    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, pilotis).score);
    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, pilotis).score);
    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
    }, pilotis).score);
    expect(withAllObstacles.score).toBeGreaterThan(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
      hasHydraulicObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: true,
    }, pilotis).score);
  });

  it('calibra a dificuldade operacional pela media dos pilotis', () => {
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(1.5, 0)).score)
      .toBe(10);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(2, 0)).score)
      .toBe(20);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(2.5, 0)).score)
      .toBe(30);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(3, 0)).score)
      .toBe(40);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(3.2, 0)).score)
      .toBe(44);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(3.5, 0)).score)
      .toBe(50);
    expect(calculateHouseDifficultyIndicator({soilProfile: 'stable_clay'}, createPilotisWithHeightAndDesnivel(3.8, 0)).score)
      .toBe(50);
  });

  it('trata pilotis de 3,8 m como 3,5 m apenas no cálculo de dificuldade', () => {
    expect(calculateHouseDifficultyIndicator(
      {soilProfile: 'stable_clay'},
      createPilotisFromHeights([1, 3.8]),
    ).score).toBe(calculateHouseDifficultyIndicator(
      {soilProfile: 'stable_clay'},
      createPilotisFromHeights([1, 3.5]),
    ).score);
  });

  it('calibra casas planas com agua no fundo por medias altas de pilotis', () => {
    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
    }, createPilotisWithHeightAndDesnivel(2.5, 0))).toEqual({
      score: 55,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
    }, createPilotisWithHeightAndDesnivel(3, 0))).toEqual({
      score: 65,
      label: 'Alta',
      level: 'high',
    });

    expect(calculateHouseDifficultyIndicator({
      soilProfile: 'water_table',
    }, createPilotisWithHeightAndDesnivel(3.5, 0))).toEqual({
      score: 75,
      label: 'Crítica',
      level: 'critical',
    });
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

function createPilotisFromHeights(heights: number[]): Record<string, HousePiloti> {
  return Object.fromEntries(
    getAllPilotiIds().map((pilotiId, index) => [
      pilotiId,
      {
        height: heights[index % heights.length] ?? 1,
        nivel: 0,
        isMaster: index === 0,
      },
    ]),
  );
}
