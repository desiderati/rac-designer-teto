import {useEffect} from 'react';
import {Group} from 'fabric';
import {highlightContraventamentoPilotis} from '@/lib/canvas-utils';
import {ContraventamentoOrigin, ContraventamentoStep} from './useRacContraventamento.types';

interface UseRacContraventamentoEffectsArgs {
  houseVersion: number;
  isContraventamentoMode: boolean;
  contraventamentoStep: ContraventamentoStep;
  contraventamentoFirst: ContraventamentoOrigin | null;
  getTopViewGroup: () => Group | null;
  isPilotiEligibleAsOrigin: (pilotiId: string) => boolean;
  isPilotiEligibleAsDestination: (pilotiId: string, first: {col: number; row: number} | null) => boolean;
  handleCancelContraventamento: () => void;
  syncContraventamentoElevations: () => void;
}

export function useRacContraventamentoEffects({
  houseVersion,
  isContraventamentoMode,
  contraventamentoStep,
  contraventamentoFirst,
  getTopViewGroup,
  isPilotiEligibleAsOrigin,
  isPilotiEligibleAsDestination,
  handleCancelContraventamento,
  syncContraventamentoElevations,
}: UseRacContraventamentoEffectsArgs) {
  useEffect(() => {
    syncContraventamentoElevations();
  }, [houseVersion, syncContraventamentoElevations]);

  useEffect(() => {
    if (!isContraventamentoMode) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelContraventamento();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isContraventamentoMode, handleCancelContraventamento]);

  useEffect(() => {
    if (!isContraventamentoMode) return;

    const topGroup = getTopViewGroup();
    if (!topGroup) return;

    if (contraventamentoStep === 'select-second' && contraventamentoFirst) {
      highlightContraventamentoPilotis(
        topGroup,
        (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId, {
          col: contraventamentoFirst.col,
          row: contraventamentoFirst.row,
        }),
        contraventamentoFirst.col,
        contraventamentoFirst.pilotiId
      );
      return;
    }

    highlightContraventamentoPilotis(topGroup, isPilotiEligibleAsOrigin);
  }, [
    contraventamentoFirst,
    contraventamentoStep,
    getTopViewGroup,
    isContraventamentoMode,
    isPilotiEligibleAsDestination,
    isPilotiEligibleAsOrigin,
  ]);
}
