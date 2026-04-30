import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import {houseManagerReadPort} from '@/infra/house/house-manager-read-adapter.ts';
import {houseManagerWritePort} from '@/infra/house/house-manager-write-adapter.ts';
import {houseManagerRuntimePort} from '@/infra/house/house-manager-runtime-adapter.ts';
import {
  houseManagerRuntimeSnapshotPort,
  houseManagerStatePort,
} from '@/infra/house/house-manager-state-adapter.ts';
import {house3DProjectionPort} from '@/infra/house/house-3d-projection-adapter.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

export interface EditorPorts {
  houseReadPort: HouseReadPort<CanvasGroup>;
  houseWritePort: HouseWritePort<CanvasGroup>;
  houseRuntimePort: HouseRuntimePort;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<CanvasGroup>;
  house3DProjectionPort: House3DProjectionPort;
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
 * Compõe as portas atuais do editor.
 *
 * A implementação ainda usa adapters sobre o houseManager, mas o restante da aplicação
 * passa a depender deste ponto de composição em vez de importar singletons.
 */
export function createEditorPorts(): EditorPorts {
  return {
    houseReadPort: houseManagerReadPort,
    houseWritePort: houseManagerWritePort,
    houseRuntimePort: houseManagerRuntimePort,
    houseStatePort: houseManagerStatePort,
    houseRuntimeSnapshotPort: houseManagerRuntimeSnapshotPort,
    house3DProjectionPort,
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
