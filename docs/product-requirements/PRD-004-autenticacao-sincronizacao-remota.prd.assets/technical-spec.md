---
title: Especificação Técnica - Autenticação e Sync Remoto Global
doc_type: technical-spec
doc_role: technical-spec
doc_set: product-requirements
status: proposed
parent_id: PRD-004
lang: pt-BR
created: 2026-06-22
updated: 2026-06-22
---

# Especificação Técnica - Autenticação e Sync Remoto Global

## 1. Objetivo

Definir o contrato técnico inicial para implementar autenticação e sincronização remota global sem
alterar o comportamento funcional atual do RAC Designer TETO. Este documento complementa `PRD-004` e
deve ser lido junto com `ADR-003`.

## 2. Decisões Consolidadas

- O escopo remoto inicial é global: todos os usuários autenticados autorizados acessam os mesmos
  dados.

- Dados locais legados devem ser descartados por completo no início do modo remoto.

- O projeto deve permanecer nos planos gratuitos de Convex e Clerk enquanto o perfil de uso
  permitir.

- A UI mínima de sync deve expor `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.

- A arquitetura deve permitir migração futura para Supabase sem reescrever domínio, canvas ou
  editor.

- IndexedDB, se mantido, deve ser cache técnico descartável e fila de escrita, não fonte de verdade.

## 3. Resumo Da Arquitetura

A implementação deve adicionar uma camada remota global em volta da persistência atual:

```text
UI / RAC Editor
  -> EditorPorts
    -> ConstructionSiteSession
      -> ConstructionSiteSessionStoragePort
        -> RemoteGlobalConstructionSiteSessionStorage
          -> DisposableIndexedDbCache
          -> ConvexConstructionSiteRepositoryAdapter
