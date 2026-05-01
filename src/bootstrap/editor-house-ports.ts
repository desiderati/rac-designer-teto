import {createCanvasHouseController} from '@/components/rac-editor/@canvas/lib/canvas-house-controller.ts';
import {createCanvasHouse3DProjectionPort} from '@/components/rac-editor/@canvas/lib/canvas-house-3d-projection-port.ts';
import {InMemoryHousePersistenceAdapter} from '@/infra/persistence/in-memory-house-persistence.adapter.ts';
import {readProjectsStorage, writeProjectsStorage} from '@/infra/storage/projects.storage.ts';
import {
  createEditorHouseReadPort,
  createEditorHouseRuntimePort,
  createEditorHouseStatePorts,
  createEditorHouseWritePort,
  type EditorHouseReadSource,
  type EditorHouseRuntimeSource,
  type EditorHouseStateSource,
  type EditorHouseWriteSource,
} from '@/bootstrap/editor-house-port-adapters.ts';
import {createProjectSession} from '@/components/rac-editor/lib/project-session.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {EditorSettingsPort} from '@/components/rac-editor/ports/EditorSettingsPort.ts';
import {createDefaultEditorSettingsPort} from '@/bootstrap/editor-infra-ports.ts';

type EditorHousePortsSource<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> =
  & EditorHouseReadSource<TGroup>
  & EditorHouseWriteSource
  & EditorHouseRuntimeSource<TGroup>
  & EditorHouseStateSource<TGroup>;

export interface EditorHousePorts<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  houseRuntimePort: HouseRuntimePort<TGroup>;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<TGroup>;
  house3DProjectionPort: House3DProjectionPort;
}

interface CreateDefaultEditorHousePortsArgs {
  settingsPort?: EditorSettingsPort;
}

export function createEditorHousePorts<TGroup extends HouseRuntimeGroupRef>(
  source: EditorHousePortsSource<TGroup>,
  house3DProjectionPort: House3DProjectionPort,
): EditorHousePorts<TGroup> {
  const {
    houseStatePort,
    houseRuntimeSnapshotPort,
  } = createEditorHouseStatePorts(source);

  return {
    houseReadPort: createEditorHouseReadPort(source),
    houseWritePort: createEditorHouseWritePort(source),
    houseRuntimePort: createEditorHouseRuntimePort(source),
    houseStatePort,
    houseRuntimeSnapshotPort,
    house3DProjectionPort,
  };
}

export function createDefaultEditorHousePorts({
  settingsPort = createDefaultEditorSettingsPort(),
}: CreateDefaultEditorHousePortsArgs = {}): EditorHousePorts {
  const controller = createCanvasHouseController({
    persistence: new InMemoryHousePersistenceAdapter(),
    settingsPort,
    projectSession: createProjectSession({
      read: readProjectsStorage,
      write: writeProjectsStorage,
    }),
  });

  return createEditorHousePorts(
    controller,
    createCanvasHouse3DProjectionPort(() => controller.getHouse()),
  );
}
