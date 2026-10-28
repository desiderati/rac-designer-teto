---
title: Arquitetura atual do RAC Designer TETO
id: TECH-001
doc_role: architecture
doc_type: technical-reference
status: active
lang: pt-BR
created: 2026-10-17
updated: 2026-10-27
tags: [arquitetura, modulos, persistencia]
---

# Arquitetura atual do RAC Designer TETO

## Contexto e recorte

Esta nota descreve os módulos, camadas, protocolos e persistência do RAC Designer TETO. Ela
complementa as convenções do [playbook de engenharia](../engineering-playbook/README.md) e a
disciplina de [Ports and Adapters no Editor
RAC](../engineering-playbook/PLAY-006-ports-and-adapters.md). A descrição se baseia nas fontes do
repositório; disponibilidade e configuração dos serviços dependem do ambiente de execução.

Os três arquivos Mermaid são as fontes canônicas dos diagramas. Os blocos desta nota devem
permanecer sincronizados com eles. Os PNGs são ilustrações auxiliares; os contratos de módulos,
rotas e persistência seguem as fontes Mermaid e o código.

### Artefatos do pacote

O [manifesto de preservação](TECH-001-arquitetura-atual.assets/manifesto.json) associa nomes e
hashes às fontes e imagens. A tabela relaciona os PNGs disponíveis aos identificadores do manifesto:

| Visão                     | PNG disponível                                                                               | Identificador no manifesto |
|---------------------------|----------------------------------------------------------------------------------------------|----------------------------|
| 01 · Macro                | [01-arquitetura-macro.png](TECH-001-arquitetura-atual.assets/01-arquitetura-macro.png)       | `macro.png`                |
| 02 · Camadas e módulos    | [02-camadas-e-modulos.png](TECH-001-arquitetura-atual.assets/02-camadas-e-modulos.png)       | `camadas.png`              |
| 03 · Dados e persistência | [03-dados-e-persistencia.png](TECH-001-arquitetura-atual.assets/03-dados-e-persistencia.png) | `dados.png`                |

Os contratos de fotos, ledger e backup estão no [TECH-002](../TECH-002-contrato-fotos-privadas.md) e
no [OPS-002](../OPS-002-backup-storage.md).

## Escolha da visão

Público: pessoas responsáveis pelo produto e pela manutenção técnica. Os `.mmd` são canônicos; os
blocos abaixo são cópias sincronizadas para leitura nesta nota.

| Visão                                                                                      | Pergunta principal                                                                 | Nível de detalhe e navegação                                                                                                                                                |
|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [01 · Macro](TECH-001-arquitetura-atual.assets/01-arquitetura-macro.mmd)                   | Onde o aplicativo executa e como conversa com API, identidade, IA e armazenamento? | Fronteiras de execução e serviços; navegador e servidor abrem seus módulos principais. Detalhes internos na 02 e escrita na 03.                                             |
| [02 · Camadas e módulos](TECH-001-arquitetura-atual.assets/02-camadas-e-modulos.mmd)       | Como a interface usa coordenação, domínio, ports e adapters?                       | Responsabilidades internas do navegador, não serviços implantados separadamente. O nó UI da 01 é detalhado aqui.                                                            |
| [03 · Dados e persistência](TECH-001-arquitetura-atual.assets/03-dados-e-persistencia.mmd) | Onde são gravados documento, imagens e usuários, e o que ocorre em conflito?       | Etapas de escrita, tabelas e estrutura JSON; detalha DATA/DB/S3 da 01 e REMOTE/SYNC da 02. Leituras, exclusões e armazenamentos auxiliares estão descritos após o diagrama. |

## Como ler

- O navegador executa o editor e suas regras de domínio. A API Node/Express atende autenticação,
  documentos e integrações.

- A persistência normal usa MySQL: uma linha por Construção TETO, com casas, famílias e monitores
  dentro de um documento JSON.

- Fotos e ilustrações são objetos no S3; o documento guarda referências de Storage.

- IndexedDB é a alternativa para execução local/isolada e E2E, não um espelho offline geral da base
  remota.

