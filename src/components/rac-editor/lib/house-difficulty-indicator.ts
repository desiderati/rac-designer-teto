import type {SiteAssessment, SoilProfile, TerrainComplexity} from '@/shared/types/construction-site.ts';
import {ALL_PILOTI_HEIGHTS, type HousePiloti} from '@/shared/types/house.ts';

export type HouseDifficultyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HouseDifficultyIndicator {
  score: number;
  label: string;
  level: HouseDifficultyLevel;
}

const SOIL_DIFFICULTY_WEIGHT: Record<SoilProfile, number> = {
  stable: 1,
  loose_clay: 2,
  water_table: 4,
};

const TERRAIN_COMPLEXITY_DIFFICULTY_POINTS: Record<TerrainComplexity, number> = {
  flat: 0,
  moderate: 10,
  steep: 20,
  very_steep: 30,
  extreme: 40,
};

const UNKNOWN_SOIL_DIFFICULTY_WEIGHT = 1.5;
const UNDERGROUND_OBSTACLE_DIFFICULTY_INCREMENT = 1;
const ELEVATED_OBSTACLE_DIFFICULTY_INCREMENT = 0.2;
const NEIGHBOR_SETBACK_DIFFICULTY_INCREMENT = 0.6;
const MAX_OBSTACLE_PRESSURE =
  UNDERGROUND_OBSTACLE_DIFFICULTY_INCREMENT
  + ELEVATED_OBSTACLE_DIFFICULTY_INCREMENT
  + NEIGHBOR_SETBACK_DIFFICULTY_INCREMENT;
const MODERATE_TERRAIN_DESNIVEL_CM = 30;
const STEEP_TERRAIN_DESNIVEL_CM = 60;
const VERY_STEEP_TERRAIN_DESNIVEL_CM = 90;
const EXTREME_TERRAIN_DESNIVEL_CM = 120;
const MIN_PILOTI_AVERAGE_HEIGHT = Math.min(...ALL_PILOTI_HEIGHTS);
const MAX_PILOTI_AVERAGE_HEIGHT = Math.max(...ALL_PILOTI_HEIGHTS);
const MIN_SOIL_DIFFICULTY_WEIGHT = SOIL_DIFFICULTY_WEIGHT.stable;
const MAX_SOIL_DIFFICULTY_WEIGHT = SOIL_DIFFICULTY_WEIGHT.water_table;
const MAX_SOIL_DIFFICULTY_POINTS = 25;
const MAX_OBSTACLE_DIFFICULTY_POINTS = 15;
const MAX_PILOTI_HEIGHT_DIFFICULTY_POINTS = 20;

export function calculateHouseDifficultyIndicator(
  assessment: SiteAssessment,
  pilotis?: Record<string, HousePiloti>,
): HouseDifficultyIndicator {
  const obstaclePressure = calculateObstaclePressure(assessment);
  const terrainComplexity = calculateTerrainComplexityFromPilotis(pilotis);
  const rawDifficulty =
    TERRAIN_COMPLEXITY_DIFFICULTY_POINTS[terrainComplexity]
    + calculateSoilDifficultyPoints(assessment.soilProfile)
    + calculateObstacleDifficultyPoints(obstaclePressure)
    + calculatePilotiHeightDifficultyPoints(pilotis);
  const score = Math.round(rawDifficulty);
  const boundedScore = Math.min(100, Math.max(0, score));

  return {
    score: boundedScore,
    ...getDifficultyLevel(boundedScore),
  };
}

export function calculateTerrainComplexityFromPilotis(
  pilotis?: Record<string, HousePiloti>,
): TerrainComplexity {
  return calculateTerrainComplexityFromDesnivelCm(calculateTerrainDesnivelCm(pilotis));
}

export function calculateTerrainComplexityFromDesnivelCm(desnivelCm: number | null | undefined): TerrainComplexity {
  if (!Number.isFinite(desnivelCm)) return 'flat';
  if (desnivelCm < MODERATE_TERRAIN_DESNIVEL_CM) return 'flat';
  if (desnivelCm < STEEP_TERRAIN_DESNIVEL_CM) return 'moderate';
  if (desnivelCm < VERY_STEEP_TERRAIN_DESNIVEL_CM) return 'steep';
  if (desnivelCm < EXTREME_TERRAIN_DESNIVEL_CM) return 'very_steep';
  return 'extreme';
}

export function calculateTerrainDesnivelCm(pilotis: Record<string, HousePiloti> | undefined): number | null {
  const niveis = Object.values(pilotis ?? {})
    .map((piloti) => piloti.nivel)
    .filter((nivel): nivel is number => Number.isFinite(nivel));

  if (niveis.length === 0) return null;
  return Math.round((Math.max(...niveis) - Math.min(...niveis)) * 100);
}

function calculateObstaclePressure(assessment: SiteAssessment): number {
  return [
    assessment.hasUndergroundObstacles ? UNDERGROUND_OBSTACLE_DIFFICULTY_INCREMENT : 0,
    assessment.hasElevatedObstacles ? ELEVATED_OBSTACLE_DIFFICULTY_INCREMENT : 0,
    assessment.hasNeighborSetbacks ? NEIGHBOR_SETBACK_DIFFICULTY_INCREMENT : 0,
  ].reduce((total, value) => total + value, 0);
}

function calculateSoilDifficultyPoints(soilProfile: SoilProfile | undefined): number {
  const soilWeight = soilProfile ? SOIL_DIFFICULTY_WEIGHT[soilProfile] : UNKNOWN_SOIL_DIFFICULTY_WEIGHT;
  return (
    (soilWeight - MIN_SOIL_DIFFICULTY_WEIGHT)
    / (MAX_SOIL_DIFFICULTY_WEIGHT - MIN_SOIL_DIFFICULTY_WEIGHT)
  ) * MAX_SOIL_DIFFICULTY_POINTS;
}

function calculateObstacleDifficultyPoints(obstaclePressure: number): number {
  return (obstaclePressure / MAX_OBSTACLE_PRESSURE) * MAX_OBSTACLE_DIFFICULTY_POINTS;
}

function calculatePilotiHeightDifficultyPoints(pilotis: Record<string, HousePiloti> | undefined): number {
  const averageHeight = calculateAveragePilotiHeight(pilotis);
  const normalizedHeightPressure = (
    (averageHeight - MIN_PILOTI_AVERAGE_HEIGHT)
    / (MAX_PILOTI_AVERAGE_HEIGHT - MIN_PILOTI_AVERAGE_HEIGHT)
  );

  return normalizedHeightPressure * MAX_PILOTI_HEIGHT_DIFFICULTY_POINTS;
}

function calculateAveragePilotiHeight(pilotis: Record<string, HousePiloti> | undefined): number {
  const heights = Object.values(pilotis ?? {})
    .map((piloti) => piloti.height)
    .filter((height): height is number => Number.isFinite(height));

  if (heights.length === 0) return MIN_PILOTI_AVERAGE_HEIGHT;

  const average = heights.reduce((sum, height) => sum + height, 0) / heights.length;
  return Math.min(MAX_PILOTI_AVERAGE_HEIGHT, Math.max(MIN_PILOTI_AVERAGE_HEIGHT, average));
}

function getDifficultyLevel(score: number): Pick<HouseDifficultyIndicator, 'label' | 'level'> {
  if (score < 25) return {label: 'Baixa', level: 'low'};
  if (score < 50) return {label: 'Média', level: 'medium'};
  if (score < 75) return {label: 'Alta', level: 'high'};
  return {label: 'Crítica', level: 'critical'};
}
