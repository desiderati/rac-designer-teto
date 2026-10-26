import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import {
  constructionSiteDocuments,
  storageAssetBackfillRuns,
  storageAssetReferences,
  storageAssets,
  storageRetentionSchedules,
  type InsertUser,
  users,
} from '../drizzle/schema.ts';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
} from '../client/src/shared/types/construction-site.ts';
import { ENV } from './_core/env.ts';
import {
  classifyStorageAssetPurpose,
  extractStorageKeys,
  hashStorageKey,
  type StorageAssetPurpose,
  validateStorageKey,
} from './storage-assets.ts';

export const RAC_GLOBAL_SCOPE_KEY = 'rac-designer-teto-global';

export class ConstructionSiteVersionConflictError extends Error {
  constructor() {
    super('A Construção TETO foi alterada por outra sessão. Recarregue os dados antes de salvar novamente.');
    this.name = 'ConstructionSiteVersionConflictError';
  }
}

export class ConstructionSiteDeleteNotAllowedError extends Error {
  constructor() {
    super('Somente Construções TETO arquivadas podem ser removidas permanentemente.');
    this.name = 'ConstructionSiteDeleteNotAllowedError';
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

/** Cria o cliente sob demanda para manter tooling local independente do banco. */
export async function getDb() {
  if (!dbInstance && process.env.DATABASE_URL) {
    try {
      dbInstance = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn('[Database] Falha ao criar conexão:', error);
      dbInstance = null;
    }
  }
  return dbInstance;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados Manus indisponível.');
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error('User openId is required for upsert');

  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ['name', 'email', 'loginMethod'] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listConstructionSiteSummaries(): Promise<ConstructionSiteSummary[]> {
  const db = await requireDb();
  const rows = await db
    .select({ document: constructionSiteDocuments.document, documentVersion: constructionSiteDocuments.documentVersion })
    .from(constructionSiteDocuments)
    .where(eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY))
    .orderBy(desc(constructionSiteDocuments.updatedAt));

  return rows.map(({ document, documentVersion }) => toConstructionSiteSummary(document, documentVersion));
}

export async function getConstructionSiteDocument(constructionSiteId: string): Promise<{
  state: ConstructionSiteState;
  documentVersion: number;
  savedAt: string;
} | null> {
  const db = await requireDb();
  const rows = await db
    .select({ document: constructionSiteDocuments.document, documentVersion: constructionSiteDocuments.documentVersion, updatedAt: constructionSiteDocuments.updatedAt })
    .from(constructionSiteDocuments)
    .where(and(
      eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(constructionSiteDocuments.id, constructionSiteId),
    ))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    state: withDocumentVersion(row.document, row.documentVersion),
    documentVersion: row.documentVersion,
    savedAt: row.updatedAt.toISOString(),
  };
}

export async function saveConstructionSiteDocument(
  state: ConstructionSiteState,
  expectedDocumentVersion: number,
): Promise<{ documentVersion: number }> {
  const db = await requireDb();
  const constructionSite = state.constructionSite;
  const id = constructionSite.id;

  return db.transaction(async (tx) => {
    const currentRows = await tx
      .select({ documentVersion: constructionSiteDocuments.documentVersion })
      .from(constructionSiteDocuments)
      .where(and(
        eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
        eq(constructionSiteDocuments.id, id),
      ))
      .limit(1);

    const current = currentRows[0];
    if (!current) {
      if (expectedDocumentVersion !== 0) throw new ConstructionSiteVersionConflictError();

      const documentVersion = 1;
      const document = withDocumentVersion(state, documentVersion);
      await tx.insert(constructionSiteDocuments).values({
        id,
        scopeKey: RAC_GLOBAL_SCOPE_KEY,
        externalCode: constructionSite.externalCode,
        status: constructionSite.status,
        document,
        documentVersion,
      });
      await syncStorageAssetReferencesTx(tx, document, id, documentVersion);
      return { documentVersion };
    }

    if (current.documentVersion !== expectedDocumentVersion) {
      throw new ConstructionSiteVersionConflictError();
    }

    const nextDocumentVersion = expectedDocumentVersion + 1;
    const document = withDocumentVersion(state, nextDocumentVersion);
    const updateResult = await tx
      .update(constructionSiteDocuments)
      .set({
        externalCode: constructionSite.externalCode,
        status: constructionSite.status,
        document,
        documentVersion: sql`${constructionSiteDocuments.documentVersion} + 1`,
      })
      .where(and(
        eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
        eq(constructionSiteDocuments.id, id),
        eq(constructionSiteDocuments.documentVersion, expectedDocumentVersion),
      ));

    if (updateResult[0].affectedRows !== 1) throw new ConstructionSiteVersionConflictError();
    await syncStorageAssetReferencesTx(tx, document, id, nextDocumentVersion);
    return { documentVersion: nextDocumentVersion };
  });
}

export async function removeConstructionSiteDocument(
  constructionSiteId: string,
  expectedDocumentVersion: number,
): Promise<void> {
  const document = await getConstructionSiteDocument(constructionSiteId);
  if (!document) return;
  if (document.documentVersion !== expectedDocumentVersion) throw new ConstructionSiteVersionConflictError();
  if (document.state.constructionSite.status !== 'archived') throw new ConstructionSiteDeleteNotAllowedError();

  const db = await requireDb();
  await db.transaction(async (tx) => {
    const deleteResult = await tx
      .delete(constructionSiteDocuments)
      .where(and(
        eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
        eq(constructionSiteDocuments.id, constructionSiteId),
        eq(constructionSiteDocuments.documentVersion, expectedDocumentVersion),
      ));

    if (deleteResult[0].affectedRows !== 1) throw new ConstructionSiteVersionConflictError();
    await tx.delete(storageAssetReferences).where(and(
      eq(storageAssetReferences.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(storageAssetReferences.constructionSiteId, constructionSiteId),
    ));
  });
}

export type PendingStorageAsset = {
  storageKey: string;
  purpose?: StorageAssetPurpose;
  contentType?: string;
  sizeBytes?: number;
  expiresAt?: Date | null;
};

/**
 * Registra o resultado real do PUT antes de ele ser referenciado por um
 * documento. A chave física retornada pelo Storage é a única fonte de verdade.
 */
export async function registerPendingStorageAsset(input: PendingStorageAsset): Promise<void> {
  const db = await requireDb();
  const storageKey = validateStorageKey(input.storageKey);
  const now = new Date();
  await db.insert(storageAssets).values({
    scopeKey: RAC_GLOBAL_SCOPE_KEY,
    storageKey,
    storageKeyHash: hashStorageKey(storageKey),
    lifecycle: 'pending',
    purpose: input.purpose ?? classifyStorageAssetPurpose(storageKey),
    contentType: input.contentType ?? null,
    sizeBytes: input.sizeBytes ?? null,
    expiresAt: input.expiresAt ?? null,
    lastReconciledAt: now,
    lastError: null,
  }).onDuplicateKeyUpdate({
    set: {
      purpose: input.purpose ?? classifyStorageAssetPurpose(storageKey),
      contentType: input.contentType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      expiresAt: input.expiresAt ?? null,
      lastReconciledAt: now,
      lastError: null,
    },
  });
}

type BackfillMode = 'dry_run' | 'apply';

export type StorageAssetBackfillSummary = {
  runId: number;
  mode: BackfillMode;
  documentCount: number;
  referenceCount: number;
  assetCount: number;
  unresolvedCount: number;
};

/**
 * Reconstrói o ledger somente a partir do documento canônico. O dry-run grava
 * apenas o relatório auditável; o apply é idempotente e nunca remove bytes.
 */
export async function backfillStorageAssetReferences(mode: BackfillMode = 'dry_run'): Promise<StorageAssetBackfillSummary> {
  const db = await requireDb();
  const started = await db.insert(storageAssetBackfillRuns).values({
    scopeKey: RAC_GLOBAL_SCOPE_KEY,
    mode,
    status: 'running',
    source: 'construction_site_documents',
  });
  const runId = Number(started[0].insertId);
  let documentCount = 0;
  let referenceCount = 0;
  let assetCount = 0;
  let unresolvedCount = 0;

  try {
    const rows = await db.select({
      id: constructionSiteDocuments.id,
      document: constructionSiteDocuments.document,
      documentVersion: constructionSiteDocuments.documentVersion,
    }).from(constructionSiteDocuments).where(eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY));
    documentCount = rows.length;

    for (const row of rows) {
      const keys = extractStorageKeys(row.document);
      referenceCount += keys.length;
      if (mode === 'apply') {
        await db.transaction(async (tx) => {
          const current = await tx.select({
            document: constructionSiteDocuments.document,
            documentVersion: constructionSiteDocuments.documentVersion,
          }).from(constructionSiteDocuments).where(and(
            eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
            eq(constructionSiteDocuments.id, row.id),
          )).limit(1);
          if (!current[0] || current[0].documentVersion !== row.documentVersion) {
            unresolvedCount += keys.length;
            return;
          }
          const synced = await syncStorageAssetReferencesTx(
            tx,
            current[0].document,
            row.id,
            current[0].documentVersion,
          );
          assetCount += synced.assetCount;
        });
      } else {
        assetCount += keys.length;
      }
    }

    await db.update(storageAssetBackfillRuns).set({
      status: unresolvedCount > 0 ? 'completed_with_errors' : 'completed',
      documentCount,
      referenceCount,
      assetCount,
      unresolvedCount,
      finishedAt: new Date(),
    }).where(eq(storageAssetBackfillRuns.id, runId));
    return {runId, mode, documentCount, referenceCount, assetCount, unresolvedCount};
  } catch (error) {
    await db.update(storageAssetBackfillRuns).set({
      status: 'failed',
      documentCount,
      referenceCount,
      assetCount,
      unresolvedCount,
      errorSummary: 'Falha de persistência durante o backfill; consulte os logs seguros do servidor.',
      finishedAt: new Date(),
    }).where(eq(storageAssetBackfillRuns.id, runId));
    throw error;
  }
}

export async function getStorageAssetLifecycleSummary(): Promise<{
  pending: number;
  active: number;
  quarantined: number;
  manualReview: number;
}> {
  const db = await requireDb();
  const rows = await db.select({lifecycle: storageAssets.lifecycle, count: sql<number>`count(*)`})
    .from(storageAssets).where(eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY)).groupBy(storageAssets.lifecycle);
  const counts = new Map(rows.map((row) => [row.lifecycle, Number(row.count)]));
  return {
    pending: counts.get('pending') ?? 0,
    active: counts.get('active') ?? 0,
    quarantined: counts.get('quarantined') ?? 0,
    manualReview: counts.get('manual_review') ?? 0,
  };
}