- As setas internas do frontend representam chamadas/dados TypeScript no mesmo processo do
  navegador. As conexões externas têm protocolo indicado.

- O agrupamento “API” inclui os handlers HTTP de autenticação; o callback OAuth fica fora do
  endpoint tRPC.

- No modo público, o código prevê HTTPS no gateway e HTTP até Express. Porta e TLS da conexão MySQL
  não foram confirmados.

- O PWA guarda arquivos da interface. Autenticação, sincronização e serviços remotos exigem conexão.

- A base de construções é global e compartilhada entre usuários autenticados no MVP; o campo role
  existe, mas não segmenta essa base.

- Os diagramas representam arquitetura implementada, não atestam configuração ou disponibilidade das
  integrações em produção.

### Significado das setas e agrupamentos

- Na **01**, setas contínuas indicam chamadas, trocas ou transmissão conforme o rótulo; duas pontas
  indicam requisição e resposta. A seta S3 → PROXY mostra os bytes da resposta ao GET feito pelo
  proxy. Pontilhados indicam a alternativa local e a disponibilização dos arquivos da interface.

- Na **02**, setas contínuas sem rótulo indicam uso/dependência do módulo de origem para o destino,
  não transmissão HTTP. As rotuladas indicam composição, acionamento ou troca por ports; duas pontas
  indicam colaboração. Pontilhados de CONTRACT para adapters significam “implementado por”, não
  dependência concreta do domínio. O viewer consulta um port; o bootstrap compõe o adapter que
  projeta o snapshot do canvas em dados serializáveis.

- Na **03**, setas contínuas seguem dados e chamadas durante a gravação. O conflito sai da
  persistência e chega à UI através do handler e cliente tRPC, resumidos na seta. O pontilhado DOC →
  CONTENT expande a estrutura interna do mesmo JSON; não representa outro banco.

- Os grupos da **01** são contextos de execução (navegador e processo servidor); os da **02** são
  camadas lógicas dentro do navegador. Não representam segmentação de rede nem prova de isolamento
  de segurança. A **03** mistura intencionalmente etapas, tabelas e uma nota de estrutura para
  explicar a persistência.

- Cilindros representam armazenamento; retângulos representam responsabilidades ou etapas,
  identificadas no texto. Cores apenas reforçam categorias. Chamadas dentro de navegador/servidor
  são TypeScript; rede e formatos estão nos rótulos.

- HTTP(S) acompanha a URL configurada; HTTPS no gateway é o contrato previsto no código, não uma
  verificação da implantação. O fallback Bearer do preview usa `sessionStorage`; a autenticação
  regular usa cookie HttpOnly. O proxy privado atende `/api/private-storage/*` e a rota compatível
  `/manus-storage/*`, ambas com autenticação; `/api/public-assets/:asset` aceita somente os nomes da
  lista pública de apresentação.

## 01 · Visão macro — módulos e conexões

A [fonte macro](TECH-001-arquitetura-atual.assets/01-arquitetura-macro.mmd) apresenta os contextos
de execução e as conexões do aplicativo com a API e os serviços de identidade, armazenamento e IA.

