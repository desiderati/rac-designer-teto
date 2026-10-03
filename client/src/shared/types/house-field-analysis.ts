import type {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import type {HouseState} from '@/shared/types/house.ts';

/** Layout confirmado antes de existir uma planta no Canvas real. */
export interface FieldContraventamentoDefinition {
  originPilotiId: string;
  destinationPilotiId: string;
  side: ContraventamentoSide;
  isAuto: boolean;
}

export interface HouseFieldAnalysisMetadata {
  status: 'prepared' | 'inserted';
  contraventamentos: FieldContraventamentoDefinition[];
}

export interface HouseFieldAnalysisDraft {
  house: HouseState;
  selectedPilotiHeights: number[];
  contraventamentos: FieldContraventamentoDefinition[];
}
