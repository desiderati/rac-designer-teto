---
title: Autenticação e Sincronização Remota Global
id: PRD-004
doc_type: prd
doc_role: product-requirements
doc_set: product-requirements
status: in_progress
version: "0.4.0"
owners: []
lang: pt-BR
created: 2026-06-22
updated: 2026-09-17
---

# Autenticação e Sincronização Remota Global

## 1. Visão geral

O RAC Designer TETO persiste Construções TETO localmente em IndexedDB. Esta fase adiciona autenticação Manus, persistência remota global, backup, recuperação entre dispositivos e armazenamento de imagens no Storage nativo do Manus.

A aplicação usará o mesmo padrão nativo de autenticação e banco utilizado em Grocerytics: Manus OAuth, backend fullstack do Manus, tRPC, Drizzle e banco MySQL/TiDB nativo. O banco remoto será a fonte de verdade para todos os usuários autenticados.

No MVP, qualquer conta Manus autenticada terá acesso à base global. O campo `role` será mantido para evolução futura, mas não haverá restrição adicional por papel, allowlist ou organização nesta fase.

Dados locais legados não serão migrados nem enviados automaticamente. Ao entrar no modo remoto, a aplicação deverá descartar esses dados após aviso e confirmação explícitos, quando houver dados a limpar.

### Estado atual da iniciativa

A estrutura `client/src/` e o runtime fullstack Manus estão implementados. A aplicação já contém Manus OAuth, `auth.me`, procedures protegidos, tRPC, Drizzle, a migration inicial, banco remoto global, `RemoteConstructionSiteRepositoryAdapter`, Storage nativo e upload validado de imagens até 5 MiB. O documento de cada Construção TETO é salvo como JSON versionado e as imagens são referenciadas por URLs `/manus-storage/{key}`; payloads com base64 são recusados no servidor.

O estado visual detalhado de sincronização, a confirmação de limpeza do IndexedDB legado, a fila offline persistente, a experiência específica de resolução de conflito, o backup administrativo e a limpeza de objetos órfãos ainda não foram entregues. Portanto, este PRD permanece **em progresso**: a fundação remota foi concluída, mas os requisitos de resiliência e operação de campo ainda exigem uma etapa própria.

## 2. Metas

