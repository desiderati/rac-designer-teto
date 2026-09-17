import type {ConstructionSiteState, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';

export interface ConstructionSiteRepositoryPort {
  /** Lista as construções conhecidas pelo repositório. */
  list(): Promise<ConstructionSiteSummary[]>;

  /** Carrega uma construção pelo identificador, ou `null` quando ela não existe. */
  load(constructionSiteId: string): Promise<ConstructionSiteState | null>;

  /** Salva o estado completo de uma construção. */
  save(constructionSite: ConstructionSiteState): Promise<void>;

  /** Remove uma construção pelo identificador. */
  remove(constructionSiteId: string): Promise<void>;
}
