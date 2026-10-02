import type {ReactNode} from 'react';
import {createRef} from 'react';
import {render} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {HOUSE_3D_WALL_COLOR_BY_NAME} from '@/shared/config.ts';
import {House3DPdfSnapshot} from '@/components/rac-editor/@viewer-3d/ui/House3DPdfSnapshot.tsx';
import {
  getHouse3DViewerPreferencesStorageKey,
  writeHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import {EditorPortsContext, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';

const snapshotMocks = vi.hoisted(() => ({
  sceneProps: null as Record<string, unknown> | null,
  projection: null as Record<string, unknown> | null,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({children}: { children: ReactNode }) => {
    const renderableChildren = Array.isArray(children)
      ? children.filter((child) => typeof (child as { type?: unknown })?.type === 'function')
      : children;

    return <div data-testid='pdf-snapshot-canvas'>{renderableChildren}</div>;
  },
  useThree: () => ({
    gl: {
      render: vi.fn(),
      domElement: {toDataURL: vi.fn(() => 'data:image/png;base64,3d')},
    },
    scene: {},
    camera: {},
    invalidate: vi.fn(),
  }),
}));

vi.mock('@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts', () => ({
  buildHouse3DViewerModel: (projection: Record<string, unknown>) => {
    snapshotMocks.projection = projection;
    return {
      houseType: projection.houseType,
      canRenderHouse: projection.hasHouseViews,
      pilotis: projection.pilotis,
      tipo6FrontSide: 'top',
      tipo3OpenSide: null,
      contraventamentos: [],
      stairs: null,
    };
  },
  useHouse3DViewerModel: () => ({
    houseType: 'tipo6',
    canRenderHouse: true,
    pilotis: {},
    tipo6FrontSide: 'top',
    tipo3OpenSide: null,
    contraventamentos: [],
    stairs: null,
  }),
}));

vi.mock('@/components/rac-editor/@viewer-3d/ui/House3DViewerCameraRig.tsx', () => ({
  House3DViewerCameraRig: () => null,
}));

vi.mock('@/components/rac-editor/@viewer-3d/ui/House3DScene.tsx', () => ({
  House3DScene: (props: Record<string, unknown>) => {
    snapshotMocks.sceneProps = props;
    return <div data-testid='house-3d-scene'/>;
  },
}));

describe('House3DPdfSnapshot.tsx', () => {
  beforeEach(() => {
    localStorage.clear();
    snapshotMocks.sceneProps = null;
    snapshotMocks.projection = null;
  });

  it('usa a cor persistida no viewer e mantém ocultação abaixo do terreno no PDF', () => {
    const storageKey = getHouse3DViewerPreferencesStorageKey('house_1');
    writeHouse3DViewerPreferences(storageKey, {
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Verde,
      hideBelowTerrain: false,
    });

    render(<House3DPdfSnapshot ref={createRef<House3DPdfSnapshotHandle>()} activeHouseId='house_1'/>);

    expect(snapshotMocks.sceneProps).toMatchObject({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Verde,
      hideBelowTerrain: true,
    });
  });

  it('prefere a cor do documento ativo após importação em outro dispositivo', () => {
    writeHouse3DViewerPreferences(getHouse3DViewerPreferencesStorageKey('house_1'), {
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Verde, hideBelowTerrain: false,
    });
    const ports = {houseDrawingDocumentPort: {getViewer3D: () => ({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa, hideBelowTerrain: true, cameraPose: null,
    })}} as unknown as EditorPorts;

    render(
      <EditorPortsContext.Provider value={ports}>
        <House3DPdfSnapshot ref={createRef<House3DPdfSnapshotHandle>()} activeHouseId='house_1'/>
      </EditorPortsContext.Provider>,
    );
    expect(snapshotMocks.sceneProps).toMatchObject({wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa});
  });

  it('usa a cor e os pilotis do documento de outra casa sem ler a casa ativa', () => {
    const document = {
      house: {
        id: 'house_2', houseType: 'tipo6',
        pilotis: {piloti_0_0: {height: 2, isMaster: true, nivel: 0.2}},
        sideMappings: {top: 'front', bottom: null, left: null, right: null},
        views: {top: [{instanceId: 'top_2'}], front: [], back: [], side1: [], side2: []},
      },
      canvas: {objects: [{kind: 'house', metadata: {houseInstanceId: 'top_2'}, children: [{
        metadata: {isContraventamento: true, contraventamentoId: 'bracing_2', contraventamentoCol: 0},
      }]}]},
      viewer3D: {cameraPose: null, wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa, hideBelowTerrain: false},
    } as unknown as Parameters<typeof House3DPdfSnapshot>[0]['document'];

    render(<House3DPdfSnapshot ref={createRef<House3DPdfSnapshotHandle>()} activeHouseId='house_2' document={document}/>);

    expect(snapshotMocks.projection?.pilotis).toEqual(document?.house.pilotis);
    expect(snapshotMocks.projection?.topView).toMatchObject({
      contraventamentos: [{id: 'bracing_2', col: 0}],
    });
    expect(snapshotMocks.sceneProps).toMatchObject({
      wallColor: HOUSE_3D_WALL_COLOR_BY_NAME.Rosa,
      hideBelowTerrain: true,
    });
  });
});
