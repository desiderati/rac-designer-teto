---
title: "ADR-003 — Backend Remoto Global com Manus Auth e Banco Nativo Manus"
doc_type: architecture-decision
doc_role: architecture-decision-record
doc_set: architecture-decisions
adr_number: ADR-003
decision_mode: previo
status: accepted
created: 2026-06-22
updated: 2026-09-17
decision_source: "Revisão da decisão original para adoção da autenticação e do banco nativos do Manus"
tags: [adr, architecture, decision, backend, auth, persistence, manus, drizzle, mysql, trpc, storage]
aliases: [ADR-003, Backend Remoto Global com Manus Auth e Banco Nativo]
---

# ADR-003 — Backend Remoto Global com Manus Auth e Banco Nativo Manus

Status permitido: `proposed` | `accepted` | `deprecated` | `superseded`.

## 1. Contexto

O RAC Designer TETO possui persistência local em IndexedDB para Construções TETO, mas precisa adicionar autenticação, backup remoto, recuperação entre dispositivos e uma base compartilhada. A decisão anterior propunha Convex + Clerk. O projeto será alinhado ao ambiente nativo do Manus, seguindo o mesmo padrão de autenticação e persistência utilizado em Grocerytics.

O perfil esperado permanece pequeno e sazonal: entre 20 e 50 usuários, com picos concentrados em aproximadamente uma semana a cada dois meses. O escopo remoto inicial será global. Qualquer conta autenticada pelo Manus poderá acessar a aplicação e a base global no MVP. O campo `role` será mantido para evolução futura, mas não será usado como restrição de acesso agora.

A arquitetura local já oferece contratos relevantes: `ConstructionSiteRepositoryPort` representa a persistência de Construções TETO; `ConstructionSiteSessionStoragePort` compõe o estado utilizado pelo editor; `HouseDrawingDocument` e `ConstructionSiteState` são os contratos canônicos; e o runtime visual do Fabric permanece confinado ao slice `@canvas`.

Dados locais legados devem ser descartados na entrada do modo remoto. IndexedDB poderá continuar existindo somente como cache técnico descartável e fila curta de escrita pendente, nunca como fonte de verdade.

## 2. Decisão

Adotar a autenticação nativa **Manus OAuth** e o banco nativo **MySQL/TiDB do Manus**, no mesmo padrão de infraestrutura utilizado em Grocerytics. O backend será implementado com o runtime fullstack do Manus, usando **tRPC** para os contratos de aplicação e **Drizzle** para schema, queries e migrations.

A arquitetura remota será composta por Manus OAuth para identidade e sessão, a tabela nativa `users` identificada pelo `openId` do Manus, `protectedProcedure` para as operações protegidas, tRPC sob `/api/trpc`, Drizzle para acesso ao banco nativo e Storage nativo do Manus para fotos e arquivos. Os documentos de Construção TETO serão persistidos como payloads JSON versionados.

A organização física seguirá o template fullstack do Manus. A migração do frontend para `client/src/` já foi aplicada. Essa separação prepara o projeto para incorporar backend, schema e Storage sem misturar responsabilidades:

```text
client/src/domain/       # regras e contratos de domínio
client/src/shared/       # tipos e utilitários compartilhados
client/src/infra/        # adapters do frontend
client/src/bootstrap/    # composição das portas
client/src/components/   # interface e editor

drizzle/schema.ts       # schema e tipos do banco
server/db.ts            # helpers de persistência
server/routers.ts       # procedimentos tRPC
server/_core/           # infraestrutura Manus
storage/                # helpers do Storage nativo
shared/                 # constantes compartilhadas do backend
```

A mudança para `client/src/` não altera a fronteira arquitetural. O domínio, o canvas, os documentos canônicos e os componentes centrais continuam dependentes de ports, não de SDKs de infraestrutura.

### Estado da implementação

A implementação fullstack foi incorporada ao repositório. O runtime Express do Manus inicializa OAuth, tRPC sob `/api/trpc` e o proxy `/manus-storage/*`; `drizzle/schema.ts` define `users` e `construction_site_documents`; e a migration `drizzle/0000_late_karnak.sql` foi aplicada ao banco nativo. A tabela de documentos usa `id` da Construção TETO, `scopeKey = rac-designer-teto-global`, `externalCode`, `status`, o payload JSON canônico e `documentVersion` para concorrência otimista.

