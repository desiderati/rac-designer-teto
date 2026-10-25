import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import type { ConstructionSiteState } from '../client/src/shared/types/construction-site.ts';

/**
 * Identidade criada e mantida pelo fluxo Manus OAuth. O papel não restringe
 * acesso no MVP; ele preserva uma futura fronteira de autorização.
 */
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  openId: varchar('openId', { length: 64 }).notNull().unique(),
  name: text('name'),
  email: varchar('email', { length: 320 }),
  loginMethod: varchar('loginMethod', { length: 64 }),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp('lastSignedIn').defaultNow().notNull(),
});

/**
 * Um documento canônico por Construção TETO. O MVP compartilha a base global
 * entre todos os usuários Manus autenticados; scopeKey mantém essa decisão
 * explícita e permite segmentação futura sem reformatar o payload.
 */
export const constructionSiteDocuments = mysqlTable('construction_site_documents', {
  id: varchar('id', { length: 128 }).primaryKey(),
  scopeKey: varchar('scopeKey', { length: 96 }).notNull(),
  externalCode: varchar('externalCode', { length: 64 }).notNull(),
  status: varchar('status', { length: 24 }).notNull(),
  document: json('document').$type<ConstructionSiteState>().notNull(),
  documentVersion: int('documentVersion').notNull().default(1),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scopeUpdatedAtIndex: index('construction_site_scope_updated_at_idx').on(table.scopeKey, table.updatedAt),
  scopeExternalCodeIndex: index('construction_site_scope_external_code_idx').on(table.scopeKey, table.externalCode),
}));

/**
 * Índice lógico dos objetos que a aplicação conhece no Storage do Manus.
 * A chave física é mantida íntegra; o hash permite índice único seguro mesmo
 * para chaves longas em utf8mb4. Não pressupõe listagem ou delete do provedor.
 */
export const storageAssetLifecycle = mysqlEnum('lifecycle', [
  'pending',
  'active',
  'quarantined',
  'manual_review',
]);

export const storageAssets = mysqlTable('storage_assets', {
  id: bigint('id', {mode: 'number', unsigned: true}).autoincrement().primaryKey(),
  scopeKey: varchar('scopeKey', {length: 96}).notNull(),
  storageKey: varchar('storageKey', {length: 1024}).notNull(),
  storageKeyHash: varchar('storageKeyHash', {length: 64}).notNull(),
  lifecycle: storageAssetLifecycle.notNull().default('pending'),
  purpose: varchar('purpose', {length: 64}).notNull().default('unknown'),
  contentType: varchar('contentType', {length: 128}),
  sizeBytes: int('sizeBytes', {unsigned: true}),
  expiresAt: timestamp('expiresAt'),
  lastReferencedAt: timestamp('lastReferencedAt'),
  quarantinedAt: timestamp('quarantinedAt'),
  lastReconciledAt: timestamp('lastReconciledAt'),
  lastError: varchar('lastError', {length: 512}),
  protected: boolean('protected').notNull().default(false),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scopeKeyHashUnique: uniqueIndex('storage_asset_scope_key_hash_unique').on(table.scopeKey, table.storageKeyHash),
  lifecycleIndex: index('storage_asset_scope_lifecycle_idx').on(table.scopeKey, table.lifecycle, table.updatedAt),
  expiryIndex: index('storage_asset_expiry_idx').on(table.lifecycle, table.expiresAt),
}));

/** Referências do documento canônico para cada asset conhecido. */
export const storageAssetReferences = mysqlTable('storage_asset_references', {
  id: bigint('id', {mode: 'number', unsigned: true}).autoincrement().primaryKey(),
  assetId: bigint('assetId', {mode: 'number', unsigned: true}).notNull(),
  scopeKey: varchar('scopeKey', {length: 96}).notNull(),
  constructionSiteId: varchar('constructionSiteId', {length: 128}).notNull(),
  documentVersion: int('documentVersion').notNull(),
  firstReferencedAt: timestamp('firstReferencedAt').defaultNow().notNull(),
  lastReferencedAt: timestamp('lastReferencedAt').defaultNow().notNull(),
}, (table) => ({
  assetSiteUnique: uniqueIndex('storage_asset_reference_asset_site_unique').on(table.assetId, table.constructionSiteId),
  siteIndex: index('storage_asset_reference_scope_site_idx').on(table.scopeKey, table.constructionSiteId),
}));

export const storageAssetBackfillMode = mysqlEnum('mode', ['dry_run', 'apply']);
export const storageAssetBackfillStatus = mysqlEnum('status', [
  'running',
  'completed',
  'completed_with_errors',
  'failed',
]);

/** Histórico auditável de cada leitura ou aplicação do backfill. */
export const storageAssetBackfillRuns = mysqlTable('storage_asset_backfill_runs', {
  id: bigint('id', {mode: 'number', unsigned: true}).autoincrement().primaryKey(),
  scopeKey: varchar('scopeKey', {length: 96}).notNull(),
  mode: storageAssetBackfillMode.notNull(),
  status: storageAssetBackfillStatus.notNull().default('running'),
  source: varchar('source', {length: 96}).notNull(),
  documentCount: int('documentCount').notNull().default(0),
  referenceCount: int('referenceCount').notNull().default(0),
  assetCount: int('assetCount').notNull().default(0),
  unresolvedCount: int('unresolvedCount').notNull().default(0),
  errorSummary: text('errorSummary'),
  startedAt: timestamp('startedAt').defaultNow().notNull(),
  finishedAt: timestamp('finishedAt'),
}, (table) => ({
  scopeStartedIndex: index('storage_asset_backfill_scope_started_idx').on(table.scopeKey, table.startedAt),
}));

/** Um único Heartbeat de retenção por escopo, sempre identificado pelo taskUid. */
export const storageRetentionSchedules = mysqlTable('storage_retention_schedules', {
  id: varchar('id', {length: 64}).primaryKey(),
  scopeKey: varchar('scopeKey', {length: 96}).notNull(),
  scheduleCronTaskUid: varchar('scheduleCronTaskUid', {length: 65}).unique(),
  enabled: boolean('enabled').notNull().default(false),
  minUnreferencedAgeDays: int('minUnreferencedAgeDays').notNull().default(30),
  pendingGraceDays: int('pendingGraceDays').notNull().default(7),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scopeIndex: uniqueIndex('storage_retention_schedule_scope_unique').on(table.scopeKey),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ConstructionSiteDocument = typeof constructionSiteDocuments.$inferSelect;
export type InsertConstructionSiteDocument = typeof constructionSiteDocuments.$inferInsert;
export type StorageAsset = typeof storageAssets.$inferSelect;
export type StorageAssetReference = typeof storageAssetReferences.$inferSelect;
