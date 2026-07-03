---
title: Autenticação e Sincronização Remota Global
id: PRD-004
doc_type: prd
doc_role: product-requirements
doc_set: product-requirements
status: proposed
version: "0.2.0"
owners: []
lang: pt-BR
created: 2026-06-22
updated: 2026-06-22
---

# Autenticação e Sincronização Remota Global

## 1. Visão Geral

- problema: O RAC Designer TETO persiste Construções TETO localmente em IndexedDB. Isso atende ao
  marco local, mas não oferece acesso autenticado compartilhado, backup remoto nem recuperação
  simples quando o usuário troca de máquina.

- objetivo da iniciativa: Adicionar autenticação e persistência remota global, preservando o
  comportamento atual do editor e tratando o backend remoto como fonte de verdade para todos os
  usuários autenticados.

- perfil de uso considerado: A aplicação é destinada a poucas pessoas, estimadas entre 20 e 50
  usuários no limite máximo, com picos concentrados em aproximadamente uma semana a cada dois meses.

- decisão técnica associada:
  A ADR-003 seleciona Convex + Clerk para o MVP remoto, dentro do plano gratuito enquanto o uso permitir, com Supabase
  + Supabase Auth preservado como alternativa futura de migração.

- decisão sobre dados locais: Dados locais legados não serão migrados nem enviados ao remoto. No
  rollout remoto, a aplicação deve descartar os dados locais anteriores e carregar o estado a partir
  do backend global.

## 2. Metas

- Permitir que usuários autenticados acessem o mesmo conjunto global de Construções TETO.

- Usar o backend remoto como fonte de verdade compartilhada.

- Descartar dados locais legados no início do modo remoto, sem tentativa de merge ou upload
  automático.

- Preservar `ConstructionSiteState` e `HouseDrawingDocument` como contratos versionados de
  persistência.

- Usar IndexedDB, se necessário, apenas como cache técnico descartável e fila local de escrita, não
  como fonte de verdade.

- Evitar que componentes do editor, canvas ou domínio dependam diretamente de Convex, Clerk ou
  Supabase.

- Expor a UI mínima de sincronização com os estados `local`, `sincronizando`, `sincronizado`,
  `pendente` e `erro`.

- Garantir que a arquitetura permita migração futura para Supabase por meio de adapters, payloads
  versionados e fronteiras explícitas.

## 3. Histórias De Usuário

### US-001: Entrar na aplicação com identidade remota

**Description:** Como monitor ou líder autorizado, quero entrar na aplicação com uma identidade
remota para acessar o ambiente compartilhado do RAC Designer TETO.

**Acceptance Criteria:**

- [ ] O usuário consegue iniciar sessão com o provedor configurado.

- [ ] Qualquer usuário autenticado autorizado acessa o mesmo escopo global de dados.

- [ ] A identidade do provedor não aparece como tipo de domínio em `src/domain`, `src/shared/types` ou nos contratos do
      editor.

- [ ] Usuários não autenticados não acessam a base remota global.

- [ ] O fluxo de autenticação é verificado em navegador com Codex Browser ou Playwright.

### US-002: Carregar a base remota global

**Description:** Como usuário autenticado, quero carregar as Construções TETO do backend global para
trabalhar sobre a mesma base compartilhada por todos.

**Acceptance Criteria:**

- [ ] Ao iniciar sessão, a aplicação descarta dados locais legados antes de hidratar a base remota
  global.

- [ ] A aplicação carrega todas as Construções TETO do escopo global autorizado.

- [ ] O RAC Editor restaura a casa ativa conforme a regra atual de `updatedAt` e status.

- [ ] O `HouseDrawingDocument` restaurado passa pela validação estrutural vigente.

- [ ] O carregamento remoto possui estado visual de carregamento e erro.

### US-003: Salvar alterações no backend global

**Description:** Como monitor voluntário, quero salvar alterações no backend compartilhado para que
outros usuários vejam o mesmo estado.

**Acceptance Criteria:**

- [ ] Alterações em Construções TETO, casas, famílias, monitores, avaliações e documentos de desenho são persistidas no
      remoto.

