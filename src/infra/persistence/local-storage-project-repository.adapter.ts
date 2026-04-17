import type {ProjectRepositoryPort} from '@/domain/project/project-repository.port.ts';
import {readProjectsStorage, writeProjectsStorage} from '@/infra/storage/projects.storage.ts';
import type {ProjectState} from '@/shared/types/project.ts';
import {toProjectSummary} from '@/shared/types/project.ts';

export class LocalStorageProjectRepositoryAdapter implements ProjectRepositoryPort {
  async list() {
    return readProjectsStorage()
      .projects
      .map(toProjectSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(projectId: string): Promise<ProjectState | null> {
    const project = readProjectsStorage().projects.find((entry) => entry.project.id === projectId);
    return project ?? null;
  }

  async save(project: ProjectState): Promise<void> {
    const document = readProjectsStorage();
    const nextProjects = [...document.projects];
    const index = nextProjects.findIndex((entry) => entry.project.id === project.project.id);

    if (index >= 0) {
      nextProjects[index] = project;
    } else {
      nextProjects.push(project);
    }

    writeProjectsStorage(nextProjects);
  }

  async remove(projectId: string): Promise<void> {
    const document = readProjectsStorage();
    writeProjectsStorage(document.projects.filter((entry) => entry.project.id !== projectId));
  }
}
