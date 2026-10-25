---
title: Especificação Técnica — Autenticação Manus e Sync Remoto Global
doc_type: technical-spec
doc_role: technical-spec
doc_set: product-requirements
status: in_progress
parent_id: PRD-004
lang: pt-BR
created: 2026-06-22
updated: 2026-10-19
---

# Especificação Técnica — Autenticação Manus e Sync Remoto Global

## 1. Objetivo

Definir o contrato técnico para implementar autenticação Manus, persistência remota global, Storage
de imagens e sincronização sem alterar o comportamento funcional do RAC Designer TETO.

A implementação seguirá o padrão fullstack nativo do Manus utilizado em Grocerytics: Manus OAuth,
tRPC, Drizzle, banco MySQL/TiDB e Storage nativo.

## 2. Decisões consolidadas

- Manus OAuth é o provedor de identidade do MVP.

- Qualquer conta Manus autenticada acessa o escopo global no MVP.

- `users.role` será preservado para autorização futura, mas não restringirá acesso agora.

- O banco nativo Manus é a fonte de verdade remota.

- Drizzle é a camada de schema e queries.

- tRPC é a camada de procedures protegidos.

- Fotos de até 7,5 MiB são armazenadas no Storage nativo; o banco guarda referências.

- Dados locais legados são descartados após confirmação na entrada remota.

- IndexedDB mantém cache confirmado e intenções pendentes duráveis; não descartar intenções não
  sincronizadas.

- A arquitetura usa ports e adapters para permitir trocar a implementação por Supabase no futuro.

- A troca futura de backend não altera domínio, canvas, documentos canônicos ou componentes
  centrais.

- O frontend está organizado em `client/src/`.

## 3. Resumo da arquitetura

```text
Manus OAuth
  -> /api/oauth/callback
    -> cookie de sessão
      -> ctx.user
        -> protectedProcedure
          -> tRPC
            -> adapter remoto
              -> Drizzle
                -> MySQL/TiDB nativo Manus

RAC Editor
  -> ConstructionSiteSession
    -> ConstructionSiteRepositoryPort
      -> RemoteConstructionSiteRepositoryAdapter
        -> tRPC

Upload de imagem
  -> Storage nativo Manus
    -> referência no ConstructionSiteState
```

A aplicação deve separar o runtime do editor da infraestrutura:

```text
client/src/domain/
client/src/shared/
client/src/infra/
client/src/bootstrap/
client/src/components/

drizzle/
server/
server/storage.ts
shared/
```

A migração de `src/` para `client/src/` é uma mudança de organização, não de contrato.

O caminho `client/src/` já está aplicado e o backend Manus foi incorporado. O cliente consome tRPC
somente por `client/src/lib/trpc-client.ts`; o adapter remoto fica em
`client/src/infra/persistence/remote-construction-site-repository.adapter.ts`; e a composição da
sessão remota fica em `client/src/bootstrap/useRemoteConstructionSiteSessionStorage.ts`. O domínio e
o canvas continuam sem importações de infraestrutura.

## 4. Fronteiras

- `client/src/domain` não importa Manus OAuth, tRPC, Drizzle, MySQL, Storage ou React Query.
- `client/src/shared` contém tipos de domínio e contratos serializáveis, não tipos do provedor.
- `client/src/components/rac-editor/@canvas` não conhece autenticação ou backend.
- `client/src/components/rac-editor/lib` recebe storage por port.
- `client/src/infra/persistence` contém adapters concretos do frontend.
- `client/src/bootstrap` compõe autenticação, remoto, cache e ports.
- `server/_core` permanece infraestrutura do Manus.
- `server/routers.ts` contém procedures de aplicação e regras de autorização.
- `server/db.ts` contém helpers de acesso Drizzle.
- `drizzle/schema.ts` contém tabelas e tipos do banco.
- `server/storage.ts` contém helpers para upload e obtenção de URLs de leitura de objetos.

## 5. Identidade e escopo remoto

A sessão Manus deve ser normalizada na borda:

```ts
export interface RemoteIdentity {
  provider: 'manus';
  userId: string; // ctx.user.openId
  primaryEmail?: string | null;
  name?: string | null;
  role?: 'admin' | 'user';
}
```

No MVP, a autorização é:

```text
usuário autenticado pelo Manus -> acesso ao escopo global
```

O escopo não é particionado por usuário:

