import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';

/**
 * Porta de leitura reativa do snapshot visual da casa.
 *
 * Use este contrato apenas em fluxos que precisam das vistas já resolvidas
 * para grupos do runtime visual ativo.
 */
export interface HouseRuntimeSnapshotPort<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  /** Assina mudanças no snapshot de runtime da casa. */
  subscribe(listener: () => void): () => void;

  /** Retorna o snapshot de runtime atual da casa, quando existir. */
  getRuntimeSnapshot(): HouseRuntimeSnapshot<TGroup> | null;
}
