import type {HouseViewInstanceId} from '@/shared/types/house.ts';

/**
 * Capacidade de alternar o modo de desenho livre.
 */
export interface CanvasDrawingModeHandle {
  /** Ativa ou desativa o modo de desenho livre do canvas. */
  setDrawingModeEnabled(enabled: boolean): boolean;
}

/**
 * Capacidade de limpar a superfície visual do canvas.
 */
export interface CanvasSurfaceResetHandle {
  /** Remove objetos e histórico visual do canvas, preservando o contrato imperativo. */
  resetSurface(): void;
}

/**
 * Capacidade de solicitar renderização imediata do canvas.
 */
export interface CanvasRenderHandle {
  /** Solicita a renderização imediata do canvas. */
  renderAll(): void;
}

/**
 * Capacidade de ler e remover a seleção ativa do canvas.
 */
export interface CanvasActiveSelectionHandle {
  /** Retorna a quantidade de objetos atualmente ativos/selecionados. */
  getActiveObjectCount(): number;

  /** Remove os objetos ativos e executa callbacks de regra para vistas de casa. */
  deleteActiveObjects(handlers?: {
    canDeleteTopView?: () => boolean;
    onTopViewDeleted?: () => void;
    onHouseViewRemoved?: (instanceId: HouseViewInstanceId | null) => void;
    onBlockedTopViewDelete?: () => void;
  }): 'deleted' | 'blocked' | 'none';
}

export interface CanvasImageLayerHandle {
  moveActiveImageLayer(direction: 'front' | 'back'): boolean;
}

/**
 * Capacidade de desenho, limpeza e seleção da superfície visual.
 */
export interface CanvasSurfaceHandle
  extends CanvasDrawingModeHandle,
    CanvasSurfaceResetHandle,
    CanvasRenderHandle,
    CanvasImageLayerHandle,
    CanvasActiveSelectionHandle {
}
