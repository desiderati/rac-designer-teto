import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createDefaultEditorHousePorts, type EditorHousePorts} from '@/bootstrap/editor-house-ports.ts';
import type {StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';
import {HOUSE_DRAWING_CANVAS_SCHEMA_VERSION} from '@/shared/types/house-drawing-document.ts';

function createCanvasPort() {
  return {
    requestRenderAll: vi.fn(),
    includesGroup: vi.fn(() => true),
    getHouseGroups: vi.fn(() => []),
  };
}

function createConstructionSiteSessionStorage(initialConstructionSites: StoredConstructionSitesDocument['constructionSites'] = []) {
  let constructionSites = initialConstructionSites;

  return {
    read: vi.fn(() => ({version: 1, constructionSites})),
    write: vi.fn((nextConstructionSites: StoredConstructionSitesDocument['constructionSites']) => {
      constructionSites = nextConstructionSites;
    }),
  };
}

function createEditorHousePortsWithActiveHouse() {
  const ports = createDefaultEditorHousePorts({
    constructionSiteSessionStorage: createConstructionSiteSessionStorage(),
  });

  ports.constructionSiteManagementPort.createConstructionSite({
    externalCode: 'CC2603',
    constructionDate: '2026-05-11',
    communityName: 'Tiradentes',
  });
  ports.constructionSiteManagementPort.createHouse({
    familyName: 'Familia teste',
  });
  ports.houseWritePort.resetHouse();

  return ports;
}

describe('editor house ports', () => {
  let ports: EditorHousePorts;

  beforeEach(() => {
    ports = createEditorHousePortsWithActiveHouse();
  });

  it('aplica setup de pilotis sem alterar a família associada à casa ativa', () => {
    ports.houseWritePort.applyPilotisSetup({
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(ports.houseReadPort.getFamilyName()).toBe('Familia teste');
    expect([...ports.houseReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normaliza terreno pela porta de escrita', () => {
    const normalized = ports.houseWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(ports.houseReadPort.getTerrainType()).toBe(5);
  });

  it('expoe leituras de vistas pela porta de leitura', () => {
    ports.houseWritePort.setHouseType('tipo6');

    expect(ports.houseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(ports.houseReadPort.isViewAtLimit('front')).toBe(false);
    expect(ports.houseReadPort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });

  it('inicializa o runtime da casa por porta dedicada', () => {
    ports.houseRuntimePort.initializeCanvas(createCanvasPort());

    expect(ports.houseRuntimeSnapshotPort.getRuntimeSnapshot()).not.toBeNull();
  });

  it('nao expoe rebuild canvas -> casa como porta de aplicacao', () => {
    expect('rebuildHouseFromCanvas' in ports.houseWritePort).toBe(false);
    expect('houseCanvasReconciliationPort' in ports).toBe(false);
  });

  it('emite alteracoes de estado sem expor o singleton a UI', () => {
    const listener = vi.fn();
    const unsubscribe = ports.houseStatePort.subscribe(listener);

    ports.houseWritePort.setHouseType('tipo6');

    expect(listener).toHaveBeenCalled();
    expect(ports.houseStatePort.getStateSnapshot()?.houseType).toBe('tipo6');
    expect(ports.houseRuntimeSnapshotPort.getRuntimeSnapshot()?.houseType).toBe('tipo6');
    unsubscribe();
  });

  it('cria instancias isoladas para providers diferentes', () => {
    const firstPorts = createEditorHousePortsWithActiveHouse();
    const secondPorts = createEditorHousePortsWithActiveHouse();

    firstPorts.houseWritePort.setHouseType('tipo6');

    expect(firstPorts.houseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(secondPorts.houseReadPort.getCurrentHouseType()).toBeNull();
  });

  it('exporta e importa documento canonico da casa ativa', () => {
    ports.houseWritePort.setHouseType('tipo6');
    const document = ports.houseDrawingDocumentPort.exportHouseDrawingDocument({
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    });

    expect(document?.house?.houseType).toBe('tipo6');

    ports.houseWritePort.setHouseType('tipo3');
    ports.houseDrawingDocumentPort.importHouseDrawingDocument(document!);

    expect(ports.houseReadPort.getCurrentHouseType()).toBe('tipo6');
  });

  it('expõe gerenciamento de Construção TETO sem acessar a sessão concreta', () => {
    const ports = createDefaultEditorHousePorts({
      constructionSiteSessionStorage: createConstructionSiteSessionStorage(),
    });
    const listener = vi.fn();
    const unsubscribe = ports.constructionSiteManagementPort.subscribe(listener);

    ports.constructionSiteManagementPort.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });

    expect(listener).toHaveBeenCalledTimes(1);

    const createdMonitor = ports.constructionSiteManagementPort.createMonitor({
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
    });
    ports.constructionSiteManagementPort.inactivateMonitor(createdMonitor.id);

    expect(ports.constructionSiteManagementPort.getConstructionSiteSnapshot()?.monitors[0]).toMatchObject({
      id: createdMonitor.id,
      status: 'inactive',
    });

    ports.constructionSiteManagementPort.reactivateMonitor(createdMonitor.id);

    const createdHouse = ports.constructionSiteManagementPort.createHouse({
      familyName: 'Família 02',
      houseType: 'tipo6',
    });

    expect(ports.constructionSiteManagementPort.getConstructionSiteSnapshot()?.monitors[0]).toMatchObject({
      id: createdMonitor.id,
      status: 'active',
    });
    expect(ports.constructionSiteManagementPort.getConstructionSiteSnapshot()?.constructionSite.activeHouseId).toBe(createdHouse.id);
    expect(ports.constructionSiteManagementPort.getConstructionSiteSnapshot()?.houses[0]?.houseType).toBe('tipo6');
    expect(ports.houseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(ports.constructionSiteManagementPort.getConstructionSiteSummaries()).toHaveLength(1);
    ports.constructionSiteManagementPort.archiveHouse(createdHouse.id);
    expect(ports.constructionSiteManagementPort.canOpenRacEditor()).toBe(false);
    ports.constructionSiteManagementPort.unarchiveHouse(createdHouse.id);
    expect(ports.constructionSiteManagementPort.canOpenRacEditor()).toBe(true);
    expect(listener.mock.calls.length).toBeGreaterThan(1);

    unsubscribe();
  });
});
