import {describe, expect, it, vi} from 'vitest';
import {createConstructionSiteSession, type StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';
import type {HouseState} from '@/shared/types/house.ts';

const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';
const VALID_JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/';

function createStorage(initialConstructionSites: StoredConstructionSitesDocument['constructionSites'] = []) {
  const writes: StoredConstructionSitesDocument['constructionSites'][] = [];

  return {
    writes,
    storage: {
      read: vi.fn(() => ({version: 1, constructionSites: initialConstructionSites})),
      write: vi.fn((constructionSites: StoredConstructionSitesDocument['constructionSites']) => {
        writes.push(constructionSites);
      }),
    },
  };
}

describe('constructionSite-session.ts', () => {
  it('não cria construção ou casa automaticamente quando o storage está vazio', () => {
    const {storage, writes} = createStorage();

    const session = createConstructionSiteSession(storage);

    expect(session.getConstructionSite()).toBeNull();
    expect(session.getConstructionSiteSummaries()).toEqual([]);
    expect(session.canOpenRacEditor()).toBe(false);
    expect(writes).toHaveLength(0);
  });

  it('sincroniza metadados da casa ativa e persiste a sessão', () => {
    const {storage, writes} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família Teste'});

    session.syncActiveHouseMetadata({
      houseType: 'tipo6',
      terrainType: 3,
      familyName: 'Família Teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    const activeHouse = session.getActiveHouse();
    const activeFamily = session.getActiveFamily();

    expect(activeHouse.houseType).toBe('tipo6');
    expect(activeHouse.terrainType).toBe(3);
    expect(activeHouse.designSettings.selectedPilotiHeights).toEqual([1, 1.5, 2]);
    expect(activeHouse.version).toBe(2);
    expect(activeFamily.name).toBe('Família Teste');
    expect(writes).toHaveLength(3);
  });

  it('gerencia construções TETO com código da CC e comunidade única', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);

    const createdConstructionSite = session.createConstructionSite({
      externalCode: 'CC2603',
      photoDataUrl: VALID_PNG_DATA_URL,
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });

    expect(session.getConstructionSite()?.constructionSite.id).toBe(createdConstructionSite.constructionSite.id);
    expect(session.getConstructionSite()?.constructionSite.externalCode).toBe('CC2603');
    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBe(VALID_PNG_DATA_URL);
    expect(session.getConstructionSite()?.constructionSite.constructionDate).toBe('2026-05-11');
    expect(session.getConstructionSite()?.constructionSite.communityId).toBe(session.getConstructionSite()?.communities[0]?.id);
    expect(session.getConstructionSite()?.communities.map((community) => community.name)).toEqual([
      'Tiradentes',
    ]);
    expect(session.getConstructionSiteSummaries()[0]).toMatchObject({
      label: 'CC2603 · Tiradentes',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });

    session.updateActiveConstructionSite({
      externalCode: 'CC2604',
      constructionDate: '2026-05-15',
      communityName: 'Guarujá',
    });

    expect(session.getConstructionSite()?.constructionSite.externalCode).toBe('CC2604');
    expect(session.getConstructionSite()?.constructionSite.constructionDate).toBe('2026-05-15');
    expect(session.getConstructionSite()?.constructionSite.communityId).toBe(session.getConstructionSite()?.communities.find((community) => community.name === 'Guarujá')?.id);
    expect(session.getConstructionSite()?.communities.find((community) => community.name === 'Guarujá')).toBeTruthy();

    expect(() => session.updateActiveConstructionSite({constructionDate: undefined}))
      .toThrow('Data da Construção é obrigatória.');
    expect(session.getConstructionSite()?.constructionSite.constructionDate).toBe('2026-05-15');

    session.updateActiveConstructionSite({photoDataUrl: undefined});

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBeUndefined();
  });

  it('cria construção por comunidade única', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);

    session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });

    expect(session.getConstructionSite()?.constructionSite.communityId).toBe(session.getConstructionSite()?.communities[0]?.id);
    expect(session.getConstructionSiteSummaries()[0]).toMatchObject({
      communityName: 'Tiradentes',
    });
    expect(session.getConstructionSiteSummaries()[0].constructionDate).toBe('2026-05-11');
  });

  it('bloqueia criação de construção com código da CC já cadastrado', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);

    session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });

    expect(() => session.createConstructionSite({
      externalCode: ' cc2603 ',
      constructionDate: '2026-05-12',
      communityName: 'Nova Comunidade',
    })).toThrow('Já existe uma Construção TETO com este código.');
    expect(session.getConstructionSiteSummaries()).toHaveLength(1);
  });

  it('rotula casas pela família associada, sem nome próprio persistido', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});

    const createdHouse = session.createHouse({
      familyName: 'Família Souza',
    } as never);

    session.activateHouse(session.getConstructionSite()?.constructionSite.id ?? '', createdHouse.id);
    session.updateActiveFamily({
      name: 'Família Souza e Lima',
      primaryContactPhone: '(11) 99999-0000',
      primaryContactEmail: 'souza@example.com',
    });

    const activeHouse = session.getActiveHouse();
    const activeFamily = session.getActiveFamily();

    expect('name' in activeHouse).toBe(false);
    expect(activeFamily.name).toBe('Família Souza e Lima');
    expect(activeFamily.primaryContactPhone).toBe('(11) 99999-0000');
    expect(activeFamily.primaryContactEmail).toBe('souza@example.com');

    session.archiveActiveHouse();

    const archivedHouse = session.getConstructionSite()?.houses.find((house) => house.id === createdHouse.id);
    expect(archivedHouse?.status).toBe('archived');
    expect(session.canOpenRacEditor()).toBe(false);
  });

  it('salva o documento da casa ativa e restaura ao alternar entre casas', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01'});
    const firstHouseId = session.getActiveHouse().id;

    const document = createDrawingDocument({
      houseId: firstHouseId,
      familyName: 'Família Documento',
      houseType: 'tipo6',
    });

    session.saveActiveHouseDrawingDocument(document);
    const secondHouse = session.createHouse({
      familyName: 'Família 02',
    } as never);

    expect(session.getActiveHouse().id).toBe(secondHouse.id);

    const restoredDocument = session.activateHouse(session.getConstructionSite()?.constructionSite.id ?? '', firstHouseId);

    expect(restoredDocument?.house.houseType).toBe('tipo6');
    expect(restoredDocument?.setup.familyName).toBe('Família Documento');
    expect(session.getActiveHouse().id).toBe(firstHouseId);
  });

  it('não retorna documento atual quando a ativação recebe construção ou casa inexistente', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const activeHouse = session.createHouse({familyName: 'Família 01'});

    expect(session.activateConstructionSite('construction_site_missing')).toBeNull();
    expect(session.activateHouse('construction_site_missing', activeHouse.id)).toBeNull();
    expect(session.activateHouse(session.getConstructionSite()?.constructionSite.id ?? '', 'house_missing')).toBeNull();
    expect(session.getActiveHouse().id).toBe(activeHouse.id);
  });

  it('ativa no boot a casa editada mais recentemente entre todas as construções', () => {
    vi.useFakeTimers();
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);

    vi.setSystemTime(new Date('2026-05-09T10:00:00.000Z'));
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const firstHouse = session.createHouse({familyName: 'Família Antiga'});

    vi.setSystemTime(new Date('2026-05-09T11:00:00.000Z'));
    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    const latestHouse = session.createHouse({familyName: 'Família Recente'});

    const persistedConstructionSites = storage.write.mock.calls.at(-1)?.[0] ?? [];
    const reloadedSession = createConstructionSiteSession(createStorage(persistedConstructionSites).storage);

    expect(reloadedSession.getActiveHouse().id).toBe(latestHouse.id);
    expect(reloadedSession.getConstructionSite()?.constructionSite.externalCode).toBe('CC2604');
    expect(reloadedSession.canOpenRacEditor()).toBe(true);
    expect(reloadedSession.getConstructionSiteSummaries().find((summary) => summary.id === session.getConstructionSite()?.constructionSite.id)?.activeHouseId)
      .toBe(latestHouse.id);
    expect(firstHouse.id).not.toBe(latestHouse.id);
    vi.useRealTimers();
  });

  it('salva configuração completa da casa e substitui o contrato antigo de local', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
      photoDataUrl: VALID_PNG_DATA_URL,
    } as never);

    const createdHouse = session.createHouse({
      familyName: 'Família Local',
      primaryContactName: 'Maria',
      primaryContactPhone: '(11) 99999-0000',
      primaryContactEmail: 'maria@example.com',
      familyPhotoDataUrl: VALID_PNG_DATA_URL,
      houseType: 'tipo3',
      houseSize: 'large',
      leaders: 'Ana e Bruno',
      extraMaterials: {
        floorBeams: 12,
        rafters: 24,
        secondaryBeams: 8,
        gutters: 4,
        justification: 'Reforço inicial.',
      },
      notes: 'Nota inicial da casa',
      siteAssessment: {
        soilProfile: 'alluvial',
        hasHydraulicObstacles: true,
        hasUndergroundObstacles: true,
        hasElevatedObstacles: true,
        hasNeighborSetbackConstraints: false,
        locationQuery: 'Rua A, 123',
      },
    } as never);

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBe(VALID_PNG_DATA_URL);
    expect(createdHouse.houseType).toBe('tipo3');
    expect(createdHouse.houseSize).toBe('large');
    expect(createdHouse.leaders).toBe('Ana e Bruno');
    expect(createdHouse.extraMaterials).toEqual({
      floorBeams: 12,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: 'Reforço inicial.',
    });
    expect(createdHouse.notes).toBe('Nota inicial da casa');
    expect(createdHouse.siteAssessment).toEqual({
      soilProfile: 'alluvial',
      hasHydraulicObstacles: true,
      hasUndergroundObstacles: true,
      hasElevatedObstacles: true,
      hasNeighborSetbackConstraints: false,
      locationQuery: 'Rua A, 123',
    });
    expect(session.getActiveFamily()).toMatchObject({
      name: 'Família Local',
      primaryContactName: 'Maria',
      primaryContactPhone: '(11) 99999-0000',
      primaryContactEmail: 'maria@example.com',
      photoDataUrl: VALID_PNG_DATA_URL,
    });
    expect(session.getActiveFamily().notes).toBeUndefined();
    expect('hasWater' in session.getActiveHouse().siteAssessment).toBe(false);
    expect('soilNotes' in session.getActiveHouse().siteAssessment).toBe(false);

    (session as unknown as {
      updateActiveHouseConfiguration(input: unknown): void;
    }).updateActiveHouseConfiguration({
      familyName: 'Família Local Atualizada',
      primaryContactName: 'João',
      primaryContactPhone: '(11) 98888-0000',
      primaryContactEmail: 'joao@example.com',
      familyPhotoDataUrl: VALID_JPEG_DATA_URL,
      houseSize: 'small',
      leaders: 'Carla e João',
      notes: 'Nota atualizada da casa',
      siteAssessment: {
        soilProfile: 'stable_clay',
        hasHydraulicObstacles: false,
        hasUndergroundObstacles: false,
        hasElevatedObstacles: false,
        hasNeighborSetbackConstraints: true,
        locationQuery: 'Rua B, 456',
      },
    });

    expect(session.getActiveHouse().houseType).toBe('tipo3');
    expect(session.getActiveHouse().houseSize).toBe('small');
    expect(session.getActiveHouse().leaders).toBe('Carla e João');
    expect(session.getActiveHouse().notes).toBe('Nota atualizada da casa');
    expect(session.getActiveHouse().siteAssessment).toEqual({
      soilProfile: 'stable_clay',
      hasHydraulicObstacles: false,
      hasUndergroundObstacles: false,
      hasElevatedObstacles: false,
      hasNeighborSetbackConstraints: true,
      locationQuery: 'Rua B, 456',
    });
    expect(session.getActiveFamily().name).toBe('Família Local Atualizada');
    expect(session.getActiveFamily().photoDataUrl).toBe(VALID_JPEG_DATA_URL);
    expect(session.getActiveFamily().notes).toBeUndefined();

    (session as unknown as {
      updateActiveHouseConfiguration(input: unknown): void;
    }).updateActiveHouseConfiguration({
      familyPhotoDataUrl: undefined,
      houseSize: undefined,
      leaders: '',
      notes: '',
    });

    expect(session.getActiveFamily().photoDataUrl).toBeUndefined();
    expect(session.getActiveHouse().houseSize).toBeUndefined();
    expect(session.getActiveHouse().leaders).toBeUndefined();
    expect(session.getActiveHouse().notes).toBeUndefined();
  });

  it('salva materiais extras da casa ativa com inteiros normalizados', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família Materiais'});

    session.updateActiveHouseExtraMaterials({
      floorBeams: 12,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: 'Material extra por desnível e acesso lateral.',
    });

    expect(session.getActiveHouse().extraMaterials).toEqual({
      floorBeams: 12,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: 'Material extra por desnível e acesso lateral.',
    });

    session.updateActiveHouseExtraMaterials({
      floorBeams: -1,
      rafters: 1.5,
      secondaryBeams: Number.NaN,
      gutters: 10000,
      justification: '',
    });

    expect(session.getActiveHouse().extraMaterials).toBeUndefined();
  });

  it('permite apagar notas legadas da família após migrar o campo para a casa', () => {
    const now = '2026-05-09T12:00:00.000Z';
    const {storage, writes} = createStorage([{
      constructionSite: {
        id: 'construction_site_1',
        externalCode: 'CC2603',
        constructionDate: '2026-05-11',
        communityId: 'community_1',
        status: 'in_progress',
        activeHouseId: 'house_1',
        createdAt: now,
        updatedAt: now,
      },
      communities: [{id: 'community_1', name: 'Tiradentes'}],
      families: [{
        id: 'family_1',
        constructionSiteId: 'construction_site_1',
        communityId: 'community_1',
        name: 'Família Legada',
        notes: 'Nota antiga da família',
      }],
      monitors: [],
      houses: [{
        id: 'house_1',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_1',
        communityId: 'community_1',
        houseType: null,
        terrainType: 1,
        status: 'draft',
        designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
        siteAssessment: {},
        pilotiLayout: {points: []},
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION, objects: []},
          views: {},
        },
        version: 1,
        createdAt: now,
        updatedAt: now,
      }],
    } as never]);
    const session = createConstructionSiteSession(storage);

    expect(session.getActiveHouse().notes).toBe('Nota antiga da família');

    (session as unknown as {
      updateActiveHouseConfiguration(input: unknown): void;
    }).updateActiveHouseConfiguration({notes: ''});

    expect(session.getActiveHouse().notes).toBeUndefined();
    expect(session.getActiveFamily().notes).toBeUndefined();

    const persistedConstructionSites = writes.at(-1) ?? [];
    const reloadedSession = createConstructionSiteSession(createStorage(persistedConstructionSites).storage);

    expect(reloadedSession.getActiveHouse().notes).toBeUndefined();
    expect(reloadedSession.getActiveFamily().notes).toBeUndefined();
  });

  it('alterna casas entre construções diferentes restaurando o documento salvo', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01'});
    const firstConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';
    const firstHouseId = session.getActiveHouse().id;
    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: firstHouseId,
      familyName: 'Família Documento 01',
      houseType: 'tipo6',
    }));

    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    session.createHouse({familyName: 'Família 02'});
    const secondConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';
    const secondHouseId = session.getActiveHouse().id;
    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: secondHouseId,
      familyName: 'Família Documento 02',
      houseType: 'tipo3',
    }));

    const restoredFirstDocument = session.activateHouse(firstConstructionSiteId, firstHouseId);
    expect(restoredFirstDocument?.setup.familyName).toBe('Família Documento 01');
    expect(restoredFirstDocument?.house.houseType).toBe('tipo6');
    expect(session.getConstructionSite()?.constructionSite.externalCode).toBe('CC2603');

    const restoredSecondDocument = session.activateHouse(secondConstructionSiteId, secondHouseId);
    expect(restoredSecondDocument?.setup.familyName).toBe('Família Documento 02');
    expect(restoredSecondDocument?.house.houseType).toBe('tipo3');
    expect(session.getConstructionSite()?.constructionSite.externalCode).toBe('CC2604');
  });

  it('gerencia monitores por construção com inativação lógica e sem duplicar na edição', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const firstConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    const monitor = session.createMonitor({
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
      email: 'ana@example.com',
      photoDataUrl: VALID_PNG_DATA_URL,
    });

    expect(monitor.status).toBe('active');
    expect(session.getConstructionSite()?.monitors).toHaveLength(1);

    session.updateMonitor(monitor.id, {
      name: 'Ana Monitoria Atualizada',
      phone: '(11) 98888-0000',
      email: undefined,
      photoDataUrl: undefined,
    });

    expect(session.getConstructionSite()?.monitors).toHaveLength(1);
    expect(session.getConstructionSite()?.monitors[0]).toMatchObject({
      id: monitor.id,
      name: 'Ana Monitoria Atualizada',
      phone: '(11) 98888-0000',
      status: 'active',
    });
    expect(session.getConstructionSite()?.monitors[0]?.email).toBeUndefined();
    expect(session.getConstructionSite()?.monitors[0]?.photoDataUrl).toBeUndefined();

    session.inactivateMonitor(monitor.id);
    expect(session.getConstructionSite()?.monitors[0]?.status).toBe('inactive');

    session.reactivateMonitor(monitor.id);
    expect(session.getConstructionSite()?.monitors[0]?.status).toBe('active');

    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    const secondMonitor = session.createMonitor({
      name: 'Bruno Monitor',
      phone: '(11) 97777-0000',
    });

    expect(session.getConstructionSite()?.monitors.map((entry) => entry.id)).toEqual([secondMonitor.id]);

    session.activateConstructionSite(firstConstructionSiteId);

    expect(session.getConstructionSite()?.monitors.map((entry) => entry.id)).toEqual([monitor.id]);
  });

  it('bloqueia telefone, e-mail e foto inválidos no contrato de monitores', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});

    expect(() => session.createMonitor({
      name: 'Ana Monitoria',
      phone: '(11) 9999-0000',
    })).toThrow('Telefone do monitor deve ter 11 dígitos com DDD.');

    expect(() => session.createMonitor({
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
      email: 'email inválido',
    })).toThrow('E-mail do monitor inválido.');

    expect(() => session.createMonitor({
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
      photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    })).toThrow('Foto do monitor inválida.');
  });

  it('normaliza fotos inválidas de construção e família nos caminhos de sessão', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);

    session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
      photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    });
    session.createHouse({
      familyName: 'Família Souza',
      familyPhotoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    });

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBeUndefined();
    expect(session.getActiveFamily().photoDataUrl).toBeUndefined();

    session.updateActiveConstructionSite({photoDataUrl: VALID_PNG_DATA_URL});
    session.updateActiveFamily({photoDataUrl: VALID_PNG_DATA_URL});

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBe(VALID_PNG_DATA_URL);
    expect(session.getActiveFamily().photoDataUrl).toBe(VALID_PNG_DATA_URL);

    session.updateActiveConstructionSite({photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+'});
    session.updateActiveHouseConfiguration({familyPhotoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+'});

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBeUndefined();
    expect(session.getActiveFamily().photoDataUrl).toBeUndefined();
  });

  it('normaliza monitores persistidos mantendo vínculo com a construção que contém a coleção', () => {
    const now = '2026-05-09T12:00:00.000Z';
    const session = createConstructionSiteSession(createStorage([{
      constructionSite: {
        id: 'construction_site_1',
        externalCode: 'CC2603',
        constructionDate: '2026-05-11',
        communityId: '',
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      },
      communities: [],
      families: [],
      monitors: [
        {
          id: 'monitor_valid',
          constructionSiteId: 'construction_site_errada',
          name: 'Ana Monitoria',
          phone: '(11) 99999-0000',
          email: 'email inválido',
          photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
          status: 'status_antigo',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'monitor_sem_telefone',
          constructionSiteId: 'construction_site_1',
          name: 'Monitor sem telefone',
          phone: '',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      houses: [],
    } as never]).storage);

    expect(session.getConstructionSite()?.monitors).toEqual([{
      id: 'monitor_valid',
      constructionSiteId: 'construction_site_1',
      name: 'Ana Monitoria',
      phone: '(11) 99999-0000',
      photoDataUrl: undefined,
      email: undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }]);
  });

  it('normaliza fotos inválidas de construção e família persistidas', () => {
    const now = '2026-05-09T12:00:00.000Z';
    const session = createConstructionSiteSession(createStorage([{
      constructionSite: {
        id: 'construction_site_1',
        externalCode: 'CC2603',
        constructionDate: '2026-05-11',
        communityId: 'community_1',
        status: 'in_progress',
        activeHouseId: 'house_1',
        photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
        createdAt: now,
        updatedAt: now,
      },
      communities: [{id: 'community_1', name: 'Tiradentes'}],
      families: [{
        id: 'family_1',
        constructionSiteId: 'construction_site_1',
        communityId: 'community_1',
        name: 'Família Legada',
        photoDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
      }],
      monitors: [],
      houses: [{
        id: 'house_1',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_1',
        communityId: 'community_1',
        houseType: null,
        terrainType: 1,
        status: 'draft',
        designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
        siteAssessment: {},
        pilotiLayout: {points: []},
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION, objects: []},
          views: {},
        },
        version: 1,
        createdAt: now,
        updatedAt: now,
      }],
    } as never]).storage);

    expect(session.getConstructionSite()?.constructionSite.photoDataUrl).toBeUndefined();
    expect(session.getActiveFamily().photoDataUrl).toBeUndefined();
  });

  it('arquiva e desarquiva construção por ID restaurando status como em andamento', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01'});
    const firstConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    session.createHouse({familyName: 'Família 02'});

    session.archiveConstructionSite(firstConstructionSiteId);

    expect(session.getConstructionSiteSummaries().find((summary) => summary.id === firstConstructionSiteId)?.status).toBe('archived');

    session.unarchiveConstructionSite(firstConstructionSiteId);

    expect(session.getConstructionSiteSummaries().find((summary) => summary.id === firstConstructionSiteId)?.status).toBe('in_progress');
  });

  it('desarquiva casa por ID e torna a casa candidata ativa quando não há outra válida', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const house = session.createHouse({familyName: 'Família 01'});

    session.archiveHouse(house.id);

    expect(session.canOpenRacEditor()).toBe(false);
    expect(session.getConstructionSite()?.houses.find((entry) => entry.id === house.id)?.status).toBe('archived');

    session.unarchiveHouse(house.id);

    expect(session.getConstructionSite()?.houses.find((entry) => entry.id === house.id)?.status).toBe('draft');
    expect(session.getActiveHouse().id).toBe(house.id);
    expect(session.canOpenRacEditor()).toBe(true);
  });

  it('não permite abrir o Canvas quando todas as casas da construção estão arquivadas', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const firstHouse = session.createHouse({familyName: 'Família 01'});
    const secondHouse = session.createHouse({familyName: 'Família 02'});
    const constructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.archiveHouse(firstHouse.id);
    session.archiveHouse(secondHouse.id);

    expect(session.canOpenRacEditor()).toBe(false);
    expect(session.getActiveHouseDrawingDocument()).toBeNull();
    expect(session.activateConstructionSite(constructionSiteId)).toBeNull();
    expect(session.activateHouse(constructionSiteId, firstHouse.id)).toBeNull();
  });

  it('mantém retorno ao Canvas quando a construção selecionada não tem casas mas outra construção tem casa ativa', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const firstConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';
    const house = session.createHouse({familyName: 'Família 01'});
    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});

    expect(session.getConstructionSite()?.constructionSite.externalCode).toBe('CC2604');
    expect(session.getConstructionSite()?.houses).toHaveLength(0);
    expect(session.canOpenRacEditor()).toBe(true);
    expect(session.getActiveHouseDrawingDocument()).toBeNull();

    const document = session.prepareRacEditorOpening();

    expect(document?.house.id).toBe(house.id);
    expect(session.getConstructionSite()?.constructionSite.id).toBe(firstConstructionSiteId);
    expect(session.getConstructionSite()?.constructionSite.activeHouseId).toBe(house.id);
  });

  it('usa casa de construção editável quando a construção selecionada está concluída', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const editableConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';
    const editableHouse = session.createHouse({familyName: 'Família 01'});
    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    const completedHouse = session.createHouse({familyName: 'Família 02'});
    const completedConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.markConstructionSiteCompleted(completedConstructionSiteId);

    expect(session.getConstructionSite()?.constructionSite.id).toBe(completedConstructionSiteId);
    expect(session.getActiveHouseDrawingDocument()?.house.id).toBe(completedHouse.id);
    expect(session.canOpenRacEditor()).toBe(true);

    const document = session.prepareRacEditorOpening();

    expect(document?.house.id).toBe(editableHouse.id);
    expect(session.getConstructionSite()?.constructionSite.id).toBe(editableConstructionSiteId);
  });

  it('não permite abrir o Canvas quando só existem casas em construções concluídas', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01'});
    const constructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.markConstructionSiteCompleted(constructionSiteId);

    expect(session.canOpenRacEditor()).toBe(false);
    expect(session.prepareRacEditorOpening()).toBeNull();
    expect(session.getActiveHouseDrawingDocument()).not.toBeNull();
  });

  it('não permite abrir o Canvas quando todas as construções estão arquivadas', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01'});
    const firstConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';
    session.createConstructionSite({externalCode: 'CC2604', constructionDate: '2026-05-12', communityName: 'Heliópolis'});
    session.createHouse({familyName: 'Família 02'});
    const secondConstructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.archiveConstructionSite(firstConstructionSiteId);
    session.archiveConstructionSite(secondConstructionSiteId);

    expect(session.getConstructionSite()).toBeNull();
    expect(session.canOpenRacEditor()).toBe(false);
    expect(session.activateConstructionSite(firstConstructionSiteId)).toBeNull();
    expect(session.activateHouse(firstConstructionSiteId, 'house_missing')).toBeNull();
  });

  it('marca a casa ativa como RAC Impressa e volta para rascunho ao salvar alteração editorial', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const house = session.createHouse({familyName: 'Família 01', houseType: 'tipo6'});

    session.markActiveHouseRacPrinted();

    expect(session.getActiveHouse().status).toBe('rac_printed');

    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: house.id,
      familyName: 'Família 01',
      houseType: 'tipo3',
    }));

    expect(session.getActiveHouse().status).toBe('draft');
    expect(session.getActiveHouse().houseType).toBe('tipo3');
  });

  it('preserva RAC Impressa quando o flush do documento não muda a casa ativa', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    session.createHouse({familyName: 'Família 01', houseType: 'tipo6'});
    const currentDocument = session.getActiveHouseDrawingDocument();
    expect(currentDocument).not.toBeNull();

    session.markActiveHouseRacPrinted();
    const printedVersion = session.getActiveHouse().version;

    session.saveActiveHouseDrawingDocument(currentDocument!);

    expect(session.getActiveHouse().status).toBe('rac_printed');
    expect(session.getActiveHouse().version).toBe(printedVersion);
  });

  it('marca RAC Impressa por casa preservando construída e arquivada', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const draftHouse = session.createHouse({familyName: 'Família Rascunho'});
    const builtHouse = session.createHouse({familyName: 'Família Construída'});
    const archivedHouse = session.createHouse({familyName: 'Família Arquivada'});

    session.markHouseBuilt(builtHouse.id);
    session.archiveHouse(archivedHouse.id);
    session.markHouseRacPrinted(draftHouse.id);
    session.markHouseRacPrinted(builtHouse.id);
    session.markHouseRacPrinted(archivedHouse.id);

    const houses = session.getConstructionSite()?.houses ?? [];
    expect(houses.find((house) => house.id === draftHouse.id)?.status).toBe('rac_printed');
    expect(houses.find((house) => house.id === builtHouse.id)?.status).toBe('built');
    expect(houses.find((house) => house.id === archivedHouse.id)?.status).toBe('archived');
  });

  it('bloqueia mutações editoriais de casa construída e permite retornar para rascunho', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const house = session.createHouse({
      familyName: 'Família 01',
      houseType: 'tipo6',
      leaders: 'Líder original',
    });

    session.markHouseBuilt(house.id);
    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: house.id,
      familyName: 'Família Alterada',
      houseType: 'tipo3',
    }));
    session.updateActiveHouseConfiguration({
      familyName: 'Família Alterada',
      leaders: 'Líder alterado',
      siteAssessment: {hasElevatedObstacles: true},
    });
    session.updateActiveHouseExtraMaterials({floorBeams: 10, justification: 'Alteração indevida'});
    session.updateActiveHouseSiteAssessment({hasHydraulicObstacles: true});

    expect(session.getActiveHouse()).toMatchObject({
      status: 'built',
      houseType: 'tipo6',
      leaders: 'Líder original',
      extraMaterials: {},
      siteAssessment: {},
    });
    expect(session.getActiveFamily().name).toBe('Família 01');

    session.markHouseDraft(house.id);
    session.updateActiveHouseExtraMaterials({floorBeams: 10});

    expect(session.getActiveHouse().status).toBe('draft');
    expect(session.getActiveHouse().extraMaterials.floorBeams).toBe(10);
  });

  it('bloqueia edição de construção, monitores e casas quando a construção está arquivada', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const monitor = session.createMonitor({
      name: 'Monitor Original',
      phone: '(11) 99999-0000',
      email: 'monitor@example.com',
    });
    const house = session.createHouse({
      familyName: 'Família Original',
      houseType: 'tipo6',
      leaders: 'Líder original',
    });
    const constructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.archiveConstructionSite(constructionSiteId);
    session.activateConstructionSite(constructionSiteId);

    session.updateActiveConstructionSite({
      externalCode: 'CC9999',
      constructionDate: '2026-06-18',
      communityName: 'Comunidade Alterada',
    });
    session.updateMonitor(monitor.id, {
      name: 'Monitor Alterado',
      phone: '(11) 98888-0000',
      email: 'alterado@example.com',
    });
    session.inactivateMonitor(monitor.id);
    session.archiveHouse(house.id);
    session.markHouseBuilt(house.id);
    session.updateActiveHouseConfiguration({
      familyName: 'Família Alterada',
      leaders: 'Líder alterado',
      siteAssessment: {hasHydraulicObstacles: true},
    });
    session.updateActiveHouseExtraMaterials({floorBeams: 10});
    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: house.id,
      familyName: 'Família Alterada',
      houseType: 'tipo3',
    }));

    expect(() => session.createMonitor({
      name: 'Novo Monitor',
      phone: '(11) 97777-0000',
    })).toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');
    expect(() => session.createHouse({familyName: 'Nova Família'}))
      .toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');
    expect(() => session.duplicateActiveHouse())
      .toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');

    const archivedConstructionSite = session.getConstructionSiteSnapshots()
      .find((entry) => entry.constructionSite.id === constructionSiteId);
    const persistedMonitor = archivedConstructionSite?.monitors.find((entry) => entry.id === monitor.id);
    const persistedHouse = archivedConstructionSite?.houses.find((entry) => entry.id === house.id);
    const persistedFamily = archivedConstructionSite?.families.find((entry) => entry.id === house.familyId);

    expect(archivedConstructionSite?.constructionSite).toMatchObject({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      status: 'archived',
    });
    expect(archivedConstructionSite?.communities.map((community) => community.name)).toEqual(['Tiradentes']);
    expect(persistedMonitor).toMatchObject({
      name: 'Monitor Original',
      phone: '(11) 99999-0000',
      email: 'monitor@example.com',
      status: 'active',
    });
    expect(persistedHouse).toMatchObject({
      status: 'draft',
      houseType: 'tipo6',
      leaders: 'Líder original',
      extraMaterials: {},
      siteAssessment: {},
    });
    expect(persistedFamily?.name).toBe('Família Original');
  });

  it('bloqueia edição de construção, monitores e casas quando a construção está concluída', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const monitor = session.createMonitor({
      name: 'Monitor Original',
      phone: '(11) 99999-0000',
      email: 'monitor@example.com',
    });
    const house = session.createHouse({
      familyName: 'Família Original',
      houseType: 'tipo6',
      leaders: 'Líder original',
    });
    const constructionSiteId = session.getConstructionSite()?.constructionSite.id ?? '';

    session.markConstructionSiteCompleted(constructionSiteId);

    session.updateActiveConstructionSite({
      externalCode: 'CC9999',
      constructionDate: '2026-06-18',
      communityName: 'Comunidade Alterada',
    });
    session.updateMonitor(monitor.id, {
      name: 'Monitor Alterado',
      phone: '(11) 98888-0000',
      email: 'alterado@example.com',
    });
    session.inactivateMonitor(monitor.id);
    session.archiveHouse(house.id);
    session.markHouseBuilt(house.id);
    session.updateActiveHouseConfiguration({
      familyName: 'Família Alterada',
      leaders: 'Líder alterado',
      siteAssessment: {hasHydraulicObstacles: true},
    });
    session.updateActiveHouseExtraMaterials({floorBeams: 10});
    session.saveActiveHouseDrawingDocument(createDrawingDocument({
      houseId: house.id,
      familyName: 'Família Alterada',
      houseType: 'tipo3',
    }));

    expect(() => session.createMonitor({
      name: 'Novo Monitor',
      phone: '(11) 97777-0000',
    })).toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');
    expect(() => session.createHouse({familyName: 'Nova Família'}))
      .toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');
    expect(() => session.duplicateActiveHouse())
      .toThrow('Não é possível editar uma Construção TETO concluída ou arquivada.');

    const completedConstructionSite = session.getConstructionSiteSnapshots()
      .find((entry) => entry.constructionSite.id === constructionSiteId);
    const persistedMonitor = completedConstructionSite?.monitors.find((entry) => entry.id === monitor.id);
    const persistedHouse = completedConstructionSite?.houses.find((entry) => entry.id === house.id);
    const persistedFamily = completedConstructionSite?.families.find((entry) => entry.id === house.familyId);

    expect(completedConstructionSite?.constructionSite).toMatchObject({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      status: 'completed',
    });
    expect(completedConstructionSite?.communities.map((community) => community.name)).toEqual(['Tiradentes']);
    expect(persistedMonitor).toMatchObject({
      name: 'Monitor Original',
      phone: '(11) 99999-0000',
      email: 'monitor@example.com',
      status: 'active',
    });
    expect(persistedHouse).toMatchObject({
      status: 'draft',
      houseType: 'tipo6',
      leaders: 'Líder original',
      extraMaterials: {},
      siteAssessment: {},
    });
    expect(persistedFamily?.name).toBe('Família Original');

    session.markConstructionSiteInProgress(constructionSiteId);
    session.updateActiveHouseExtraMaterials({floorBeams: 10});

    expect(session.getActiveHouse().extraMaterials.floorBeams).toBe(10);
  });

  it('exclui fisicamente construção arquivada com dados filhos em cascata', () => {
    const {storage, writes} = createStorage();
    const session = createConstructionSiteSession(storage);
    const archivedConstructionSite = session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });
    session.createMonitor({name: 'Monitor 01', phone: '(11) 99999-0000'});
    session.createHouse({familyName: 'Família 01', houseType: 'tipo6'});

    session.archiveConstructionSite(archivedConstructionSite.constructionSite.id);
    const nextConstructionSite = session.createConstructionSite({
      externalCode: 'CC2604',
      constructionDate: '2026-05-12',
      communityName: 'Guarujá',
    });
    session.createHouse({familyName: 'Família 02', houseType: 'tipo3'});

    session.deleteArchivedConstructionSite(archivedConstructionSite.constructionSite.id);

    const snapshots = session.getConstructionSiteSnapshots();
    expect(snapshots.map((entry) => entry.constructionSite.id)).toEqual([
      nextConstructionSite.constructionSite.id,
    ]);
    expect(snapshots[0]?.houses.map((house) => house.familyId)).toHaveLength(1);
    expect(snapshots[0]?.families.map((family) => family.name)).toEqual(['Família 02']);
    expect(snapshots[0]?.monitors).toEqual([]);
    expect(session.getConstructionSite()?.constructionSite.id).toBe(nextConstructionSite.constructionSite.id);
    expect(session.canOpenRacEditor()).toBe(true);
    expect(writes.at(-1)).toEqual(snapshots);
  });

  it('não exclui fisicamente construção que não esteja arquivada', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    const inProgressConstructionSite = session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });
    const completedConstructionSite = session.createConstructionSite({
      externalCode: 'CC2604',
      constructionDate: '2026-05-12',
      communityName: 'Guarujá',
    });

    session.markConstructionSiteCompleted(completedConstructionSite.constructionSite.id);
    session.deleteArchivedConstructionSite(inProgressConstructionSite.constructionSite.id);
    session.deleteArchivedConstructionSite(completedConstructionSite.constructionSite.id);

    expect(session.getConstructionSiteSnapshots().map((entry) => ({
      id: entry.constructionSite.id,
      status: entry.constructionSite.status,
    }))).toEqual([
      {id: inProgressConstructionSite.constructionSite.id, status: 'in_progress'},
      {id: completedConstructionSite.constructionSite.id, status: 'completed'},
    ]);
  });

  it('exclui fisicamente casa arquivada e remove família sem referência restante', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const archivedHouse = session.createHouse({familyName: 'Família Arquivada'});
    const activeHouse = session.createHouse({familyName: 'Família Ativa'});

    session.archiveHouse(archivedHouse.id);
    session.deleteArchivedHouse(archivedHouse.id);

    const state = session.getConstructionSite();
    expect(state?.houses.map((house) => house.id)).toEqual([activeHouse.id]);
    expect(state?.families.map((family) => family.name)).toEqual(['Família Ativa']);
    expect(state?.constructionSite.activeHouseId).toBe(activeHouse.id);
  });

  it('não exclui casa que não esteja arquivada ou que pertença a construção bloqueada', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    const constructionSite = session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });
    const draftHouse = session.createHouse({familyName: 'Família Rascunho'});
    const archivedHouse = session.createHouse({familyName: 'Família Arquivada'});

    session.deleteArchivedHouse(draftHouse.id);
    expect(session.getConstructionSite()?.houses.map((house) => house.id)).toContain(draftHouse.id);

    session.archiveHouse(archivedHouse.id);
    session.markConstructionSiteCompleted(constructionSite.constructionSite.id);
    session.deleteArchivedHouse(archivedHouse.id);

    expect(session.getConstructionSite()?.houses.map((house) => house.id)).toEqual([
      draftHouse.id,
      archivedHouse.id,
    ]);
  });

  it('exclui fisicamente monitor inativo sem afetar monitores ativos', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    session.createConstructionSite({externalCode: 'CC2603', constructionDate: '2026-05-11', communityName: 'Tiradentes'});
    const inactiveMonitor = session.createMonitor({name: 'Monitor Inativo', phone: '(11) 99999-0000'});
    const activeMonitor = session.createMonitor({name: 'Monitor Ativo', phone: '(11) 98888-0000'});

    session.inactivateMonitor(inactiveMonitor.id);
    session.deleteInactiveMonitor(inactiveMonitor.id);
    session.deleteInactiveMonitor(activeMonitor.id);

    expect(session.getConstructionSite()?.monitors.map((monitor) => ({
      id: monitor.id,
      status: monitor.status,
    }))).toEqual([
      {id: activeMonitor.id, status: 'active'},
    ]);
  });

  it('não exclui monitor inativo quando a construção está concluída ou arquivada', () => {
    const {storage} = createStorage();
    const session = createConstructionSiteSession(storage);
    const completedConstructionSite = session.createConstructionSite({
      externalCode: 'CC2603',
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
    });
    const completedMonitor = session.createMonitor({name: 'Monitor Concluído', phone: '(11) 99999-0000'});
    session.inactivateMonitor(completedMonitor.id);
    session.markConstructionSiteCompleted(completedConstructionSite.constructionSite.id);

    session.deleteInactiveMonitor(completedMonitor.id);

    expect(session.getConstructionSite()?.monitors.map((monitor) => monitor.id)).toEqual([completedMonitor.id]);

    const archivedConstructionSite = session.createConstructionSite({
      externalCode: 'CC2604',
      constructionDate: '2026-05-12',
      communityName: 'Guarujá',
    });
    const archivedMonitor = session.createMonitor({name: 'Monitor Arquivado', phone: '(11) 98888-0000'});
    session.inactivateMonitor(archivedMonitor.id);
    session.archiveConstructionSite(archivedConstructionSite.constructionSite.id);

    session.deleteInactiveMonitor(archivedMonitor.id);

    const archivedSnapshot = session.getConstructionSiteSnapshots()
      .find((entry) => entry.constructionSite.id === archivedConstructionSite.constructionSite.id);
    expect(archivedSnapshot?.monitors.map((monitor) => monitor.id)).toEqual([archivedMonitor.id]);
  });

  it('normaliza destrutivamente registros antigos ao ler a sessão', () => {
    const now = '2026-05-09T12:00:00.000Z';
    const legacyConstructionSite = {
      constructionSite: {
        id: 'construction_site_legacy',
        externalCode: 'CC2603',
        communityId: 'community_1',
        communityIds: ['community_1'],
        status: 'draft',
        activeHouseId: 'house_legacy',
        leaderAssignments: [],
        monitorAssignments: [],
        createdAt: now,
        updatedAt: now,
      },
      communities: [{id: 'community_1', name: 'Tiradentes'}],
      families: [{
        id: 'family_legacy',
        constructionSiteId: 'construction_site_legacy',
        name: 'Família Legada',
        notes: 'Nota antiga da família',
      }],
      people: [],
      houses: [{
        id: 'house_legacy',
        constructionSiteId: 'construction_site_legacy',
        familyId: 'family_legacy',
        communityId: 'community_1',
        houseType: 'tipo6',
        houseSize: 'grande',
        terrainType: 1,
        status: 'draft',
        designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
        siteAssessment: {
          hasWater: true,
          hasStone: true,
          soilNotes: 'solo antigo',
        },
        pilotiLayout: {points: []},
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {
            schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
            objects: [],
          },
        },
        version: 1,
        createdAt: now,
        updatedAt: now,
      }],
    };

    const session = createConstructionSiteSession(createStorage([legacyConstructionSite as never]).storage);
    const state = session.getConstructionSite() as unknown as Record<string, unknown>;
    const constructionSiteRecord = session.getConstructionSite()?.constructionSite as unknown as Record<string, unknown>;
    const houseRecord = session.getActiveHouse() as unknown as Record<string, unknown>;

    expect('people' in state).toBe(false);
    expect('leaderAssignments' in constructionSiteRecord).toBe(false);
    expect('monitorAssignments' in constructionSiteRecord).toBe(false);
    expect('communityIds' in constructionSiteRecord).toBe(false);
    expect(session.getConstructionSite()?.monitors).toEqual([]);
    expect(constructionSiteRecord.constructionDate).toBe('2026-05-09');
    expect(houseRecord.houseSize).toBe('large');
    expect(houseRecord.notes).toBe('Nota antiga da família');
    expect(houseRecord.siteAssessment).toEqual({});
  });
});

function createDrawingDocument(input: {
  houseId: string;
  familyName: string;
  houseType: HouseState['houseType'];
}): HouseDrawingDocument {
  return {
    documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
    schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
    setup: {
      familyName: input.familyName,
      selectedPilotiHeights: [1, 1.5, 2],
    },
    house: {
      id: input.houseId,
      houseType: input.houseType,
      pilotis: {},
      terrainType: 3,
      views: {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideMappings: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      preAssignedSides: {},
    },
    canvas: {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    },
  };
}