- Permitir que qualquer usuário autenticado pelo Manus acesse a base global.
- Usar o banco nativo Manus como fonte de verdade compartilhada.
- Usar Storage nativo para fotos e arquivos de até aproximadamente 5 MB, mantendo no banco apenas referências e metadados.
- Preservar `ConstructionSiteState` e `HouseDrawingDocument` como contratos versionados.
- Usar IndexedDB somente como cache técnico descartável e fila de escrita pendente.
- Manter o editor independente da implementação de autenticação e persistência por meio de ports e adapters.
- Permitir que uma futura implementação Supabase substitua apenas esses adapters e sua composição.
- Expor os estados `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.
- Preservar as regras existentes de casas, construções, famílias, monitores e desenhos.

## 3. Histórias de usuário

### US-001: Entrar com Manus OAuth

Como usuário do RAC Designer TETO, quero autenticar-me com minha conta Manus para acessar a base remota global.

Critérios de aceitação:

- O usuário consegue iniciar o login pelo portal Manus.
- O callback `/api/oauth/callback` cria a sessão nativa.
- `auth.me` retorna o usuário atual quando a sessão é válida.
- Qualquer usuário autenticado acessa o escopo global no MVP.
- Usuários não autenticados não acessam procedimentos protegidos.
- O editor não manipula cookies, tokens ou URLs de sessão diretamente.
- O fluxo é verificado em navegador com uma sessão limpa.

### US-002: Carregar a base global

Como usuário autenticado, quero carregar as Construções TETO remotas para trabalhar sobre a mesma base em qualquer dispositivo.

Critérios de aceitação:

- O aplicativo avisa antes de descartar dados locais legados.
- Após a confirmação, os dados locais legados são removidos sem upload automático.
- A aplicação carrega a base global pelo backend protegido.
- O editor restaura a casa ativa segundo as regras existentes.
- `HouseDrawingDocument` passa pela validação estrutural vigente.
- O carregamento possui estados visuais de progresso e erro.

### US-003: Salvar alterações

Como usuário autenticado, quero salvar alterações no backend compartilhado para que elas estejam disponíveis em outros dispositivos.

Critérios de aceitação:

- Alterações de construções, casas, famílias, monitores, avaliações e desenhos são persistidas.
- Cada registro mantém `scopeId`, `constructionSiteId`, `schemaVersion`, `documentVersion`, `updatedAt` e payload versionado.
- O payload não usa JSON Fabric bruto como contrato durável.
- O backend verifica `expectedDocumentVersion` antes de aceitar uma escrita.
- Conflito de versão não sobrescreve silenciosamente o remoto.
- O usuário responsável pode ser registrado por `openId` para auditoria futura.

### US-004: Persistir e recuperar imagens

Como usuário autenticado, quero anexar fotos sem inflar o documento JSON da construção.

Critérios de aceitação:

- Fotos de até aproximadamente 5 MB são enviadas ao Storage nativo.
- O banco armazena apenas a referência do objeto, tipo, tamanho, checksum opcional e metadados necessários.
- A exclusão ou substituição de uma foto não remove o registro do banco antes de a nova referência estar confirmada.
- Objetos órfãos podem ser identificados e limpos por procedimento administrativo.
- O payload remoto não contém base64 de imagens como regra permanente.

### US-005: Operar com cache descartável

Como usuário em campo, quero tolerar instabilidade curta de rede sem transformar o cache local em fonte definitiva.

Critérios de aceitação:

- O cache pode ser limpo e reconstruído a partir do backend.
- Falha de rede marca a escrita como `pendente` ou `erro`.
- A aplicação tenta reenviar alterações pendentes quando a conectividade retorna.
- Conflitos não são mesclados nem sobrescritos automaticamente.
- O usuário pode recarregar o estado remoto ou exportar a intenção local para resolução explícita.

### US-006: Exportar backup administrativo

Como mantenedor, quero exportar documentos e referências de arquivos em formato versionado para suporte, auditoria e migração.

Critérios de aceitação:

- Existe um procedimento documentado para exportar o escopo global.
- A exportação não depende de IDs internos do banco ou de tokens de sessão.
- As referências do Storage são exportadas com metadados suficientes para reconstituição.
- A exportação pode ser transformada para outro backend sem alterar o domínio.

## 4. Requisitos funcionais

- `FR-1:` Manus OAuth é obrigatório para acessar o backend global.
- `FR-2:` Qualquer conta Manus autenticada acessa o escopo global no MVP.
- `FR-3:` O campo `role` não restringe acesso nesta fase, mas deve permanecer disponível para autorização futura.
- `FR-4:` Dados locais legados são descartados no primeiro ingresso remoto após confirmação explícita.
- `FR-5:` IndexedDB pode existir somente como cache descartável e fila de escrita.
- `FR-6:` O adapter remoto preserva listagem, carga, salvamento, remoção lógica e versionamento.
- `FR-7:` Cada documento remoto contém `scopeId`, `constructionSiteId`, `schemaVersion`, `documentVersion`, `updatedAt`, `deletedAt` opcional e `payload`.
- `FR-8:` O payload remoto é compatível com `ConstructionSiteState`.
- `FR-9:` Cada casa mantém seu `PersistedDrawingDocument` versionado.
- `FR-10:` Escritas exigem `expectedDocumentVersion` e são rejeitadas quando a versão diverge.
- `FR-11:` Imagens são armazenadas no Storage nativo; o banco guarda referências e metadados.
- `FR-12:` O estado visual distingue `local`, `sincronizando`, `sincronizado`, `pendente` e `erro`.
- `FR-13:` A implementação não altera regras existentes de status, restauração da casa ativa ou bloqueios do domínio.
- `FR-14:` A arquitetura permite substituir autenticação ou persistência trocando a implementação dos ports e sua composição, sem alterar domínio, canvas, documentos canônicos ou componentes centrais.
- `FR-15:` O frontend reside em `client/src/`; mudanças futuras de organização física não alteram os contratos arquiteturais.

## 5. Não objetivos

- Restrição de acesso por papel no MVP.
- Allowlist de usuários, memberships organizacionais, SSO ou MFA obrigatório.
- Colaboração em tempo real no canvas.
- Merge automático de desenhos divergentes.
- Normalização completa de todas as entidades.
- Migração automática do IndexedDB legado.
- Persistência de imagens base64 no payload como solução durável.
- Tratar IndexedDB como fonte de verdade.

## 6. Considerações de design

A experiência deve ser simples: autenticar, carregar a base global, editar e acompanhar o estado de sincronização. O acesso aberto no MVP não deve impedir a introdução posterior de autorização server-side.

O aviso de descarte local deve ser explícito. A interface deve diferenciar cache local, escrita pendente e sincronização confirmada. Erros de autenticação e conflitos de versão devem orientar o usuário para uma ação concreta, sem esconder a perda ou substituição de estado.

## 7. Restrições técnicas

O domínio e o canvas não importam SDKs de backend. A autenticação fica na borda da aplicação, e as regras de acesso ficam em procedures server-side.

O frontend seguirá a estrutura `client/` do template fullstack do Manus. A separação entre `client/src/domain`, `client/src/shared`, `client/src/infra` e `client/src/bootstrap` preserva a arquitetura atual, mesmo que os caminhos físicos mudem.

O backend usará tRPC, Drizzle e o banco MySQL/TiDB nativo. O Storage nativo será usado para fotos e arquivos. Segredos e tokens não entram no bundle nem nos documentos de domínio.

## 8. Métricas de sucesso

- Qualquer usuário Manus autenticado consegue abrir a base global em outro dispositivo.
- Dados locais legados são descartados sem upload acidental.
- Uma foto de até aproximadamente 5 MB é armazenada fora do payload JSON e recuperada por referência.
- O app exibe corretamente os estados de sincronização.
- Falhas remotas não causam sobrescrita silenciosa.
- Conflitos de versão são detectados e apresentados de forma explícita.
- Os testes atuais de persistência e editor continuam passando.
- Uma futura troca de backend pode substituir adapters sem alterar domínio, canvas ou documentos canônicos.

## 9. Evolução planejada

A primeira evolução de autorização poderá restringir o acesso por `users.role`, allowlist de `openId` ou memberships. A regra deverá ser implementada no backend e testada independentemente da UI.

A concorrência evoluirá de versão por documento para avisos de presença, locks leves, versões por seção e merge semântico limitado. Colaboração em tempo real só será considerada se o uso real justificar.

A persistência poderá normalizar entidades administrativas quando relatórios, auditoria ou consultas relacionais se tornarem requisitos. O envelope versionado e os ports devem permanecer estáveis.

## 10. Questões em aberto

- Texto final do aviso de descarte do IndexedDB legado.
- Política para escrita quando a rede estiver indisponível.
- Mensagem e ação para conflito de versão.
- Política futura para limpeza de objetos órfãos no Storage.
- Momento de ativar restrições por papel ou allowlist.
