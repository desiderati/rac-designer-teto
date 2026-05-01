import type {TutorialTipKey} from '@/shared/types/tutorial-progress.ts';

export type {TutorialTipKey} from '@/shared/types/tutorial-progress.ts';

/**
 * Porta de persistência do progresso do tutorial do editor.
 */
export interface TutorialProgressPort {
  /** Retorna se o tutorial principal já foi concluído. */
  isTutorialCompleted(): boolean;

  /** Marca o tutorial principal como concluído. */
  markTutorialCompleted(): void;

  /** Retorna se a dica de piloti já foi exibida. */
  isPilotiTutorialShown(): boolean;

  /** Marca a dica de piloti como exibida. */
  markPilotiTutorialShown(): void;

  /** Retorna se uma dica contextual de ferramenta já foi exibida. */
  isTutorialTipShown(tip: TutorialTipKey): boolean;

  /** Marca uma dica contextual de ferramenta como exibida. */
  markTutorialTipShown(tip: TutorialTipKey): void;

  /** Reinicia o progresso persistido do tutorial. */
  resetTutorialProgress(): void;
}
