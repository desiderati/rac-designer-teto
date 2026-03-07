# CLAUDE.md — RAC Designer TETO

> Guia de referência rápida para assistentes de IA que trabalham neste repositório.
> Leia também: `AGENTS.md`, `.prompts/` (11 guias arquiteturais) e `.rules/` (8 regras funcionais de negócio).

---

## Visão Geral do Projeto

**RAC Designer TETO** é uma Single-Page Application (SPA) de editor gráfico que permite a voluntários, monitores e
líderes de construção da ONG TETO criar plantas baixas 2D com visualização 3D de casas modulares. 
RAC = Representação de Arranjo de Construção.

- **Versão:** v3.0.0
- **Linguagem principal:** TypeScript 5.8.3 (modo não-estrito)
- **Framework:** React 18.3.1 + Vite 7.1.11
- **Package manager:** npm (Node.js 22.x)

---

## Comandos Essenciais

```bash
# Dependências
npm install

# Desenvolvimento
npm run dev -- --host 0.0.0.0     # servidor na porta 8080 (todas interfaces)
npm run dev:local                  # localhost:5200 (usado pelos testes E2E)

# Build
npm run build                      # produção
npm run build:dev                  # modo development

# Qualidade de código — rodar sempre após mudanças significativas
npm run lint                       # ESLint
npm run test                       # Vitest (execução única)
npm run test:watch                 # Vitest em modo watch
npm run test:coverage              # Relatório de cobertura (V8)

# E2E (requer servidor em localhost:5200)
npm run test:e2e                   # Playwright
npm run test:e2e:ui                # Playwright com interface visual

# Regressão completa
npm run test:regression            # test → build → test:e2e
```

---

## Estrutura do Repositório

```
rac-designer-teto/
├── .agents/refactoring/           # Sistema dual-agent de refatoração automatizada
├── .changelogs/                   # Changelogs diários (changelog-AAAAMMDD.md)
├── .prompts/                      # 11 guias arquiteturais (leitura obrigatória no início da sessão)
├── .rules/                        # 8 documentos de regras funcionais de negócio
├── e2e/                           # Testes Playwright (6 specs)
├── public/                        # Assets estáticos
├── src/
│   ├── components/
│   │   ├── rac-editor/            # Feature principal: editor gráfico
│   │   │   ├── ui/                # Componentes visuais (canvas, modais, toolbar, viewer 3D)
│   │   │   ├── hooks/             # 40+ hooks de estado e lógica de feature
│   │   │   └── lib/               # 150+ utilitários puros (canvas, 3D, estratégias)
│   │   └── ui/                    # Componentes base shadcn/ui
│   ├── domain/
│   │   └── house/                 # DDD: aggregate, use-cases, port de persistência
│   ├── infra/
│   │   ├── persistence/           # Adaptadores de persistência (in-memory)
│   │   └── storage/               # Adaptadores de LocalStorage
│   ├── pages/                     # Rotas (Index, NotFound)
│   ├── shared/
│   │   ├── config.ts              # Constantes globais (canvas, house, storage keys)
│   │   └── types/                 # Tipos de domínio (house, piloti, contraventamento…)
│   └── test/                      # Setup de testes (mocks de browser APIs)
├── AGENTS.md                      # Instruções operacionais para agentes
├── CLAUDE.md                      # Este arquivo
└── README.md                      # Documentação completa do projeto
```

---

## Stack Tecnológica

| Camada           | Tecnologia                                                |
|------------------|-----------------------------------------------------------|
| Build            | Vite 7.1.11 + @vitejs/plugin-react-swc                    |
| UI               | React 18.3.1 + TypeScript 5.8.3                           |
| Roteamento       | React Router DOM 6.30.1                                   |
| Estilo           | TailwindCSS 3.4.17 + shadcn/ui + Radix UI                 |
| Ícones           | Lucide React + FontAwesome 7                              |
| Canvas 2D        | Fabric.js 6.9.0                                           |
| 3D               | Three.js 0.170.0 + @react-three/fiber + @react-three/drei |
| Formulários      | React Hook Form 7.61.1 + Zod 3.25.76                      |
| Data fetching    | TanStack React Query 5                                    |
| PDF              | jsPDF 4.2.0                                               |
| Testes unitários | Vitest 3.2.4 + React Testing Library 16                   |
| Testes E2E       | Playwright 1.58.2 (Chromium)                              |
| Linting          | ESLint 9.32.0 + typescript-eslint                         |
| Formatação       | Prettier (ver `.prettierrc`)                              |

---

## Arquitetura

### Domain-Driven Design

- **`HouseAggregate`** (`src/domain/house/house.aggregate.ts`) — estado central imutável da casa
- **Use-cases** em `src/domain/house/use-cases/` — regras de negócio isoladas e testáveis
- **Port** `house-persistence.port.ts` + **Adapter** in-memory em `src/infra/persistence/`
- Domínio completamente separado da apresentação

### Organização do Feature `rac-editor`

```
rac-editor/
├── ui/         → componentes React (renderização, layout)
├── hooks/      → lógica de estado e side-effects (custom hooks)
└── lib/        → funções puras, estratégias, utilitários (testáveis sem React)
```

### Padrões Principais

- **Strategy / Factory** — criação de elementos do canvas (30+ arquivos em `lib/canvas/`)
- **Parser pattern** — conversão de dados 2D → geometria 3D (`lib/3d/`)
- **Custom hooks** para encapsulamento de lógica complexa
- **React.memo / useMemo / useCallback** para performance em operações de canvas
- **Nenhum store global** (sem Redux/Zustand) — estado local via hooks e Context quando necessário

---

## Convenções de Código

### TypeScript

