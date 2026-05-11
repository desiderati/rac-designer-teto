import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/editor-state-store.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';
import type {ConstructionSiteManagementPort} from '@/components/construction-site/ports/ConstructionSiteManagementPort.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';
import {createDefaultEditorHousePorts} from '@/bootstrap/editor-house-ports.ts';
import {createDefaultSettingsPort} from '@/bootstrap/editor-infra-ports.ts';
import type {ConstructionSiteSessionStoragePort} from '@/components/rac-editor/lib/construction-site-session.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

export interface EditorPorts {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  houseRuntimePort: HouseRuntimePort;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort;
  house3DProjectionPort: House3DProjectionPort;
  houseDrawingDocumentPort: HouseDrawingDocumentPort;
  constructionSiteManagementPort: ConstructionSiteManagementPort;
  settingsPort: SettingsPort;
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
 * A implementação ainda usa adapters compostos no bootstrap, mas o restante da aplicação
 * passa a depender deste ponto de composição em vez de importar singletons.
 */
interface CreateEditorPortsArgs {
  constructionSiteSessionStorage?: ConstructionSiteSessionStoragePort;
}

export function createEditorPorts(args: CreateEditorPortsArgs = {}): EditorPorts {
  const settingsPort = createDefaultSettingsPort();
  const housePorts = createDefaultEditorHousePorts({
    settingsPort,
    constructionSiteSessionStorage: args.constructionSiteSessionStorage,
  });

  return {
    ...housePorts,
    settingsPort,
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
