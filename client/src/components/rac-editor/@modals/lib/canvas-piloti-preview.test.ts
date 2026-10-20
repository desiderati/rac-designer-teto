import {describe, expect, it} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {createHouseTop} from '@/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts';
import {applyFieldAnalysisContraventamentos} from '@/components/rac-editor/@canvas/lib/field-analysis-contraventamentos.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {getAllPilotiIds, parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {isHouseHorizontalContraventamentoDestinationEligible} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';
import {createCanvasPilotiPreviewDraft, getEligibleCanvasDestinationPilotiIds} from './canvas-piloti-preview.ts';

describe('projeção da mini planta do editor mobile', () => {
  it('oferece C1 como destino de C4 sem confundir índice da lista com origem', () => {
    const first = {col: 3, row: 2};
    const destinations = getEligibleCanvasDestinationPilotiIds((pilotiId, firstOverride?: typeof first) => {
      const candidate = parsePilotiGridPosition(pilotiId);
      return candidate !== null && isHouseHorizontalContraventamentoDestinationEligible({
        first: firstOverride ?? first,
        candidate,
        side: 'top',
        pilotis: {piloti_3_2: {height: 1.2, nivel: 0.5}},
        allowWithinProportion: true,
      });
    });

    expect(destinations).toContain('piloti_0_2');
    expect(destinations).not.toContain('piloti_3_2');
    expect(destinations).not.toContain('piloti_0_0');
  });

  it('lê os pilotis e o contraventamento manual da vista real sem mutá-la', () => {
    const group = createHouseTop({width: 960, height: 600} as FabricCanvas);
    applyFieldAnalysisContraventamentos(group, [{
      originPilotiId: 'piloti_3_2', destinationPilotiId: 'piloti_0_2', side: 'top', isAuto: false,
    }]);
    const house = HouseAggregate.createInitialHouseState({
      id: 'test', pilotiIds: getAllPilotiIds(), defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: 1,
    });
    const snapshot = {...house, views: {
      top: [{instanceId: 'top', group}], front: [], back: [], side1: [], side2: [],
    }};
    const before = group.getObjects().length;
    const draft = createCanvasPilotiPreviewDraft(snapshot, [1, 1.2, 1.5]);

    expect(draft?.house.pilotis).toBe(snapshot.pilotis);
    expect(draft?.house.views.top).toEqual([]);
    expect(draft?.contraventamentos).toEqual([{
      originPilotiId: 'piloti_3_2', destinationPilotiId: 'piloti_0_2', side: 'top', isAuto: false,
    }]);
    expect(group.getObjects()).toHaveLength(before);
  });
});
