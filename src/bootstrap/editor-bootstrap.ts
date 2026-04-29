import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseReadPort} from '@/components/rac-editor/store/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/store/HouseWritePort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/store/HouseRuntimePort.ts';
import type {HouseStatePort} from '@/components/rac-editor/store/HouseStatePort.ts';
import {houseManagerReadPort} from '@/infra/house/house-manager-read-adapter.ts';
import {houseManagerWritePort} from '@/infra/house/house-manager-write-adapter.ts';
import {houseManagerRuntimePort} from '@/infra/house/house-manager-runtime-adapter.ts';
import {houseManagerStatePort} from '@/infra/house/house-manager-state-adapter.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

export interface EditorPorts {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort<CanvasGroup>;
  houseRuntimePort: HouseRuntimePort;
  houseStatePort: HouseStatePort<CanvasGroup>;
}

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

/**
 * Compoe as portas atuais do editor.
 *
 * A implementacao ainda usa adapters sobre o houseManager, mas o restante da aplicacao
 * passa a depender deste ponto de composicao em vez de importar singletons.
 */
export function createEditorPorts(): EditorPorts {
  return {
    houseReadPort: houseManagerReadPort,
    houseWritePort: houseManagerWritePort,
    houseRuntimePort: houseManagerRuntimePort,
    houseStatePort: houseManagerStatePort,
  };
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
