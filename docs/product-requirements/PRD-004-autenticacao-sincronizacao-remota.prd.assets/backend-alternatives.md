---
title: Alternativas De Backend Ao Convex
doc_type: technical-note
doc_role: technical-spec
doc_set: product-requirements
status: proposed
parent_id: PRD-004
lang: pt-BR
created: 2026-06-23
updated: 2026-06-23
---

# Alternativas De Backend Ao Convex

## 1. Objetivo

Registrar alternativas avaliadas para autenticação e persistência remota do RAC Designer TETO, sem
alterar a decisão vigente da `ADR-003`: Convex + Clerk permanece a stack proposta para o MVP remoto
global, com Supabase + Supabase Auth preservado como rota futura de migração.

Este documento é uma nota de apoio para planejamento posterior. Ele não substitui a `ADR-003`, o
`PRD-004` nem a especificação técnica associada.

## 2. Contexto Considerado

- A aplicação deve atender poucas pessoas, estimadas entre 20 e 50 usuários no limite máximo.

- O uso terá picos concentrados em aproximadamente uma semana a cada dois meses.

- O escopo remoto inicial é global: todos os usuários autorizados veem e editam a mesma base.

- Dados locais legados devem ser descartados no modo remoto.

- IndexedDB, se mantido, é apenas cache técnico descartável e fila curta de escrita.

