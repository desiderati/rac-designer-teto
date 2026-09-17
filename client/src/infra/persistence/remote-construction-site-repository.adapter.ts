import type { ConstructionSiteRepositoryPort } from '@/domain/construction-site/construction-site-repository.port.ts';
import type { RacTrpcClient } from '@/lib/trpc-client.ts';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
} from '@/shared/types/construction-site.ts';

/**
 * Adapter remoto do documento canônico. O editor permanece desacoplado do tRPC:
 * apenas este adapter conhece o contrato HTTP e o versionamento otimista.
 */
export class RemoteConstructionSiteRepositoryAdapter implements ConstructionSiteRepositoryPort {
  private readonly versions = new Map<string, number>();

  constructor(private readonly client: RacTrpcClient) {}

  async list(): Promise<ConstructionSiteSummary[]> {
    return this.client.constructionSites.list.query() as unknown as Promise<ConstructionSiteSummary[]>;
  }

  async load(constructionSiteId: string): Promise<ConstructionSiteState | null> {
    const result = await this.client.constructionSites.load.query({ constructionSiteId });
    if (!result) return null;

    this.versions.set(constructionSiteId, result.documentVersion);
    return withDocumentVersion(result.state as unknown as ConstructionSiteState, result.documentVersion);
  }

  async save(constructionSite: ConstructionSiteState): Promise<void> {
    const constructionSiteId = constructionSite.constructionSite.id;
    const expectedDocumentVersion = this.versions.get(constructionSiteId)
      ?? constructionSite.constructionSite.documentVersion
      ?? 0;
    const result = await this.client.constructionSites.save.mutate({
      state: constructionSite,
      expectedDocumentVersion,
    });

    this.versions.set(constructionSiteId, result.documentVersion);
    constructionSite.constructionSite.documentVersion = result.documentVersion;
  }

  async remove(constructionSiteId: string): Promise<void> {
    const expectedDocumentVersion = this.versions.get(constructionSiteId);
    if (!expectedDocumentVersion) {
      throw new Error('Não foi possível remover uma Construção TETO sem sua versão remota.');
    }

    await this.client.constructionSites.remove.mutate({
      constructionSiteId,
      expectedDocumentVersion,
    });
    this.versions.delete(constructionSiteId);
  }

  setDocumentVersion(constructionSiteId: string, documentVersion: number): void {
    this.versions.set(constructionSiteId, documentVersion);
  }
}

function withDocumentVersion(state: ConstructionSiteState, documentVersion: number): ConstructionSiteState {
  return {
    ...state,
    constructionSite: {
      ...state.constructionSite,
      documentVersion,
    },
  };
}
