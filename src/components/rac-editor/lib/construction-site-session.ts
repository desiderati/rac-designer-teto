import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  DEFAULT_HOUSE_PILOTI,
  DEFAULT_HOUSE_PILOTI_HEIGHTS,
  type HouseState,
  type HouseType,
} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {normalizeOptionalPhotoDataUrl} from '@/shared/lib/photo-data-url.ts';
import {
  createEmptyConstructionSiteState,
  EMPTY_DRAWING_DOCUMENT,
  EMPTY_SITE_ASSESSMENT,
  type ConstructionSiteRecord,
  type FamilyRecord,
  type CommunityRecord,
  type PersistedDrawingDocument,
  type PersistedPilotiPoint,
  type PersistedHouseRecord,
  type MonitorRecord,
  type MonitorStatus,
  type ConstructionSiteSummary,
  type ConstructionSiteState,
  type HouseExtraMaterials,
  type HouseSize,
  type SiteAssessment,
  toConstructionSiteSummary,
} from '@/shared/types/construction-site.ts';
import {
  HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
  HOUSE_DRAWING_DOCUMENT_TYPE,
  type HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';
import {
  cloneConstructionSiteValue,
  isConstructionSiteStatus,
  isHouseType,
  isMonitorStatus,
  isPersistedHouseStatus,
  normalizeConstructionCode,
  normalizeConstructionDate,
  normalizeConstructionSiteCommunityId,
  normalizeDateOnlyFromIso,
  normalizeHouseSize,
  normalizeMonitorEmail,
  normalizeMonitorPhotoDataUrl,
  normalizeNumberArray,
  normalizeOptionalText,
  normalizePersistedMonitorEmail,
  normalizePersistedMonitorPhone,
  normalizePilotiLayout,
  requireConstructionCode,
  requireConstructionDate,
  requireMonitorName,
  requireMonitorPhone,
  sanitizeHouseExtraMaterials,
  sanitizeSiteAssessment,
} from '@/components/rac-editor/lib/construction-site-session-normalizers.ts';

export interface StoredConstructionSitesDocument {
  version: number;
  constructionSites: ConstructionSiteState[];
}

export interface ConstructionSiteSessionStoragePort {
  read(): StoredConstructionSitesDocument;
  write(constructionSites: ConstructionSiteState[]): void;
}

export interface ConstructionSiteSessionPort {
  getConstructionSiteSummaries(): ConstructionSiteSummary[];
  getConstructionSiteSnapshots(): ConstructionSiteState[];
  getConstructionSite(): ConstructionSiteState | null;
  getActiveHouse(): PersistedHouseRecord;
  getActiveFamily(): FamilyRecord;
  canOpenRacEditor(): boolean;
  prepareRacEditorOpening(): HouseDrawingDocument | null;
  createConstructionSite(input: CreateConstructionSiteInput): ConstructionSiteState;
  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void;
  archiveActiveConstructionSite(): void;
  archiveConstructionSite(constructionSiteId: string): void;
  unarchiveConstructionSite(constructionSiteId: string): void;
  markConstructionSiteCompleted(constructionSiteId: string): void;
  markConstructionSiteInProgress(constructionSiteId: string): void;
  activateConstructionSite(constructionSiteId: string): HouseDrawingDocument | null;
  createMonitor(input: CreateMonitorInput): MonitorRecord;
  updateMonitor(monitorId: string, input: UpdateMonitorInput): void;
  inactivateMonitor(monitorId: string): void;
  reactivateMonitor(monitorId: string): void;
  createHouse(input: CreateHouseInput): PersistedHouseRecord;
  duplicateActiveHouse(): PersistedHouseRecord;
  archiveActiveHouse(): void;
  archiveHouse(houseId: string): void;
  unarchiveHouse(houseId: string): void;
  markActiveHouseRacPrinted(): void;
  markHouseBuilt(houseId: string): void;
  markHouseDraft(houseId: string): void;
  activateHouse(constructionSiteId: string, houseId: string): HouseDrawingDocument | null;
  updateActiveFamily(input: UpdateFamilyInput): void;
  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void;
  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void;
  updateActiveHouseExtraMaterials(input: UpdateHouseExtraMaterialsInput): void;
  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void;
  getActiveHouseDrawingDocument(): HouseDrawingDocument | null;
  setActiveFamilyName(name: string): void;
  setActiveHouseSelectedPilotiHeights(heights: number[]): void;
  syncActiveHouseMetadata(input: {
    houseType: HouseType;
    terrainType: number;
    familyName: string;
    selectedPilotiHeights: number[];
  }): void;
}

type HouseConstructionSiteCandidate = {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
};

export interface CreateConstructionSiteInput {
  externalCode: string;
  photoDataUrl?: string;
  constructionDate: string;
  communityName: string;
}

export interface UpdateConstructionSiteInput {
  externalCode?: string;
  photoDataUrl?: string;
  constructionDate?: string;
  communityName?: string;
}

export interface CreateMonitorInput {
  name: string;
  phone: string;
  photoDataUrl?: string;
  email?: string;
}

export interface UpdateMonitorInput {
  name?: string;
  phone?: string;
  photoDataUrl?: string;
  email?: string;
}

export interface CreateHouseInput {
  familyName: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  familyPhotoDataUrl?: string;
  houseType?: HouseType;
  houseSize?: HouseSize;
  leaders?: string;
  extraMaterials?: HouseExtraMaterials;
  siteAssessment?: Partial<SiteAssessment>;
  notes?: string;
}

export interface UpdateFamilyInput {
  name?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  photoDataUrl?: string;
  notes?: string;
}

export interface UpdateHouseConfigurationInput {
  familyName?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  familyPhotoDataUrl?: string;
  houseSize?: HouseSize;
  leaders?: string;
  siteAssessment?: Partial<SiteAssessment>;
  notes?: string;
}

export type UpdateHouseExtraMaterialsInput = HouseExtraMaterials;

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialHouseState(houseId: string): HouseState {
  return HouseAggregate.createInitialHouseState({
    id: houseId,
    pilotiIds: getAllPilotiIds(),
    defaultPiloti: DEFAULT_HOUSE_PILOTI,
    defaultTerrainType: 1,
  });
}

const DEFAULT_CONSTRUCTION_CODE = 'CC0000';
const DEFAULT_COMMUNITY_NAME = 'Comunidade não informada';
const READ_ONLY_CONSTRUCTION_SITE_ERROR = 'Não é possível editar uma Construção TETO concluída ou arquivada.';

function createConstructionSiteRecord(now: string, input: CreateConstructionSiteInput, communityId: string): ConstructionSiteRecord {
  return {
    id: createId('construction'),
    externalCode: requireConstructionCode(input.externalCode),
    photoDataUrl: normalizeOptionalPhotoDataUrl(input.photoDataUrl),
    constructionDate: requireConstructionDate(input.constructionDate),
    communityId,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
}

function requireCommunityName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Comunidade é obrigatória.');
  const communityName = value.trim();
  if (!communityName) throw new Error('Comunidade é obrigatória.');
  return communityName;
}

function createCommunityRecord(now: string, name: string): CommunityRecord {
  void now;
  return {
    id: createId('community'),
    name,
  };
}

function createFamilyRecord(
  constructionSiteId: string,
  now: string,
  input: Partial<UpdateFamilyInput> = {},
): FamilyRecord {
  void now;
  return {
    id: createId('family'),
    constructionSiteId,
    name: input.name?.trim() || 'Família sem nome',
    primaryContactName: input.primaryContactName,
    primaryContactPhone: input.primaryContactPhone,
    primaryContactEmail: input.primaryContactEmail,
    photoDataUrl: normalizeOptionalPhotoDataUrl(input.photoDataUrl),
    notes: normalizeOptionalText(input.notes),
  };
}

function createMonitorRecord(
  constructionSiteId: string,
  now: string,
  input: CreateMonitorInput,
): MonitorRecord {
  return {
    id: createId('monitor'),
    constructionSiteId,
    name: requireMonitorName(input.name),
    phone: requireMonitorPhone(input.phone),
    photoDataUrl: normalizeMonitorPhotoDataUrl(input.photoDataUrl),
    email: normalizeMonitorEmail(input.email),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

function createHouseRecord(
  constructionSiteId: string,
  familyId: string,
  now: string,
  input: Pick<CreateHouseInput, 'houseType' | 'houseSize' | 'leaders' | 'extraMaterials' | 'siteAssessment' | 'notes'> = {},
): PersistedHouseRecord {

  const id = createId('house');
  const houseState = createInitialHouseState(id);
  houseState.houseType = input.houseType ?? null;

  return {
    id,
    constructionSiteId,
    familyId,
    houseType: input.houseType ?? null,
    terrainType: 1,
    status: 'draft',
    houseSize: normalizeHouseSize(input.houseSize),
    leaders: normalizeOptionalText(input.leaders),
    extraMaterials: sanitizeHouseExtraMaterials(input.extraMaterials),
    designSettings: {
      selectedPilotiHeights: [...DEFAULT_HOUSE_PILOTI_HEIGHTS],
    },
    siteAssessment: sanitizeSiteAssessment(input.siteAssessment ?? EMPTY_SITE_ASSESSMENT),
    pilotiLayout: {
      points: [],
    },
    drawingDocument: {
      ...EMPTY_DRAWING_DOCUMENT,
      house: houseState,
      canvas: {
        schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
        objects: [],
      },
    },
    notes: normalizeOptionalText(input.notes),
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function createConstructionSiteState(input: CreateConstructionSiteInput): ConstructionSiteState {
  const now = new Date().toISOString();
  const community = createCommunityRecord(now, requireCommunityName(input.communityName));
  const constructionSite = createConstructionSiteRecord(now, input, community.id);
  const state = createEmptyConstructionSiteState(constructionSite);
  state.communities.push(community);
  return state;
}

function normalizeConstructionSiteState(input: ConstructionSiteState): ConstructionSiteState {
  const rawConstructionSite = input.constructionSite;
  const now = new Date().toISOString();
  const constructionSiteId = rawConstructionSite.id || createId('construction');
  const communities = (input.communities ?? [])
    .map((community) => ({
      id: community.id || createId('community'),
      name: typeof community.name === 'string' && community.name.trim()
        ? community.name.trim()
        : DEFAULT_COMMUNITY_NAME,
      city: community.city,
      state: community.state,
    }));

  const families = (input.families ?? []).map((family) => ({
    id: family.id,
    constructionSiteId: family.constructionSiteId || constructionSiteId,
    communityId: family.communityId,
    name: family.name || 'Família sem nome',
    primaryContactName: family.primaryContactName,
    primaryContactPhone: family.primaryContactPhone,
    primaryContactEmail: family.primaryContactEmail,
    photoDataUrl: normalizeOptionalPhotoDataUrl(family.photoDataUrl),
    notes: family.notes,
  }));

  const primaryCommunityId = normalizeConstructionSiteCommunityId(rawConstructionSite.communityId, communities, now);
  const constructionSite: ConstructionSiteRecord = {
    id: constructionSiteId,
    externalCode: normalizeConstructionCode(rawConstructionSite.externalCode) ?? DEFAULT_CONSTRUCTION_CODE,
    photoDataUrl: normalizeOptionalPhotoDataUrl(rawConstructionSite.photoDataUrl),
    constructionDate: normalizeConstructionDate(rawConstructionSite.constructionDate)
      ?? normalizeDateOnlyFromIso(rawConstructionSite.createdAt)
      ?? normalizeDateOnlyFromIso(now)
      ?? now.slice(0, 10),
    communityId: primaryCommunityId,
    status: isConstructionSiteStatus(rawConstructionSite.status) ? rawConstructionSite.status : 'in_progress',
    activeHouseId: rawConstructionSite.activeHouseId,
    createdAt: rawConstructionSite.createdAt || now,
    updatedAt: rawConstructionSite.updatedAt || now,
  };

  return {
    constructionSite,
    communities,
    families,
    monitors: normalizeMonitors((input as Partial<ConstructionSiteState>).monitors, constructionSite.id, now),
    houses: (input.houses ?? []).map((house) => {
      const houseId = house.id || createId('house');
      const family = families.find((entry) => entry.id === house.familyId);
      return {
        id: houseId,
        constructionSiteId: house.constructionSiteId || constructionSite.id,
        familyId: house.familyId,
        communityId: house.communityId,
        houseType: isHouseType(house.houseType) ? house.houseType : null,
        terrainType: Number.isFinite(house.terrainType) ? house.terrainType : 1,
        status: isPersistedHouseStatus(house.status) ? house.status : 'draft',
        houseSize: normalizeHouseSize(house.houseSize),
        leaders: normalizeOptionalText(house.leaders),
        extraMaterials: sanitizeHouseExtraMaterials(house.extraMaterials),
        designSettings: {
          selectedPilotiHeights: normalizeNumberArray(house.designSettings?.selectedPilotiHeights)
            ?? [...DEFAULT_HOUSE_PILOTI_HEIGHTS],
        },
        siteAssessment: sanitizeSiteAssessment(house.siteAssessment ?? EMPTY_SITE_ASSESSMENT),
        pilotiLayout: normalizePilotiLayout(house.pilotiLayout),
        drawingDocument: normalizePersistedDrawingDocument(house.drawingDocument, houseId),
        notes: normalizeOptionalText(house.notes) ?? normalizeOptionalText(family?.notes),
        version: Number.isFinite(house.version) ? house.version : 1,
        createdAt: house.createdAt || now,
        updatedAt: house.updatedAt || now,
      };
    }),
  };
}

class ConstructionSiteSession implements ConstructionSiteSessionPort {
  private readonly constructionSites: ConstructionSiteState[];

  private state: ConstructionSiteState | null;

  constructor(private readonly storage: ConstructionSiteSessionStoragePort) {
    this.constructionSites = this.storage.read().constructionSites.map(normalizeConstructionSiteState);
    this.state = this.resolveInitialConstructionSite();
    if (this.state) {
      this.normalizeConstructionSiteActiveHouse(this.state);
    }
  }

  getConstructionSiteSummaries(): ConstructionSiteSummary[] {
    return this.constructionSites
      .map(toConstructionSiteSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getConstructionSiteSnapshots(): ConstructionSiteState[] {
    return this.constructionSites;
  }

  getConstructionSite(): ConstructionSiteState | null {
    return this.state;
  }

  getActiveHouse(): PersistedHouseRecord {
    const house = this.getActiveHouseOrNull();
    if (!house) {
      throw new Error('Nenhuma casa ativa disponível para o RAC Editor.');
    }
    return house;
  }

  getActiveFamily(): FamilyRecord {
    const activeHouse = this.getActiveHouse();
    const family = this.state.families.find((entry) => entry.id === activeHouse.familyId) ?? this.state.families[0];
    if (!family) {
      const now = new Date().toISOString();
      const created = createFamilyRecord(this.state.constructionSite.id, now);
      this.state.families.push(created);
      activeHouse.familyId = created.id;
      this.state.constructionSite.updatedAt = now;
      this.persist();
      return created;
    }
    return family;
  }

  canOpenRacEditor(): boolean {
    return this.hasActiveRacEditorDocument() || this.findRacEditorOpeningCandidate() !== null;
  }

  prepareRacEditorOpening(): HouseDrawingDocument | null {
    if (this.hasActiveRacEditorDocument()) {
      return this.getActiveHouseDrawingDocument();
    }

    const candidate = this.findRacEditorOpeningCandidate();
    if (!candidate) return null;

    return this.selectRacEditorOpeningCandidate(candidate);
  }

  setActiveFamilyName(name: string): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    const family = this.getActiveFamily();
    family.name = name;
    this.touchActiveHouse();
  }

  setActiveHouseSelectedPilotiHeights(heights: number[]): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    house.designSettings.selectedPilotiHeights = [...heights];
    this.touchActiveHouse();
  }

  syncActiveHouseMetadata(input: {
    houseType: HouseType;
    terrainType: number;
    familyName: string;
    selectedPilotiHeights: number[];
  }): void {

    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    const family = this.getActiveFamily();
    house.houseType = input.houseType;
    house.terrainType = input.terrainType;
    house.designSettings.selectedPilotiHeights = [...input.selectedPilotiHeights];
    family.name = input.familyName || family.name;
    this.touchActiveHouse();
  }

  createConstructionSite(input: CreateConstructionSiteInput): ConstructionSiteState {
    const externalCode = requireConstructionCode(input.externalCode);
    if (this.hasConstructionCode(externalCode)) {
      throw new Error('Já existe uma Construção TETO com este código.');
    }

    this.state = createConstructionSiteState({...input, externalCode});
    this.constructionSites.push(this.state);
    this.persist();
    return this.state;
  }

  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void {
    if (!this.state) return;
    if (this.isConstructionSiteReadOnly(this.state)) return;

    const now = new Date().toISOString();
    const constructionSite = this.state.constructionSite;
    if (input.externalCode !== undefined) constructionSite.externalCode = requireConstructionCode(input.externalCode);
    if ('photoDataUrl' in input) constructionSite.photoDataUrl = normalizeOptionalPhotoDataUrl(input.photoDataUrl);
    if ('constructionDate' in input) constructionSite.constructionDate = requireConstructionDate(input.constructionDate);
    if (input.communityName !== undefined) {
      this.replaceConstructionSiteCommunity(requireCommunityName(input.communityName));
    }

    constructionSite.updatedAt = now;
    this.persist();
  }

  archiveActiveConstructionSite(): void {
    if (!this.state) return;
    this.archiveConstructionSite(this.state.constructionSite.id);
  }

  archiveConstructionSite(constructionSiteId: string): void {
    const constructionSite = this.constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId);
    if (!constructionSite || constructionSite.constructionSite.status === 'archived') return;

    constructionSite.constructionSite.status = 'archived';
    constructionSite.constructionSite.updatedAt = new Date().toISOString();

    if (this.state?.constructionSite.id === constructionSiteId) {
      this.state = this.resolveInitialConstructionSite();
    }
    this.persist();
  }

  unarchiveConstructionSite(constructionSiteId: string): void {
    const constructionSite = this.constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId);
    if (!constructionSite || constructionSite.constructionSite.status !== 'archived') return;

    constructionSite.constructionSite.status = 'in_progress';
    constructionSite.constructionSite.updatedAt = new Date().toISOString();
    this.normalizeConstructionSiteActiveHouse(constructionSite);

    if (!this.canOpenRacEditor() || this.state?.constructionSite.id === constructionSiteId) {
      this.state = constructionSite;
    }
    this.persist();
  }

  markConstructionSiteCompleted(constructionSiteId: string): void {
    this.updateConstructionSiteStatus(constructionSiteId, 'completed');
  }

  markConstructionSiteInProgress(constructionSiteId: string): void {
    this.updateConstructionSiteStatus(constructionSiteId, 'in_progress');
  }

  activateConstructionSite(constructionSiteId: string): HouseDrawingDocument | null {
    const constructionSite = this.constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId);
    if (!constructionSite) return null;

    this.state = constructionSite;
    this.normalizeConstructionSiteActiveHouse(constructionSite);
    this.persist();
    return this.getActiveHouseDrawingDocument();
  }

  createMonitor(input: CreateMonitorInput): MonitorRecord {
    if (!this.state) {
      throw new Error('Não foi possível criar monitor sem Construção TETO ativa.');
    }
    if (this.isConstructionSiteReadOnly(this.state)) {
      throw new Error(READ_ONLY_CONSTRUCTION_SITE_ERROR);
    }

    const now = new Date().toISOString();
    const monitor = createMonitorRecord(this.state.constructionSite.id, now, input);
    this.state.monitors.push(monitor);
    this.state.constructionSite.updatedAt = now;
    this.persist();
    return monitor;
  }

  updateMonitor(monitorId: string, input: UpdateMonitorInput): void {
    const monitorConstructionSite = this.findMonitorConstructionSite(monitorId);
    if (!monitorConstructionSite) return;

    const now = new Date().toISOString();
    const {constructionSite, monitor} = monitorConstructionSite;
    if (this.isConstructionSiteReadOnly(constructionSite)) return;
    if (input.name !== undefined) monitor.name = requireMonitorName(input.name);
    if (input.phone !== undefined) monitor.phone = requireMonitorPhone(input.phone);
    if ('photoDataUrl' in input) monitor.photoDataUrl = normalizeMonitorPhotoDataUrl(input.photoDataUrl);
    if ('email' in input) monitor.email = normalizeMonitorEmail(input.email);
    monitor.updatedAt = now;
    constructionSite.constructionSite.updatedAt = now;

    if (this.state?.constructionSite.id === constructionSite.constructionSite.id) {
      this.state = constructionSite;
    }
    this.persist();
  }

  inactivateMonitor(monitorId: string): void {
    this.updateMonitorStatus(monitorId, 'inactive');
  }

  reactivateMonitor(monitorId: string): void {
    this.updateMonitorStatus(monitorId, 'active');
  }

  createHouse(input: CreateHouseInput): PersistedHouseRecord {
    if (!this.state) {
      throw new Error('Não foi possível criar casa sem Construção TETO ativa.');
    }
    if (this.isConstructionSiteReadOnly(this.state)) {
      throw new Error(READ_ONLY_CONSTRUCTION_SITE_ERROR);
    }

    const now = new Date().toISOString();
    const family = createFamilyRecord(this.state.constructionSite.id, now, {
      name: input.familyName || 'Família sem nome',
      primaryContactName: input.primaryContactName,
      primaryContactPhone: input.primaryContactPhone,
      primaryContactEmail: input.primaryContactEmail,
      photoDataUrl: input.familyPhotoDataUrl,
    });

    const house = createHouseRecord(this.state.constructionSite.id, family.id, now, input);
    const constructionSiteCommunityId = this.getPrimaryConstructionSiteCommunityId();
    if (constructionSiteCommunityId) {
      family.communityId = constructionSiteCommunityId;
      house.communityId = constructionSiteCommunityId;
    }

    this.state.families.push(family);
    this.state.houses.push(house);
    this.state.constructionSite.activeHouseId = house.id;
    this.state.constructionSite.updatedAt = now;
    this.persist();
    return house;
  }

  duplicateActiveHouse(): PersistedHouseRecord {
    if (this.isConstructionSiteReadOnly(this.state)) {
      throw new Error(READ_ONLY_CONSTRUCTION_SITE_ERROR);
    }

    const now = new Date().toISOString();
    const activeHouse = this.getActiveHouse();
    const activeFamily = this.getActiveFamily();
    const family = createFamilyRecord(
      this.state.constructionSite.id,
      now,
      {
        name: `${activeFamily.name} cópia`,
        primaryContactName: activeFamily.primaryContactName,
        primaryContactPhone: activeFamily.primaryContactPhone,
        primaryContactEmail: activeFamily.primaryContactEmail,
        photoDataUrl: activeFamily.photoDataUrl,
        notes: activeFamily.notes,
      },
    );

    const house = cloneConstructionSiteValue(activeHouse);
    house.id = createId('house');
    house.familyId = family.id;
    house.status = 'draft';
    house.siteAssessment = sanitizeSiteAssessment(house.siteAssessment);
    house.extraMaterials = sanitizeHouseExtraMaterials(house.extraMaterials);
    house.version = 1;
    house.createdAt = now;
    house.updatedAt = now;
    if (house.drawingDocument.house) {
      house.drawingDocument.house.id = house.id;
    }

    this.state.families.push(family);
    this.state.houses.push(house);
    this.state.constructionSite.activeHouseId = house.id;
    this.state.constructionSite.updatedAt = now;
    this.persist();
    return house;
  }

  archiveActiveHouse(): void {
    if (!this.state) return;
    if (this.isConstructionSiteReadOnly(this.state)) return;
    this.archiveHouse(this.getActiveHouse().id);
  }

  archiveHouse(houseId: string): void {
    const houseConstructionSite = this.findHouseConstructionSite(houseId);
    if (!houseConstructionSite) return;

    const now = new Date().toISOString();
    const {constructionSite, house: targetHouse} = houseConstructionSite;
    if (this.isConstructionSiteReadOnly(constructionSite)) return;
    if (!targetHouse || targetHouse.status === 'archived') return;

    targetHouse.status = 'archived';
    targetHouse.updatedAt = now;
    targetHouse.version += 1;

    if (constructionSite.constructionSite.activeHouseId === targetHouse.id) {
      const nextActiveHouse = constructionSite.houses.find((house) => house.status !== 'archived');
      constructionSite.constructionSite.activeHouseId = nextActiveHouse?.id;
    }

    constructionSite.constructionSite.updatedAt = now;
    if (this.state?.constructionSite.id === constructionSite.constructionSite.id) {
      this.state = constructionSite;
    }
    this.persist();
  }

  unarchiveHouse(houseId: string): void {
    const houseConstructionSite = this.findHouseConstructionSite(houseId);
    if (!houseConstructionSite) return;

    const now = new Date().toISOString();
    const {constructionSite, house} = houseConstructionSite;
    if (this.isConstructionSiteReadOnly(constructionSite)) return;
    if (house.status !== 'archived') return;

    house.status = 'draft';
    house.updatedAt = now;
    house.version += 1;

    const hasActiveHouse = constructionSite.houses.some((entry) =>
      entry.id === constructionSite.constructionSite.activeHouseId && entry.status !== 'archived');
    if (!hasActiveHouse) {
      constructionSite.constructionSite.activeHouseId = house.id;
    }

    constructionSite.constructionSite.updatedAt = now;
    if (!this.canOpenRacEditor() && constructionSite.constructionSite.status !== 'archived') {
      this.state = constructionSite;
    } else if (this.state?.constructionSite.id === constructionSite.constructionSite.id) {
      this.state = constructionSite;
    }
    this.persist();
  }

  markActiveHouseRacPrinted(): void {
    const house = this.getActiveHouseOrNull();
    if (!house || house.status === 'built' || house.status === 'archived') return;
    this.updateHouseStatus(house.id, 'rac_printed');
  }

  markHouseBuilt(houseId: string): void {
    this.updateHouseStatus(houseId, 'built');
  }

  markHouseDraft(houseId: string): void {
    this.updateHouseStatus(houseId, 'draft');
  }

  activateHouse(constructionSiteId: string, houseId: string): HouseDrawingDocument | null {
    const constructionSite = this.constructionSites.find((entry) => (
      entry.constructionSite.id === constructionSiteId && this.isConstructionSiteVisibleInManagement(entry)
    ));
    if (!constructionSite) return null;

    const house = constructionSite.houses.find((entry) =>
      entry.id === houseId && this.isHouseAvailableForRacEditor(entry));
    if (!house) return null;

    this.state = constructionSite;
    this.state.constructionSite.activeHouseId = house.id;
    this.state.constructionSite.updatedAt = new Date().toISOString();
    this.persist();
    return this.getActiveHouseDrawingDocument();
  }

  updateActiveFamily(input: UpdateFamilyInput): void {
    if (!this.getEditableActiveHouseOrNull()) return;
    const family = this.getActiveFamily();
    if (input.name !== undefined) family.name = input.name;
    if (input.primaryContactName !== undefined) family.primaryContactName = input.primaryContactName;
    if (input.primaryContactPhone !== undefined) family.primaryContactPhone = input.primaryContactPhone;
    if (input.primaryContactEmail !== undefined) family.primaryContactEmail = input.primaryContactEmail;
    if ('photoDataUrl' in input) family.photoDataUrl = normalizeOptionalPhotoDataUrl(input.photoDataUrl);
    if (input.notes !== undefined) family.notes = input.notes;
    this.touchActiveHouse();
  }

  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    house.siteAssessment = {
      ...house.siteAssessment,
      ...input,
    };
    house.siteAssessment = sanitizeSiteAssessment(house.siteAssessment);
    this.touchActiveHouse();
  }

  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    const family = this.getActiveFamily();

    if (input.familyName !== undefined) family.name = input.familyName || family.name;
    if (input.primaryContactName !== undefined) family.primaryContactName = input.primaryContactName;
    if (input.primaryContactPhone !== undefined) family.primaryContactPhone = input.primaryContactPhone;
    if (input.primaryContactEmail !== undefined) family.primaryContactEmail = input.primaryContactEmail;
    if ('familyPhotoDataUrl' in input) family.photoDataUrl = normalizeOptionalPhotoDataUrl(input.familyPhotoDataUrl);
    if ('houseSize' in input) house.houseSize = normalizeHouseSize(input.houseSize);
    if ('leaders' in input) house.leaders = normalizeOptionalText(input.leaders);
    if ('notes' in input) {
      house.notes = normalizeOptionalText(input.notes);
      family.notes = undefined;
    }

    if (input.siteAssessment !== undefined) {
      house.siteAssessment = sanitizeSiteAssessment({
        ...house.siteAssessment,
        ...input.siteAssessment,
      });
    }

    this.touchActiveHouse();
  }

  updateActiveHouseExtraMaterials(input: UpdateHouseExtraMaterialsInput): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    house.extraMaterials = sanitizeHouseExtraMaterials(input);
    this.touchActiveHouse();
  }

  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void {
    const house = this.getEditableActiveHouseOrNull();
    if (!house) return;
    const family = this.getActiveFamily();
    if (this.isActiveHouseDrawingDocumentUnchanged(house, family, document)) return;
    const now = new Date().toISOString();

    house.houseType = document.house.houseType;
    house.terrainType = document.house.terrainType;
    house.designSettings.selectedPilotiHeights = [...document.setup.selectedPilotiHeights];
    house.pilotiLayout = {
      masterCode: toPersistedPilotiPoints(document.house).find((point) => point.isMaster)?.code,
      points: toPersistedPilotiPoints(document.house),
    };

    house.drawingDocument = {
      schemaVersion: 1,
      house: cloneConstructionSiteValue(document.house),
      canvas: cloneConstructionSiteValue(document.canvas),
      views: {},
    };

    house.updatedAt = now;
    house.version += 1;
    if (house.status === 'rac_printed') house.status = 'draft';
    family.name = document.setup.familyName || family.name;
    this.state.constructionSite.updatedAt = now;
    this.persist();
  }

  private isActiveHouseDrawingDocumentUnchanged(
    house: PersistedHouseRecord,
    family: FamilyRecord,
    document: HouseDrawingDocument,
  ): boolean {
    const currentHouseState = cloneConstructionSiteValue(
      house.drawingDocument.house ?? createInitialHouseState(house.id),
    );
    currentHouseState.id = house.id;
    currentHouseState.houseType = house.houseType;
    currentHouseState.terrainType = house.terrainType;

    const nextFamilyName = document.setup.familyName || family.name;

    return family.name === nextFamilyName
      && house.houseType === document.house.houseType
      && house.terrainType === document.house.terrainType
      && areConstructionSiteValuesEqual(
        house.designSettings.selectedPilotiHeights,
        document.setup.selectedPilotiHeights,
      )
      && areConstructionSiteValuesEqual(currentHouseState, document.house)
      && areConstructionSiteValuesEqual(house.drawingDocument.canvas, document.canvas);
  }

  getActiveHouseDrawingDocument(): HouseDrawingDocument | null {
    const house = this.getActiveHouseOrNull();
    if (!house) return null;
    const family = this.getActiveFamily();
    const houseState = cloneConstructionSiteValue(house.drawingDocument.house ?? createInitialHouseState(house.id));
    houseState.id = house.id;
    houseState.houseType = house.houseType;
    houseState.terrainType = house.terrainType;

    return {
      documentType: HOUSE_DRAWING_DOCUMENT_TYPE,
      schemaVersion: HOUSE_DRAWING_DOCUMENT_SCHEMA_VERSION,
      setup: {
        familyName: family.name,
        selectedPilotiHeights: [...house.designSettings.selectedPilotiHeights],
      },
      house: houseState,
      canvas: cloneConstructionSiteValue(house.drawingDocument.canvas),
    };
  }

  private touchActiveHouse(): void {
    const now = new Date().toISOString();
    const house = this.getActiveHouse();
    if (house.status === 'built') return;
    if (house.status === 'rac_printed') house.status = 'draft';
    house.updatedAt = now;
    house.version += 1;
    this.state.constructionSite.updatedAt = now;
    this.persist();
  }

  private persist(): void {
    if (!this.state) {
      this.storage.write(this.constructionSites);
      return;
    }

    const index = this.constructionSites.findIndex((constructionSite) => constructionSite.constructionSite.id === this.state.constructionSite.id);
    if (index >= 0) {
      this.constructionSites[index] = this.state;
    } else {
      this.constructionSites.push(this.state);
    }

    this.storage.write(this.constructionSites);
  }

  private hasConstructionCode(externalCode: string): boolean {
    return this.constructionSites.some((constructionSite) => (
      normalizeConstructionCode(constructionSite.constructionSite.externalCode) === externalCode
    ));
  }

  private resolveInitialConstructionSite(): ConstructionSiteState | null {
    const candidate = this.findRacEditorOpeningCandidate();
    if (candidate) {
      candidate.constructionSite.constructionSite.activeHouseId = candidate.house.id;
      return candidate.constructionSite;
    }

    return this.constructionSites.find((constructionSite) =>
      this.isConstructionSiteVisibleInManagement(constructionSite)) ?? null;
  }

  private findRacEditorOpeningCandidate(): HouseConstructionSiteCandidate | null {
    return this.constructionSites
      .filter((constructionSite) => this.isConstructionSiteEditableForCanvas(constructionSite))
      .flatMap((constructionSite) => constructionSite.houses
        .filter((house) => this.isHouseAvailableForRacEditor(house))
        .map((house) => ({constructionSite, house})))
      .sort((a, b) => b.house.updatedAt.localeCompare(a.house.updatedAt))[0] ?? null;
  }

  private selectRacEditorOpeningCandidate(candidate: HouseConstructionSiteCandidate): HouseDrawingDocument | null {
    this.state = candidate.constructionSite;
    this.state.constructionSite.activeHouseId = candidate.house.id;
    this.persist();

    return this.getActiveHouseDrawingDocument();
  }

  private hasActiveRacEditorDocument(): boolean {
    return this.isConstructionSiteEditableForCanvas(this.state) && this.getActiveHouseOrNull() !== null;
  }

  private getActiveHouseOrNull(): PersistedHouseRecord | null {
    if (!this.state) return null;
    if (!this.isConstructionSiteVisibleInManagement(this.state)) return null;
    const activeHouseId = this.state.constructionSite.activeHouseId;
    return this.state.houses.find((entry) => entry.id === activeHouseId && this.isHouseAvailableForRacEditor(entry))
      ?? this.state.houses.find((entry) => this.isHouseAvailableForRacEditor(entry))
      ?? null;
  }

  private getEditableActiveHouseOrNull(): PersistedHouseRecord | null {
    if (this.isConstructionSiteReadOnly(this.state)) return null;
    const house = this.getActiveHouseOrNull();
    if (!house || house.status === 'built') return null;
    return house;
  }

  private isConstructionSiteArchived(constructionSite: ConstructionSiteState | null | undefined): boolean {
    return constructionSite?.constructionSite.status === 'archived';
  }

  private isConstructionSiteVisibleInManagement(
    constructionSite: ConstructionSiteState | null | undefined,
  ): constructionSite is ConstructionSiteState {
    return Boolean(constructionSite) && !this.isConstructionSiteArchived(constructionSite);
  }

  private isConstructionSiteEditableForCanvas(
    constructionSite: ConstructionSiteState | null | undefined,
  ): constructionSite is ConstructionSiteState {
    return Boolean(constructionSite) && !this.isConstructionSiteReadOnly(constructionSite);
  }

  private isConstructionSiteReadOnly(constructionSite: ConstructionSiteState | null | undefined): boolean {
    const status = constructionSite?.constructionSite.status;
    return status === 'completed' || status === 'archived';
  }

  private isHouseAvailableForRacEditor(
    house: PersistedHouseRecord | null | undefined,
  ): house is PersistedHouseRecord {
    return Boolean(house) && house.status !== 'archived';
  }

  private updateConstructionSiteStatus(
    constructionSiteId: string,
    status: ConstructionSiteRecord['status'],
  ): void {
    const constructionSite = this.constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId);
    if (!constructionSite || constructionSite.constructionSite.status === 'archived') return;
    if (constructionSite.constructionSite.status === status) return;

    constructionSite.constructionSite.status = status;
    constructionSite.constructionSite.updatedAt = new Date().toISOString();
    this.normalizeConstructionSiteActiveHouse(constructionSite);

    if (this.state?.constructionSite.id === constructionSiteId) {
      this.state = constructionSite;
    }
    this.persist();
  }

  private normalizeConstructionSiteActiveHouse(constructionSite: ConstructionSiteState): void {
    const activeHouse = constructionSite.houses.find((house) => house.id === constructionSite.constructionSite.activeHouseId && house.status !== 'archived')
      ?? constructionSite.houses
        .filter((house) => house.status !== 'archived')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      ?? null;
    constructionSite.constructionSite.activeHouseId = activeHouse?.id;
  }

  private replaceConstructionSiteCommunity(communityName: string): void {
    const primaryCommunityId = this.ensureConstructionSiteCommunity(communityName).id;
    this.state.constructionSite.communityId = primaryCommunityId;
    this.state.families.forEach((family) => {
      family.communityId = primaryCommunityId;
    });
    this.state.houses.forEach((house) => {
      house.communityId = primaryCommunityId;
    });
  }

  private getPrimaryConstructionSiteCommunityId(): string {
    return this.state.constructionSite.communityId;
  }

  private ensureConstructionSiteCommunity(normalizedName: string): CommunityRecord {
    const current = this.state.communities.find((community) => community.name === normalizedName);
    if (current) return current;

    const community = createCommunityRecord(new Date().toISOString(), normalizedName);
    this.state.communities.push(community);
    return community;
  }

  private findHouseConstructionSite(houseId: string): { constructionSite: ConstructionSiteState; house: PersistedHouseRecord } | null {
    for (const constructionSite of this.constructionSites) {
      const house = constructionSite.houses.find((entry) => entry.id === houseId);
      if (house) return {constructionSite, house};
    }
    return null;
  }

  private findMonitorConstructionSite(monitorId: string): { constructionSite: ConstructionSiteState; monitor: MonitorRecord } | null {
    for (const constructionSite of this.constructionSites) {
      const monitor = constructionSite.monitors.find((entry) => entry.id === monitorId);
      if (monitor) return {constructionSite, monitor};
    }
    return null;
  }

  private updateMonitorStatus(monitorId: string, status: MonitorStatus): void {
    const monitorConstructionSite = this.findMonitorConstructionSite(monitorId);
    if (!monitorConstructionSite) return;
    const {constructionSite, monitor} = monitorConstructionSite;
    if (this.isConstructionSiteReadOnly(constructionSite)) return;
    if (monitor.status === status) return;

    const now = new Date().toISOString();
    monitor.status = status;
    monitor.updatedAt = now;
    constructionSite.constructionSite.updatedAt = now;

    if (this.state?.constructionSite.id === constructionSite.constructionSite.id) {
      this.state = constructionSite;
    }
    this.persist();
  }

  private updateHouseStatus(houseId: string, status: PersistedHouseRecord['status']): void {
    const houseConstructionSite = this.findHouseConstructionSite(houseId);
    if (!houseConstructionSite) return;

    const {constructionSite, house} = houseConstructionSite;
    if (this.isConstructionSiteReadOnly(constructionSite)) return;
    if (house.status === 'archived' || house.status === status) return;

    const now = new Date().toISOString();
    house.status = status;
    house.updatedAt = now;
    house.version += 1;
    constructionSite.constructionSite.updatedAt = now;

    if (this.state?.constructionSite.id === constructionSite.constructionSite.id) {
      this.state = constructionSite;
    }
    this.persist();
  }
}