```

O editor continua operando sobre a sessão já carregada. O backend remoto é a fonte de verdade. O
cache local participa apenas como otimização técnica, suporte a escrita pendente e recuperação curta
de estado de UI.

## 4. Fronteiras

- `src/domain` não deve importar Convex, Clerk, Supabase, React Query ou detalhes de autenticação.

- `src/shared/types` não deve conter tipos do provedor remoto.

- `src/components/rac-editor/@canvas` não deve conhecer autenticação nem backend.

- `src/components/rac-editor/lib` deve continuar recebendo storage por porta.

- `src/infra/persistence` e `src/infra/storage` são os locais preferenciais para adapters concretos.

- A composição deve permanecer em `src/bootstrap` ou em um provider de aplicação claramente
  identificado.

## 5. Identidade e Escopo Remoto

A identidade remota deve ser normalizada antes de chegar aos adapters de persistência:

```ts
export interface RemoteIdentity {
  provider: 'clerk';
  userId: string;
  primaryEmail?: string | null;
}
```

O escopo de dados não é individual por usuário nesta fase. Todos os usuários autenticados
autorizados acessam o mesmo escopo global:

```ts
export interface RemoteDataScope {
  kind: 'global';
  scopeId: 'rac-designer-teto-global';
}
```

Regras:

- `userId` é identidade de auditoria e sessão, não partição de dados.

- `scopeId` define a base compartilhada inicial.

- `constructionSite.id`, `family.id`, `house.id` e demais IDs do domínio continuam sendo gerados
  pela aplicação.

- Trocar Clerk por outro provedor deve exigir mudança no adapter de identidade, não nos documentos
  persistidos.

## 6. Modelo Remoto Inicial

No Convex, o MVP deve armazenar um documento por Construção TETO:

```ts
constructionSites: {
  scopeId: 'rac-designer-teto-global';
  constructionSiteId: string;
  schemaVersion: number;
  documentVersion: number;
  updatedAt: string;
  deletedAt?: string;
  payload: ConstructionSiteState;
}
```

Índices esperados:

- por `scopeId` e `updatedAt`;
- por `scopeId` e `constructionSiteId`.

Modelo equivalente inicial para Supabase futuro:

```sql
construction_sites (
  id uuid primary key,
  scope_id text not null,
  construction_site_id text not null,
  schema_version integer not null,
  document_version integer not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null,
  payload jsonb not null
)
```

Esse desenho permite iniciar a migração por `jsonb` e normalizar entidades depois, sem alterar o
contrato do editor.

## 7. Semântica De Boot

### 7.1. Boot Sem Login

- Não carregar a base remota.
- Exibir estado `local` quando a aplicação estiver em modo local ou aguardando autenticação.
- Não tratar dados locais legados como candidatos a upload.

### 7.2. Primeiro Boot Com Login No Modo Remoto

- Confirmar a entrada no modo remoto quando houver dados locais legados.
- Descartar por completo os dados locais legados.
- Carregar documentos remotos do escopo global.
- Criar a sessão local em memória a partir do remoto.
- Recriar o cache local descartável a partir do remoto, se o cache estiver habilitado.

### 7.3. Boots Seguintes Com Login

- Carregar remoto como fonte de verdade.
- Usar cache local apenas como fallback temporário de UI enquanto o remoto carrega.
- Substituir o cache pelo estado remoto confirmado.

## 8. Semântica De Escrita

- A escrita deve ser enviada ao remoto com `documentVersion` esperado.

- A UI pode aplicar atualização otimista no cache local.

- Se a mutation remota confirmar, marcar o estado como `sincronizado`.

- Se a rede falhar, manter alteração em fila local e marcar como `pendente` ou `erro`.

- Se o remoto rejeitar por conflito de versão, não sobrescrever silenciosamente; recarregar remoto e
  exigir resolução futura ou ação explícita.

## 9. Cache Local

O cache local continua valendo, mas com papel reduzido:

- acelerar boot e navegação;
- permitir fila curta de escrita pendente;
- preservar edição durante instabilidade temporária;
- reconstruir sessão quando o remoto acabou de ser carregado.

O cache local não deve:

- ser fonte de verdade;
- ser migrado para o remoto automaticamente;
- sobreviver como base separada após ativação do modo remoto;
- impedir limpeza total quando houver suspeita de inconsistência.

## 10. Adapter Remoto

O adapter Convex deve preservar a semântica do contrato existente:

```ts
export class ConvexConstructionSiteRepositoryAdapter implements ConstructionSiteRepositoryPort {
  list(): Promise<ConstructionSiteSummary[]>;
  load(constructionSiteId: string): Promise<ConstructionSiteState | null>;
  save(constructionSite: ConstructionSiteState): Promise<void>;
  remove(constructionSiteId: string): Promise<void>;
}
```

Regras:

- `remove` deve preferir tombstone remoto (`deletedAt`) quando a remoção física puder prejudicar
  sync entre dispositivos.

- O adapter não deve fazer chamadas diretas a UI nem emitir toast.

- Erros remotos devem ser propagados para a camada de sync, não engolidos silenciosamente.

- A implementação Supabase futura deve implementar o mesmo port ou um port equivalente no domínio.

## 11. Hook De Composição

Criar um hook de composição, nome sugerido:

```ts
useRemoteGlobalConstructionSiteSessionStorage()
```

Responsabilidades:

- obter identidade autenticada;
- detectar e descartar dados locais legados ao entrar no modo remoto;
- carregar remoto como fonte de verdade;
- reconstruir cache local descartável, quando habilitado;
- construir `ConstructionSiteSessionStoragePort` síncrono para o editor;
- expor status de sync para UI;
- enfileirar writes remotos sem bloquear a superfície do editor.

## 12. Variáveis E Segredos

Variáveis públicas esperadas:

- `VITE_CONVEX_URL`;
- `VITE_CLERK_PUBLISHABLE_KEY`.

Regras:

- chaves secretas não devem entrar no bundle Vite;
- tokens de sessão não devem ser persistidos em documentos de domínio;
- logs não devem imprimir payloads completos contendo dados pessoais, fotos ou contatos.

## 13. Testes Esperados

- Smoke test do adapter Convex com cliente fake.
- Teste de boot remoto descartando dados locais legados.
- Teste de carregamento do escopo global.
- Teste de cache local descartável reconstruído a partir do remoto.
- Teste de falha remota preservando fila pendente sem promover cache a fonte de verdade.
- Teste de conflito de versão sem sobrescrita silenciosa.
- Teste de fronteira garantindo que `src/domain` e `@canvas` não importam Convex ou Clerk.
- Verificação em navegador do fluxo de login, descarte local, sync e restauração em sessão limpa.

## 14. Fora Do Escopo Técnico Inicial

- colaboração em tempo real no canvas;
- merge visual de documentos divergentes;
- normalização relacional;
- Supabase adapter produtivo;
- permissão granular por papel;
- dashboard administrativo completo;
- migração automática de Clerk para Supabase Auth;
- importação automática do IndexedDB legado para o remoto.

## 15. Trilha Técnica Pós-MVP Para Concorrência

A arquitetura inicial deve deixar espaço para evoluir de salvamento documental simples para
colaboração mais sofisticada sem reescrever o editor.

### 15.1. MVP: Concorrência Otimista Por Documento

- Cada escrita envia `expectedDocumentVersion`.

- O backend aceita a escrita apenas quando a versão remota atual corresponde à versão esperada.

- Em conflito, o backend rejeita a mutation e informa a versão remota atual.

- A UI não faz merge automático; deve recarregar remoto ou preservar a intenção local como rascunho
  técnico/exportável.

### 15.2. Fase Seguinte: Lock Leve Por Construção TETO

- Adicionar metadados de presença por `constructionSiteId`, identidade e instante de heartbeat.
- Usar `TTL` para expirar locks abandonados.
- Exibir aviso operacional quando outra pessoa estiver editando a mesma Construção TETO.
- Preferir aviso forte antes de bloqueio absoluto.

### 15.3. Fase Seguinte: Versionamento Por Seção

Evoluir o envelope remoto para permitir versões independentes:

```ts
sectionVersions: {
  metadata: number;
  families: number;
  monitors: number;
  drawing: number;
}
```

Regras:

- alterações em seções diferentes podem ser aceitas sem conflito total do documento;
- alterações concorrentes na mesma seção continuam gerando conflito;
- o payload legado por documento inteiro continua exportável durante a transição.

### 15.4. Fase Seguinte: Merge Por Seção

- Resolver automaticamente apenas alterações independentes e semanticamente seguras.
- Não tentar merge cego de `HouseDrawingDocument`.
- Quando houver divergência no mesmo desenho ou entidade, exigir ação explícita.

### 15.5. Fase Seguinte: Patch Ou Event Log

Persistir comandos ou eventos versionados em vez de depender somente de snapshots:

```ts
type ConstructionSiteEvent =
  | { type: 'family.added'; familyId: string; payload: unknown }
  | { type: 'monitor.updated'; monitorId: string; patch: unknown }
  | { type: 'house.drawing.updated'; houseId: string; patch: unknown };
```

Benefícios esperados:

- histórico e auditoria;
- retry mais granular;
- resolução de conflito mais localizada;
- migração futura para Supabase com replay ou materialização em `jsonb`.

### 15.6. Fase Futura: Colaboração Em Tempo Real

Só deve entrar se o uso real mostrar edição simultânea frequente na mesma Construção TETO ou no
mesmo desenho. Nessa fase, avaliar presença em tempo real, cursores, atualização ao vivo e, se
necessário, CRDT/Yjs/Automerge para partes altamente concorrentes.

## 16. Condições Para Implementação

Antes de implementar, confirmar:

- texto exato do aviso de descarte local;
- se o cache local descartável será habilitado já no MVP ou introduzido depois;
- onde a UI mínima de status de sync aparecerá;
- se o modo remoto bloqueia edição quando há conflito de versão.