```mermaid
flowchart LR
  subgraph browser["NAVEGADOR · React + TypeScript"]
    UI["Editor RAC e Construções TETO<br/>Canvas 2D · visualização 3D · formulários"]
    CLIENT["Cliente tRPC + TanStack Query<br/>sincronização de documentos"]
    CACHE["PWA / Service Worker<br/>cache dos arquivos da interface"]
    LOCAL[("IndexedDB<br/>modo local / isolated / E2E")]
    UI -->|"operações e resultados"| CLIENT
    UI -. "alternativa local" .-> LOCAL
    CACHE -. "carrega interface" .-> UI
  end
  subgraph app["SERVIDOR · Node.js + Express"]
    WEB["Arquivos estáticos + API<br/>/api/trpc · HTTP interno<br/>HTTPS público via gateway TLS"]
    API["tRPC + Zod + SuperJSON<br/>auth · constructionSites<br/>storage + IA · system<br/>handlers OAuth HTTP"]
    DATA["Persistência de documentos<br/>Drizzle ORM + mysql2<br/>controle otimista de versão"]
    PROXY["Proxy de imagens<br/>/api/private-storage/* autenticado<br/>/manus-storage/* compatível<br/>/api/public-assets/:asset restrito"]
    WEB -->|"despacha handlers"| API
    API -->|"chama funções de persistência"| DATA
    WEB -->|"GET de imagens"| PROXY
  end
  DB[("MySQL<br/>users<br/>construction_site_documents<br/>JSON + documentVersion")]
  AUTH["Manus OAuth<br/>identidade e login"]
  FORGE["Manus Forge<br/>URLs assinadas de storage<br/>IA: imagens e descrição de fotos"]
  S3[("S3 / objetos<br/>fotos e ilustrações")]
  CLIENT <-->|"HTTP(S) · /api/trpc<br/>batch · JSON/SuperJSON<br/>cookie HttpOnly / Bearer no preview"| WEB
  DATA <-->|"SQL · protocolo MySQL / TCP"| DB
  UI <-->|"redirecionamentos OAuth"| AUTH
  API <-->|"HTTP(S) · troca de código<br/>consulta de perfil"| AUTH
  API <-->|"HTTP(S) · JSON<br/>imagens: Connect · descrição: chat/completions"| FORGE
  API -->|"PUT por URL assinada · bytes"| S3
  PROXY -->|"HTTP(S) · obter URL assinada"| FORGE
  S3 -->|"GET assinado · bytes via proxy"| PROXY
  PROXY -->|"imagem same-origin"| UI
  classDef client fill:#e6f4ff,stroke:#0284c7,color:#12344d;
  classDef server fill:#e7f6ee,stroke:#15803d,color:#123424;
  classDef external fill:#fff0dd,stroke:#c77911,color:#55370e;
  classDef store fill:#f0eaff,stroke:#7c3aed,color:#382259;
  class UI,CLIENT,CACHE client;
  class WEB,API,DATA,PROXY server;
  class AUTH,FORGE external;
  class DB,S3,LOCAL store;
```

## 02 · Camadas internas — navegador

A [fonte de camadas](TECH-001-arquitetura-atual.assets/02-camadas-e-modulos.mmd) organiza as
responsabilidades do navegador e as dependências entre apresentação, coordenação, domínio, ports e
adapters.

```mermaid
flowchart TB
  subgraph presentation["1 · APRESENTAÇÃO"]
    SHELL["App + React Router<br/>UI Tailwind / shadcn / Radix<br/>tour guiado · avisos PWA"]
    SITE["Construções TETO<br/>comunidades · famílias · monitores<br/>casas · terreno · Análise de Campo"]
    RAC["Editor RAC<br/>menus · modais · ferramentas"]
    C2["Canvas 2D<br/>Fabric.js<br/>plantas e elevações"]
    V3["Viewer 3D<br/>Three.js + React Three Fiber<br/>geometria e meshes"]
    SHELL -->|"compõe"| SITE
    SHELL -->|"compõe"| RAC
    RAC -->|"compõe"| C2
    RAC -->|"compõe"| V3
  end
  subgraph application["2 · COORDENAÇÃO E ESTADO"]
    PORT["Bootstrap + contextos + ports<br/>composição e injeção de adapters"]
    CTRL["EditorHouseController<br/>commands · queries · sessões<br/>bridge com Construção TETO"]
    STATE["EditorStore + house-store<br/>seleção · interação · notificações"]
    SYNC["Sessão de Construções<br/>estado de sync · conflitos<br/>expectedDocumentVersion"]
    OUT["Exportação local<br/>relatório RAC em PDF · lote ZIP<br/>jsPDF + JSZip"]
  end
  subgraph domain["3 · DOMÍNIO E CONTRATOS"]
    HOUSE["HouseAggregate + casos de uso<br/>casa · pilotis · vistas"]
    CONTRACT["ConstructionSiteRepositoryPort<br/>HousePersistencePort<br/>tipos serializáveis compartilhados"]
  end
  subgraph infra["4 · INFRAESTRUTURA DO CLIENTE"]
    MEMORY["Adapter de casa em memória<br/>estado da sessão de edição"]
    REMOTE["RemoteConstructionSiteRepositoryAdapter<br/>tRPC · envio de imagens ao Storage"]
    IDB["Adapter IndexedDB<br/>alternativa local / isolated / E2E"]
  end
  SITE --> PORT
  RAC --> PORT
  C2 <-->|"ports / projeções"| CTRL
  V3 -. "consulta House3DProjectionPort" .-> PORT
  PORT -. "compõe adapter de projeção do canvas" .-> C2
  PORT --> CTRL
  CTRL <--> STATE
  CTRL --> HOUSE
  CTRL <--> SYNC
  SYNC --> CONTRACT
  HOUSE --> CONTRACT
  RAC -->|"aciona exportação"| OUT
  CONTRACT -. "implementado por" .-> MEMORY
  CONTRACT -. "implementado por" .-> REMOTE
  CONTRACT -. "implementado por" .-> IDB
  classDef ui fill:#e6f4ff,stroke:#0284c7,color:#12344d;
  classDef coord fill:#e7f6ee,stroke:#15803d,color:#123424;
  classDef dom fill:#fff0dd,stroke:#c77911,color:#55370e;
  classDef inf fill:#f0eaff,stroke:#7c3aed,color:#382259;
  class SHELL,SITE,RAC,C2,V3 ui;
  class PORT,CTRL,STATE,SYNC,OUT coord;
  class HOUSE,CONTRACT dom;
  class MEMORY,REMOTE,IDB inf;
```