export type StorageAssetInventoryQuery = {
  lifecycle?: 'pending' | 'active' | 'quarantined' | 'manual_review';
  limit?: number;
  offset?: number;
};

function normalizeStorageAssetInventoryQuery(input: StorageAssetInventoryQuery) {
  const limit = input.limit ?? 100;
  const offset = input.offset ?? 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > 500
    || !Number.isInteger(offset) || offset < 0) {
    throw new Error('Consulta de inventário de Storage inválida.');
  }
  return {limit, offset};
}

/** Inventário administrativo somente do ledger conhecido; não representa listagem global do provedor. */
export async function listStorageAssetInventory(input: StorageAssetInventoryQuery = {}) {
  const db = await requireDb();
  const {limit, offset} = normalizeStorageAssetInventoryQuery(input);
  const predicate = and(
    eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY),
    input.lifecycle ? eq(storageAssets.lifecycle, input.lifecycle) : undefined,
  );
  const [totalRows, rows] = await Promise.all([
    db.select({count: sql<number>`count(*)`}).from(storageAssets).where(predicate),
    db.select({
      id: storageAssets.id,
      storageKey: storageAssets.storageKey,
      lifecycle: storageAssets.lifecycle,
      purpose: storageAssets.purpose,
      contentType: storageAssets.contentType,
      sizeBytes: storageAssets.sizeBytes,
      expiresAt: storageAssets.expiresAt,
      lastReferencedAt: storageAssets.lastReferencedAt,
      quarantinedAt: storageAssets.quarantinedAt,
      lastReconciledAt: storageAssets.lastReconciledAt,
      protected: storageAssets.protected,
      createdAt: storageAssets.createdAt,
      updatedAt: storageAssets.updatedAt,
      referenceCount: sql<number>`(
        select count(*) from ${storageAssetReferences} references
        where references.assetId = ${storageAssets.id}
          and references.scopeKey = ${RAC_GLOBAL_SCOPE_KEY}
      )`,
    }).from(storageAssets)
      .where(predicate)
      .orderBy(desc(storageAssets.updatedAt), desc(storageAssets.id))
      .limit(limit)
      .offset(offset),
  ]);
  return {
    coverage: 'ledger-known-only' as const,
    total: Number(totalRows[0]?.count ?? 0),
    limit,
    offset,
    items: rows.map((row) => ({...row, referenceCount: Number(row.referenceCount)})),
  };
}

