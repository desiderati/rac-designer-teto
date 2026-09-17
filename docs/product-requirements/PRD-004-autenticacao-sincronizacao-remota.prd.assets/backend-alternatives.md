---
title: Alternativas de Backend para o RAC Designer TETO
doc_type: technical-note
doc_role: technical-spec
doc_set: product-requirements
status: proposed
parent_id: PRD-004
lang: pt-BR
created: 2026-06-23
updated: 2026-09-17
---

# Alternativas de Backend para o RAC Designer TETO

## 1. Objetivo

Registrar a decisão atual e as alternativas avaliadas para autenticação, persistência remota e armazenamento de arquivos. A decisão vigente é usar o padrão nativo do Manus utilizado em Grocerytics: Manus OAuth, tRPC, Drizzle, banco MySQL/TiDB e Storage nativo.

Esta nota apoia a `ADR-003` e o `PRD-004`. Ela não os substitui.

## 2. Contexto

A aplicação atenderá poucas pessoas, estimadas entre 20 e 50 usuários, com uso sazonal. O escopo remoto inicial é global e qualquer usuário autenticado acessa a base no MVP. Dados locais legados serão descartados no modo remoto. IndexedDB será apenas cache e fila curta de escrita.

Fotos podem ter aproximadamente 5 MB. Elas devem ser armazenadas no Storage nativo, enquanto o banco guarda referências e metadados.

## 3. Alternativas

| Alternativa | Leitura atual |
|---|---|
| Manus OAuth + banco nativo Manus | Escolha do MVP. Reduz provedores externos e aproveita autenticação, banco, Storage, deploy e runtime nativos. Exige migrar o frontend para o template fullstack e implementar tRPC, Drizzle e migrations. |
| Supabase + Supabase Auth | Alternativa futura se Postgres, RLS, relatórios, auditoria relacional ou SSO forem prioritários. A adoção futura deverá substituir adapters e composição, não o domínio. |
| Convex + Clerk | Decisão histórica substituída. Não deve ser usada na implementação atual. |
| Firebase/Firestore + Firebase Auth | Tecnicamente viável, mas menos alinhada ao runtime Manus e à portabilidade desejada. |
| Appwrite | Possível, mas adicionaria infraestrutura externa sem benefício proporcional ao MVP. |
| PocketBase | Adequado para operação própria de baixo custo, mas transfere backup, segurança e disponibilidade ao mantenedor. |
| Node/Nest.js + Postgres | Opção para requisitos institucionais fortes. Excede a necessidade atual e aumenta o custo operacional. |
| Electric/PowerSync | Evolução possível se sync local-first avançado se tornar requisito principal. Não é necessário no MVP. |

## 4. Recomendação

Usar o backend fullstack nativo do Manus no MVP. Qualquer conta Manus autenticada terá acesso ao escopo global. O campo `role` será preservado para introduzir autorização futura sem remodelar a identidade.

A implementação deve manter `ConstructionSiteRepositoryPort`, `ConstructionSiteSessionStoragePort` e os contratos de documentos como fronteiras. Uma futura adoção de Supabase deverá substituir as implementações concretas dos ports e sua composição, sem alterar domínio, canvas, documentos canônicos ou componentes centrais.

## 5. Implicações

- O projeto passa de frontend-only para fullstack.
- O frontend pode migrar de `client/src/` para `client/src/` conforme o template Manus.
- `drizzle/schema.ts` será a fonte do schema do banco.
- `server/routers.ts` será a fronteira tRPC.
- `server/db.ts` concentrará queries Drizzle.
- `storage/` concentrará uploads e referências de arquivos.
- Fotos não serão armazenadas como base64 no banco.
- Conflitos serão tratados por `documentVersion`.
- Exportação versionada será obrigatória antes de uma migração de provedor.

## 6. Gatilhos para revisitar

Revisitar a escolha se surgirem requisitos de autorização por papel, allowlist, SSO, MFA, RLS, residência de dados, relatórios SQL complexos, colaboração simultânea frequente ou operação fora do ambiente Manus.
