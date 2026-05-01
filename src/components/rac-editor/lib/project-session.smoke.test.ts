import {describe, expect, it, vi} from 'vitest';
import {createProjectSession, type StoredProjectsDocument} from '@/components/rac-editor/lib/project-session.ts';

function createStorage(initialProjects: StoredProjectsDocument['projects'] = []) {
  const writes: StoredProjectsDocument['projects'][] = [];

  return {
    writes,
    storage: {
      read: vi.fn(() => ({version: 1, projects: initialProjects})),
      write: vi.fn((projects: StoredProjectsDocument['projects']) => {
        writes.push(projects);
      }),
    },
  };
}

describe('project-session.ts', () => {
  it('cria projeto, família e casa padrão quando o storage está vazio', () => {
    const {storage, writes} = createStorage();

    const session = createProjectSession(storage);
    const project = session.getProject();

    expect(project.project.activeHouseId).toBe(project.houses[0]?.id);
    expect(project.families).toHaveLength(1);
    expect(project.houses).toHaveLength(1);
    expect(writes).toHaveLength(1);
  });

  it('sincroniza metadados da casa ativa e persiste a sessão', () => {
    const {storage, writes} = createStorage();
    const session = createProjectSession(storage);

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
    expect(writes).toHaveLength(2);
  });
});
