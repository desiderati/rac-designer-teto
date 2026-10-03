import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {
  getHouse3DViewerCameraPoseStorageKey,
  readHouse3DViewerCameraPose,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  getHouse3DViewerPreferencesStorageKey,
  readHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';

// Incrementar quando o layout, os textos fixos ou a captura do PDF mudarem.
const RAC_PDF_CACHE_VERSION = 7;

interface CachedRacPdf {
  fingerprint: string;
  blob: Blob;
  fileName: string;
  pageCount: number;
}

const cachedByHouse = new Map<string, CachedRacPdf>();

export function clearRacPdfCache(): void {
  cachedByHouse.clear();
}

function cacheKey(constructionSite: ConstructionSiteState, houseId: string): string {
  return `${constructionSite.constructionSite.id}\u0000${houseId}`;
}

/** Projeção das entradas efetivamente consumidas pelo relatório e pelas duas capturas. */
export function getRacPdfFingerprint(constructionSite: ConstructionSiteState, houseId: string): string | null {
  const house = constructionSite.houses.find((entry) => entry.id === houseId && entry.status !== 'archived');
  if (!house) return null;

  const family = constructionSite.families.find((entry) => entry.id === house.familyId);
  const persistedViewer = house.drawingDocument.viewer3D;
  const viewer3D = persistedViewer
    ? {cameraPose: persistedViewer.cameraPose, wallColor: persistedViewer.wallColor}
    : {
      cameraPose: readHouse3DViewerCameraPose(getHouse3DViewerCameraPoseStorageKey(house.id)),
      wallColor: readHouse3DViewerPreferences(getHouse3DViewerPreferencesStorageKey(house.id)).wallColor,
    };

  return stableStringify({
    cacheVersion: RAC_PDF_CACHE_VERSION,
    constructionSiteId: constructionSite.constructionSite.id,
    houseId: house.id,
    constructionCode: constructionSite.constructionSite.externalCode,
    communityName: getConstructionSiteCommunityName(constructionSite),
    family: {id: family?.id, name: family?.name, photoDataUrl: family?.photoDataUrl},
    monitors: constructionSite.monitors
      .filter((monitor) => monitor.status === 'active')
      .map(({id, name, phone, email}) => ({id, name, phone, email})),
    house: {
      familyId: house.familyId,
      houseType: house.houseType,
      terrainType: house.terrainType,
      houseSize: house.houseSize,
      leaders: house.leaders,
      notes: house.notes,
      extraMaterials: house.extraMaterials,
      designSettings: house.designSettings,
      siteAssessment: {
        soilProfile: house.siteAssessment.soilProfile,
        hasHydraulicObstacles: house.siteAssessment.hasHydraulicObstacles,
        hasUndergroundObstacles: house.siteAssessment.hasUndergroundObstacles,
        hasElevatedObstacles: house.siteAssessment.hasElevatedObstacles,
        hasNeighborSetbackConstraints: house.siteAssessment.hasNeighborSetbackConstraints,
        residentActions: house.siteAssessment.residentActions,
        terrainPhotos: house.siteAssessment.terrainPhotos?.slice(0, 4).map(({url}) => url),
      },
      pilotiLayout: house.pilotiLayout,
      drawing: {
        house: house.drawingDocument.house,
        canvas: house.drawingDocument.canvas,
        views: house.drawingDocument.views,
      },
      viewer3D,
    },
  });
}

export function getCachedRacPdf(
  constructionSite: ConstructionSiteState,
  houseId: string,
  fingerprint: string,
): CachedRacPdf | null {
  try {
    const cached = cachedByHouse.get(cacheKey(constructionSite, houseId));
    return cached?.fingerprint === fingerprint && cached.blob.size > 0 ? cached : null;
  } catch {
    return null;
  }
}

export function cacheRacPdf(
  constructionSite: ConstructionSiteState,
  houseId: string,
  entry: CachedRacPdf,
): void {
  if (!entry.blob || entry.blob.size <= 0) return;
  try {
    cachedByHouse.set(cacheKey(constructionSite, houseId), entry);
  } catch {
    // Falha no cache não impede gerar ou baixar um documento válido.
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record).sort().map((key) => [key, sortValue(record[key])]),
  );
}