## 03 · Dados — o que vai para cada armazenamento

A [fonte de dados e persistência](TECH-001-arquitetura-atual.assets/03-dados-e-persistencia.mmd)
detalha o upload pela rota privada, as referências de imagens no documento e o controle de versão
por Construção TETO.

```mermaid
flowchart LR
  STATE["Construção TETO em memória<br/>comunidades · famílias · monitores<br/>casas · terreno · desenho RAC<br/>Análise de Campo preparada / inserida"]
  ADAPTER["Adapter remoto<br/>externaliza imagens embutidas<br/>envia estado + versão esperada"]
  UPLOAD["storage.uploadImage<br/>JSON com Base64 → bytes"]
  OBJECTS[("Storage S3<br/>bytes de fotos e ilustrações")]
  SAVE["constructionSites.save<br/>validação Zod + segurança do documento"]
  SQL["Drizzle / mysql2 · servidor<br/>documentos com controle de versão<br/>upsert de usuários"]
  DOC[("construction_site_documents<br/>id · scopeKey · externalCode · status<br/>document: JSON · documentVersion<br/>createdAt · updatedAt")]
  CONTENT["Conteúdo de document<br/>constructionSite · communities<br/>families · monitors · houses<br/>drawingDocument: house + canvas<br/>fieldAnalysis: status + contraventamentos<br/>fotos: referências de storage"]
  USERS[("users<br/>openId · perfil · role<br/>datas de criação e login")]
  LOGIN["Callback OAuth / SDK de sessão<br/>cria / atualiza usuário"]
  CONFLICT["Conflito de versão<br/>UI permite tratar versões<br/>sem sobrescrita silenciosa"]
  STATE -->|"snapshot no navegador"| ADAPTER
  ADAPTER -->|"1 · tRPC / Base64 se houver Data URL"| UPLOAD
  UPLOAD -->|"PUT assinado"| OBJECTS
  UPLOAD -->|"retorna /api/private-storage/key"| ADAPTER
  ADAPTER -->|"2 · JSON/SuperJSON via tRPC"| SAVE
  SAVE -->|"chamada interna TypeScript"| SQL
  SQL -->|"versão válida"| DOC
  SQL -->|"CONFLICT via tRPC até a UI"| CONFLICT
  DOC -. "estrutura JSON interna" .-> CONTENT
  LOGIN -->|"upsertUser"| SQL
  SQL -->|"SQL · perfil e último login"| USERS
  classDef flow fill:#e7f6ee,stroke:#15803d,color:#123424;
  classDef db fill:#f0eaff,stroke:#7c3aed,color:#382259;
  classDef note fill:#fff0dd,stroke:#c77911,color:#55370e;
  class STATE,ADAPTER,UPLOAD,SAVE,SQL,LOGIN flow;
  class OBJECTS,DOC,USERS db;
  class CONTENT,CONFLICT note;
```

