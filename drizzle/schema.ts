import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ConstructionSiteDocument = typeof constructionSiteDocuments.$inferSelect;
export type InsertConstructionSiteDocument = typeof constructionSiteDocuments.$inferInsert;
