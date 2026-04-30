import type {CanvasGroup, CanvasObject, ElementStrategyKey,} from '@/components/rac-editor/canvas/lib';
import type {EditorScreenPoint} from '@/components/rac-editor/canvas/store/types.ts';
import type {GenericObjectEditorType} from '@/components/rac-editor/canvas/lib/generic-object-editor-strategy.ts';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasDebugPort} from '@/components/rac-editor/canvas/ports/CanvasDebugPort.ts';
import type {CanvasDocumentPort} from '@/components/rac-editor/canvas/ports/CanvasDocumentPort.ts';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/canvas/ports/CanvasHouseRuntimePort.ts';
import type {CanvasSnapshotPort} from '@/components/rac-editor/canvas/ports/CanvasSnapshotPort.ts';

/**
 * Porta imperativa exposta pelo canvas para os controladores do editor.
 */
export interface CanvasInteractionPort {
  /** Cria a porta de runtime da casa apoiada no canvas atual. */
  createCanvasHouseRuntimePort(): CanvasHouseRuntimePort | null;

  /** Cria a porta documental do canvas para importação/exportação. */
  createDocumentPort(): CanvasDocumentPort | null;

  /** Cria a porta de diagnóstico do canvas para ferramentas DEV. */
  createDebugPort(): CanvasDebugPort | null;

  /** Cria a porta de inserção de snapshots visuais no canvas. */
  createSnapshotPort(): CanvasSnapshotPort | null;

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

  /** Cria um objeto visual de elemento sem adicioná-lo automaticamente ao canvas. */
  createElementObject(kind: ElementStrategyKey): CanvasObject | null;

  /** Cria o grupo visual de uma vista da casa sem registrá-lo automaticamente. */
  createHouseViewGroup(payload: { viewType: HouseViewType; side?: HouseSide }): CanvasGroup | null;

  /** Adiciona um objeto visual no centro visível do canvas. */
  addObjectAtVisibleCenter(object: CanvasObject): boolean;

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

  /** Converte um ponto do canvas para coordenadas de tela. */
  getCanvasPointScreenPosition(point: EditorScreenPoint): EditorScreenPoint | null;

  /** Converte um ponto local de grupo para coordenadas de tela. */
  getGroupLocalPointScreenPosition(
    group: CanvasGroup,
    localCanvasPoint: EditorScreenPoint,
  ): EditorScreenPoint | null;

  /** Aplica alterações de editor genérico em objetos lineares ou paredes. */
  applyGenericObjectEdit(payload: {
    /** Tipo de editor genérico que determina a estratégia de aplicação. */
    kind: GenericObjectEditorType;

    /** Objeto visual que receberá a alteração. */
    object: CanvasObject;

    /** Cor final a ser aplicada ao objeto editado. */
    color: string;

    /** Rótulo textual final a ser aplicado ao objeto editado. */
    label: string;
  }): string | null;

  /** Restaura visuais temporários aplicados pelo editor de piloti ao fechar. */
  applyPilotiEditorCloseVisuals(group: CanvasGroup | null | undefined): void;

  /** Aplica destaque visual ao piloti informado. */
  applyPilotiSelectionVisuals(pilotiId: string): void;

  /** Retorna o centro visível do canvas em coordenadas lógicas. */
  getVisibleCenter(): EditorScreenPoint;

  /** Retorna posição e zoom atuais do canvas. */
  getCanvasPosition(): { x: number; y: number; zoom: number };

  /** Define a posição lógica atual da viewport do canvas. */
  setCanvasPosition(x: number, y: number): void;

  /** Ajusta a viewport para enquadrar o canvas na área visível. */
  fitToView(): void;
}

export type CanvasHandle = CanvasInteractionPort;
