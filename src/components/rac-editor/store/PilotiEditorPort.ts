import type {EditorPilotiId} from '@/components/rac-editor/canvas/store/types.ts';

export interface EditorPilotiData {
  pilotiId: EditorPilotiId;
  height: number;
  isMaster: boolean;
  nivel: number;
}

export interface UpdateEditorPilotiPatch {
  height?: number;
  isMaster?: boolean;
  nivel?: number;
}

/**
 * Porta de aplicação usada pelo editor de piloti.
 *
 * A UI precisa ler e alterar dados de piloti, mas não deve saber se a fonte
 * atual é um adapter de infraestrutura, storage, worker ou outro mecanismo. A porta mantém
 * esse fluxo testável sem carregar objetos do runtime gráfico.
 */
export interface PilotiEditorPort {
  getSelectedPilotiHeights(): readonly number[];
  getPilotiData(pilotiId: EditorPilotiId): EditorPilotiData;
  updatePiloti(pilotiId: EditorPilotiId, patch: UpdateEditorPilotiPatch): EditorPilotiData;
}