export async function getStorageAssetByStorageKey(storageKey: string) {
  const db = await requireDb();
  const normalizedKey = validateStorageKey(storageKey);
  const rows = await db.select({
    id: storageAssets.id,
    storageKey: storageAssets.storageKey,
    lifecycle: storageAssets.lifecycle,
    protected: storageAssets.protected,
    referenceCount: sql<number>`(
      select count(*) from ${storageAssetReferences} references
      where references.assetId = ${storageAssets.id}
        and references.scopeKey = ${RAC_GLOBAL_SCOPE_KEY}
    )`,
  }).from(storageAssets).where(and(
    eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY),
    eq(storageAssets.storageKey, normalizedKey),
  )).limit(1);
  const row = rows[0];
  return row ? {...row, referenceCount: Number(row.referenceCount)} : null;
}

/** Quarentena lógica é reversível e não chama API de remoção do provedor. */
export async function quarantineUnreferencedStorageAssets(options: {
  minUnreferencedAgeDays: number;
  pendingGraceDays: number;
  limit?: number;
}): Promise<{quarantined: number; inspected: number}> {
  const {minUnreferencedAgeDays, pendingGraceDays, limit = 100} = options;
  if (!Number.isInteger(minUnreferencedAgeDays) || minUnreferencedAgeDays < 1
    || !Number.isInteger(pendingGraceDays) || pendingGraceDays < 1
    || !Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Política de quarentena inválida.');
  }

  const db = await requireDb();
  const candidates = await db.select().from(storageAssets).where(and(
    eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY),
    inArray(storageAssets.lifecycle, ['pending', 'active']),
    eq(storageAssets.protected, false),
  )).limit(limit);
  if (!candidates.length) return {quarantined: 0, inspected: 0};

  const references = await db.select({assetId: storageAssetReferences.assetId}).from(storageAssetReferences)
    .where(and(
      eq(storageAssetReferences.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      inArray(storageAssetReferences.assetId, candidates.map((asset) => asset.id)),
    ));
  const referencedIds = new Set(references.map((reference) => reference.assetId));
  const now = Date.now();
  const toQuarantine = candidates.filter((asset) => {
    if (referencedIds.has(asset.id)) return false;
    const ageBase = asset.lifecycle === 'pending'
      ? asset.createdAt
      : asset.lastReferencedAt ?? asset.createdAt;
    const threshold = (asset.lifecycle === 'pending' ? pendingGraceDays : minUnreferencedAgeDays) * 86_400_000;
    return ageBase.getTime() <= now - threshold;
  });
  if (!toQuarantine.length) return {quarantined: 0, inspected: candidates.length};

  const update = await db.update(storageAssets).set({
    lifecycle: 'quarantined',
    quarantinedAt: new Date(),
    lastReconciledAt: new Date(),
  }).where(and(
    eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY),
    inArray(storageAssets.id, toQuarantine.map((asset) => asset.id)),
    inArray(storageAssets.lifecycle, ['pending', 'active']),
  ));
  return {quarantined: update[0].affectedRows, inspected: candidates.length};
}

