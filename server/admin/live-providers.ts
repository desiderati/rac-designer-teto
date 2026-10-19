import { documentSourceFromSingleSelect, signedGetAssetSource } from './live-capture.ts';
import { GLOBAL_SCOPE, type CanonicalRow } from './operations.ts';

/** Só é importado pela CLI após o opt-in; nenhuma leitura conectada ocorre no carregamento do módulo. */
export async function liveBackupSources() {
  const [{ getDb }, { constructionSiteDocuments }, { eq }, { storageGetSignedUrl }] = await Promise.all([
    import('../db.ts'), import('../../drizzle/schema.ts'), import('drizzle-orm'), import('../storage.ts'),
  ]);
  const documents = documentSourceFromSingleSelect(async (): Promise<CanonicalRow[]> => {
    const db = await getDb();
    if (!db) throw new Error('Banco global indisponível para captura administrativa');
    // Um SELECT filtrado pelo escopo: a visão de cada statement é consistente no banco.
    const rows = await db.select({
      id: constructionSiteDocuments.id,
      scopeKey: constructionSiteDocuments.scopeKey,
      externalCode: constructionSiteDocuments.externalCode,
      status: constructionSiteDocuments.status,
      document: constructionSiteDocuments.document,
      documentVersion: constructionSiteDocuments.documentVersion,
      createdAt: constructionSiteDocuments.createdAt,
      updatedAt: constructionSiteDocuments.updatedAt,
    }).from(constructionSiteDocuments).where(eq(constructionSiteDocuments.scopeKey, GLOBAL_SCOPE));
    return rows.map(row => ({ ...row,
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
  });
  return { documents, assets: signedGetAssetSource(storageGetSignedUrl, fetch) };
}