- A UI mínima deve expor `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.

- A solução deve permanecer em plano gratuito enquanto o perfil de uso permitir.

- A arquitetura deve preservar migração futura para Supabase por meio de adapters e payloads
  versionados.

## 3. Critérios De Comparação

- Esforço de implementação no app React/Vite atual.
- Custo inicial e chance de permanecer em plano gratuito.
- Autenticação disponível sem backend próprio.
- Suporte a dados remotos compartilhados e atualizações reativas.
- Complexidade para tratar conflito por `documentVersion`.
- Facilidade de migração futura para Supabase/Postgres.
- Responsabilidade operacional assumida pelo mantenedor.
- Risco de acoplar o editor, canvas ou domínio a um provedor específico.

## 4. Alternativas

| Alternativa                        | Quando faz sentido                                                                                                           | Vantagens                                                                                | Custos e riscos                                                                                              | Leitura para o RAC Designer TETO                                                               |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Convex + Clerk                     | MVP remoto com baixo atrito, funções TypeScript e dados reativos.                                                            | Menor esforço para backend reativo, mutations transacionais e sincronização de UI.       | Lock-in maior no modelo Convex; migração futura exige exportação/adapters disciplinados.                     | Continua sendo a escolha proposta para o MVP.                                                  |
| Supabase + Supabase Auth           | Quando SQL/Postgres, RLS, relatórios, auditoria relacional ou integração administrativa forem prioridades desde o início.    | Postgres, Auth integrado, `jsonb`, SQL, RLS e rota natural de migração.                  | Mais trabalho para modelar sync, conflitos, cache e mutations seguras.                                       | Principal alternativa estratégica e destino futuro mais coerente.                              |
| Firebase/Firestore + Firebase Auth | Quando realtime/offline simples e ecossistema Google forem mais importantes que SQL.                                         | Produto maduro, Auth integrado, Firestore, SDKs fortes e bom suporte a apps client-side. | Modelo NoSQL e custo por operação podem dificultar previsibilidade e migração SQL.                           | Tecnicamente viável, mas menos alinhado à rota futura Supabase.                                |
| Appwrite                           | Quando se deseja BaaS open-source com Auth, Database, Storage, Functions e opção cloud/self-host.                            | Plataforma integrada e alternativa mais aberta que Firebase.                             | Ecossistema e maturidade menores que Supabase/Firebase; sync/conflito continuam sob responsabilidade do app. | Alternativa aceitável, mas não mais forte que Supabase para este caso.                         |
| PocketBase                         | Quando custo mínimo e simplicidade operacional local forem mais importantes que plataforma gerenciada robusta.               | Single binary, SQLite, Auth, realtime e painel administrativo.                           | O mantenedor assume hospedagem, backup, segurança, monitoramento e disponibilidade.                          | Pode funcionar para 20 a 50 pessoas, mas muda o problema para operação.                        |
| Nest.js/Node + Postgres            | Quando controle total, integrações corporativas, auditoria forte e regras server-side complexas forem requisitos explícitos. | Máximo controle arquitetural e menor dependência de BaaS.                                | Maior esforço de implementação, segurança, deploy, observabilidade, backup e manutenção.                     | Excesso para o MVP atual; pode ser revisto se o produto crescer em complexidade institucional. |
| Neon ou Turso + API própria        | Quando se quer banco serverless barato com uma API fina construída pela aplicação.                                           | Pode reduzir custo fixo e manter flexibilidade de banco.                                 | Não entrega sozinho Auth, sync, permissões, mutations de domínio nem UI reativa.                             | É componente de backend, não substituto direto do Convex.                                      |
| InstantDB                          | Quando presença, sync e colaboração forem o centro do produto desde cedo.                                                    | Modelo orientado a apps reativos e colaboração.                                          | Menos alinhado ao plano Supabase/Postgres e menos estabelecido para o domínio atual.                         | Interessante para uma fase colaborativa, não para o MVP remoto global.                         |
| Electric/PowerSync sobre Postgres  | Quando local-first ou sync sofisticado sobre Postgres virarem requisito principal.                                           | Sincronização mais forte com base Postgres e caminho para colaboração/offline avançado.  | Adiciona uma camada especializada e aumenta a complexidade inicial.                                          | Melhor como evolução futura se cache/sync se tornarem o problema central.                      |

## 5. Recomendação Atual

Manter a decisão da `ADR-003`:

1. Usar Convex + Clerk no MVP remoto global.

2. Manter Supabase + Supabase Auth como alternativa estratégica e destino futuro.

3. Evitar Firebase se a prioridade for preservar uma migração limpa para Postgres.

4. Evitar Nest.js/Node + Postgres no MVP, salvo se surgirem requisitos institucionais fortes.

5. Tratar PocketBase como opção de custo baixo apenas se o mantenedor aceitar operar infraestrutura.

6. Tratar Neon, Turso, Electric, PowerSync e InstantDB como componentes ou evoluções, não como
   substitutos diretos imediatos.

## 6. Implicações Para A Arquitetura

Para manter a decisão reversível, qualquer alternativa futura deve respeitar os mesmos limites:

- `src/domain` não importa SDK de backend, autenticação ou cliente remoto.

- `src/components/rac-editor/@canvas` não conhece provedor de persistência.

- O editor depende de ports e documentos serializáveis.

- O payload remoto mantém `schemaVersion`, `documentVersion`, `scopeId`, `constructionSiteId`,
  `updatedAt`, `deletedAt` opcional e `payload`.

- Conflitos são tratados por versão, sem merge silencioso.

- Exportação administrativa versionada é obrigatória antes de qualquer troca de provedor.

## 7. Gatilhos Para Revisitar A Escolha

- O plano gratuito de Convex ou Clerk deixar de cobrir o perfil real de uso.
- A aplicação exigir SQL, relatórios, auditoria relacional, RLS ou integrações administrativas.
- A TETO exigir SSO, MFA obrigatório, políticas de dados incompatíveis ou governança mais forte.
- Edição simultânea no mesmo desenho se tornar frequente.
- O custo de migração para Supabase começar a crescer por acoplamento indevido ao Convex.
- A operação passar a exigir backups, restauração e observabilidade que o fluxo inicial não cobre.

## 8. Fontes E Volatilidade

Planos, limites e preços são informações voláteis e devem ser verificados novamente antes da
implementação. Fontes consultadas em 2026-06-23:

- [Convex pricing](https://www.convex.dev/pricing)
- [Convex docs](https://docs.convex.dev/home)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Firestore pricing](https://cloud.google.com/firestore/pricing)
- [Appwrite pricing](https://appwrite.io/pricing)
- [PocketBase](https://pocketbase.io/)
- [Neon pricing](https://neon.com/pricing)
- [Turso pricing](https://turso.tech/pricing)
- [InstantDB pricing](https://www.instantdb.com/pricing)
- [Electric Sync](https://electric.ax/sync/)