## Leituras e armazenamentos complementares

| Cenário                     | Caminho e responsabilidade                                                                                                                                                                                                              |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Listar/carregar construções | Adapter remoto → `constructionSites.list/load` (tRPC protegido) → `server/db.ts` → MySQL. O retorno reconstitui estado e versão no navegador.                                                                                           |
| Remover construção          | `constructionSites.remove` recebe a versão esperada; o servidor verifica versão e permite remover somente o documento com status `archived`. Não representa exclusão de objetos S3.                                                     |
| Salvar imagens e documento  | O servidor envia bytes ao S3; o adapter substitui imagens embutidas por referências antes de salvar o documento MySQL. Upload e gravação do documento são operações distintas; o diagrama não promete transação única entre S3 e MySQL. |
| Alternativa local           | IndexedDB substitui o repositório remoto em `isolated` ou `VITE_E2E`; apenas `isolated` desliga todas as integrações. Não há espelhamento offline geral.                                                                                |
| Preferências e sessão       | `localStorage` guarda configurações do editor; `sessionStorage` participa do fallback de autenticação no preview. Esses estados auxiliares não são a base canônica de construções.                                                      |
| Interface e exportação      | O service worker guarda arquivos da interface, com exclusão das rotas API/Storage no fallback de navegação. PDF/ZIP são produzidos no cliente, sem novo banco remoto.                                                                   |

## Coerência entre as visões

- UI/CLIENT da macro correspondem à apresentação, sessão e adapter remoto na 02; ADAPTER na 03 é
  esse mesmo adapter, não um segundo serviço.

- API/DATA da 01 executam SAVE, UPLOAD, LOGIN e SQL da 03. Escritas MySQL passam pelo servidor;
  bytes S3 são enviados pelo servidor, não diretamente pelo navegador.

- DOC e USERS são as tabelas do mesmo MySQL da 01. CONTENT é conteúdo de DOC. O callback OAuth e a
  autenticação pelo SDK podem atualizar USERS; o callback não é seu escritor exclusivo.

- C2 e V3 executam no navegador. O viewer recebe uma projeção serializável do snapshot visual via
  port; nenhum elo da 02 pressupõe servidor 3D.

- A alternativa IndexedDB da 01/02 é outro modo de execução; a 03 descreve a escrita remota.
  `fieldAnalysis` acompanha a casa no JSON, incluindo preparação anterior à inserção no canvas.

## Escopo das visões

As visões cobrem os pontos de entrada HTTP e da interface, a composição de ports, sessões e
adapters, os contratos de documentos, banco, autenticação, storage, IA e configuração PWA. Cada nó
representa uma responsabilidade; as fontes específicas estão na tabela abaixo.

Os diagramas descrevem os contratos do aplicativo com Manus, Forge, S3 e MySQL. Topologia, portas,
TLS, disponibilidade das integrações e políticas operacionais de storage dependem da configuração do
ambiente. Esta nota não atesta o estado de uma implantação.

## Manutenção e validação

Atualize a parte afetada quando mudar uma fronteira, protocolo, contrato de persistência ou
responsabilidade de escrita. Confira a alteração no código e depois nas três visões, preservando
IDs, conexões e ajustes manuais que continuem corretos. Uma mudança apenas de rótulo não justifica
substituir o desenho por listas ou tabelas. Mantenha Mermaid como fonte canônica e PNG como imagem
derivada; não é necessário gerar SVG.

Para validar a consistência das visões, confira os fluxos navegador → API → MySQL, imagem →
referência → documento, OAuth → usuário e UI → ports → domínio/adapters. Verifique o escopo global
autenticado, o controle otimista de versão, o modo IndexedDB e o limite do cache PWA.

No bootstrap há um fallback de storage local quando a sessão não é injetada. A composição normal
injeta a sessão remota ou IndexedDB conforme o modo. Esse fallback não configura sincronização
offline geral.

