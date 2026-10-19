---
title: Autenticação e Sincronização Remota Global
id: PRD-004
doc_type: prd
doc_role: product-requirements
doc_set: product-requirements
status: in_progress
version: "0.5.0"
owners: []
lang: pt-BR
created: 2026-06-22
updated: 2026-10-19
---

# Autenticação e Sincronização Remota Global

## 1. Visão geral

O RAC Designer TETO persiste Construções TETO na base global autenticada do Manus. IndexedDB mantém cache e intenções de escrita pendentes neste dispositivo. Esta fase cobre autenticação, recuperação entre dispositivos, resiliência de rede, backup administrativo e armazenamento de imagens no Storage nativo.

A aplicação usará o mesmo padrão nativo de autenticação e banco utilizado em Grocerytics: Manus OAuth, backend fullstack do Manus, tRPC, Drizzle e banco MySQL/TiDB nativo. O banco remoto será a fonte de verdade para todos os usuários autenticados.

No MVP, qualquer conta Manus autenticada terá acesso à base global. O campo `role` será mantido para evolução futura, mas não haverá restrição adicional por papel, allowlist ou organização nesta fase.

Todas as imagens armazenadas da aplicação exigem sessão válida para leitura, incluindo fotos de famílias,
terrenos e imagens 3D. Somente os arquivos explicitamente usados na Landing Page são públicos, por uma
lista fechada no servidor. Imagens privadas não podem usar cache público; os consumidores de interface,
Canvas e PDF devem suportar autenticação por cookie e pelo Bearer utilizado no preview em iframe.

Dados locais legados não serão migrados nem enviados automaticamente. Ao entrar no modo remoto, a aplicação deverá descartar esses dados após aviso e confirmação explícitos, quando houver dados a limpar.

### Estado atual da iniciativa

A estrutura `client/src/`, Manus OAuth, `auth.me`, procedures protegidos, tRPC, Drizzle, banco remoto global e `RemoteConstructionSiteRepositoryAdapter` estão implementados. Cada Construção TETO é salva como JSON versionado. O upload aceita PNG, JPEG e WEBP até 7,5 MiB; a rota canônica de leitura é `/api/private-storage/{key}`, com compatibilidade de `/manus-storage/{key}`. Payloads remotos com imagens base64 são recusados.

Os indicadores de sincronização, a confirmação de descarte legado e a resolução explícita de conflitos já existem. A implementação local agora inclui sondagem legada sem upgrade nem exclusão, fila persistente por usuário e sessão da aba, recuperação após recarga e reenvio ao reconectar. Uma falha de IndexedDB bloqueia o envio e fica visível; o cache não substitui autenticação válida.

O suporte administrativo inclui backup global versionado, verificação por SHA-256, reconstituição em diretório isolado e inventário de órfãos em dry-run. A limpeza exige política de retenção explícita, inventário completo e autorização ligada ao hash do plano. O adapter destrutivo entregue atua somente sobre arquivos locais. O Forge conhecido fornece GET/PUT, sem listagem ou exclusão; a limpeza remota depende dessas capacidades e de uma fonte confiável de uploads pendentes. Ver [OPS-002](../OPS-002-backup-storage.md).

Este PRD permanece **em progresso operacional**: código e testes locais não comprovam captura de dados reais, restauração em outro backend ou limpeza real. Não foram realizadas essas operações nesta entrega. A janela de retenção continua uma decisão do mantenedor, sem padrão inventado.

## 2. Metas

- Permitir que qualquer usuário autenticado pelo Manus acesse a base global.
- Usar o banco nativo Manus como fonte de verdade compartilhada.
- Usar Storage nativo para fotos e arquivos de até 7,5 MiB, mantendo no banco apenas referências e metadados.
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

- A sondagem não cria banco, não altera sua versão e não remove stores ou registros.
- O aplicativo avisa antes de descartar dados locais legados; “Manter e sair” preserva a base.
- Após a confirmação, os dados locais legados são removidos sem upload automático.
- A aplicação carrega a base global pelo backend protegido.
- O editor restaura a casa ativa segundo as regras existentes.
- `HouseDrawingDocument` passa pela validação estrutural vigente.
- O carregamento possui estados visuais de progresso e erro.

### US-003: Salvar alterações

Como usuário autenticado, quero salvar alterações no backend compartilhado para que elas estejam disponíveis em outros dispositivos.

