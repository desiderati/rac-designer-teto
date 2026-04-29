import {type ReactNode, useRef} from 'react';
import {
  createEditorStore,
  EditorStoreContext,
} from '@/bootstrap/editor-bootstrap.ts';
import type {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';

interface EditorStoreProviderProps {
  children: ReactNode;
  store?: EditorStore;
}

/**
 * Provider do store serializável do editor.
 *
 * A instância é criada uma vez por árvore React e injetada por contexto, sem
 * singleton de módulo. Isso permite testes com stores isolados e prepara a
 * migração de bindings UI/canvas para commands.
 */
export function EditorStoreProvider({children, store}: EditorStoreProviderProps) {
  const storeRef = useRef<EditorStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = store ?? createEditorStore();
  }

  return (
    <EditorStoreContext.Provider value={storeRef.current}>
      {children}
    </EditorStoreContext.Provider>
  );
}