- [ ] Cada documento remoto preserva `constructionSite.id`, `schemaVersion`, `documentVersion`, `updatedAt` e payload
      versionado.

- [ ] O sync não persiste JSON Fabric bruto como contrato durável.

- [ ] Falhas remotas não sobrescrevem silenciosamente a versão remota.

- [ ] Testes automatizados cobrem sucesso, falha remota e conflito de versão.

### US-004: Operar com cache local descartável

**Description:** Como usuário em campo, quero que a aplicação tolere instabilidade curta de rede sem
transformar dados locais em fonte definitiva.

**Acceptance Criteria:**

- [ ] O cache local pode ser limpo e reconstruído a partir do remoto.

- [ ] Quando o remoto está indisponível após uma edição, a aplicação marca a sincronização como
  `pendente` ou `erro`.

- [ ] Ao recuperar conectividade, a aplicação tenta reenviar alterações pendentes.

- [ ] Se houver conflito de versão, a aplicação não faz merge automático nem sobrescreve a base
  remota silenciosamente.

- [ ] Testes cobrem cache descartável, fila pendente e reprocessamento.

### US-005: Exportar backup administrativo

**Description:** Como mantenedor da aplicação, quero exportar os documentos remotos em formato
versionado para ter um caminho de auditoria, suporte e eventual migração.

**Acceptance Criteria:**

- [ ] Existe um fluxo administrativo ou script documentado para exportar todos os documentos do
  escopo global.

- [ ] A exportação usa payloads versionados e não depende de IDs internos do provedor remoto.

- [ ] A exportação pode alimentar uma migração futura para Supabase usando `jsonb` inicial.

- [ ] O procedimento não inclui segredos, tokens ou dados de sessão.

## 4. Requisitos Funcionais

- `FR-1:` A autenticação remota deve ser obrigatória para acessar o backend global.

- `FR-2:` O escopo remoto inicial deve ser global: todos os usuários autenticados autorizados veem e
  editam os mesmos dados.

- `FR-3:` Dados locais legados devem ser descartados por completo no início do modo remoto; não
  haverá migração nem upload automático do IndexedDB antigo.

- `FR-4:` IndexedDB pode existir no modo remoto apenas como cache descartável e fila de escrita
  pendente.

- `FR-5:` O adapter remoto deve preservar a semântica de listagem, carga, salvamento e remoção
  lógica de Construções TETO.

- `FR-6:` Cada documento remoto deve conter `scopeId`, `constructionSiteId`, `schemaVersion`,
  `documentVersion`, `updatedAt`, `deletedAt` opcional e `payload`.

- `FR-7:` O payload remoto deve ser compatível com `ConstructionSiteState`.

- `FR-8:` Cada casa persistida deve manter `PersistedHouseRecord.drawingDocument` com
  `HouseDrawingDocument` ou subdocumentos equivalentes versionados.

- `FR-9:` O sync deve tratar conflito de versão sem sobrescrever silenciosamente alterações remotas
  ou locais divergentes.

- `FR-10:` O estado visual de sincronização deve distinguir `local`, `sincronizando`,
  `sincronizado`, `pendente` e `erro`.

- `FR-11:` A implementação não deve alterar regras de status de casa, status de construção,
  restauração da casa ativa nem bloqueios já definidos nos documentos de regras de negócio.

- `FR-12:` A arquitetura deve permitir trocar Convex por Supabase sem alterar domínio, canvas ou
  componentes centrais do editor.

## 5. Não Objetivos

- Entregar colaboração em tempo real no editor.
- Permitir edição simultânea segura da mesma casa por vários usuários.
- Migrar para Supabase nesta fase.
- Normalizar todo o modelo em tabelas relacionais nesta fase.
- Criar relatórios SQL, BI ou camada administrativa relacional nesta fase.
- Manter dados locais legados após ativar o modo remoto.
- Tratar IndexedDB como fonte de verdade no modo remoto.
- Tratar JSON Fabric bruto como formato durável de persistência.
- Criar uma matriz completa de permissões, cargos e auditoria organizacional.

