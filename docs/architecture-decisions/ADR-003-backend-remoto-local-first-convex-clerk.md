---
title: "ADR-003 — Backend Remoto Global com Convex e Clerk"
doc_role: architecture-decision-record
adr_number: ADR-003
decision_mode: previo
status: proposed
created: 2026-06-22
updated: 2026-06-22
supersedes:
superseded_by:
decision_source: "Conversa Codex de 2026-06-22 sobre autenticação, persistência remota, custos, escopo global e migração futura"
tags: [ adr, architecture, decision, backend, auth, persistence, convex, clerk ]
aliases: [ ADR-003, Backend Remoto Global com Convex e Clerk ]
---

# ADR-003 — Backend Remoto Global com Convex e Clerk

Status permitido: `proposed` | `accepted` | `deprecated` | `superseded`.

## 1. Contexto

- problema que queremos resolver:
  - O RAC Designer TETO possui persistência local durável em IndexedDB para Construções TETO, mas ainda não possui
    autenticação, backup remoto, sincronização entre dispositivos ou identidade de usuário.

- restrições reais do ambiente:
  - `PRD-001` implementou uma arquitetura local com Construções TETO, múltiplas casas e persistência em IndexedDB.
  - `ADR-001` protege a fronteira do editor com Fabric, mantendo o runtime visual confinado ao slice `@canvas`.
  - `ADR-002` define `HouseDrawingDocument` como contrato canônico da casa ativa.
  - `ConstructionSiteRepositoryPort` já existe como contrato assíncrono de persistência de Construções TETO.
  - `RacEditor` injeta storage de sessão por bootstrap, hoje a partir de IndexedDB.
  - O perfil informado para a aplicação é de 20 a 50 usuários no máximo, com picos de uso por cerca de uma semana a
    cada dois meses.
  - O escopo remoto inicial deve ser global: todos os usuários autenticados autorizados acessam os mesmos dados.
  - Dados locais legados devem ser descartados por completo no início do modo remoto.

- por que a decisão importa agora:
  - A escolha de backend e autenticação pode contaminar componentes do editor se não for registrada como decisão de
    fronteira.
  - A decisão precisa preservar uma rota realista de migração futura para Supabase.

- evidências consultadas:
  - `README.md`
  - `OBSIDIAN.md`
  - `docs/product-requirements/PRD-001-evolucao-multicasa.prd.md`
  - `docs/architecture-decisions/ADR-001-fronteira-editor-runtime-fabric.md`
  - `docs/architecture-decisions/ADR-002-formato-canonico-projeto-rac.md`
  - `docs/engineering-playbook/PLAY-004-project-structure.md`
  - `docs/engineering-playbook/PLAY-006-ports-and-adapters.md`
  - `docs/engineering-playbook/PLAY-103-frontend-data-fetching.md`
  - `src/domain/construction-site/construction-site-repository.port.ts`
  - `src/shared/types/construction-site.ts`
  - `src/shared/types/house-drawing-document.ts`
  - `src/components/rac-editor/ui/RacEditor.tsx`
  - `src/bootstrap/editor-house-ports.ts`
  - `graphify-out/GRAPH_REPORT.md`

## 2. Decisão

- decisão adotada:
  - Usar Convex + Clerk como stack proposta para o MVP de autenticação e persistência remota global, mantendo Supabase +
    Supabase Auth como rota futura de migração.

- arquitetura escolhida:
  - Backend remoto global como fonte de verdade, com adapters isolados e cache local descartável opcional.

- componentes ou áreas principais:
  - `src/infra/persistence` para adapter remoto Convex.
  - `src/bootstrap` para composição entre identidade, remoto, cache descartável e ports do editor.
  - `convex/` para schema e funções server-side do Convex, quando a implementação for iniciada.
  - componentes de autenticação isolados da feature do editor.

- responsabilidades:
  - Clerk fornece identidade e sessão.
  - Convex armazena documentos remotos versionados de Construções TETO no escopo global.
  - IndexedDB, se mantido no modo remoto, funciona apenas como cache descartável e fila pendente.
  - O editor continua consumindo ports e documentos serializáveis, sem conhecer o provedor remoto.
  - A camada de sync descarta dados locais legados, carrega o remoto, reconstrói cache quando necessário e expõe status
    operacional.

- fluxo principal:
  - Boot sem login -> estado `local` ou tela de autenticação, sem upload de IndexedDB legado.
  - Primeiro boot com login -> descartar IndexedDB legado -> carregar Convex global -> criar sessão local em memória ->
    reconstruir cache descartável, se habilitado.
  - Escrita -> mutation remota com versão esperada -> cache otimista opcional -> status de sync.

- modo da decisão: previo

- custo de reversão:
  - Baixo a médio se Convex e Clerk permanecerem atrás de adapters e se os payloads remotos forem versionados.
  - Alto se componentes do editor chamarem Convex diretamente, IDs internos do provedor virarem IDs de domínio ou
    regras de autorização ficarem espalhadas pela UI.

## 3. Alternativas consideradas

### Alternativa A: Convex + Clerk com base remota global

