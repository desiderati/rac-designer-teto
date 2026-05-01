import type {GenericCanvasObjectEditorType} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';

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
