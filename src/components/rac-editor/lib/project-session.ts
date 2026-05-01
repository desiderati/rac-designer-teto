import {DEFAULT_HOUSE_PILOTI_HEIGHTS, type HouseType} from '@/shared/types/house.ts';
import {
  createEmptyProjectState,
  EMPTY_DRAWING_DOCUMENT,
  EMPTY_SITE_ASSESSMENT,
  type ConstructionProjectRecord,
  type FamilyRecord,
  type PersistedHouseRecord,
  type ProjectState,
} from '@/shared/types/project.ts';

export interface StoredProjectsDocument {
  version: number;
  projects: ProjectState[];
}

export interface ProjectSessionStoragePort {
  read(): StoredProjectsDocument;
  write(projects: ProjectState[]): void;
}

export interface ProjectSessionPort {
  getProject(): ProjectState;
  getActiveHouse(): PersistedHouseRecord;
  getActiveFamily(): FamilyRecord;
  setActiveFamilyName(name: string): void;
  setActiveHouseSelectedPilotiHeights(heights: number[]): void;
  syncActiveHouseMetadata(input: {
    houseType: HouseType;
    terrainType: number;
    familyName: string;
    selectedPilotiHeights: number[];
  }): void;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createProjectRecord(now: string): ConstructionProjectRecord {
  return {
    id: createId('project'),
    name: 'Projeto RAC',
    status: 'draft',
    leaderAssignments: [],
    monitorAssignments: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createFamilyRecord(projectId: string, now: string): FamilyRecord {
  return {
    id: createId('family'),
    projectId,
    name: 'Família sem nome',
    notes: '',
  };
}

function createHouseRecord(projectId: string, familyId: string, now: string): PersistedHouseRecord {
  return {
    id: createId('house'),
    projectId,
    familyId,
    houseType: null,
    terrainType: 1,
    status: 'draft',
    designSettings: {
      selectedPilotiHeights: [...DEFAULT_HOUSE_PILOTI_HEIGHTS],
    },
    siteAssessment: {...EMPTY_SITE_ASSESSMENT},
    pilotiLayout: {
      points: [],
    },
    drawingDocument: {...EMPTY_DRAWING_DOCUMENT},
    notes: '',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultProjectState(): ProjectState {
  const now = new Date().toISOString();
  const project = createProjectRecord(now);
  const family = createFamilyRecord(project.id, now);
  const house = createHouseRecord(project.id, family.id, now);
  project.activeHouseId = house.id;

  const state = createEmptyProjectState(project);
  state.families.push(family);
  state.houses.push(house);
  return state;
}

class ProjectSession implements ProjectSessionPort {
  private state: ProjectState;

  constructor(private readonly storage: ProjectSessionStoragePort) {
    const stored = this.storage.read().projects[0] ?? null;
    this.state = stored ?? createDefaultProjectState();
    this.persist();
  }

  getProject(): ProjectState {
    return this.state;
  }

  getActiveHouse(): PersistedHouseRecord {
    const activeHouseId = this.state.project.activeHouseId;
    const house = this.state.houses.find((entry) => entry.id === activeHouseId) ?? this.state.houses[0];
    if (!house) {
      const now = new Date().toISOString();
      const family = this.state.families[0] ?? createFamilyRecord(this.state.project.id, now);
      if (!this.state.families.length) {
        this.state.families.push(family);
      }
      const createdHouse = createHouseRecord(this.state.project.id, family.id, now);
      this.state.houses.push(createdHouse);
      this.state.project.activeHouseId = createdHouse.id;
      this.state.project.updatedAt = now;
      this.persist();
      return createdHouse;
    }
    return house;
  }

  getActiveFamily(): FamilyRecord {
    const activeHouse = this.getActiveHouse();
    const family = this.state.families.find((entry) => entry.id === activeHouse.familyId) ?? this.state.families[0];
    if (!family) {
      const now = new Date().toISOString();
      const created = createFamilyRecord(this.state.project.id, now);
      this.state.families.push(created);
      activeHouse.familyId = created.id;
      this.state.project.updatedAt = now;
      this.persist();
      return created;
    }
    return family;
  }

  setActiveFamilyName(name: string): void {
    const family = this.getActiveFamily();
    family.name = name;
    this.touchActiveHouse();
  }

  setActiveHouseSelectedPilotiHeights(heights: number[]): void {
    this.getActiveHouse().designSettings.selectedPilotiHeights = [...heights];
    this.touchActiveHouse();
  }

  syncActiveHouseMetadata(input: {
    houseType: HouseType;
    terrainType: number;
    familyName: string;
    selectedPilotiHeights: number[];
  }): void {
    const house = this.getActiveHouse();
    const family = this.getActiveFamily();
    house.houseType = input.houseType;
    house.terrainType = input.terrainType;
    house.designSettings.selectedPilotiHeights = [...input.selectedPilotiHeights];
    family.name = input.familyName || family.name;
    this.touchActiveHouse();
  }

  private touchActiveHouse(): void {
    const now = new Date().toISOString();
    const house = this.getActiveHouse();
    house.updatedAt = now;
    house.version += 1;
    this.state.project.updatedAt = now;
    this.persist();
  }

  private persist(): void {
    this.storage.write([this.state]);
  }
}

export function createProjectSession(storage: ProjectSessionStoragePort): ProjectSessionPort {
  return new ProjectSession(storage);
}