export async function getStorageRetentionScheduleByTaskUid(taskUid: string) {
  const db = await requireDb();
  const rows = await db.select().from(storageRetentionSchedules)
    .where(and(
      eq(storageRetentionSchedules.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(storageRetentionSchedules.scheduleCronTaskUid, taskUid),
      eq(storageRetentionSchedules.enabled, true),
    )).limit(1);
  return rows[0] ?? null;
}

export async function configureStorageRetentionSchedule(input: {
  taskUid: string;
  enabled: boolean;
  minUnreferencedAgeDays: number;
  pendingGraceDays: number;
}): Promise<void> {
  if (!/^[A-Za-z0-9_-]{6,65}$/.test(input.taskUid)
    || !Number.isInteger(input.minUnreferencedAgeDays) || input.minUnreferencedAgeDays < 1
    || !Number.isInteger(input.pendingGraceDays) || input.pendingGraceDays < 1) {
    throw new Error('Configuração de retenção inválida.');
  }
  const db = await requireDb();
  await db.insert(storageRetentionSchedules).values({
    id: 'rac-storage-retention',
    scopeKey: RAC_GLOBAL_SCOPE_KEY,
    scheduleCronTaskUid: input.taskUid,
    enabled: input.enabled,
    minUnreferencedAgeDays: input.minUnreferencedAgeDays,
    pendingGraceDays: input.pendingGraceDays,
  }).onDuplicateKeyUpdate({
    set: {
      scheduleCronTaskUid: input.taskUid,
      enabled: input.enabled,
      minUnreferencedAgeDays: input.minUnreferencedAgeDays,
      pendingGraceDays: input.pendingGraceDays,
    },
  });
}

async function syncStorageAssetReferencesTx(
  tx: any,
  document: ConstructionSiteState,
  constructionSiteId: string,
  documentVersion: number,
): Promise<{assetCount: number}> {
  const keys = extractStorageKeys(document);
  const now = new Date();
  const assetIds: number[] = [];

  for (const storageKey of keys) {
    const storageKeyHash = hashStorageKey(storageKey);
    await tx.insert(storageAssets).values({
      scopeKey: RAC_GLOBAL_SCOPE_KEY,
      storageKey,
      storageKeyHash,
      lifecycle: 'active',
      purpose: classifyStorageAssetPurpose(storageKey),
      lastReferencedAt: now,
      lastReconciledAt: now,
      lastError: null,
    }).onDuplicateKeyUpdate({
      set: {
        lifecycle: 'active',
        purpose: classifyStorageAssetPurpose(storageKey),
        lastReferencedAt: now,
        lastReconciledAt: now,
        quarantinedAt: null,
        expiresAt: null,
        lastError: null,
      },
    });
    const assets = await tx.select({id: storageAssets.id, storageKey: storageAssets.storageKey})
      .from(storageAssets).where(and(
        eq(storageAssets.scopeKey, RAC_GLOBAL_SCOPE_KEY),
        eq(storageAssets.storageKeyHash, storageKeyHash),
      )).limit(1);
    if (!assets[0] || assets[0].storageKey !== storageKey) {
      throw new Error('Colisão inesperada no índice de Storage.');
    }
    assetIds.push(assets[0].id);
  }

  const existing = await tx.select({assetId: storageAssetReferences.assetId}).from(storageAssetReferences)
    .where(and(
      eq(storageAssetReferences.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(storageAssetReferences.constructionSiteId, constructionSiteId),
    ));
  const currentIds = new Set(assetIds);
  const staleIds = existing.map((reference: {assetId: number}) => reference.assetId)
    .filter((assetId: number) => !currentIds.has(assetId));
  if (staleIds.length) {
    await tx.delete(storageAssetReferences).where(and(
      eq(storageAssetReferences.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(storageAssetReferences.constructionSiteId, constructionSiteId),
      inArray(storageAssetReferences.assetId, staleIds),
    ));
  }

  for (const assetId of assetIds) {
    await tx.insert(storageAssetReferences).values({
      assetId,
      scopeKey: RAC_GLOBAL_SCOPE_KEY,
      constructionSiteId,
      documentVersion,
      firstReferencedAt: now,
      lastReferencedAt: now,
    }).onDuplicateKeyUpdate({
      set: {documentVersion, lastReferencedAt: now},
    });
  }
  return {assetCount: assetIds.length};
}

function withDocumentVersion(document: ConstructionSiteState, documentVersion: number): ConstructionSiteState {
  return {
    ...document,
    constructionSite: {
      ...document.constructionSite,
      documentVersion,
    },
  };
}

function toConstructionSiteSummary(document: ConstructionSiteState, documentVersion: number): ConstructionSiteSummary {
  const state = withDocumentVersion(document, documentVersion);
  const constructionSite = state.constructionSite;
  const communityName = state.communities.find((community) => community.id === constructionSite.communityId)?.name?.trim()
    || 'Comunidade não informada';
  const externalCode = constructionSite.externalCode?.trim() || 'Construção sem identificação';

  return {
    id: constructionSite.id,
    label: `${externalCode} · ${communityName}`,
    externalCode,
    photoDataUrl: constructionSite.photoDataUrl,
    constructionDate: constructionSite.constructionDate,
    communityName,
    status: constructionSite.status,
    activeHouseId: constructionSite.activeHouseId,
    houseCount: state.houses.length,
    nonArchivedHouseCount: state.houses.filter((house) => house.status !== 'archived').length,
    familyCount: state.families.length,
    updatedAt: constructionSite.updatedAt,
  };
}
