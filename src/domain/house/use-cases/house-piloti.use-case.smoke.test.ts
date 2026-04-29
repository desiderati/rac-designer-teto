import {describe, expect, it} from 'vitest';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {recalculateRecommendedPilotiData} from '@/domain/house/use-cases/house-piloti.use-case.ts';

function createPilotis() {
  return Object.fromEntries(
    getAllPilotiIds().map((id) => [id, {...DEFAULT_HOUSE_PILOTI}]),
  );
}

describe('house-piloti.use-case.ts', () => {
  it('recalcula níveis intermediários e alturas recomendadas por interpolação bilinear', () => {
    const pilotis = createPilotis();
    pilotis.piloti_0_0 = {...pilotis.piloti_0_0, nivel: 0.2};
    pilotis.piloti_3_0 = {...pilotis.piloti_3_0, nivel: 1.0};
    pilotis.piloti_0_2 = {...pilotis.piloti_0_2, nivel: 0.2};
    pilotis.piloti_3_2 = {...pilotis.piloti_3_2, nivel: 1.0};

    const result = recalculateRecommendedPilotiData({
      pilotis,
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      availableHeights: [0.5, 1.0, 1.5, 2.0, 2.5],
    });

    expect(result.piloti_1_1.nivel).toBe(0.47);
    expect(result.piloti_1_1.height).toBe(1.5);
    expect(result.piloti_2_1.nivel).toBe(0.73);
    expect(result.piloti_2_1.height).toBe(2.5);
  });

  it('preserva alturas quando o recálculo de altura está desativado', () => {
    const pilotis = createPilotis();
    pilotis.piloti_0_0 = {...pilotis.piloti_0_0, nivel: 1.0, height: 0.5};

    const result = recalculateRecommendedPilotiData({
      pilotis,
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      recalculateHeight: false,
    });

    expect(result.piloti_0_0.nivel).toBe(1.0);
    expect(result.piloti_0_0.height).toBe(0.5);
  });
});
