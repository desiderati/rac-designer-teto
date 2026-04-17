import type {ProjectState, ProjectSummary} from '@/shared/types/project.ts';

export interface ProjectRepositoryPort {
  list(): Promise<ProjectSummary[]>;

  load(projectId: string): Promise<ProjectState | null>;

  save(project: ProjectState): Promise<void>;

  remove(projectId: string): Promise<void>;
}