Critérios de aceitação:

- Alterações de construções, casas, famílias, monitores, avaliações e desenhos são persistidas.
- A linha remota mantém `id`, `scopeKey`, `externalCode`, `status`, `document`, `documentVersion`, `createdAt` e `updatedAt`; `id` corresponde à Construção TETO e `scopeKey` ao escopo global. O payload mantém os contratos versionados de domínio.
- O payload não usa JSON Fabric bruto como contrato durável.
- O backend verifica `expectedDocumentVersion` antes de aceitar uma escrita.
- Conflito de versão não sobrescreve silenciosamente o remoto.
- O usuário responsável pode ser registrado por `openId` para auditoria futura.

### US-004: Persistir e recuperar imagens

Como usuário autenticado, quero anexar fotos sem inflar o documento JSON da construção.

Critérios de aceitação:

- Fotos de até 7,5 MiB são enviadas ao Storage nativo.
- O payload armazena a referência relativa do objeto. Tipo, tamanho e SHA-256 dos binários são registrados no manifesto administrativo; não se pressupõe uma tabela de assets inexistente.
- A exclusão ou substituição de uma foto não remove o registro do banco antes de a nova referência estar confirmada.
- Objetos órfãos podem ser identificados e limpos por procedimento administrativo.
- O payload remoto não contém base64 de imagens como regra permanente.

### US-005: Operar com cache descartável

Como usuário em campo, quero tolerar instabilidade curta de rede sem transformar o cache local em fonte definitiva.

Critérios de aceitação:

- O cache confirmado pode ser reconstruído a partir do backend. Intenções ainda não sincronizadas não devem ser descartadas como se fossem cache.
- Cada envio aguarda a gravação da intenção no IndexedDB. Recarga da mesma sessão da aba recupera documento local e base confirmada, preservando a versão esperada.
- Contas e sessões de abas têm filas separadas. Uma escrita concorrente na mesma fila é recusada, sem substituir o registro.
- Em uma nova sessão, filas pendentes da mesma conta são oferecidas para retomada explícita. A transferência é atômica, exige a revisão apresentada e invalida o escritor anterior. Continuar sem retomar preserva as outras filas; limpar os dados do navegador continua removendo as cópias locais.
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
- O ZIP inclui documentos canônicos e binários referenciados, hashes por arquivo e hash externo; arquivos ausentes ou corrompidos impedem validação.
- A reconstituição local cria diretório novo e protegido, sem sobrescrever banco ou Storage.
- A exportação pode ser transformada para outro backend sem alterar o domínio.

## 4. Requisitos funcionais

- `FR-1:` Manus OAuth é obrigatório para acessar o backend global.
- `FR-2:` Qualquer conta Manus autenticada acessa o escopo global no MVP.
- `FR-3:` O campo `role` não restringe acesso nesta fase, mas deve permanecer disponível para autorização futura.
- `FR-4:` Dados locais legados são descartados no primeiro ingresso remoto após confirmação explícita.
- `FR-5:` IndexedDB pode existir somente como cache descartável e fila de escrita.
- `FR-6:` O adapter remoto preserva listagem, carga, salvamento e versionamento. A remoção é física, condicionada ao estado arquivado e à versão esperada; não há tombstone nesta entrega.
- `FR-7:` A tabela remota contém `id`, `scopeKey`, `externalCode`, `status`, `document`, `documentVersion`, `createdAt` e `updatedAt`. A versão do desenho permanece no contrato de domínio; `deletedAt` e uma coluna SQL `schemaVersion` não são exigidos pelo modelo atual.
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
- Uma foto de até 7,5 MiB é armazenada fora do payload JSON e recuperada por referência.
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

- Janela de retenção e coordenação necessária antes de qualquer limpeza real.
- Provedor de inventário global, exclusão condicional e registro confiável de uploads pendentes no Storage.
- Execução autorizada de backup real e ensaio de importação em outro backend, além da reconstituição local já testada.
- Momento de ativar restrições por papel ou allowlist.

## 11. Documentos complementares

- [Especificação técnica](PRD-004-autenticacao-sincronizacao-remota.prd.assets/technical-spec.md)
- [Alternativas de backend](PRD-004-autenticacao-sincronizacao-remota.prd.assets/backend-alternatives.md)
