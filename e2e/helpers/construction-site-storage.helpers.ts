import type {Page} from '@playwright/test';

type SeedHouseType = 'tipo6' | 'tipo3' | null;
type SeedHouseSize = 'large' | 'small';

interface SeedConstructionSiteDocumentOptions {
  houseType?: SeedHouseType;
  houseSize?: SeedHouseSize;
  leaders?: string;
  notes?: string;
  familyNotes?: string;
  primaryContactName?: string;
}

export async function seedConstructionSiteDocument(
  page: Page,
  options: SeedConstructionSiteDocumentOptions = {},
) {
  await page.evaluate(async (document) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('rac-designer-teto', 2);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir IndexedDB.'));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('construction-site-documents')) {
          database.createObjectStore('construction-site-documents');
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('construction-site-documents', 'readwrite');
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Falha ao escrever IndexedDB.'));
        };
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction
          .objectStore('construction-site-documents')
          .put(document, 'construction-sites');
      };
    });
  }, createSeedDocument(options));
}

function createSeedDocument(options: SeedConstructionSiteDocumentOptions) {
  const now = '2026-05-11T12:00:00.000Z';
  const houseType = options.houseType === undefined ? 'tipo6' : options.houseType;

  return {
    version: 1,
    constructionSites: [{
      constructionSite: {
        id: 'construction_site_e2e',
        externalCode: 'CC2603',
        constructionDate: '2026-05-11',
        communityId: 'community_e2e',
        status: 'in_progress',
        activeHouseId: 'house_e2e',
        createdAt: now,
        updatedAt: now,
      },
      communities: [{id: 'community_e2e', name: 'Tiradentes'}],
      families: [{
        id: 'family_e2e',
        constructionSiteId: 'construction_site_e2e',
        communityId: 'community_e2e',
        name: 'Família E2E',
        primaryContactName: options.primaryContactName,
        ...(options.familyNotes ? {notes: options.familyNotes} : {}),
      }],
      monitors: [],
      houses: [{
        id: 'house_e2e',
        constructionSiteId: 'construction_site_e2e',
        familyId: 'family_e2e',
        communityId: 'community_e2e',
        houseType,
        ...(options.houseSize ? {houseSize: options.houseSize} : {}),
        ...(options.leaders ? {leaders: options.leaders} : {}),
        terrainType: 1,
        status: 'draft',
        designSettings: {selectedPilotiHeights: [1, 1.5, 2]},
        siteAssessment: {terrainComplexity: 'flat'},
        pilotiLayout: {points: []},
        drawingDocument: {
          schemaVersion: 1,
          house: {
            id: 'house_e2e',
            houseType,
            pilotis: {},
            terrainType: 1,
            views: {top: [], front: [], back: [], side1: [], side2: []},
            sideMappings: {top: null, bottom: null, left: null, right: null},
            preAssignedSides: {},
          },
          canvas: {schemaVersion: 1, objects: []},
          views: {},
        },
        ...(options.notes ? {notes: options.notes} : {}),
        version: 1,
        createdAt: now,
        updatedAt: now,
      }],
    }],
  };
}
