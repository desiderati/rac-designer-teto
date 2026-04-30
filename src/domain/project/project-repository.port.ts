import type {ProjectState, ProjectSummary} from '@/shared/types/project.ts';

export interface ProjectRepositoryPort {
  /** Lista os projetos conhecidos pelo repositório. */
  list(): Promise<ProjectSummary[]>;

  /** Carrega um projeto pelo identificador, ou `null` quando ele não existe. */
  load(projectId: string): Promise<ProjectState | null>;

  /** Salva o estado completo de um projeto. */
  save(project: ProjectState): Promise<void>;

  /** Remove um projeto pelo identificador. */
  remove(projectId: string): Promise<void>;
}
