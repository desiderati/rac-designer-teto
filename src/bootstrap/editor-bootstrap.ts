import {createContext, useContext} from 'react';
import {EditorStore} from '@/components/rac-editor/store/EditorStateStore.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {
  HouseCanvasReconciliationPort,
  HouseWritePort,
} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';
import type {EditorSettingsPort} from '@/components/rac-editor/ports/EditorSettingsPort.ts';
import type {TutorialProgressPort} from '@/components/rac-editor/ports/TutorialProgressPort.ts';
import {createDefaultEditorHousePorts} from '@/bootstrap/editor-house-ports.ts';
import {createDefaultEditorSettingsPort, createDefaultTutorialProgressPort} from '@/bootstrap/editor-infra-ports.ts';

export const EditorStoreContext = createContext<EditorStore | null>(null);

export interface EditorPorts {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  houseCanvasReconciliationPort: HouseCanvasReconciliationPort;
  houseRuntimePort: HouseRuntimePort;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort;
  house3DProjectionPort: House3DProjectionPort;
  houseDrawingDocumentPort: HouseDrawingDocumentPort;
  settingsPort: EditorSettingsPort;
  tutorialProgressPort: TutorialProgressPort;
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
export function createEditorPorts(): EditorPorts {
  const settingsPort = createDefaultEditorSettingsPort();
  const tutorialProgressPort = createDefaultTutorialProgressPort();
  const housePorts = createDefaultEditorHousePorts({settingsPort});

  return {
    ...housePorts,
    settingsPort,
    tutorialProgressPort,
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
