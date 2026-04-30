import type {CanvasGroup, CanvasObject, ElementStrategyKey,} from '@/components/rac-editor/@canvas/lib';
import type {EditorScreenPoint} from '@/components/rac-editor/@canvas/store/types.ts';
import type {GenericCanvasObjectEditorType} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasDebugPort} from '@/components/rac-editor/@canvas/ports/CanvasDebugPort.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';
import type {CanvasSnapshotPort} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotPort.ts';

/**
 * Capacidade de inicializar o runtime visual da casa a partir do canvas atual.
 */
export interface CanvasHouseRuntimeHandle {
  createCanvasHouseRuntimePort(): CanvasHouseRuntimePort | null;
}

/**
 * Capacidade documental do canvas para importação, exportação e imagem.
 */
export interface CanvasDocumentHandle {
  createDocumentPort(): CanvasDocumentPort | null;
}

/**
 * Capacidade de diagnóstico usada apenas por ferramentas de desenvolvimento.
 */
export interface CanvasDebugHandle {
  createDebugPort(): CanvasDebugPort | null;
}

/**
 * Capacidade de inserir snapshots visuais externos no canvas.
 */
export interface CanvasSnapshotHandle {
  createSnapshotPort(): CanvasSnapshotPort | null;
}

/**
 * Capacidade de histórico e clipboard do canvas.
 */
export interface CanvasHistoryHandle {
  /** Salva o estado atual no histórico de undo do canvas. */
  saveHistory(): void;

  /** Limpa o histórico de undo do canvas. */
  clearHistory(): void;

  /** Restaura o snapshot anterior do histórico, quando existir. */
  undo(): void;

  /** Copia os objetos atualmente selecionados no canvas. */
  copy(): void;

  /** Cola no canvas os objetos copiados anteriormente. */
  paste(): void;
}

/**
 * Capacidade de criar e posicionar objetos visuais no canvas.
 */
export interface CanvasObjectCreationHandle {
  /** Cria um objeto visual de elemento sem adicioná-lo automaticamente ao canvas. */
  createElementObject(kind: ElementStrategyKey): CanvasObject | null;

  /** Cria o grupo visual de uma vista da casa sem registrá-lo automaticamente. */
  createHouseViewGroup(payload: { viewType: HouseViewType; side?: HouseSide }): CanvasGroup | null;

  /** Adiciona um objeto visual no centro visível do canvas. */
  addObjectAtVisibleCenter(object: CanvasObject): boolean;
}

/**
 * Capacidade de desenho livre e limpeza da superfície visual.
 */
export interface CanvasSurfaceHandle {
  /** Ativa ou desativa o modo de desenho livre do canvas. */
  setDrawingModeEnabled(enabled: boolean): boolean;

  /** Remove objetos e histórico visual do canvas, preservando o contrato imperativo. */
  resetSurface(): void;

  /** Solicita a renderização imediata do canvas. */
  renderAll(): void;

  /** Retorna a quantidade de objetos atualmente ativos/selecionados. */
  getActiveObjectCount(): number;

  /** Remove os objetos ativos e executa callbacks de regra para vistas de casa. */
  deleteActiveObjects(handlers?: {
    canDeleteTopView?: () => boolean;
    onTopViewDeleted?: () => void;
    onHouseViewRemoved?: (group: CanvasGroup | null) => void;
    onBlockedTopViewDelete?: () => void;
  }): 'deleted' | 'blocked' | 'none';
}

/**
 * Capacidade de converter coordenadas do canvas para a tela.
 */
export interface CanvasScreenProjectionHandle {
  /** Converte um ponto do canvas para coordenadas de tela. */
  getCanvasPointScreenPosition(point: EditorScreenPoint): EditorScreenPoint | null;

  /** Converte um ponto local de grupo para coordenadas de tela. */
  getGroupLocalPointScreenPosition(
    group: CanvasGroup,
    localCanvasPoint: EditorScreenPoint,
  ): EditorScreenPoint | null;
}

/**
 * Capacidade de aplicar alterações dos editores flutuantes.
 */
export interface CanvasEditorVisualHandle {
  /** Aplica alterações de editor genérico em objetos lineares ou paredes. */
  applyGenericObjectEdit(payload: {
    /** Tipo de editor genérico que determina a estratégia de aplicação. */
    kind: GenericCanvasObjectEditorType;

    /** Identidade serializável do objeto visual que receberá a alteração. */
    objectId: string;

    /** Cor final a ser aplicada ao objeto editado. */
    color: string;

    /** Rótulo textual final a ser aplicado ao objeto editado. */
    label: string;
  }): string | null;

  /** Restaura visuais temporários aplicados pelo editor de piloti ao fechar. */
  applyPilotiEditorCloseVisuals(): void;

  /** Aplica destaque visual ao piloti informado. */
  applyPilotiSelectionVisuals(pilotiId: string): void;
}

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

/**
 * Porta imperativa completa exposta pelo canvas.
 *
 * Este tipo permanece como composição transitória para o `forwardRef` do canvas.
 * Consumidores novos devem depender das capacidades menores acima.
 */
export interface CanvasInteractionPort
  extends CanvasHouseRuntimeHandle,
    CanvasDocumentHandle,
    CanvasDebugHandle,
    CanvasSnapshotHandle,
    CanvasHistoryHandle,
    CanvasObjectCreationHandle,
    CanvasSurfaceHandle,
    CanvasScreenProjectionHandle,
    CanvasEditorVisualHandle,
    CanvasViewportHandle {
}

export type CanvasHandle = CanvasInteractionPort;
