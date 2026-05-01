import {createCanvasHouseController} from '@/components/rac-editor/@canvas/lib/canvas-house-controller.ts';
import {
  createHouse3DProjectionPort,
  createEditorHouseReadPort,
  createEditorHouseRuntimePort,
  createEditorHouseStatePorts,
  createEditorHouseWritePort,
  type EditorHouseReadSource,
  type EditorHouseRuntimeSource,
  type EditorHouseStateSource,
  type EditorHouseWriteSource,
} from '@/bootstrap/editor-house-port-adapters.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

type EditorHousePortsSource =
  & EditorHouseReadSource
  & EditorHouseWriteSource
  & EditorHouseRuntimeSource
  & EditorHouseStateSource;

export interface EditorHousePorts {
  houseReadPort: HouseReadPort;
  houseWritePort: HouseWritePort;
  houseRuntimePort: HouseRuntimePort<CanvasGroup>;
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<CanvasGroup>;
  house3DProjectionPort: House3DProjectionPort;
}

export function createEditorHousePorts(source: EditorHousePortsSource): EditorHousePorts {
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
    house3DProjectionPort: createHouse3DProjectionPort(() => source.getHouse()),
  };
}

export function createDefaultEditorHousePorts(): EditorHousePorts {
  return createEditorHousePorts(createCanvasHouseController());
}
