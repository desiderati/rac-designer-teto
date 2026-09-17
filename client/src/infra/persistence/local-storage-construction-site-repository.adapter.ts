import type {ConstructionSiteRepositoryPort} from '@/domain/construction-site/construction-site-repository.port.ts';
import {readConstructionSitesStorage, writeConstructionSitesStorage} from '@/infra/storage/construction-sites.storage.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {toConstructionSiteSummary} from '@/shared/types/construction-site.ts';

export class LocalStorageConstructionSiteRepositoryAdapter implements ConstructionSiteRepositoryPort {
  async list() {
    return readConstructionSitesStorage()
      .constructionSites
      .map(toConstructionSiteSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(constructionSiteId: string): Promise<ConstructionSiteState | null> {
    const constructionSite = readConstructionSitesStorage().constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId);
    return constructionSite ?? null;
  }

  async save(constructionSite: ConstructionSiteState): Promise<void> {
    const document = readConstructionSitesStorage();
    const nextConstructionSites = [...document.constructionSites];
    const index = nextConstructionSites.findIndex((entry) => entry.constructionSite.id === constructionSite.constructionSite.id);

    if (index >= 0) {
      nextConstructionSites[index] = constructionSite;
    } else {
      nextConstructionSites.push(constructionSite);
    }

    writeConstructionSitesStorage(nextConstructionSites);
  }

  async remove(constructionSiteId: string): Promise<void> {
    const document = readConstructionSitesStorage();
    writeConstructionSitesStorage(document.constructionSites.filter((entry) => entry.constructionSite.id !== constructionSiteId));
  }
}