export function createConstructionSiteSession(storage: ConstructionSiteSessionStoragePort): ConstructionSiteSessionPort {
  return new ConstructionSiteSession(storage);
}

function normalizeMonitors(
  monitors: ConstructionSiteState['monitors'] | undefined,
  constructionSiteId: string,
  now: string,
): MonitorRecord[] {
  if (!Array.isArray(monitors)) return [];

  return monitors.flatMap((monitor): MonitorRecord[] => {
    const phone = normalizePersistedMonitorPhone(monitor.phone);
    if (!phone) return [];

    return [{
      id: typeof monitor.id === 'string' && monitor.id.trim() ? monitor.id : createId('monitor'),
      constructionSiteId,
      name: typeof monitor.name === 'string' && monitor.name.trim()
        ? monitor.name.trim()
        : 'Monitor sem nome',
      phone,
      photoDataUrl: normalizeOptionalPhotoDataUrl(monitor.photoDataUrl),
      email: normalizePersistedMonitorEmail(monitor.email),
      status: isMonitorStatus(monitor.status) ? monitor.status : 'active',
      createdAt: typeof monitor.createdAt === 'string' && monitor.createdAt ? monitor.createdAt : now,
      updatedAt: typeof monitor.updatedAt === 'string' && monitor.updatedAt ? monitor.updatedAt : now,
    }];
  });
}