- `strict: false` — sem checagem estrita, mas evite `any`; prefira `unknown` com type narrowing
- `paths: { "@/*": ["./src/*"] }` — use o alias `@/` para imports absolutos
- Prefira `interface` a `type` para objetos
- Tipos explícitos em props e retornos de funções públicas

### Nomenclatura

```typescript
// Componentes
PascalCase               // RacEditor, CanvasToolbar

// Funções e variáveis
camelCase                // handleCanvasClick, updateHouseData

// Event handlers
handleX                  // handleMouseDown, handleKeyPress

// Callbacks/props de evento
onX                      // onSave, onCancel

// Booleanos
isX / hasX               // isSelected, hasError, isLoading

// Constantes
UPPER_SNAKE_CASE         // MAX_ZOOM_LEVEL, CANVAS_DEFAULTS
```

### Estilo (Prettier — `.prettierrc`)

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": false,
  "semi": true,
  "endOfLine": "lf"
}
```

### CSS / Tailwind

- Prefira utilitários Tailwind; evite CSS inline
- Use `clsx` para classes condicionais
- Extraia componentes em vez de duplicar classes
- Variáveis CSS para theming (ver `tailwind.config.ts`)

---

## Testes

### Testes Unitários / Integração (Vitest)

- Arquivos: `*.test.ts` / `*.test.tsx`
- Smoke tests: `*.smoke.test.ts` / `*.smoke.test.tsx` (excluídos da cobertura)
- Setup: `src/test/setup.ts` (mocks de `matchMedia`, `ResizeObserver`, pointer capture)
- Cobertura: `src/domain/**` e `src/components/rac-editor/lib/**`

### Testes E2E (Playwright)

- Localização: `e2e/` (6 specs: canvas, house-views-limits, modal-editors, piloti, toolbar-overflow, viewer-3d)
- Requer servidor em `localhost:5200` (`npm run dev:local`)
- Apenas Chromium; paralelo por padrão, serial em CI (`workers=1`)
- Relatórios HTML em `playwright-report/`

### Estratégia de Teste

```
Smoke tests  → validação rápida de que nada quebrou
Unit tests   → lógica de domínio e lib puras
E2E tests    → fluxos de usuário completos
```

---

## Configurações Importantes

| Arquivo                | Propósito                                                                |
|------------------------|--------------------------------------------------------------------------|
| `src/shared/config.ts` | Constantes da aplicação (canvas, house defaults, storage keys, viewport) |
| `vite.config.ts`       | Build, dev server (porta 8080), chunking para three.js e fabric          |
| `tsconfig.app.json`    | Configuração TypeScript da aplicação                                     |
| `tailwind.config.ts`   | Temas com variáveis CSS, suporte a dark mode                             |
| `components.json`      | Configuração shadcn/ui e aliases de componentes                          |
| `playwright.config.ts` | Configuração dos testes E2E                                              |
| `.editorconfig`        | UTF-8, LF, indentação 2 espaços, máx 120 chars                           |

---

## Git e Fluxo de Desenvolvimento

### Formato de Commit

```
<tipo>(<escopo>): <assunto em português>

<corpo opcional>
```

**Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Escopos comuns:** `canvas`, `3d-viewer`, `toolbar`, `modals`, `ui`, `core`, `rac-editor`, `house-3d`

### Fluxo de Desenvolvimento

1. Ler `.prompts/` e `.rules/` relevantes antes de implementar
2. Implementar as mudanças
3. Rodar `npm run lint && npm run test`
4. Documentar em `.changelogs/changelog-AAAAMMDD.md` (criar se não existir)
5. Commit com mensagem descritiva
6. Push para o branch de desenvolvimento

### Requisitos antes de Push

- `npm run lint` — sem erros
- `npm run test` — todos os testes passando
- Changelog do dia atualizado
- Para mudanças grandes: `npm run test:regression` completo

---

## Regras de Negócio

As regras funcionais estão documentadas em `.rules/`:

- `canvas.md` — interações 2D do canvas
- `toolbar.md` — comportamento da toolbar
- `vistas-por-tipo.md` — limites de vistas por tipo de casa
- `piloti-nivel.md` — edição de nível de piloti
- `piloti-mestre.md` — regras do piloti mestre
- `contraventamento.md` — contraventamento estrutural
- `viewer-3d.md` — visualizador 3D

**Consulte sempre estas regras antes de alterar comportamentos do editor.**

---

## Comunicação

- Responda e documente sempre em **português**
- Mantenha acentuação correta em todos os arquivos em português
- Confirme objetivos antes de tarefas grandes (novas telas, mudanças no renderizador 3D, sistema de undo/redo)
- Se o branch ou `package-lock.json` mudar inesperadamente, pare e solicite visão geral do estado atual

---

## Guias de Referência

Para aprofundamento em cada área, leia os guias em `.prompts/`:

| Arquivo                    | Conteúdo                                    |
|----------------------------|---------------------------------------------|
| `00_persona.md`            | Personalidade e instruções gerais do agente |
| `01_core_principles.md`    | Princípios fundamentais de desenvolvimento  |
| `02_tech_stack.md`         | Stack tecnológica detalhada                 |
| `03_project_structure.md`  | Arquitetura e organização                   |
| `04_naming_conventions.md` | Convenções de nomenclatura                  |
| `05_component_patterns.md` | Padrões de componentes React                |
| `06_hooks_and_state.md`    | Gerenciamento de estado e hooks             |
| `07_data_fetching.md`      | Busca e mutação de dados                    |
| `08_testing.md`            | Especificações de testes                    |
| `09_security_and_a11y.md`  | Segurança e acessibilidade (WCAG)           |
| `10_git_and_ci.md`         | Git workflow e CI/CD                        |
