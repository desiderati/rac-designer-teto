import {createCanvasHouseController} from '@/components/rac-editor/@canvas/lib/canvas-house-controller.ts';
import {createCanvasHouse3DProjectionPort} from '@/components/rac-editor/@canvas/lib/canvas-house-3d-projection-port.ts';
import {InMemoryHousePersistenceAdapter} from '@/infra/persistence/in-memory-house-persistence.adapter.ts';
import {readConstructionSitesStorage, writeConstructionSitesStorage} from '@/infra/storage/construction-sites.storage.ts';
import {
  createEditorHouseDrawingDocumentPort,
  createEditorHouseReadPort,
  createEditorHouseRuntimePort,
  createEditorHouseStatePorts,
  createEditorHouseWritePort,
  createEditorConstructionSiteManagementPort,
  type EditorHouseDocumentSource,
  type EditorHouseReadSource,
  type EditorHouseRuntimeSource,
  type EditorHouseStateSource,
  type EditorHouseWriteSource,
  type EditorConstructionSiteManagementSource,
} from '@/bootstrap/editor-house-port-adapters.ts';
import {createConstructionSiteSession} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteSessionStoragePort} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {ConstructionSiteManagementPort} from '@/components/construction-site/ports/ConstructionSiteManagementPort.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';
import {createDefaultSettingsPort} from '@/bootstrap/editor-infra-ports.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';

type EditorHousePortsSource<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> =
  & EditorHouseReadSource<TGroup>
  & EditorHouseWriteSource
  & EditorHouseRuntimeSource<TGroup>
  & EditorHouseStateSource<TGroup>
  & EditorHouseDocumentSource
  & EditorConstructionSiteManagementSource;

export interface EditorHousePorts<TGroup extends HouseRuntimeGroupRef = HouseRuntimeGroupRef> {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  houseRuntimePort: HouseRuntimePort<TGroup>;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<TGroup>;
  house3DProjectionPort: House3DProjectionPort;
  houseDrawingDocumentPort: HouseDrawingDocumentPort;
  constructionSiteManagementPort: ConstructionSiteManagementPort;
}

interface CreateDefaultEditorHousePortsArgs {
  settingsPort?: SettingsPort;
  constructionSiteSessionStorage?: ConstructionSiteSessionStoragePort;
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
    houseDrawingDocumentPort: createEditorHouseDrawingDocumentPort(source),
    constructionSiteManagementPort: createEditorConstructionSiteManagementPort(source),
  };
}

export function createDefaultEditorHousePorts({
  settingsPort = createDefaultSettingsPort(),
  constructionSiteSessionStorage,
}: CreateDefaultEditorHousePortsArgs = {}): EditorHousePorts {
  const controller = createCanvasHouseController({
    persistence: new InMemoryHousePersistenceAdapter(),
    settingsPort,
    constructionSiteSession: createConstructionSiteSession(constructionSiteSessionStorage ?? {
      read: readConstructionSitesStorage,
      write: writeConstructionSitesStorage,
    }),
  });

  return createEditorHousePorts(
    controller,
    createCanvasHouse3DProjectionPort(() => controller.getHouse()),
  );
}