```ts
export interface RemoteDataScope {
  kind: 'global';
  scopeId: 'rac-designer-teto-global';
}
```

`openId` é usado para identidade e auditoria. `scopeId` define a base compartilhada. IDs de
construção, família, casa e monitor continuam sendo IDs de domínio gerados pela aplicação.

No futuro, a regra poderá ser substituída por `role`, allowlist ou memberships em procedures
server-side. Essa evolução não deve exigir mudanças no domínio.

## 6. Modelo de banco e arquivos

A tabela de usuários é a tabela nativa do template Manus e deve preservar o `openId`, `name`,
`email`, `loginMethod`, `role`, timestamps e `lastSignedIn`.

A tabela implementada de documentos remotos é `construction_site_documents`:

```text
construction_site_documents
  id                    # constructionSite.id
  scopeKey              # rac-designer-teto-global no MVP
  externalCode
  status
  document              # JSON ConstructionSiteState
  documentVersion
  createdAt
  updatedAt
```

O `id` é chave primária e há índices por `(scopeKey, updatedAt)` e `(scopeKey, externalCode)`. O
payload é compatível com `ConstructionSiteState`, recebe `documentVersion` monotônico e é atualizado
condicionalmente pela versão esperada. A remoção física permanece permitida apenas para construções
já arquivadas; tombstones continuam uma evolução possível.

O banco não armazena imagens como base64. O payload mantém a referência relativa do objeto. Tipo,
tamanho, SHA-256 e data observada são preservados no manifesto administrativo do backup; não existe
uma tabela de assets ou um envelope `StoredAssetReference` obrigatório no domínio atual.

Os campos de foto continuam nomeados `photoDataUrl` por compatibilidade de domínio, mas a
implementação aceita como valor remoto uma URL relativa canônica `/api/private-storage/{key}`, com
compatibilidade de `/manus-storage/{key}`. A procedure `storage.uploadImage` aceita PNG, JPEG e WEBP
até 7,5 MiB, verifica a assinatura binária e chama `storagePut`; `constructionSites.save` rejeita
qualquer `data:image/...` no payload.

## 7. Procedures tRPC

Procedures mínimos:

```text
auth.me
auth.logout
constructionSites.list
constructionSites.load
constructionSites.save
constructionSites.remove
storage.uploadImage
```

As operações de construção e assets usam `protectedProcedure`. O servidor obtém `ctx.user` da sessão
Manus, deriva `scopeId`, valida input e ignora valores de autorização fornecidos pelo cliente.

## 8. Contrato de persistência e concorrência

O port deve representar concorrência otimista:

```ts
export interface SaveConstructionSiteInput {
  constructionSite: ConstructionSiteState;
  expectedDocumentVersion: number;
}

export interface SaveConstructionSiteResult {
  documentVersion: number;
  updatedAt: string;
}

export interface ConstructionSiteRepositoryPort {
  list(): Promise<ConstructionSiteSummary[]>;
  load(constructionSiteId: string): Promise<ConstructionSiteState | null>;
  save(input: SaveConstructionSiteInput): Promise<SaveConstructionSiteResult>;
  remove(constructionSiteId: string, expectedDocumentVersion: number): Promise<void>;
}
```

Uma escrita condicional atualiza somente quando a versão remota corresponde à versão esperada. Se
nenhuma linha for atualizada, o servidor retorna `CONFLICT`. O backend deriva `scopeKey`, calcula a
próxima versão e substitui `documentVersion` no payload; não confia nesses valores fornecidos pelo
cliente.

## 9. Semântica de boot

Sem login, não carregar a base remota nem fazer upload. Após `auth.me`, a sondagem legada abre o
IndexedDB sem solicitar versão. Banco inexistente tem a criação abortada; stores existentes são
lidos em transações readonly. “Manter e sair” bloqueia o editor remoto sem alterar a base. Somente a
confirmação explícita limpa os stores legados; falha mantém o diálogo e os dados. A abertura do
driver também preserva stores desconhecidos.

A fila usa outro banco, `rac-designer-teto-remote-sync`, store `sessions`, schema 1. A chave combina
escopo global, `openId` e ID da sessão da aba mantido em `sessionStorage`. Contas distintas e abas
com IDs distintos não consomem filas umas das outras. O registro guarda documento local, última base
confirmada, revisão e data, sem credenciais. A revisão é comparada na mesma transação de escrita
para recusar escritores concorrentes.

