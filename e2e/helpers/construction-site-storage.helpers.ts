import type {Page} from '@playwright/test';
import type {HouseExtraMaterials, MonitorStatus, SiteAssessment} from '../../src/shared/types/construction-site';
import type {HousePiloti, HouseSideMapping, HouseType, HouseViews} from '../../src/shared/types/house';
import {getAllPilotiIds} from '../../src/shared/types/piloti';

type SeedHouseType = HouseType;
type SeedHouseSize = 'large' | 'small';

interface SeedConstructionSiteMonitor {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  status?: MonitorStatus;
}

export interface SeedConstructionSiteDocumentOptions {
  houseType?: SeedHouseType;
  houseSize?: SeedHouseSize;
  leaders?: string;
  extraMaterials?: HouseExtraMaterials;
  notes?: string;
  familyNotes?: string;
  primaryContactName?: string;
  monitors?: SeedConstructionSiteMonitor[];
  siteAssessment?: Partial<SiteAssessment>;
  selectedPilotiHeights?: number[];
  pilotis?: Record<string, Partial<HousePiloti>>;
  insertInitialViews?: boolean;
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
  const initialViews = options.insertInitialViews
    ? createInitialViewsForHouseType(houseType)
    : createEmptyInitialViews();
  const pilotis = options.pilotis
    ? Object.fromEntries(
      getAllPilotiIds().map((pilotiId) => [
        pilotiId,
        {
          height: 1.5,
          nivel: 0.4,
          isMaster: false,
          ...options.pilotis?.[pilotiId],
        },
      ]),
    )
    : {};

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
      monitors: (options.monitors ?? []).map((monitor, index) => ({
        id: monitor.id ?? `monitor_e2e_${index + 1}`,
        constructionSiteId: 'construction_site_e2e',
        name: monitor.name,
        phone: monitor.phone,
        email: monitor.email,
        status: monitor.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      })),
      houses: [{
        id: 'house_e2e',
        constructionSiteId: 'construction_site_e2e',
        familyId: 'family_e2e',
        communityId: 'community_e2e',
        houseType,
        ...(options.houseSize ? {houseSize: options.houseSize} : {}),
        ...(options.leaders ? {leaders: options.leaders} : {}),
        ...(options.extraMaterials ? {extraMaterials: options.extraMaterials} : {}),
        terrainType: 1,
        status: 'draft',
        designSettings: {selectedPilotiHeights: options.selectedPilotiHeights ?? [1, 1.5, 2]},
        siteAssessment: {
          terrainComplexity: 'flat',
          ...options.siteAssessment,
        },
        pilotiLayout: {points: []},
        drawingDocument: {
          schemaVersion: 1,
          house: {
            id: 'house_e2e',
            houseType,
            pilotis,
            terrainType: 1,
            views: initialViews.views,
            sideMappings: initialViews.sideMappings,
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

function createEmptyHouseViews(): HouseViews {
  return {top: [], front: [], back: [], side1: [], side2: []};
}

function createEmptySideMappings(): HouseSideMapping {
  return {top: null, bottom: null, left: null, right: null};
}

function createEmptyInitialViews() {
  return {
    views: createEmptyHouseViews(),
    sideMappings: createEmptySideMappings(),
  };
}

function createInitialViewsForHouseType(houseType: SeedHouseType) {
  const {views, sideMappings} = createEmptyInitialViews();
  views.top.push({instanceId: 'top_e2e'});

  if (houseType === 'tipo6') {
    views.front.push({instanceId: 'front_e2e', side: 'top'});
    sideMappings.top = 'front';
  } else if (houseType === 'tipo3') {
    views.side2.push({instanceId: 'side2_e2e', side: 'left'});
    sideMappings.left = 'side2';
  }

  return {views, sideMappings};
}
