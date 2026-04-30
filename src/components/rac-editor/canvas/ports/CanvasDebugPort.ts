import type {CanvasObject} from '@/components/rac-editor/canvas/lib';

export interface CanvasObjectSummary {
  /** Tipo nativo ou lógico do objeto selecionado no canvas. */
  type: string | null;

  /** Tipo de domínio visual usado pelo editor RAC, quando existir. */
  myType: string | null;
}

export interface ActiveCanvasObjectSummary extends CanvasObjectSummary {
  /** Texto editável associado ao objeto ativo, quando existir. */
  labelText: string | null;

  /** Cor principal associada ao objeto ativo, quando existir. */
  color: string | null;
}

/**
 * Porta de inspeção para o bridge DEV do editor.
 *
 * Mantém operações auxiliares de diagnóstico fora do contrato público normal
 * do editor e evita expor o runtime Fabric inteiro.
 */
export interface CanvasDebugPort {
  /** Retorna o centro visível do canvas em coordenadas de tela. */
  getCanvasScreenCenter(): { x: number; y: number } | null;

  /** Remove um objeto específico do canvas e informa se a remoção aconteceu. */
  removeObject(object: CanvasObject): boolean;

  /** Seleciona um objeto pelo tipo lógico usado pelo editor. */
  selectObjectByMyType(myType: string, fromEnd?: boolean, triggerInlineEditor?: boolean): boolean;

  /** Retorna um resumo seguro do objeto atualmente ativo no canvas. */
  getActiveObjectSummary(): ActiveCanvasObjectSummary | null;

  /** Retorna um resumo seguro dos objetos presentes no canvas. */
  getObjectsSummary(): CanvasObjectSummary[] | null;
}
