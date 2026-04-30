import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

/**
 * Porta de leitura reativa do snapshot da casa exposto ao editor.
 *
 * O estado canônico permanece lógico; este contrato entrega o snapshot de
 * runtime porque a UI atual ainda consome grupos concretos em alguns fluxos.
 */
export interface HouseStatePort<TGroup = unknown> {
  /** Assina mudanças no snapshot da casa. */
  subscribe(listener: () => void): () => void;

  /** Retorna o snapshot atual da casa, quando existir. */
  getSnapshot(): HouseRuntimeSnapshot<TGroup> | null;
}