No cliente, `RemoteConstructionSiteRepositoryAdapter` implementa `ConstructionSiteRepositoryPort`; `useRemoteConstructionSiteSessionStorage` hidrata a sessão síncrona que o canvas exige e serializa as escritas remotas. A tela do editor passa pelo gate `auth.me`, e os uploads de PNG, JPEG e WEBP são validados no cliente e novamente no servidor antes de `storagePut`. O banco persiste somente URLs `/manus-storage/{key}` e a procedure recusa qualquer `data:image/...` no documento remoto.

O MVP implementado ainda não oferece confirmação visual para apagar o IndexedDB legado, fila offline persistente, indicador de sincronização por estado, exportação administrativa ou limpeza de objetos órfãos. Esses itens permanecem evolução explícita; IndexedDB não é consultado no caminho remoto implementado.

### Responsabilidades

- Manus OAuth autentica o usuário e mantém a sessão por cookie.
- O contexto tRPC disponibiliza o usuário autenticado em `ctx.user`.
- O `openId` identifica o usuário para auditoria e futura autorização, mas não particiona a base no MVP.
- O servidor deriva o escopo global `rac-designer-teto-global`.
- Drizzle acessa o banco nativo e mantém o schema sincronizado por migrations.
- O adapter remoto implementa `ConstructionSiteRepositoryPort`.
- O Storage nativo guarda PNG, JPEG e WEBP de até 5 MiB; o banco guarda a URL `/manus-storage/{key}` no payload canônico. Metadados adicionais e checksum continuam evolução possível.
- O editor continua consumindo documentos serializáveis sem conhecer Manus OAuth, tRPC, Drizzle, MySQL/TiDB ou Storage.

### Fluxo principal

1. Usuário não autenticado vê a entrada de login e não acessa procedimentos protegidos.
2. Manus OAuth conclui em `/api/oauth/callback` e cria a sessão.
3. `auth.me` fornece o usuário atual ao frontend.
4. O primeiro acesso remoto descarta o IndexedDB legado após confirmação explícita, quando aplicável.
5. O backend carrega a base global e o frontend reconstrói a sessão do editor.
6. Escritas são enviadas por tRPC com `expectedDocumentVersion`.
7. O backend valida o payload, verifica a versão, grava o novo snapshot e incrementa `documentVersion`.
8. Conflitos não sobrescrevem dados silenciosamente.

### Substituibilidade por ports

A implementação concreta de autenticação e persistência deve permanecer atrás de ports e adapters. Se o projeto futuramente adotar Supabase, a alteração deverá ficar limitada à implementação dos ports, à composição em `client/src/bootstrap/` e à infraestrutura correspondente. O domínio, o canvas, os documentos canônicos e os componentes centrais do editor não deverão ser alterados por essa troca.

## 3. Alternativas consideradas

### Alternativa A: Manus OAuth + banco nativo Manus

É a alternativa selecionada. Ela reduz o número de provedores externos, aproveita autenticação, banco, storage, deploy e runtime já disponíveis no ambiente Manus e segue o padrão já utilizado em Grocerytics. O custo principal é adaptar o projeto Vite atual ao template fullstack e manter a portabilidade por meio de ports.

### Alternativa B: Supabase + Supabase Auth

Permanece uma alternativa futura caso SQL/Postgres, RLS, relatórios, auditoria relacional, SSO ou requisitos organizacionais se tornem prioritários. A adoção futura deverá usar exportação de payloads versionados e novos adapters, não acoplamento do domínio ao Postgres.

### Alternativa C: Convex + Clerk

Foi a decisão anterior, agora substituída. Continua registrada como histórico arquitetural, mas não deve orientar a implementação atual.

### Alternativa D: Backend próprio

Um backend Node/Nest.js com banco próprio daria controle máximo, mas adicionaria deploy, segurança, observabilidade, migrations, backup e operação desproporcionais ao perfil atual. Poderá ser reavaliado caso surjam requisitos institucionais fortes.

## 4. Consequências e trade-offs

### 4.1. Positivas

- A aplicação usa uma única plataforma nativa para autenticação, backend, banco e storage.
- O editor permanece protegido por ports e documentos versionados.
- A base global atende o fluxo de recuperação entre dispositivos.
- Fotos não precisam ser armazenadas como base64 dentro do payload do banco.
- O modelo de dados pode começar documental em JSON e evoluir sem reescrever o canvas.
- Uma futura troca para Supabase permanece limitada aos adapters e à composição de infraestrutura.

