# RAC Designer TETO - Project Guidelines

## 📋 Project Overview

**RAC Designer TETO** é um editor visual profissional para design de plantas de casas desenvolvido
para a ONG TETO. A aplicação permite que monitores, líderes de construção e voluntários criem
plantas baixas e elevações de casas com ferramentas avançadas de desenho 2D e visualização 3D
interativa.

## 🧭 Leitura Recomendada

Este README concentra o contexto humano e operacional do repositório. Para qualquer trabalho
técnico, siga esta ordem:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/business-rules/README.md` quando a mudança afetar comportamento do editor
4. `docs/engineering-playbook/README.md` e os guias `PLAY-*` relevantes
5. `docs/product-requirements/README.md` e o PRD específico quando houver iniciativa formal

> `package.json` continua sendo a fonte de verdade para scripts e dependências instaladas.

---

## 🎯 Project Goals & Priorities

### Primary Goals

1. **Accessibility & Usability** - Ferramentas devem ser intuitivas para usuários sem experiência
   técnica

2. **Precision & Accuracy** - Medições e desenhos devem ser precisos para uso profissional

3. **Performance** - Editor 2D e visualização 3D devem ser responsivos mesmo com plantas complexas

4. **Mobile-First Responsiveness** - Suportar tablets e dispositivos móveis para trabalho em campo

### What to Prioritize

- User experience e feedback visual claro
- Funcionalidades essenciais de desenho antes de features avançadas
- Documentação e tutorial interativo para novos usuários
- Compatibilidade com navegadores modernos (Chrome, Firefox, Safari, Edge)

### What to Avoid

- Adicionar muitas opções de configuração que confundem usuários
- Remover funcionalidades de desenho básicas
- Ignorar feedback de usuários sobre usabilidade

---

## 👥 User Personas

### Persona 1: Monitor Voluntário

- **Objetivo:** Criar plantas precisas de casas para projetos da TETO

- **Experiência:** Conhecimento técnico nos modelos de casa da TETO

- **Necessidades:** Ferramentas de desenho precisas, exportação para PDF, medições exatas

- **Frustração:** Interfaces complexas, demora na criação e alteração de RACs, falta de feedback
  visual

### Persona 2: Líder Voluntário

- **Objetivo:** Ver e validar plantas criadas por monitores
- **Experiência:** Conhecimento construtivo, experiência em métodos construtivos
- **Necessidades:** Visualização 3D clara, ferramentas de anotação, acesso a histórico de edições
- **Frustração:** Imprecisão da RAC; falta de entendimento do modelo criado pelos monitores

### Persona 3: Voluntário Iniciante

- **Objetivo:** Aprender a usar a ferramenta para entender como um processo construtivo funciona
- **Experiência:** Sem experiência em design
- **Necessidades:** Tutorial interativo, interface clara, mensagens de erro úteis
- **Frustração:** Falta de orientação, erros sem explicação

## 🧱 Stack Tecnológica Atual

- SPA em React + Vite + TypeScript
- Roteamento client-side com React Router DOM
- UI com TailwindCSS, shadcn/ui, Radix UI e Lucide React
- Editor 2D baseado em Fabric.js
- Visualização 3D com Three.js, `@react-three/fiber` e `@react-three/drei`
- Formulários com React Hook Form + Zod
- Data fetching remoto com TanStack Query, quando houver integração real
- Exportação em PDF com jsPDF
- Testes com Vitest, React Testing Library e Playwright

### Instalação e atualização da interface

- O build de produção gera um manifesto PWA e um service worker para permitir adicionar o RAC
  Designer à tela inicial e abrir os arquivos da interface sem conexão após a primeira visita
  online.

- Os ícones de instalação e da aba usam o [isotipo do
  TETO](https://colabore-fichas-production.s3.amazonaws.com/13/favicon/Isotipo_Azul_Claro.png), com
  versões dimensionadas para o manifesto e para a tela inicial do iPhone.

- Quando uma nova versão fica disponível, a aplicação mostra um aviso e só recarrega após a ação do
  usuário. A recarga é bloqueada enquanto houver edição local ou sincronização remota pendente.

- O cache inicial cobre os arquivos da interface. Após autenticação, o editor preserva as intenções
  pendentes no IndexedDB antes de enviá-las, recupera a recarga da mesma sessão da aba e tenta
  reenviar ao reconectar. Autenticação e confirmação remota exigem conexão; conflitos pedem decisão
  explícita. Falha de armazenamento local bloqueia o envio e mostra erro. Em outra sessão da aba, o
  editor pede confirmação para retomar uma fila pendente da mesma conta. Limpar dados do navegador
  remove essa proteção local.

- O procedimento de [backup e inventário administrativo](docs/OPS-002-backup-storage.md) descreve
  exportação versionada, reconstituição isolada e dry-run de órfãos, com limites da integração
  Manus.

## 🏗️ Arquitetura Atual

Consulte a [Arquitetura atual do RAC Designer
TETO](docs/architecture-diagrams/TECH-001-arquitetura-atual.md) para as três visões conectadas de
módulos, camadas e persistência, com fontes Mermaid versionadas e o recorte histórico das imagens
aprovadas. Os PNGs históricos não estão disponíveis no checkout atual; os diagramas continuam
legíveis nos blocos Mermaid da nota.

- `client/src/domain/house/` concentra agregado, casos de uso e contratos do domínio da casa

- `client/src/domain/construction-site/` concentra o contrato de repositório de Construções TETO

- `client/src/infra/` implementa persistência em memória, repositório local de Construções TETO,
  storage local e integrações técnicas

- `client/src/components/guided-tour/` concentra o runtime reutilizável do tour guiado

- `client/src/components/rac-editor/` é a feature principal e organiza o editor em slices internos
  como `@canvas/`, `@menus/`, `@modals/`, `@viewer-3d/`, `ui/`, `hooks/`, `lib/`, `ports/` e
  `store/`

- `client/src/components/rac-editor/@canvas/` concentra a borda visual 2D, incluindo hooks,
  `ports/`, adapters Fabric, factories e helpers de projeção/renderização do canvas

- `client/src/components/rac-editor/@menus/` concentra a superfície de menus do editor, incluindo
  `RacEditorMenus`, `CanvasToolsMenu`, menus superiores, tipos e configs locais

- `client/src/components/rac-editor/@modals/` concentra dialogs, selectors, editors flutuantes e
  hooks específicos de modais

- `client/src/components/rac-editor/@viewer-3d/` concentra a visualização 3D, parsers, geometria,
  meshes e hooks do viewer

- `client/src/components/rac-editor/ports/` concentra contratos internos do editor ligados à casa,
  vistas, pilotis, runtime e leitura/escrita lógica

- `client/src/components/rac-editor/store/` concentra stores reais e modelos serializáveis de
  interação da feature, hoje com `EditorStateStore` e `EditorSelection`

- `client/src/components/rac-editor/lib/editor-house-controller.ts` coordena hoje o estado
  compartilhado da casa, com bridge reativa em `client/src/components/rac-editor/lib/house-store.ts`

- `client/src/shared/config.ts` concentra constantes operacionais compartilhadas

- `client/src/shared/types/` concentra contratos serializáveis compartilhados, incluindo casa,
  Construção TETO e documento RAC

- O projeto usa alias `@/` para imports absolutos

### Contratos de interface

A identidade compartilhada incorporada da R48 está no [DESIGN.md](DESIGN.md). Modais e editores
reutilizam `ModalFrame` para separar cabeçalho, conteúdo rolável e ações; `ModalActions` mantém a
ordem visual e de teclado nos limites responsivos. Consulte [Modais e ações
compartilhadas](docs/ui-definitions/UI-007-modais-e-acoes-compartilhadas.md) antes de criar uma
variação local.

A [Análise de Campo](docs/ui-definitions/UI-008-analise-de-campo.md) mantém a planta expansível e o
editor inline responsivo pela largura do card. Os demais contratos estão no [índice de definições de
UI](docs/ui-definitions/README.md). Preservar as apresentações próprias de Landing, tour, toasts,
fotos e fullscreen 3D.

- O projeto não adota uma camada de store genérica na raiz; o estado compartilhado do editor
  permanece concentrado na própria feature

- O TypeScript roda hoje em modo não estrito, mas o código deve continuar explícito e defensivo

- O playbook em `docs/engineering-playbook/` continua sendo a fonte canônica para arquitetura,
  convenções e critérios de refatoração, com qualquer direção futura marcada explicitamente como
  transição

- A taxonomia atual do playbook separa núcleo comum em `PLAY-001` a `PLAY-006` e módulos frontend em
  `PLAY-101` a `PLAY-105`

---

### Criar ou retomar uma prévia isolada

Quando disponível no Codex local, `$design-system-playground` organiza a prévia executável com
componentes reais, comparação Atual/Proposta e controles independentes de largura e altura.
`$ui-ux-review` mantém o feedback e o aceite; aprovação da prévia não incorpora a mudança à
aplicação nem autoriza publicação.

Para criar, pedir uma prévia isolada do escopo desejado, preservando o produto. Para retomar,
informar a prévia existente e a revisão aprovada: conferir projeto, comando de execução, origem
servida e manifests/hashes antes de reutilizar o servidor. Preservar decisões, evidências e
exceções; comparar a mesma cena, dados e viewport. Uma referência congelada não deve importar
componentes vivos que já foram alterados.

Portas, revisões e estado dos servidores pertencem à continuidade local, não a um default do Design
System. Manter um servidor rodando quando solicitado; fechar uma aba não o encerra. Integrar ao
produto é uma etapa explicitamente autorizada, validada nos componentes nativos e nos contratos da
R48 acima, sem tomar o cenário forçado da prévia como roteamento real da aplicação.

## 🗂️ Estrutura do Repositório

```
.
├── .agents/
│   ├── bug-analysis/         # Registros versionados de análises de bug
│   ├── changelogs/           # Registro factual das execuções relevantes
│   ├── examples/             # Exemplos de calibragem para prompts locais
│   ├── prompts/              # Prompts operacionais especializados
│   ├── refactorings/         # Registros duráveis das frentes de refatoração
│   ├── templates/            # Templates operacionais da camada de agentes
│   └── work-items/           # Continuidade local efêmera
├── docs/
│   ├── business-rules/       # Regras funcionais do produto, numeradas em ordem canônica
│   ├── engineering-playbook/ # Constituição técnica e guias locais de engenharia
│   ├── code-scaffolds/       # Scaffolds aprovados quando houver uso operacional real
│   ├── refactoring-backlog/  # Backlogs técnicos transitórios de refatoração
│   └── product-requirements/ # PRDs canônicos e sidecars associados
├── e2e/                      # Testes E2E (Playwright)
├── public/                   # Assets estáticos
├── client/src/
│   ├── components/
│   │   ├── rac-editor/       # Núcleo do editor (canvas, menus, modals, viewer3d, house, piloti)
│   │   └── ui/               # Componentes base (shadcn/ui)
│   ├── domain/               # Domínio e casos de uso (ex.: house)
│   ├── infra/                # Infra/persistência/storage e settings
│   ├── pages/                # Páginas/rotas da aplicação
│   ├── shared/               # Configurações e tipos compartilhados
│   ├── test/                 # Setup de testes
│   ├── App.tsx               # Componente raiz
│   ├── index.css             # Estilos globais
│   └── main.tsx              # Bootstrap React/Vite
├── AGENTS.md                 # Instruções operacionais para agentes
├── package.json              # Scripts e dependências do projeto
└── README.md                 # Este documento
```

As convenções detalhadas de nomenclatura, componentes, hooks, estado, testes, segurança e
acessibilidade vivem no playbook em `docs/engineering-playbook/`. Este README mantém apenas o mapa
geral do projeto e os comandos reais de trabalho.

---

## 🔄 Development Workflow

### Before Starting Work

1. Ler `AGENTS.md`, este `README.md` e o `docs/README.md`
2. Entender a persona do usuário afetada e as regras de negócio aplicáveis
3. Consultar o `docs/engineering-playbook/` antes de qualquer mudança estrutural ou comportamental
4. Verificar se há componentes, hooks ou utilitários reutilizáveis antes de criar algo novo

### During Development

1. Seguir as convenções daqui e do playbook

2. Verificar impacto em regras de negócio e documentação durável quando houver mudança
   comportamental

3. Testar os fluxos afetados

4. Verificar responsividade em mobile/tablet quando a interface for tocada

### Comandos principais (estado atual)

1. Instalação de dependências com pnpm:

    ```bash
    pnpm install --frozen-lockfile
    ```

   Use pnpm para instalar e atualizar as dependências. O arquivo `pnpm-lock.yaml` é o lockfile
   canônico do projeto; `--frozen-lockfile` instala as versões registradas sem atualizá-lo.
   A configuração em `pnpm-workspace.yaml` define as permissões de build e os overrides, incluindo
   a remoção do Canvas 2 opcional do Fabric e do jsdom 20, preservando o Canvas 3 dos testes.

   Os arquivos `package-lock.json` e `bun.lock` permanecem no repositório, mas não são a referência
   para esta instalação. Os comandos `npm run` abaixo apenas executam os scripts do `package.json`
   e podem ser usados após a instalação com pnpm.

2. Desenvolvimento local na rede:

    ```bash
    npm run dev -- --host 0.0.0.0
    ```

   Para trabalhar apenas com dados de teste neste computador, use `npm run dev:local` (ou seu alias
   `npm run dev:isolated`) e abra
   `http://127.0.0.1:5200/`. Esse perfil serve somente o frontend em loopback, dispensa login Manus e
   guarda Construções TETO e fotos no IndexedDB `rac-designer-teto-isolated` deste navegador. Não há
   sincronização entre dispositivos; descrição de fotos e ilustrações por IA ficam indisponíveis.
   A visualização 3D e sua captura para PDF continuam locais. Limpar os dados do site no navegador
   remove os projetos desse perfil. O perfil `isolated` não pode ser usado para gerar um build.

   Durante o desenvolvimento, sem a chave pública do proxy Manus, a prévia de localização usa o
   [mapa incorporado do OpenStreetMap](https://wiki.openstreetmap.org/wiki/Export#Embeddable_HTML).
   Esse mapa precisa de internet e envia ao OpenStreetMap as coordenadas exibidas. Com a chave Manus
   configurada ou o SDK Google já disponível, a integração original é preservada. Builds publicados
   continuam usando o mapa Google Maps/Manus.

3. Desenvolvimento local sem integração Manus:

    ```bash
    npm run dev:local
    ```

4. Builds:

    ```bash
    npm run build
    npm run build:dev
    ```

5. Preview local do build:

    ```bash
    npm run preview
    ```

6. Qualidade e testes unitários:

    ```bash
    npm run check
    npm run check:e2e
    npm run lint
    npm run test
    npm run test:watch
    npm run test:coverage
    ```

7. Testes E2E (o Playwright inicia seu próprio servidor com `VITE_E2E=true` em `127.0.0.1:5200`):

    ```bash
    npm run test:e2e
    npm run test:e2e:ui
    ```

   Para usar outra porta, defina `E2E_PORT` ao executar a suíte. O Playwright e o servidor usam o
   mesmo valor; sem essa variável, a porta continua sendo `5200`.

    ```bash
    E2E_PORT=5307 pnpm test:e2e
    ```

   `E2E_PORT` aceita inteiros decimais de `1` a `65535`. Valores vazios ou inválidos interrompem a
   execução antes de iniciar o servidor. Escolha uma porta livre para preservar servidores de
   outras frentes; não há escolha automática de porta.

   Antes de iniciar os cenários, o runner verifica a identificação do aplicativo e exige o perfil
   `development` com `VITE_E2E=true`. Um servidor E2E compatível já aberto pode ser reutilizado
   localmente. Se a porta estiver ocupada por `dev:local`, `dev:isolated` ou outro servidor, a suíte
   para com uma mensagem de perfil incompatível. Defina outra porta com `E2E_PORT` ou encerre
   manualmente esse servidor e execute os testes novamente. O runner não encerra processos nem
   troca a porta automaticamente. O endpoint de identificação é servido apenas durante o
   desenvolvimento e fica indisponível em produção.

8. Regressão completa:

    ```bash
    npm run test:regression
    ```

### Before Committing

1. Executar `npm run lint` e corrigir erros
2. Testar funcionalidade completa
3. Verificar se não quebrou features existentes
4. Seguir `CONTRIBUTING.md` para formato de commit, PR e CI

## 🧪 Testes e Validação

O [playbook de testes frontend](docs/engineering-playbook/PLAY-104-frontend-testing.md) distingue
checagem estática de tipos e execução dos cenários E2E.

- Smoke tests coexistem com unit/integration tests em arquivos `*.smoke.test.ts` e
  `*.smoke.test.tsx`

- A suíte E2E vive em `e2e/` e gera relatórios em `playwright-report/`

- `npm run test:regression` executa, nesta ordem: `check`, `check:e2e`, `test`, `test:server`,
  `build` e `test:e2e`. As checagens TypeScript da aplicação e dos E2E são executadas antes dos
  testes; qualquer falha interrompe a sequência. Use-o para validar mudanças de maior alcance.

## ⚙️ Configurações Importantes

| Arquivo                       | Propósito                                            |
|-------------------------------|------------------------------------------------------|
| `client/src/shared/config.ts` | Constantes operacionais compartilhadas do editor     |
| `vite.config.ts`              | Build, dev server e otimizações do Vite              |
| `tailwind.config.ts`          | Tema e configuração do Tailwind                      |
| `components.json`             | Configuração e aliases do shadcn/ui                  |
| `playwright.config.ts`        | Configuração da suíte E2E                            |
| `.editorconfig`               | Convenções editoriais e de formatação do repositório |

---

## 📚 Regras de Negócio

- O índice canônico está em `docs/business-rules/README.md`

- Hoje o repositório documenta regras específicas para canvas, toolbar, vistas por tipo de casa,
  piloti, contraventamento e viewer 3D

- Mudanças comportamentais no editor devem ser confrontadas com esses documentos antes da
  implementação

---

## 📚 Documentação Canônica e Recursos

- **Guardrails operacionais:** `AGENTS.md`

- **Índice documental do projeto:** `docs/README.md`

- **Regras de negócio:** `docs/business-rules/README.md`

- **PRDs e sidecars:** `docs/product-requirements/README.md`

- **Engineering Playbook:** `docs/engineering-playbook/README.md` (núcleo comum `PLAY-001` a
  `PLAY-006` e frente frontend `PLAY-101` a `PLAY-105`)

- **Code Scaffolds aprovados:** `docs/code-scaffolds/README.md`

- **Prompts duráveis de refatoração:** `.agents/prompts/refactoring-*.prompt.md`

- **Execuções e regressões de refatoração:** `.agents/refactorings/`

- **Heurísticas repo-locais:** `.agents/refactorings/heuristics/`

- **Contribuição, Git e CI:** `CONTRIBUTING.md`

---

## 📚 External References

- **Fabric.js Docs:** http://fabricjs.com/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **TETO ONG:** https://www.teto.org.br/
