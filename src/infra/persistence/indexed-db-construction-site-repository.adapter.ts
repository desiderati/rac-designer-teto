import type {ConstructionSiteRepositoryPort} from '@/domain/construction-site/construction-site-repository.port.ts';
import {
  createIndexedDbConstructionSiteStorageDriver,
  type ConstructionSiteStorageDriver,
} from '@/infra/storage/indexed-db-construction-sites.storage.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {toConstructionSiteSummary} from '@/shared/types/construction-site.ts';

export class IndexedDbConstructionSiteRepositoryAdapter implements ConstructionSiteRepositoryPort {
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly driver: ConstructionSiteStorageDriver = createIndexedDbConstructionSiteStorageDriver()) {
  }

  async list() {
    return (await this.driver.read())
      .constructionSites
      .map(toConstructionSiteSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async load(constructionSiteId: string): Promise<ConstructionSiteState | null> {
    const document = await this.driver.read();
    return document.constructionSites.find((entry) => entry.constructionSite.id === constructionSiteId) ?? null;
  }

  async save(constructionSite: ConstructionSiteState): Promise<void> {
    return this.enqueueMutation(async () => {
      const document = await this.driver.read();
      const constructionSites = [...document.constructionSites];
      const index = constructionSites.findIndex((entry) => entry.constructionSite.id === constructionSite.constructionSite.id);

      if (index >= 0) {
        constructionSites[index] = constructionSite;
      } else {
        constructionSites.push(constructionSite);
      }

      await this.driver.write({
        version: document.version || 1,
        constructionSites,
      });
    });
  }

  async remove(constructionSiteId: string): Promise<void> {
    return this.enqueueMutation(async () => {
      const document = await this.driver.read();
      await this.driver.write({
        version: document.version || 1,
        constructionSites: document.constructionSites.filter((entry) => entry.constructionSite.id !== constructionSiteId),
      });
    });
  }

  private enqueueMutation(mutation: () => Promise<void>): Promise<void> {
    const nextMutation = this.mutationQueue
      .catch(() => undefined)
      .then(mutation);

    this.mutationQueue = nextMutation.catch(() => undefined);
    return nextMutation;
  }
}