## 6. Considerações De Design

- A experiência remota deve ser simples: autenticar, carregar a base global e editar.

- O descarte de dados locais legados deve ser explícito e seguro, evitando surpresa operacional.

- Estados de carregamento e erro remoto devem ser discretos e operacionais, sem transformar a tela
  em onboarding.

- O indicador de salvamento deve distinguir cache local, escrita pendente e sincronização
  confirmada.

- Qualquer interface nova deve respeitar o padrão visual utilitário do editor.

## 7. Restrições e Considerações Relevantes

- `ADR-001` mantém Fabric e objetos concretos do canvas confinados ao slice `@canvas`.

- `ADR-002` define `HouseDrawingDocument` como contrato canônico da casa ativa.

- `PRD-001` consolidou a fase local com Construções TETO persistidas em IndexedDB.

- `ConstructionSiteRepositoryPort` já existe como contrato assíncrono de persistência.

- `ConstructionSiteSessionStoragePort` ainda é síncrono na borda da sessão atual; a integração
  remota deve respeitar esse fato ou propor uma transição explícita.

- `PLAY-103` orienta usar TanStack Query somente quando houver comunicação remota real, sem
  transformar estado local do editor em fetch por reflexo.

- O volume esperado de usuários é baixo; custo, simplicidade operacional e reversibilidade pesam
  mais que otimização prematura para escala.

## 8. Métricas De Sucesso

- Um usuário autenticado consegue abrir a base global em outro dispositivo.
- Dados locais legados são descartados no modo remoto sem upload acidental.
- O app exibe corretamente os estados `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.
- Falhas remotas não causam sobrescrita silenciosa de dados.
- Os testes existentes de persistência multicasa continuam passando.
- O MVP permanece dentro de planos gratuitos para o perfil de 20 a 50 usuários.
- A decisão continua reversível para Supabase por meio de payloads versionados e adapters isolados.

## 9. Evolução Planejada Pós-MVP

A primeira versão remota não deve tentar resolver colaboração simultânea complexa. A trilha de
evolução planejada é incremental:

1. `documentVersion` obrigatório no MVP.

   - Rejeitar conflito de versão.
   - Não fazer merge automático.
   - Não sobrescrever alteração remota silenciosamente.

2. Lock leve por Construção TETO.

   - Exibir presença operacional como "Felipe está editando esta construção".
   - Usar `TTL` e heartbeat para evitar lock preso.
   - Começar como aviso forte, não como bloqueio absoluto.

3. Versionamento por seção.

   - Separar versões de metadados, famílias, monitores e desenho.
   - Permitir aceitar alterações independentes quando seções diferentes forem modificadas.
   - Manter conflito quando duas sessões alterarem a mesma seção incompatível.

4. Merge por seção.

   - Aceitar alterações paralelas em seções distintas.
   - Exigir resolução explícita quando a mesma entidade ou o mesmo desenho tiver alterações
     incompatíveis.

5. Patch ou event log.

   - Persistir intenções como adicionar família, atualizar monitor ou mover casa, em vez de sempre
     salvar o payload inteiro.
   - Abrir caminho para histórico, auditoria, undo remoto e migração mais controlada.

6. Colaboração em tempo real somente se o uso real justificar.

   - Considerar presença, cursores, atualização ao vivo e eventualmente CRDT apenas se a edição
     simultânea da mesma Construção TETO virar requisito frequente.

Essa evolução é compatível com Convex no início e com Supabase depois, desde que o editor continue
dependendo de ports, IDs de domínio e payloads versionados.

## 10. Questões Em Aberto

- Qual texto exato deve avisar o usuário de que os dados locais legados serão descartados?

- O modo remoto deve bloquear completamente edição offline ou permitir fila pendente com cache local
  descartável?

- Qual mensagem e ação de UI devem ser exibidas quando o MVP rejeitar conflito de versão?

- Haverá necessidade de remover branding do provedor de autenticação?

- Haverá requisito de MFA no futuro?

- Qual será o procedimento oficial de suporte para restaurar backup remoto em caso de erro
  operacional?
