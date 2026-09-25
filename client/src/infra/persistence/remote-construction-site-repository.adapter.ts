import type { ConstructionSiteRepositoryPort } from '@/domain/construction-site/construction-site-repository.port.ts';
import type { RacTrpcClient } from '@/lib/trpc-client.ts';
import {dataUrlToStorageImageUploadPayload} from '@/shared/lib/storage-image-upload.ts';
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
  private readonly savedAt = new Map<string, string>();

  constructor(private readonly client: RacTrpcClient) {}

  async list(): Promise<ConstructionSiteSummary[]> {
    return this.client.constructionSites.list.query() as unknown as Promise<ConstructionSiteSummary[]>;
  }

  async load(constructionSiteId: string): Promise<ConstructionSiteState | null> {
    const result = await this.client.constructionSites.load.query({ constructionSiteId });
    if (!result) return null;

    this.versions.set(constructionSiteId, result.documentVersion);
    if (result.savedAt) this.savedAt.set(constructionSiteId, result.savedAt);
    else this.savedAt.delete(constructionSiteId);
    return withDocumentVersion(result.state as unknown as ConstructionSiteState, result.documentVersion);
  }

  async save(constructionSite: ConstructionSiteState): Promise<void> {
    const constructionSiteId = constructionSite.constructionSite.id;
    const expectedDocumentVersion = this.versions.get(constructionSiteId)
      ?? constructionSite.constructionSite.documentVersion
      ?? 0;
    const preparedState = await externalizeEmbeddedImages(constructionSite, this.client);
    const result = await this.client.constructionSites.save.mutate({
      state: preparedState,
      expectedDocumentVersion,
    });

    Object.assign(constructionSite, preparedState);
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
    this.savedAt.delete(constructionSiteId);
  }

  setDocumentVersion(constructionSiteId: string, documentVersion: number): void {
    this.versions.set(constructionSiteId, documentVersion);
  }

  getSavedAt(constructionSiteId: string): string | undefined {
    return this.savedAt.get(constructionSiteId);
  }
}

/**
 * Converte snapshots/imagens legadas embutidas em referências do Storage antes
 * do documento chegar ao servidor. Isso também recupera documentos criados
 * antes da adoção do fluxo de Storage e elimina a causa da falha de sync.
 */
async function externalizeEmbeddedImages(
  state: ConstructionSiteState,
  client: RacTrpcClient,
): Promise<ConstructionSiteState> {
  const cache = new Map<string, string>();
  return externalizeValue(
    state,
    client,
    cache,
    'rac-document',
    state.constructionSite.id,
  ) as Promise<ConstructionSiteState>;
}

async function externalizeValue(
  value: unknown,
  client: RacTrpcClient,
  cache: Map<string, string>,
  path: string,
  constructionSiteId: string,
): Promise<unknown> {
  if (typeof value === 'string') {
    if (!/^data:image\/(png|jpeg|webp);base64,/i.test(value)) return value;
    const cached = cache.get(value);
    if (cached) return cached;

    const payload = {
      ...dataUrlToStorageImageUploadPayload(value, `${path.replace(/[^a-z0-9_-]+/gi, '-')}.png`),
      constructionSiteId,
    };
    const uploaded = await client.storage.uploadImage.mutate(payload);
    if (!uploaded.url) throw new Error('O Storage não retornou uma referência para a imagem embutida.');
    cache.set(value, uploaded.url);
    return uploaded.url;
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => externalizeValue(
      item,
      client,
      cache,
      `${path}-${index}`,
      constructionSiteId,
    )));
  }

  if (!value || typeof value !== 'object') return value;

  const entries = await Promise.all(
    Object.entries(value as Record<string, unknown>).map(async ([key, nested]) => [
      key,
      await externalizeValue(nested, client, cache, `${path}-${key}`, constructionSiteId),
    ] as const),
  );
  return Object.fromEntries(entries);
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
