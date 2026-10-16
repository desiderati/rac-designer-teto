import {describe, expect, it, vi} from 'vitest';
import {createConstructionSiteSession, type StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';
import {DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {getHousePresentationStatus} from './house-status.ts';
import {
  addFieldAnalysisContraventamento, configureHouseFieldAnalysis, getFieldAnalysisDestinations,
  getHouseFieldAnalysisDisabledReason, normalizeHouseFieldAnalysis, removeFieldAnalysisContraventamento,
  updateFieldAnalysisPiloti,
} from './house-field-analysis.ts';

function setup() {
  let stored: StoredConstructionSitesDocument = {version: 1, constructionSites: []};
  const storage = {read: () => structuredClone(stored), write: vi.fn((sites) => {
    stored = {version: 1, constructionSites: structuredClone(sites)};
  })};
  const session = createConstructionSiteSession(storage);
  const site = session.createConstructionSite({externalCode: 'CC2603', communityName: 'Campo', constructionDate: '2026-10-03'});
  const house = session.createHouse({familyName: 'Família A'});
  const draft = configureHouseFieldAnalysis(session.getHouseFieldAnalysis(site.constructionSite.id, house.id), {
    houseType: 'tipo3', initialSide: 'left', selectedPilotiHeights: [...DEFAULT_HOUSE_PILOTI_HEIGHTS],
  });
  return {session, storage, site, house, draft};
}

describe('Análise de Campo: preparação persistida e domínio', () => {
  it('A-013/A-020 redefine somente a configuração e as vistas, preservando objetos e família', () => {
    const {session, storage, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.views.top.push({instanceId: 'top_test'});
    document.house.views.front.push({instanceId: 'front_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group'}, {id: 'tree', kind: 'element', shape: 'circle', geometry: {left: 31, top: 42}});
    session.saveActiveHouseDrawingDocument(document);
    session.markHouseRacPrinted(house.id);
    const tree = structuredClone(house.drawingDocument.canvas.objects.find((object) => object.id === 'tree'));
    session.resetHouseDefinition(house.id);
    expect(getHousePresentationStatus(house)).toBe('initial');
    expect(house.houseType).toBeNull();
    expect(house.fieldAnalysis).toBeUndefined();
    expect(house.lastRacExportedAt).toBeUndefined();
    expect(Object.values(house.drawingDocument.house!.views).flat()).toEqual([]);
    expect(house.drawingDocument.views).toEqual({});
    expect(house.drawingDocument.canvas.objects).toEqual([tree]);
    expect(session.getActiveFamily().name).toBe('Família A');
    expect(getHousePresentationStatus(createConstructionSiteSession(storage).getActiveHouse())).toBe('initial');
  });

  it('A-013 reverte a redefinição se a persistência falhar', () => {
    const {session, storage, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const before = structuredClone(house);
    storage.write.mockImplementationOnce(() => {throw new Error('disco cheio');});
    expect(() => session.resetHouseDefinition(house.id)).toThrow('disco cheio');
    expect(house).toEqual(before);
  });

  it('A-002/A-010 abre casa impressa sem alterar dados e persiste edição sem remover as vistas', () => {
    const {session, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.views.top.push({instanceId: 'top_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group'});
    session.saveActiveHouseDrawingDocument(document);
    session.markHouseRacPrinted(house.id);
    const before = structuredClone(house);
    const existing = session.getHouseFieldAnalysis(site.constructionSite.id, house.id);
    expect(house).toEqual(before);
    expect(existing.house.pilotis).toEqual(before.drawingDocument.house!.pilotis);
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, updateFieldAnalysisPiloti(existing, 'piloti_3_2', {height: 1.5, nivel: .4, isMaster: true}));
    expect(house.drawingDocument.house!.views.top).toEqual([{instanceId: 'top_test'}]);
    expect(house.drawingDocument.house!.pilotis.piloti_3_2).toMatchObject({nivel: .4, isMaster: true});
    expect(house.status).toBe('rac_printed');
  });

  it('A-002/A-010 recupera reforços do Canvas e mantém edições pendentes após reabrir', () => {
    const {session, storage, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.views.top.push({instanceId: 'top_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group', metadata: {myType: 'house', houseViewType: 'top'}, children: [{id: 'brace', kind: 'element', shape: 'rect', metadata: {isContraventamento: true, contraventamentoOrientation: 'vertical', contraventamentoCol: 0, contraventamentoStartRow: 0, contraventamentoEndRow: 2, contraventamentoSide: 'left', contraventamentoAnchorPilotiId: 'piloti_0_0', isAutoContraventamento: false}}]});
    session.saveActiveHouseDrawingDocument(document);
    const existing = session.getHouseFieldAnalysis(site.constructionSite.id, house.id);
    expect(existing.contraventamentos).toEqual([{originPilotiId: 'piloti_0_0', destinationPilotiId: 'piloti_0_2', side: 'left', isAuto: false}]);
    existing.contraventamentos = [];
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, existing);
    expect(createConstructionSiteSession(storage).getHouseFieldAnalysis(site.constructionSite.id, house.id).contraventamentos).toEqual([]);
    expect(house.drawingDocument.house!.views.top).toHaveLength(1);
  });

  it('A-002 aceita a seleção personalizada de alturas já salva pelo Canvas', () => {
    const {session, site, house, draft} = setup();
    draft.selectedPilotiHeights = [1, 1.5, 2];
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    expect(session.getHouseFieldAnalysis(site.constructionSite.id, house.id).selectedPilotiHeights).toEqual([1, 1.5, 2]);
    expect(house.drawingDocument.house!.pilotis).toEqual(draft.house.pilotis);
  });

  it('A-026 remover apenas a planta conserva mestre, níveis e status e permite reinserção', () => {
    const {session, storage, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.views.top.push({instanceId: 'top_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group'});
    session.saveActiveHouseDrawingDocument(document);
    const configuration = structuredClone(document.house.pilotis);
    document.house.views.top = []; document.canvas.objects = [];
    session.saveActiveHouseDrawingDocument(document);
    const restored = createConstructionSiteSession(storage).getActiveHouse();
    expect(getHousePresentationStatus(restored)).toBe('defined');
    expect(restored.drawingDocument.house!.pilotis).toEqual(configuration);
    expect(restored.houseType).toBe('tipo3');
    expect(restored.fieldAnalysis?.status).toBe('inserted');
  });

  it('distingue Inicial, Definida, Impressa e Indefinida e libera nova análise depois da remoção', () => {
    const {session, storage, site, house, draft} = setup();
    expect(getHousePresentationStatus(house)).toBe('initial');
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    expect(getHousePresentationStatus(house)).toBe('defined');
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.views.top.push({instanceId: 'top_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group'});
    session.saveActiveHouseDrawingDocument(document);
    session.markHouseRacPrinted(house.id);
    expect(getHousePresentationStatus(house)).toBe('rac_printed');
    const printed = structuredClone(house);
    document.house.houseType = null;
    document.house.views.top = [];
    document.canvas.objects = [];
    storage.write.mockImplementationOnce(() => {throw new Error('falha ao remover');});
    expect(() => session.saveActiveHouseDrawingDocument(document)).toThrow('falha ao remover');
    expect(house).toEqual(printed);
    session.saveActiveHouseDrawingDocument(document);
    expect(getHousePresentationStatus(house)).toBe('undefined');
    expect(house.fieldAnalysis).toBeUndefined();
    expect(getHouseFieldAnalysisDisabledReason(site, house)).toBeNull();
    const restored = createConstructionSiteSession(storage);
    expect(getHousePresentationStatus(restored.getActiveHouse())).toBe('undefined');
    expect(() => restored.getHouseFieldAnalysis(site.constructionSite.id, house.id)).not.toThrow();
    // O histórico de impressão e os bloqueios continuam disponíveis.
    expect(house.hasRacBeenPrinted).toBe(true);
    session.markHouseBuilt(house.id);
    expect(getHousePresentationStatus(house)).toBe('built');
    session.archiveHouse(house.id);
    expect(getHousePresentationStatus(house)).toBe('archived');
  });

  it('mantém a distinção após remover uma casa legada sem metadado de análise', () => {
    const {session, storage, house} = setup();
    const document = session.getActiveHouseDrawingDocument()!;
    document.house.houseType = 'tipo6';
    document.house.views.top.push({instanceId: 'legacy_top'});
    session.saveActiveHouseDrawingDocument(document);
    expect(house.fieldAnalysis).toBeUndefined();
    expect(getHousePresentationStatus(house)).toBe('defined');
    document.house.houseType = null;
    document.house.views.top = [];
    session.saveActiveHouseDrawingDocument(document);
    expect(getHousePresentationStatus(createConstructionSiteSession(storage).getActiveHouse())).toBe('undefined');
  });

  it('não grava rascunho e salva por identidade sem alterar seleção ou documento de outra casa', () => {
    const {session, storage, site, house, draft} = setup();
    expect(house.fieldAnalysis).toBeUndefined();
    expect(house.houseType).toBeNull();
    const other = session.createHouse({familyName: 'Família B'});
    const before = structuredClone(session.getActiveHouseDrawingDocument());
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    expect(session.getActiveHouse().id).toBe(other.id);
    expect(session.getActiveHouseDrawingDocument()).toEqual(before);
    expect(house.fieldAnalysis).toEqual({status: 'prepared', contraventamentos: []});
    expect(Object.values(house.drawingDocument.house.views).flat()).toEqual([]);
    const restored = createConstructionSiteSession(storage);
    expect(restored.getHouseFieldAnalysis(site.constructionSite.id, house.id)).toEqual(draft);
  });

  it('mantém mestre único, limite do nível, destinos e remoção explícita de reforços', () => {
    const {draft} = setup();
    const high = updateFieldAnalysisPiloti(draft, 'piloti_0_0', {height: 1, nivel: .8});
    expect(high.house.pilotis.piloti_0_0.nivel).toBe(.5);
    expect(high.contraventamentos).toHaveLength(1);
    expect(high.contraventamentos[0]).toMatchObject({side: 'left', isAuto: true});
    expect(getFieldAnalysisDestinations(high, 'piloti_0_0', 'right')).toEqual(['piloti_0_1', 'piloti_0_2']);
    expect(getFieldAnalysisDestinations(high, 'piloti_0_0', 'left')).toEqual([]);
    const manual = addFieldAnalysisContraventamento(high, 'piloti_0_0', 'piloti_2_0', 'bottom');
    expect(() => addFieldAnalysisContraventamento(manual, 'piloti_1_0', 'piloti_3_0', 'bottom')).toThrow();
    const removed = removeFieldAnalysisContraventamento(manual, 'piloti_0_2', 'left');
    const master = updateFieldAnalysisPiloti(removed, 'piloti_3_2', {isMaster: true});
    expect(Object.values(master.house.pilotis).filter((p) => p.isMaster)).toHaveLength(1);
    expect(master.house.pilotis.piloti_3_2.isMaster).toBe(true);
    expect(master.contraventamentos).toEqual(removed.contraventamentos);
  });

  it('persiste contraventamentos e preserva preparação quando o salvamento falha', () => {
    const {session, storage, site, house, draft} = setup();
    const high = updateFieldAnalysisPiloti(draft, 'piloti_0_0', {height: 1, nivel: .5});
    const prepared = addFieldAnalysisContraventamento(high, 'piloti_0_0', 'piloti_3_0', 'bottom');
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, prepared);
    const before = structuredClone(house);
    storage.write.mockImplementationOnce(() => {throw new Error('disco indisponível');});
    expect(() => session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft)).toThrow('disco indisponível');
    expect(house).toEqual(before);
    expect(createConstructionSiteSession(storage).getHouseFieldAnalysis(site.constructionSite.id, house.id)).toEqual(prepared);
  });

  it('consome pendências só quando a inclusão é salva e reverte falhas', () => {
    const {session, storage, site, house, draft} = setup();
    session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft);
    const document = session.getActiveHouseDrawingDocument();
    document.house.views.top.push({instanceId: 'top_test'});
    document.canvas.objects.push({id: 'top_test', kind: 'house', shape: 'group'});
    storage.write.mockImplementationOnce(() => {throw new Error('falha');});
    expect(() => session.saveActiveHouseDrawingDocument(document)).toThrow('falha');
    expect(house.fieldAnalysis.status).toBe('prepared');
    expect(house.drawingDocument.canvas.objects).toHaveLength(0);
    session.saveActiveHouseDrawingDocument(document);
    expect(house.fieldAnalysis).toEqual({status: 'inserted', contraventamentos: []});
    expect(() => session.getHouseFieldAnalysis(site.constructionSite.id, house.id)).not.toThrow('já foi inserida');
    const version = house.version;
    session.saveActiveHouseDrawingDocument(document);
    expect(house.version).toBe(version);
  });

  it('respeita bloqueios e registros legados; descarta metadados inválidos', () => {
    const {site, house, session, draft} = setup();
    expect(getHouseFieldAnalysisDisabledReason(site, house)).toBeNull();
    house.status = 'built';
    expect(() => session.saveHouseFieldAnalysis(site.constructionSite.id, house.id, draft)).toThrow('bloqueada');
    house.status = 'draft';
    site.constructionSite.status = 'completed';
    expect(getHouseFieldAnalysisDisabledReason(site, house)).toContain('bloqueada');
    expect(normalizeHouseFieldAnalysis(undefined)).toBeUndefined();
    expect(normalizeHouseFieldAnalysis({status: 'prepared', contraventamentos: [{originPilotiId: 'piloti_9_9'}]})).toBeUndefined();
  });

  it('mantém a Análise de Campo aberta quando há uma vista persistida sem estado inserido', () => {
    const {site, house} = setup();
    house.drawingDocument.house?.views.front.push({instanceId: 'legacy_view'});
    expect(getHouseFieldAnalysisDisabledReason(site, house)).toBeNull();
  });
});
