import {getCanvasGroupObjects, type CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {normalizeHouseFieldAnalysis} from '@/components/construction-site/lib/house-field-analysis.ts';
import type {FieldContraventamentoDefinition, HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import {isContraventamentoHorizontalSide, isContraventamentoVerticalSide} from '@/shared/types/contraventamento.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

/** O predicado do fluxo aceita origem opcional; não repasse o índice de Array.filter como origem. */
export function getEligibleCanvasDestinationPilotiIds(isEligible: (pilotiId: string) => boolean): string[] {
  return getAllPilotiIds().filter((pilotiId) => isEligible(pilotiId));
}

/** Somente projeta o estado atual do Canvas para a mini planta, sem alterar a casa. */
export function createCanvasPilotiPreviewDraft(
  snapshot: HouseRuntimeSnapshot<CanvasGroup> | null,
  selectedPilotiHeights: readonly number[],
): HouseFieldAnalysisDraft | null {
  const topGroup = snapshot?.views.top[0]?.group;
  if (!snapshot || !topGroup) return null;

  const definitions = getCanvasGroupObjects(topGroup).flatMap((object): FieldContraventamentoDefinition[] => {
    if (!object.isContraventamento || !object.contraventamentoSide) return [];
    const horizontal = isContraventamentoHorizontalSide(object.contraventamentoSide);
    if (!horizontal && !isContraventamentoVerticalSide(object.contraventamentoSide)) return [];
    const col = Number(object.contraventamentoCol);
    const row = Number(object.contraventamentoRow);
    const start = horizontal
      ? `piloti_${object.contraventamentoStartCol}_${row}`
      : `piloti_${col}_${object.contraventamentoStartRow}`;
    const end = horizontal
      ? `piloti_${object.contraventamentoEndCol}_${row}`
      : `piloti_${col}_${object.contraventamentoEndRow}`;
    const origin = object.contraventamentoAnchorPilotiId ?? start;
    return [{
      originPilotiId: origin,
      destinationPilotiId: origin === start ? end : start,
      side: object.contraventamentoSide,
      isAuto: object.isAutoContraventamento === true,
    }];
  });
  const contraventamentos = normalizeHouseFieldAnalysis({status: 'prepared', contraventamentos: definitions})
    ?.contraventamentos ?? [];
  const {views: _views, ...house} = snapshot;
  return {
    house: {...house, views: {top: [], front: [], back: [], side1: [], side2: []}},
    selectedPilotiHeights: [...selectedPilotiHeights],
    contraventamentos,
  };
}