## Fontes de referência

| Elemento                                                           | Fonte no repositório                                                                                                                                                                                                                                                                 |
|--------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Visão geral e dependências                                         | [README.md](../../README.md); [package.json](../../package.json)                                                                                                                                                                                                                     |
| Entrada HTTP, TLS no gateway, API e arquivos estáticos             | [server/_core/index.ts](../../server/_core/index.ts)                                                                                                                                                                                                                                 |
| Routers, validação, upload e recursos de IA                        | [server/routers.ts](../../server/routers.ts)                                                                                                                                                                                                                                         |
| tRPC HTTP em lote e serialização                                   | [client/src/lib/trpc-client.ts](../../client/src/lib/trpc-client.ts)                                                                                                                                                                                                                 |
| Autenticação OAuth e cookie HttpOnly                               | [server/_core/oauth.ts](../../server/_core/oauth.ts); [server/_core/cookies.ts](../../server/_core/cookies.ts)                                                                                                                                                                       |
| MySQL, tabelas e controle de versão                                | [server/db.ts](../../server/db.ts); [drizzle/schema.ts](../../drizzle/schema.ts)                                                                                                                                                                                                     |
| S3, URLs assinadas e proxy de leitura                              | [server/storage.ts](../../server/storage.ts); [server/_core/storageProxy.ts](../../server/_core/storageProxy.ts)                                                                                                                                                                     |
| Forge: Connect/JSON para imagens e chat/completions para descrição | [server/_core/imageGeneration.ts](../../server/_core/imageGeneration.ts); [server/_core/llm.ts](../../server/_core/llm.ts)                                                                                                                                                           |
| Seleção de persistência remota ou IndexedDB                        | [client/src/bootstrap/useRemoteConstructionSiteSessionStorage.ts](../../client/src/bootstrap/useRemoteConstructionSiteSessionStorage.ts); [client/src/shared/local-runtime.ts](../../client/src/shared/local-runtime.ts)                                                             |
| Imagem embutida convertida em referência antes de salvar           | [client/src/infra/persistence/remote-construction-site-repository.adapter.ts](../../client/src/infra/persistence/remote-construction-site-repository.adapter.ts)                                                                                                                     |
| Camadas do editor e composição                                     | [client/src/bootstrap/editor-bootstrap.ts](../../client/src/bootstrap/editor-bootstrap.ts); [client/src/components/rac-editor/lib/editor-house-controller.ts](../../client/src/components/rac-editor/lib/editor-house-controller.ts)                                                 |
| Projeção para visualização 3D                                      | [client/src/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts](../../client/src/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts)                                                                                                                       |
| Exportação PDF e ZIP no cliente                                    | [client/src/components/rac-editor/lib/rac-pdf-zip-export.ts](../../client/src/components/rac-editor/lib/rac-pdf-zip-export.ts)                                                                                                                                                       |
| PWA e exclusões de API/Storage                                     | [vite.config.ts](../../vite.config.ts)                                                                                                                                                                                                                                               |
| Fluxo atual de sessão / autenticação de requisições                | [session-headers.ts](../../client/src/_core/session-headers.ts); [sdk.ts](../../server/_core/sdk.ts)                                                                                                                                                                                 |
| Composição e projeção do canvas                                    | [editor-house-ports.ts](../../client/src/bootstrap/editor-house-ports.ts); [canvas-house-3d-projection-port.ts](../../client/src/components/rac-editor/@canvas/lib/canvas-house-3d-projection-port.ts)                                                                               |
| Análise de Campo e documento persistido                            | [HouseFieldAnalysisScreen.tsx](../../client/src/components/construction-site/ui/HouseFieldAnalysisScreen.tsx); [house-field-analysis.ts](../../client/src/shared/types/house-field-analysis.ts); [construction-site.ts](../../client/src/shared/types/construction-site.ts)          |
| Preferências locais                                                | [editor-settings-storage.ts](../../client/src/components/rac-editor/store/editor-settings-storage.ts)                                                                                                                                                                                |