function toPersistedPilotiPoints(house: HouseState): PersistedPilotiPoint[] {
  return Object.entries(house.pilotis).map(([id, piloti]) => ({
    id,
    code: toPilotiCode(id),
    height: piloti.height,
    nivel: piloti.nivel,
    isMaster: piloti.isMaster,
  }));
}

function toPilotiCode(pilotiId: string): PersistedPilotiPoint['code'] {
  const match = /^piloti_(\d+)_(\d+)$/.exec(pilotiId);
  if (!match) return 'a1';

  const col = Number(match[1]);
  const row = Number(match[2]);
  const rowLabel = ['a', 'b', 'c'][row] ?? 'a';
  const colLabel = Math.min(Math.max(col + 1, 1), 4);
  return `${rowLabel}${colLabel}` as PersistedPilotiPoint['code'];
}

function normalizePersistedDrawingDocument(
  document: PersistedDrawingDocument | undefined,
  houseId: string,
): PersistedDrawingDocument {
  if (!document) {
    return createEmptyPersistedDrawingDocument(houseId);
  }

  const normalized = cloneConstructionSiteValue(document);
  normalized.house ??= createInitialHouseState(houseId);
  normalized.house.id = houseId;
  normalized.canvas ??= {
    schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
    objects: [],
  };
  normalized.views ??= {};
  return normalized;
}

function createEmptyPersistedDrawingDocument(houseId: string): PersistedDrawingDocument {
  return {
    ...EMPTY_DRAWING_DOCUMENT,
    house: createInitialHouseState(houseId),
    canvas: {
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    },
    views: {},
  };
}

function areConstructionSiteValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
