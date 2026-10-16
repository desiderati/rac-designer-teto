# RAC Designer TETO — arquitetura atual

Levantamento do código local em 05/10/2026. O objetivo é explicar módulos, camadas, comunicação e persistência; a implantação remota e seus recursos não foram inspecionados.

[Quadro tldraw concluído](https://www.tldraw.com/f/MtSP6Pa4uMRSSnWvPCIBR). Três páginas editáveis, com revisão visual por screenshot. A vista macro usa agrupamento manual dos componentes para facilitar a leitura; as páginas de detalhe foram renderizadas dos Mermaid.

## Como ler

- O navegador executa o editor e suas regras de domínio. A API Node/Express atende autenticação, documentos e integrações.
- A persistência normal usa MySQL: uma linha por Construção TETO, com casas, famílias e monitores dentro de um documento JSON.
- Fotos e ilustrações são objetos no S3; o documento guarda referências de Storage.
- IndexedDB é a alternativa para execução local/isolada e E2E, não um espelho offline geral da base remota.
- As setas internas do frontend representam chamadas/dados TypeScript no mesmo processo do navegador. As conexões externas têm protocolo indicado.
- O agrupamento “API” inclui os handlers HTTP de autenticação; o callback OAuth fica fora do endpoint tRPC.
- No modo público, o código prevê HTTPS no gateway e HTTP até Express. Porta e TLS da conexão MySQL não foram confirmados.
- O PWA guarda arquivos da interface. Autenticação, sincronização e serviços remotos exigem conexão.
- A base de construções é global e compartilhada entre usuários autenticados no MVP; o campo role existe, mas não segmenta essa base.
- Os diagramas representam arquitetura implementada, não atestam configuração ou disponibilidade das integrações em produção.

## 01 · Visão macro — módulos e conexões

```mermaid
flowchart LR
  subgraph browser["NAVEGADOR · React + TypeScript"]
    UI["Editor RAC e Construções TETO<br/>Canvas 2D · visualização 3D · formulários"]
    CLIENT["Cliente tRPC + TanStack Query<br/>sincronização de documentos"]
    CACHE["PWA / Service Worker<br/>cache dos arquivos da interface"]
    LOCAL[("IndexedDB<br/>modo local / isolated / E2E")]
    UI --> CLIENT
    UI -. "alternativa local" .-> LOCAL
    CACHE -. "carrega interface" .-> UI
  end
  subgraph app["SERVIDOR · Node.js + Express"]
    WEB["Arquivos estáticos + API<br/>/api/trpc · HTTP interno<br/>HTTPS público via gateway TLS"]
    API["tRPC + Zod + SuperJSON<br/>auth · constructionSites<br/>storage + IA · system"]
    DATA["Persistência de documentos<br/>Drizzle ORM + mysql2<br/>controle otimista de versão"]
    PROXY["Proxy de imagens<br/>/manus-storage/*"]
    WEB --> API --> DATA
    WEB --> PROXY
  end
  DB[("MySQL<br/>users<br/>construction_site_documents<br/>JSON + documentVersion")]
  AUTH["Manus OAuth<br/>identidade e login"]
  FORGE["Manus Forge<br/>URLs assinadas de storage<br/>IA: imagens e descrição de fotos"]
  S3[("S3 / objetos<br/>fotos e ilustrações")]
  CLIENT <-->|"HTTP(S) · /api/trpc<br/>batch · JSON/SuperJSON · cookie HttpOnly"| WEB
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

```mermaid
flowchart TB
  subgraph presentation["1 · APRESENTAÇÃO"]
    SHELL["App + React Router<br/>UI Tailwind / shadcn / Radix<br/>tour guiado · avisos PWA"]
    SITE["Construções TETO<br/>comunidades · famílias · monitores<br/>casas · avaliação do terreno"]
    RAC["Editor RAC<br/>menus · modais · ferramentas"]
    C2["Canvas 2D<br/>Fabric.js<br/>plantas e elevações"]
    V3["Viewer 3D<br/>Three.js + React Three Fiber<br/>geometria e meshes"]
    SHELL --> SITE
    SHELL --> RAC
    RAC --> C2
    RAC --> V3
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
  V3 -. "snapshots / dados da casa" .-> CTRL
  PORT --> CTRL
  CTRL <--> STATE
  CTRL --> HOUSE
  CTRL <--> SYNC
  SYNC --> CONTRACT
  HOUSE --> CONTRACT
  CTRL --> OUT
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

```mermaid
flowchart LR
  STATE["Construção TETO em memória<br/>comunidades · famílias · monitores<br/>casas · terreno · desenho RAC"]
  ADAPTER["Adapter remoto<br/>externaliza imagens embutidas<br/>envia estado + versão esperada"]
  UPLOAD["storage.uploadImage<br/>JSON com Base64 → bytes"]
  OBJECTS[("Storage S3<br/>bytes de fotos e ilustrações")]
  SAVE["constructionSites.save<br/>validação Zod + segurança do documento"]
  SQL["Drizzle / mysql2<br/>gravação com controle de versão"]
  DOC[("construction_site_documents<br/>id · scopeKey · externalCode · status<br/>document: JSON · documentVersion<br/>createdAt · updatedAt")]
  CONTENT["Conteúdo de document<br/>constructionSite · communities<br/>families · monitors · houses<br/>drawingDocument: house + canvas<br/>fotos: referências de storage"]
  USERS[("users<br/>openId · perfil · role<br/>datas de criação e login")]
  LOGIN["Callback OAuth<br/>cria / atualiza usuário"]
  CONFLICT["Conflito de versão<br/>UI permite tratar versões<br/>sem sobrescrita silenciosa"]
  STATE --> ADAPTER
  ADAPTER -->|"1 · se houver Data URL"| UPLOAD
  UPLOAD -->|"PUT assinado"| OBJECTS
  UPLOAD -->|"retorna /manus-storage/key"| ADAPTER
  ADAPTER -->|"2 · JSON/SuperJSON via tRPC"| SAVE
  SAVE --> SQL
  SQL -->|"versão válida"| DOC
  SQL -->|"versão divergente"| CONFLICT
  DOC -. "estrutura JSON interna" .-> CONTENT
  LOGIN --> USERS
  classDef flow fill:#e7f6ee,stroke:#15803d,color:#123424;
  classDef db fill:#f0eaff,stroke:#7c3aed,color:#382259;
  classDef note fill:#fff0dd,stroke:#c77911,color:#55370e;
  class STATE,ADAPTER,UPLOAD,SAVE,SQL,LOGIN flow;
  class OBJECTS,DOC,USERS db;
  class CONTENT,CONFLICT note;
```

## Fontes verificadas

| Elemento | Fonte no repositório |
|---|---|
| Visão geral e dependências | [README.md](../../README.md); [package.json](../../package.json) |
| Entrada HTTP, TLS no gateway, API e arquivos estáticos | [server/_core/index.ts](../../server/_core/index.ts) |
| Routers, validação, upload e recursos de IA | [server/routers.ts](../../server/routers.ts) |
| tRPC HTTP em lote e serialização | [client/src/lib/trpc-client.ts](../../client/src/lib/trpc-client.ts) |
| Autenticação OAuth e cookie HttpOnly | [server/_core/oauth.ts](../../server/_core/oauth.ts); [server/_core/cookies.ts](../../server/_core/cookies.ts) |
| MySQL, tabelas e controle de versão | [server/db.ts](../../server/db.ts); [drizzle/schema.ts](../../drizzle/schema.ts) |
| S3, URLs assinadas e proxy de leitura | [server/storage.ts](../../server/storage.ts); [server/_core/storageProxy.ts](../../server/_core/storageProxy.ts) |
| Forge: Connect/JSON para imagens e chat/completions para descrição | [server/_core/imageGeneration.ts](../../server/_core/imageGeneration.ts); [server/_core/llm.ts](../../server/_core/llm.ts) |
| Seleção de persistência remota ou IndexedDB | [client/src/bootstrap/useRemoteConstructionSiteSessionStorage.ts](../../client/src/bootstrap/useRemoteConstructionSiteSessionStorage.ts); [client/src/shared/local-runtime.ts](../../client/src/shared/local-runtime.ts) |
| Imagem embutida convertida em referência antes de salvar | [client/src/infra/persistence/remote-construction-site-repository.adapter.ts](../../client/src/infra/persistence/remote-construction-site-repository.adapter.ts) |
| Camadas do editor e composição | [client/src/bootstrap/editor-bootstrap.ts](../../client/src/bootstrap/editor-bootstrap.ts); [client/src/components/rac-editor/lib/editor-house-controller.ts](../../client/src/components/rac-editor/lib/editor-house-controller.ts) |
| Projeção para visualização 3D | [client/src/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts](../../client/src/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts) |
| Exportação PDF e ZIP no cliente | [client/src/components/rac-editor/lib/rac-pdf-zip-export.ts](../../client/src/components/rac-editor/lib/rac-pdf-zip-export.ts) |
| PWA e exclusões de API/Storage | [vite.config.ts](../../vite.config.ts) |

