import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

/**
 * Cria uma instância isolada do store serializável do editor.
 *
 * O bootstrap centraliza a composição para evitar singletons implícitos na UI
 * e permitir substituir adapters legados sem tocar nos componentes.
 */
export function createEditorStore(): EditorStore {
  return new EditorStore();
}

export function useEditorStore(): EditorStore {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within EditorStoreProvider.');
  }
  return store;
}
