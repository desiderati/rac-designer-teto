import {describe, expect, it, vi} from 'vitest';
import {
  normalizeTerrainSolidityLevel,
  PILOTI_VISUAL_FEEDBACK_COLORS,
  TERRAIN_SOLIDITY
} from '@/shared/config.ts';
import {
  clampNivel,
  clampNivelByHeight,
  formatNivel,
  getAllPilotiIds,
  getMaxNivelForAvailableHeights,
  getMaxNivelForPilotiHeight,
  getMinimumPilotiHeightForNivel,
  getPilotiName,
  getRecommendedHeight,
  isPilotiOutOfProportion,
  normalizeAvailablePilotiHeights,
  MAX_AVAILABLE_PILOTI_NIVEL
} from '@/shared/types/piloti.ts';
import {getTerrainRachaoThicknessCm} from '@/components/rac-editor/@canvas/lib/terrain.ts';
import {refreshHouseGroupRendering} from '@/components/rac-editor/@canvas/lib/piloti.ts';

type TestCanvasObject = {
  dirty: boolean;
  objectCaching: boolean;
  stroke?: string;
  strokeWidth?: number;
  strokeUniform?: boolean;
  set: ReturnType<typeof vi.fn>;
  setCoords: ReturnType<typeof vi.fn>;
} & Record<string, unknown>;

describe('piloti.ts', () => {
  it('clamps nivel respecting min/max', () => {
    expect(clampNivel(0.1, 0.2, 1.5)).toBe(0.2);
    expect(clampNivel(2.0, 0.2, 1.5)).toBe(1.5);
  });

  it('clamps nivel based on piloti height', () => {
    expect(clampNivelByHeight(2, 1)).toBe(0.5);
  });

  it('supports max nivel 1.9 when max piloti height is 3.8', () => {
    expect(getMaxNivelForPilotiHeight(3.5)).toBe(1.75);
    expect(getMaxNivelForPilotiHeight(3.8)).toBe(1.9);
    expect(MAX_AVAILABLE_PILOTI_NIVEL).toBe(1.9);
    expect(clampNivel(2)).toBe(1.9);
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
    expect(getRecommendedHeight(1.75)).toBe(3.0);
  });

  it('computes recommendation and max nivel from selected family heights', () => {
    const selectedHeights = [1.2, 1.5, 2.0, 2.2, 3.0, 3.2] as const;

    expect(getRecommendedHeight(0.2, selectedHeights)).toBe(1.2);
    expect(getRecommendedHeight(0.5, selectedHeights)).toBe(1.5);
    expect(getRecommendedHeight(1.55, selectedHeights)).toBe(3.2);
    expect(getMaxNivelForAvailableHeights(selectedHeights)).toBe(1.6);
  });

  it('normalizes selected family heights and falls back safely when needed', () => {
    expect(normalizeAvailablePilotiHeights([3.2, 1.5, 3.2, 9] as unknown as number[])).toEqual([1.5, 3.2]);
    expect(normalizeAvailablePilotiHeights([])).toEqual([1.0, 1.2, 1.5, 1.8, 2.0, 2.2, 2.5, 3.0]);
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

  it('preserves active top-view piloti border behavior while normalizing neutral strokes', () => {
    const createObject = (properties: Record<string, unknown>): TestCanvasObject => ({
      dirty: false,
      objectCaching: true,
      set: vi.fn(function set(this: Record<string, unknown>, patch: Record<string, unknown>) {
        Object.assign(this, patch);
      }),
      setCoords: vi.fn(),
      ...properties,
    });

    const highlightedPiloti = createObject({
      isPilotiCircle: true,
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
      strokeUniform: false,
    });
    const focusedPiloti = createObject({
      isPilotiCircle: true,
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
      strokeUniform: false,
    });
    const neutralPiloti = createObject({
      isPilotiCircle: true,
      stroke: '#3f3f46',
      strokeUniform: false,
    });
    const contraventamento = createObject({
      isContraventamento: true,
      strokeUniform: false,
    });
    const objects = [highlightedPiloti, focusedPiloti, neutralPiloti, contraventamento];
    const group = {
      myType: 'house',
      _objects: [...objects],
      getCanvasObjects: () => objects,
      setControlsVisibility: vi.fn(),
      _clearCache: vi.fn(),
      _calcBounds: vi.fn(),
      setCoords: vi.fn(),
    };

    refreshHouseGroupRendering(group as never);

    expect(highlightedPiloti.strokeUniform).toBe(false);
    expect(focusedPiloti.strokeUniform).toBe(false);
    expect(neutralPiloti.strokeUniform).toBe(true);
    expect(contraventamento.strokeUniform).toBe(true);
  });

  it('mantém contraventamento de elevação entre terreno e estrutura ao reordenar o grupo', () => {
    const createObject = (properties: Record<string, unknown>): TestCanvasObject => ({
      dirty: false,
      objectCaching: true,
      set: vi.fn(function set(this: Record<string, unknown>, patch: Record<string, unknown>) {
        Object.assign(this, patch);
      }),
      setCoords: vi.fn(),
      ...properties,
    });

    const piloti = createObject({isPilotiRect: true});
    const ground = createObject({isGroundElement: true, isGroundFill: true});
    const contraventamentoElevation = createObject({isContraventamentoElevation: true});
    const nivelLabel = createObject({isGroundElement: true, isNivelLabel: true});
    const objects = [piloti, ground, contraventamentoElevation, nivelLabel];
    const group = {
      myType: 'house',
      _objects: [...objects],
      getCanvasObjects: () => objects,
      setControlsVisibility: vi.fn(),
      _clearCache: vi.fn(),
      _calcBounds: vi.fn(),
      setCoords: vi.fn(),
    };

    refreshHouseGroupRendering(group as never);

    expect(group._objects).toEqual([
      ground,
      contraventamentoElevation,
      piloti,
      nivelLabel,
    ]);
  });
});