- descrição:
  - Usar Convex como backend documental/reativo e Clerk como provedor de autenticação. Persistir Construções TETO como
    documentos versionados em um escopo global compartilhado por todos os usuários autenticados autorizados.

- benefícios:
  - Menor atrito para o modelo atual, que já opera sobre documentos ricos como `ConstructionSiteState`.
  - Bom encaixe com TypeScript e funções server-side.
  - Custo inicial tende a zero para o perfil de 20 a 50 usuários.
  - Menor necessidade de normalização relacional imediata.
  - Permite cache local descartável sem transformar IndexedDB em fonte de verdade.

- custos ou riscos:
  - Menor portabilidade que um Postgres puro.
  - Relatórios SQL e BI ficam adiados.
  - Clerk pode ficar caro se o número de usuários crescer muito além do perfil informado.
  - Escopo global reduz complexidade, mas não oferece permissões granulares.

- por que foi escolhida:
  - É a melhor relação entre baixo atrito, custo inicial, base global compartilhada e preservação da arquitetura atual.

### Alternativa B: Supabase + Supabase Auth desde o início

- descrição:
  - Usar Supabase Auth e Postgres como backend remoto desde a primeira versão, iniciando com `jsonb` ou já normalizando
    tabelas.

- benefícios:
  - Auth integrado ao próprio backend.
  - Excelente base para SQL, relatórios, auditoria, RLS e portabilidade.
  - Tende a escalar melhor em custo por usuário ativo.

- custos ou riscos:
  - Maior decisão arquitetural inicial para um app pequeno e sazonal.
  - Risco de normalizar cedo demais antes de estabilizar sync e uso real.
  - Plano gratuito pode ser inconveniente para uso sazonal se houver pausa por inatividade.

- por que não foi escolhida:
  - O perfil informado não justifica antecipar uma plataforma relacional completa. Supabase permanece rota futura
    explícita, viabilizada por adapters e payloads versionados.

### Alternativa C: Backend próprio Node/Nest.js

- descrição:
  - Criar um backend customizado com Node/Nest.js, banco relacional, autenticação e API própria.

- benefícios:
  - Controle máximo sobre contratos, deploy, auth, autorização e evolução.
  - Melhor encaixe caso o produto se torne uma plataforma operacional maior.

- custos ou riscos:
  - Maior custo de implementação e manutenção.
  - Exige decisões de deploy, banco, observabilidade, migrations, filas e segurança.
  - Desproporcional para 20 a 50 usuários com picos sazonais.

- por que não foi escolhida:
  - A complexidade operacional não se justifica para o objetivo atual.

### Alternativa D: Remoto sem cache local

- descrição:
  - Remover completamente IndexedDB do modo remoto e depender somente do backend para leitura e escrita.

- benefícios:
  - Sem ambiguidades sobre fonte de verdade.
  - Menos código de reconciliação local.

- custos ou riscos:
  - Pior tolerância a rede instável.
  - Maior risco de perda de edição em refresh, queda de conexão ou latência durante uso em campo.
  - Experiência menos robusta para um editor visual.

- por que não foi escolhida:
  - Dados locais legados devem ser descartados, mas cache local técnico continua útil como infraestrutura descartável.

## 4. Consequências e trade-offs

### 4.1. Positivas

- O editor continua protegido por ports e documentos serializáveis.
- O MVP remoto pode nascer com baixo custo operacional.
- Todos os usuários autenticados trabalham sobre a mesma base global.
- Uma migração futura para Supabase continua viável por meio de payloads versionados e adapters.
- O risco de regressão no canvas é menor do que em uma reescrita orientada a backend.

### 4.2. Negativas

- O modelo relacional completo fica adiado.

- Consultas administrativas complexas dependerão de exportação, funções auxiliares ou migração
  futura.

- O projeto passa a depender de dois provedores externos no MVP remoto.

- Conflitos multi-dispositivo exigirão uma política explícita de UX em fase posterior.

- Escopo global não resolve permissões diferenciadas entre perfis.

### 4.3. Trade-offs aceitos

- Aceitar menor poder relacional inicial em troca de menor atrito de implementação.

- Aceitar escopo global para reduzir complexidade de autorização no MVP.

- Aceitar cache local descartável, mas não persistência local como fonte de verdade.

- Persistir documentos remotos inicialmente como payloads versionados, evitando normalização
  prematura.

- Manter Supabase como plano de migração, não como stack inicial.

### 4.4. Riscos e mitigação

- Risco: acoplamento direto de Convex ou Clerk ao editor.
  - Mitigação: criar adapters em `src/infra` e manter componentes do editor dependentes apenas de ports.

- Risco: migração futura para Supabase ficar cara.
  - Mitigação: usar `scopeId`, IDs de domínio próprios, payloads versionados e exportação administrativa.

- Risco: conflito de edição entre dispositivos.
  - Mitigação: usar `documentVersion` e impedir sobrescrita silenciosa no MVP.

- Risco: falha remota causar perda de edição.
  - Mitigação: usar cache descartável e fila pendente sem promovê-los a fonte de verdade.

