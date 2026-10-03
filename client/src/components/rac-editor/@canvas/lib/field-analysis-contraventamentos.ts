import type {CanvasGroup} from './index.ts';
import {addContraventamentoBeam, addHorizontalContraventamentoBeam} from './contraventamento.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {isContraventamentoVerticalSide} from '@/shared/types/contraventamento.ts';
import type {FieldContraventamentoDefinition} from '@/shared/types/house-field-analysis.ts';

/** Reproduz exatamente as definições confirmadas, inclusive a ausência de reforços removidos. */
export function applyFieldAnalysisContraventamentos(group: CanvasGroup, definitions: FieldContraventamentoDefinition[]): void {
  for (const definition of definitions) {
    const origin = parsePilotiGridPosition(definition.originPilotiId);
    const destination = parsePilotiGridPosition(definition.destinationPilotiId);
    if (!origin || !destination) throw new Error('Contraventamento com pilotis inválidos.');
    const options = {anchorPilotiId: definition.originPilotiId, isAuto: definition.isAuto};
    const id = isContraventamentoVerticalSide(definition.side)
      ? addContraventamentoBeam(group, origin, destination, {...options, side: definition.side})
      : addHorizontalContraventamentoBeam(group, origin, destination, {...options, side: definition.side});
    if (!id) throw new Error('Não foi possível inserir o contraventamento preparado.');
  }
}