### 4.2. Negativas

- O projeto deixa de ser frontend-only e passa a exigir backend, schema, migrations e runtime fullstack.
- O banco nativo MySQL/TiDB não deve ser tratado como Postgres; uma eventual migração exigirá transformação de schema e dados.
- A autorização inicial será deliberadamente ampla: qualquer conta Manus autenticada poderá acessar a base global.
- Concorrência entre dispositivos exigirá controle explícito de versão.
- O projeto passa a depender das convenções operacionais do ambiente Manus.

### 4.3. Trade-offs aceitos

- Aceitar escopo global e acesso aberto no MVP para reduzir complexidade inicial.
- Aceitar payloads JSON versionados antes da normalização relacional.
- Aceitar cache local descartável, sem promover IndexedDB a fonte de verdade.
- Persistir imagens no Storage nativo e referências no banco, mesmo que isso exija um fluxo separado de upload.
- Aceitar que permissões por papel, allowlists, SSO e MFA sejam evoluções posteriores.

### 4.4. Riscos e mitigação

- **Acoplamento do editor à infraestrutura:** manter SDKs apenas em `client/src/infra`, `client/src/bootstrap`, `server/` e `storage/`.
- **Conflito de edição:** exigir `expectedDocumentVersion` e rejeitar escrita quando a versão remota divergir.
- **Perda de imagem:** usar referências de storage estáveis, checksum opcional e limpeza controlada de objetos órfãos.
- **Payloads grandes:** guardar arquivos no Storage e limitar o payload JSON a metadados e referências.
- **Autorização ampla demais no futuro:** manter `role`, `openId` e metadados de usuário disponíveis para introduzir políticas sem remodelar o domínio.
- **Dados pessoais em logs:** sanitizar logs, não registrar payloads completos e não persistir tokens no domínio.

## 5. Escopo do MVP

Entra Manus OAuth, acesso ao backend para qualquer conta Manus autenticada, base remota global, tabela nativa de usuários, documento remoto por Construção TETO, Drizzle, schema e migrations, tRPC, adapter remoto atrás de `ConstructionSiteRepositoryPort`, Storage nativo para fotos e arquivos, descarte explícito dos dados locais legados, cache local descartável opcional, estados de sincronização, exportação administrativa versionada e controle de concorrência por `documentVersion`.

Fica fora a restrição de acesso por papel ou allowlist, SSO, MFA obrigatório, colaboração em tempo real, merge visual automático, normalização completa de todas as entidades, migração automática de IndexedDB legado e compartilhamento direto de tabelas com outra aplicação sem contrato explícito.

## 6. Evolução planejada

A primeira evolução de autorização poderá usar `users.role`, allowlists por `openId` ou uma tabela de memberships. Essa alteração deve ocorrer em procedures server-side, sem espalhar regras pela UI.

A evolução de concorrência seguirá esta ordem: versão por documento, aviso de presença, locks leves, versões por seção, merge semântico limitado e, somente se necessário, colaboração em tempo real.

Se o volume de consultas administrativas crescer, entidades poderão ser normalizadas gradualmente. O envelope versionado e o Storage desacoplado devem continuar sendo os contratos de migração.

## 7. Artefatos e contratos relacionados

- `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.md`
- `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.assets/technical-spec.md`
- `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.assets/backend-alternatives.md`
- `client/src/domain/construction-site/construction-site-repository.port.ts`
- `client/src/shared/types/construction-site.ts`
- `client/src/shared/types/house-drawing-document.ts`

## 8. Condições de revisão

Revisitar esta decisão quando houver necessidade de autorização por papel, allowlist, SSO, MFA, RLS, relatórios relacionais complexos, requisitos de residência de dados, colaboração simultânea frequente ou operação fora do ambiente Manus.

A mudança para Supabase ou outro backend não deverá alterar o domínio, o canvas, os documentos canônicos ou os componentes centrais. Ela deverá substituir os adapters e a composição das portas.

## 9. Referências cruzadas

- `ADR-001` — fronteira do editor e runtime Fabric.
- `ADR-002` — formato canônico do projeto RAC.
- `PRD-001` — evolução multicasa.
- `PRD-004` — autenticação e sincronização remota global.
- Padrão fullstack do Manus/WebDev utilizado em Grocerytics.
