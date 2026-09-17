import type {SaveCanvasHistoryOptions} from '@/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.ts';

/**
 * Capacidade de histórico e clipboard do canvas.
 */
export interface CanvasHistoryHandle {
  /** Salva o estado atual no histórico de undo do canvas. */
  saveHistory(options?: SaveCanvasHistoryOptions): void;

  /** Limpa o histórico de undo do canvas. */
  clearHistory(): void;

  /** Restaura o snapshot anterior do histórico, quando existir. */
  undo(): void;

  /** Copia os objetos atualmente selecionados no canvas. */
  copy(): void;

  /** Cola no canvas os objetos copiados anteriormente. */
  paste(): void;
}
