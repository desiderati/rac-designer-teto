import type {EditorScreenPoint} from '@/components/rac-editor/store/types.ts';

/**
 * Capacidade de leitura e controle da viewport do canvas.
 */
export interface CanvasViewportHandle {
  /** Retorna o centro visível do canvas em coordenadas lógicas. */
  getVisibleCenter(): EditorScreenPoint;

  /** Retorna posição e zoom atuais do canvas. */
  getCanvasPosition(): { x: number; y: number; zoom: number };

  /** Define a posição lógica atual da viewport do canvas. */
  setCanvasPosition(x: number, y: number): void;

  /** Ajusta a viewport para enquadrar o canvas na área visível. */
  fitToView(): void;
}
