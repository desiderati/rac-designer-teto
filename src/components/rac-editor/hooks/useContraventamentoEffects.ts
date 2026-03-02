import {useEffect} from 'react';
import {CanvasGroup, ContraventamentoOrigin} from '@/components/rac-editor/lib/canvas';
import {
  highlightEligibleContraventamentoPilotis
} from '@/components/rac-editor/lib/canvas/contraventamento-top-view-highlight.ts';

interface UseContraventamentoEffectsArgs {
  houseVersion: number;
  isContraventamentoMode: boolean;
  contraventamentoFirst: ContraventamentoOrigin | null;
  getTopViewGroup: () => CanvasGroup | null;
  isPilotiEligibleAsDestination: (pilotiId: string, first: { col: number; row: number } | null) => boolean;
  handleCancelContraventamento: () => void;
  syncContraventamentoElevations: () => void;
}

export function useContraventamentoEffects({
  houseVersion,
  isContraventamentoMode,
  contraventamentoFirst,
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
      highlightEligibleContraventamentoPilotis(
        topGroup,
        (candidatePilotiId: string) => isPilotiEligibleAsDestination(candidatePilotiId, {
          col: contraventamentoFirst.col,
          row: contraventamentoFirst.row,
        }),
        contraventamentoFirst.col,
        contraventamentoFirst.pilotiId
      );
      return;
    }
  }, [
    contraventamentoFirst,
    getTopViewGroup,
    isContraventamentoMode,
    isPilotiEligibleAsDestination,
  ]);
}