- Risco: dados pessoais aparecerem em logs.
  - Mitigação: sanitizar logs e evitar imprimir payloads completos.

## 5. Escopo do MVP

- o que entra:
  - Autenticação com Clerk.
  - Escopo remoto global.
  - Documento remoto Convex por Construção TETO.
  - Descarte completo dos dados locais legados no modo remoto.
  - Adapter Convex atrás de contrato de persistência.
  - Cache local descartável opcional.
  - Status `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.
  - Exportação administrativa versionada.

- o que fica fora:
  - Colaboração em tempo real no canvas.
  - Normalização relacional.
  - Supabase adapter produtivo.
  - RLS/Postgres.
  - Permissões granulares por papel.
  - Merge visual de conflitos.
  - Upload automático do IndexedDB legado.

## 6. Evolução Planejada Para Concorrência

A decisão aceita que o MVP remoto terá concorrência otimista por documento, não colaboração plena. A
sequência recomendada para evoluir edição concorrente é:

1. `documentVersion` obrigatório no MVP, com rejeição de conflitos e sem merge silencioso.

2. Lock leve por Construção TETO, com presença operacional, `TTL` e heartbeat. A primeira versão
   deve atuar como aviso forte antes de virar bloqueio absoluto.

3. Versionamento por seção, separando metadados, famílias, monitores e desenho para reduzir
   conflitos falsos entre alterações independentes.

4. Merge por seção apenas quando as alterações forem semanticamente independentes. Divergências no
   mesmo desenho ou na mesma entidade continuam exigindo ação explícita.

5. Patch ou event log para persistir intenções, melhorar auditoria, retry, undo remoto e migração
   futura.

6. Colaboração em tempo real somente se o uso real indicar edição simultânea frequente no mesmo
   desenho ou na mesma Construção TETO.

Essa ordem preserva o MVP dentro de um custo técnico baixo e evita acoplar o editor diretamente a
Convex. Também mantém a migração futura para Supabase viável, porque a evolução acontece no contrato
de persistência e nos adapters, não no canvas.

## 7. Artefatos e contratos relacionados

- blueprint ou schema relacionado:
  - `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.assets/technical-spec.md`
  - `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.assets/backend-alternatives.md`

- prompts relacionados:
  - `.agents/prompts/solution-design.prompt.md`
  - `.agents/prompts/architecture-decision.prompt.md`

- contratos de integração:
  - `src/domain/construction-site/construction-site-repository.port.ts`
  - `src/components/rac-editor/lib/construction-site-session.ts`
  - `src/shared/types/construction-site.ts`
  - `src/shared/types/house-drawing-document.ts`

- layout de artefatos:
  - `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.md`
  - `docs/product-requirements/PRD-004-autenticacao-sincronizacao-remota.prd.assets/`

- superfícies humanas relacionadas:
  - `README.md`
  - `OBSIDIAN.md`
  - `docs/product-requirements/README.md`

- runbook humano canônico:
  - Ainda não aplicável.

## 8. Evoluções deliberadamente adiadas

- item adiado:
  - Supabase + Supabase Auth.

- motivo do adiamento:
  - Continua sendo alternativa forte para uma fase relacional/administrativa, mas adiciona complexidade inicial maior
    que o necessário para o perfil de uso atual.

- item adiado:
  - Colaboração realtime no editor.

- motivo do adiamento:
  - A demanda atual é base remota compartilhada e recuperação entre dispositivos, não coedição simultânea.

- item adiado:
  - Modelo relacional normalizado.

- motivo do adiamento:
  - O contrato documental atual ainda é suficiente para sincronização e preserva reversibilidade.

## 9. Condições de revisão

- o que invalidaria esta decisão:
  - A aplicação passar a exigir relatórios SQL, auditoria relacional, RLS ou integrações administrativas fortes.
  - O número de usuários crescer a ponto de custo por usuário do Clerk se tornar material.
  - A TETO exigir controle organizacional avançado, SSO, MFA obrigatório ou política de dados incompatível com a stack.
  - O uso real exigir colaboração simultânea no mesmo desenho.
  - Convex ou Clerk deixarem de atender requisitos de segurança, residência de dados ou continuidade operacional.

- quando revisitar:
  - Antes de iniciar implementação de permissões organizacionais avançadas.
  - Antes de normalizar dados para relatórios.
  - Após o primeiro ciclo real de uso remoto em campo.

- sinais de que outro ADR deve superseder este:
  - Aceitação formal de Supabase/Postgres como backend principal.
  - Criação de backend próprio.
  - Mudança de autenticação para outro provedor.

## 10. Referências cruzadas

- prompt de origem:
  - Conversa Codex de 2026-06-22 sobre Convex, Supabase, custos, escopo global e migração.

- code review de origem:
  - Nenhum.

- changelog relacionado:
  - `.agents/changelogs/2026-06/20260622.changelog.md`

- outros ADRs relacionados:
  - `docs/architecture-decisions/ADR-001-fronteira-editor-runtime-fabric.md`
  - `docs/architecture-decisions/ADR-002-formato-canonico-projeto-rac.md`
