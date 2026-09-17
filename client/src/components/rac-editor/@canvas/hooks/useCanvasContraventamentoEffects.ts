import {useEffect} from 'react';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {ContraventamentoOrigin, ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {
  highlightEligibleContraventamentoPilotis
} from '@/components/rac-editor/@canvas/lib/contraventamento-top-view-highlight.ts';
import {getContraventamentoOrientationBySide} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';

interface UseContraventamentoEffectsArgs {
  houseVersion: number;
  isContraventamentoMode: boolean;
  contraventamentoFirst: ContraventamentoOrigin | null;
  contraventamentoSide: ContraventamentoSide | null;
  getTopViewGroup: () => CanvasGroup | null;
  isPilotiEligibleAsDestination: (
    pilotiId: string,
    first: { col: number; row: number } | null,
    side?: ContraventamentoSide | null,
  ) => boolean;
  handleCancelContraventamento: () => void;
  syncContraventamentoElevations: () => void;
}

export function useContraventamentoEffects({
  houseVersion,
  isContraventamentoMode,
  contraventamentoFirst,
  contraventamentoSide,
  getTopViewGroup,
  isPilotiEligibleAsDestination,
  handleCancelContraventamento,
  syncContraventamentoElevations,
}: UseContraventamentoEffectsArgs) {

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

    if (contraventamentoFirst) {
      const orientation = getContraventamentoOrientationBySide(contraventamentoSide);
      highlightEligibleContraventamentoPilotis(
        topGroup,
        (candidatePilotiId: string) => isPilotiEligibleAsDestination(candidatePilotiId, {
          col: contraventamentoFirst.col,
          row: contraventamentoFirst.row,
        }, contraventamentoSide),
        orientation === 'vertical' ? contraventamentoFirst.col : undefined,
        contraventamentoFirst.pilotiId,
        orientation === 'horizontal' ? contraventamentoFirst.row : undefined,
      );
      return;
    }
  }, [
    contraventamentoFirst,
    contraventamentoSide,
    getTopViewGroup,
    isContraventamentoMode,
    isPilotiEligibleAsDestination,
  ]);
}
