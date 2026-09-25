import { and, desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import {
  constructionSiteDocuments,
  type InsertUser,
  users,
} from '../drizzle/schema.ts';
import type {
  ConstructionSiteState,
  ConstructionSiteSummary,
} from '../client/src/shared/types/construction-site.ts';
import { ENV } from './_core/env.ts';

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

  const currentRows = await db
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
    await db.insert(constructionSiteDocuments).values({
      id,
      scopeKey: RAC_GLOBAL_SCOPE_KEY,
      externalCode: constructionSite.externalCode,
      status: constructionSite.status,
      document: withDocumentVersion(state, documentVersion),
      documentVersion,
    });
    return { documentVersion };
  }

  if (current.documentVersion !== expectedDocumentVersion) {
    throw new ConstructionSiteVersionConflictError();
  }

  const nextDocumentVersion = expectedDocumentVersion + 1;
  const updateResult = await db
    .update(constructionSiteDocuments)
    .set({
      externalCode: constructionSite.externalCode,
      status: constructionSite.status,
      document: withDocumentVersion(state, nextDocumentVersion),
      documentVersion: sql`${constructionSiteDocuments.documentVersion} + 1`,
    })
    .where(and(
      eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(constructionSiteDocuments.id, id),
      eq(constructionSiteDocuments.documentVersion, expectedDocumentVersion),
    ));

  if (updateResult[0].affectedRows !== 1) throw new ConstructionSiteVersionConflictError();
  return { documentVersion: nextDocumentVersion };
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
  const deleteResult = await db
    .delete(constructionSiteDocuments)
    .where(and(
      eq(constructionSiteDocuments.scopeKey, RAC_GLOBAL_SCOPE_KEY),
      eq(constructionSiteDocuments.id, constructionSiteId),
      eq(constructionSiteDocuments.documentVersion, expectedDocumentVersion),
    ));

  if (deleteResult[0].affectedRows !== 1) throw new ConstructionSiteVersionConflictError();
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
