import {type ReactNode, useRef} from 'react';
import {
  createEditorPorts,
  createEditorStore,
  EditorPorts,
  EditorPortsContext,
  EditorStoreContext,
} from '@/bootstrap/editor-bootstrap.ts';
import type {EditorStore} from '@/components/rac-editor/store/editor-state-store.ts';

interface RacEditorStoreProviderProps {
  children: ReactNode;
  store?: EditorStore;
  ports?: EditorPorts;
}

/**
 * Provider do store serializável do editor.
 *
 * A instância é criada uma vez por árvore React e injetada por contexto, sem
 * singleton de módulo. Isso permite testes com stores isolados e prepara a
 * migração de bindings UI/canvas para commands.
 */
export function RacEditorStoreProvider({children, store, ports}: RacEditorStoreProviderProps) {
  const storeRef = useRef<EditorStore | null>(null);
  const portsRef = useRef<EditorPorts | null>(null);

  if (!storeRef.current) {
    storeRef.current = store ?? createEditorStore();
  }

  if (!portsRef.current) {
    portsRef.current = ports ?? createEditorPorts();
  }

  return (
    <EditorPortsContext.Provider value={portsRef.current}>
      <EditorStoreContext.Provider value={storeRef.current}>
        {children}
      </EditorStoreContext.Provider>
    </EditorPortsContext.Provider>
  );
}
