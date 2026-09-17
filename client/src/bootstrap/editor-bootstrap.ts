import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/editor-state-store.ts';
import {
  createEditorPorts,
  type EditorPorts,
} from '@/bootstrap/editor-ports-composition.ts';

export {
  createEditorPorts,
  type CreateEditorPortsArgs,
  type EditorPorts,
} from '@/bootstrap/editor-ports-composition.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

export const EditorPortsContext = createContext<EditorPorts | null>(null);

/**
 * Cria uma instância isolada do store serializável do editor.
 *
 * O bootstrap centraliza a composição para evitar singletons implícitos na UI
 * e permitir substituir adapters de infraestrutura sem tocar nos componentes.
 */
export function createEditorStore(): EditorStore {
  return new EditorStore();
}

export function useEditorStore(): EditorStore {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within RacEditorStoreProvider.');
  }
  return store;
}

export function useEditorPorts(): EditorPorts {
  const ports = useContext(EditorPortsContext);
  if (!ports) {
    throw new Error('useEditorPorts must be used within RacEditorStoreProvider.');
  }
  return ports;
}