Com intenção pendente, o boot restaura o documento e a base confirmada e mantém suas versões
esperadas, sem substituí-los pela base remota atual. Sem pendência, consulta `list`/`load` e
atualiza o cache. Falha de rede pode usar cache existente após autenticação; falha de autenticação
não é contornada. A recuperação automática cobre recarga da mesma sessão da aba. Em outra sessão, o
boot lista filas pendentes da mesma conta para retomada explícita. A transferência preserva intenção
e base, compara revisões e move o registro em uma transação, invalidando o escritor anterior; não
infere que a aba anterior esteja fechada. Continuar sem retomar preserva as outras filas. IndexedDB
indisponível, corrompido ou sem quota bloqueia envios, com erro visível.

## 10. Semântica de escrita e assets

Cada alteração é serializada no journal antes da chamada de rede. A fila envia o estado mais recente
em ordem e confirma cada documento no journal após seu save/remove, inclusive quando outro documento
do lote falha; novas edições durante um envio permanecem pendentes. Uma falha de disco ou perda da
resposta após commit remoto pode exigir resolução explícita de conflito, sem sobrescrever
silenciosamente o servidor. A escrita envia `expectedDocumentVersion`. Falha de rede pausa os
envios, preserva a intenção e marca erro. `online` ou retomada manual tenta novamente. Mudança da
identidade invalida a fila ativa antes dos próximos envios. Conflitos pausam a fila e exigem decisão
explícita; não há merge automático ao reconectar. A UI de resolução existente permite adotar o
remoto ou aplicar mudanças locais quando o merge explícito for seguro.

O upload de foto ocorre antes da gravação do payload que referencia o arquivo. A referência só entra
no documento depois de o upload ser confirmado. A substituição evita apagar o objeto antigo antes de
persistir a nova referência. O inventário administrativo exclui referências válidas e uploads
pendentes dos candidatos. Retenção é obrigatória e explícita, sem valor padrão. Dry-run não remove
objetos. O apply local exige hash do plano autorizado, relê as fontes antes de cada objeto e confere
os bytes antes de remover. Não há adapter de limpeza remota: o Forge atual só oferece GET/PUT. A
janela entre conferir e excluir não é um bloqueio exclusivo.

## 11. Autenticação e variáveis

O frontend inicia login em handler usando o helper nativo Manus, consulta `auth.me` e usa
`auth.logout`. Componentes do editor não manipulam cookies ou tokens.

Variáveis nativas esperadas:

```text
DATABASE_URL
JWT_SECRET
VITE_APP_ID
OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL
OWNER_OPEN_ID
OWNER_NAME
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
```

Não versionar `.env`, enviar segredos ao bundle, persistir tokens em documentos ou registrar
payloads completos.

## 12. Testes esperados

Testar login, callback, logout, `auth.me`, acesso global para qualquer conta Manus autenticada,
migrations, listagem, carga, save, remove, conflito de versão, descarte de IndexedDB, cache, fila
pendente, upload, referências e fronteira de imports do domínio e canvas.

### Evidências locais de resiliência e operação

Os testes `remote-sync-journal.smoke.test.ts`, `useRemoteConstructionSiteSessionStorage.test.tsx` e
`e2e/prd004-storage.spec.ts` cobrem gravação antes da rede, falha de disco, recarga, reconexão,
isolamento de identidade, revisão concorrente, preservação do legado e recusa do descarte. Os testes
`server/admin/` usam fontes e binários sintéticos, inclusive reconstituição em diretório isolado.
Não comprovam operação conectada em produção.

O procedimento [OPS-002](../../OPS-002-backup-storage.md) descreve o ZIP versão 1, captura global
por um único SELECT, leitura dos assets referenciados por GET assinado, integridade, reconstituição
e inventário. A captura real exige opt-in e autorização específica; nenhum comando destrutivo é
exposto em tRPC.

## 13. Fora do escopo inicial

Autorização por papel ou allowlist, SSO, MFA obrigatório, colaboração em tempo real, merge visual,
normalização completa, migração automática de dados locais e importação automática do IndexedDB
legado.

## 14. Evolução

A autorização futura poderá ser introduzida em `protectedProcedure` por `role`, allowlist ou
memberships. A troca para Supabase deve implementar os mesmos ports. O contrato de documentos e o
domínio não devem ser reescritos por causa da mudança de infraestrutura.
