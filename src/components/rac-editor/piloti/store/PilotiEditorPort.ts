import type {EditorPilotiId} from '@/components/rac-editor/canvas/store/types.ts';

/**
 * Dados serializáveis que o editor de piloti precisa para renderizar e navegar.
 */
export interface EditorPilotiData {
  pilotiId: EditorPilotiId;
  height: number;
  isMaster: boolean;
  nivel: number;
}

/**
 * Patch aplicado pelo editor de piloti ao confirmar altura, mestre ou nível.
 */
export interface UpdateEditorPilotiPatch {
  height?: number;
  isMaster?: boolean;
  nivel?: number;
}

/**
 * Porta de aplicação usada pelo editor de piloti.
 *
 * A UI precisa ler e alterar dados de piloti, mas não deve saber se a fonte
 * atual é um adapter de infraestrutura, storage, worker ou outro mecanismo.
 * A porta mantém esse fluxo testável sem carregar objetos do runtime gráfico.
 *
 * Este contrato fica no slice `piloti` porque serve ao editor especializado de
 * piloti, não ao store genérico de interação do RAC editor.
 */
export interface PilotiEditorPort {
  /** Alturas disponíveis para a família selecionada. */
  getSelectedPilotiHeights(): readonly number[];
  /** Lê os dados atuais de um piloti específico. */
  getPilotiData(pilotiId: EditorPilotiId): EditorPilotiData;
  /** Atualiza o piloti e devolve o estado efetivamente aplicado. */
  updatePiloti(pilotiId: EditorPilotiId, patch: UpdateEditorPilotiPatch): EditorPilotiData;
}
