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

export interface CreateEditorPortsArgs {
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
