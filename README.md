# RAC Designer TETO - Project Guidelines

## 📋 Project Overview

**RAC Designer TETO** é um editor visual profissional para design de plantas de casas desenvolvido para a ONG TETO. A
aplicação permite que monitores, líderes de construção e voluntários criem plantas baixas e elevações de casas com
ferramentas avançadas de desenho 2D e visualização 3D interativa.

## 🧭 Leitura Recomendada

Este README concentra o contexto humano e operacional do repositório. Para qualquer trabalho técnico, siga esta ordem:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/business-rules/README.md` quando a mudança afetar comportamento do editor
4. `docs/engineering-playbook/README.md` e os guias `PLAY-*` relevantes
5. `docs/product-requirements/README.md` e o PRD específico quando houver iniciativa formal

> `package.json` continua sendo a fonte de verdade para scripts e dependências instaladas.

---

## 🎯 Project Goals & Priorities

### Primary Goals

1. **Accessibility & Usability** - Ferramentas devem ser intuitivas para usuários sem experiência técnica
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
- **Frustração:** Interfaces complexas, demora na criação e alteração de RACs, falta de feedback visual

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

## 🏗️ Arquitetura Atual

- `src/domain/house/` concentra agregado, casos de uso e contratos do domínio
- `src/infra/` implementa persistência em memória, storage local e integrações técnicas
- `src/components/rac-editor/` é a feature principal e organiza a interface em `ui/`, `hooks/` e `lib/`
- `src/shared/config.ts` concentra constantes operacionais compartilhadas
- O projeto usa alias `@/` para imports absolutos
- Não há store global genérico; o estado do editor permanece concentrado na própria feature e nos contratos já
  existentes
- O TypeScript roda hoje em modo não estrito, mas o código deve continuar explícito e defensivo
- O playbook em `docs/engineering-playbook/` continua sendo a fonte canônica para arquitetura, convenções e critérios de
  refatoração

---

## 🛠️ Coding Conventions

### File Structure

```
.
├── .agents/
│   ├── prompts/              # Prompts operacionais especializados
│   ├── refactorings/         # Registros duráveis das frentes de refatoração
│   └── templates/            # Templates operacionais da camada de agentes
├── .lovable/                 # Planos/artefatos do Lovable (automação)
├── docs/
│   ├── business-rules/       # Regras funcionais do produto, numeradas em ordem canônica
│   ├── engineering-playbook/ # Constituição técnica e guias locais de engenharia
│   ├── code-scaffolds/       # Scaffolds aprovados quando houver uso operacional real
│   └── product-requirements/ # PRDs canônicos e sidecars associados
├── e2e/                      # Testes E2E (Playwright)
├── public/                   # Assets estáticos
├── src/
│   ├── components/
│   │   ├── rac-editor/       # Núcleo do editor (ui, lib, hooks)
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

### Naming Conventions

#### Components

- PascalCase para nomes de componentes: `RacEditor`, `Canvas`, `Toolbar`
- Sufixo `Modal` para componentes de modal: `SettingsModal`, `ConfirmDialogModal`
- Sufixo `Editor` para componentes de edição: `PilotiEditor`, `DistanceEditor`

#### Functions & Variables

- camelCase para funções e variáveis: `handleCanvasClick`, `updateHouseData`
- Prefixo `handle` para event handlers: `handleMouseDown`, `handleKeyPress`
- Prefixo `on` para callbacks: `onSave`, `onCancel`
- Prefixo `is` ou `has` para booleanos: `isSelected`, `hasError`

#### Constants

- UPPER_SNAKE_CASE para constantes globais: `MAX_ZOOM_LEVEL`, `DEFAULT_CANVAS_SIZE`
- camelCase para constantes de módulo: `defaultSettings`, `toolbarHeight`

### TypeScript Best Practices

- Sempre definir tipos explícitos para props e retorno de funções
- Usar interfaces para definir estruturas de dados
- Evitar `any` - usar `unknown` se necessário e fazer type narrowing
- Usar tipos genéricos para componentes reutilizáveis

```typescript
// ✅ Bom
interface CanvasProps {
    width: number;
    height: number;
    onDraw: (data: DrawData) => void;
}

const Canvas: React.FC<CanvasProps> = ({width, height, onDraw}) => {
    // ...
};

// ❌ Evitar
const Canvas = (props: any) => {
    // ...
};
```

### React Best Practices

- Usar functional components com hooks
- Memorizar componentes pesados com `React.memo` quando apropriado
- Usar `useCallback` para event handlers que são passados como props
- Evitar criar objetos/arrays dentro de render - usar `useMemo` se necessário
- Sempre adicionar key props em listas

```tsx
// ✅ Bom
const HouseList: React.FC<{ houses: House[] }> = ({houses}) => (
    <div>
        {houses.map(house => (<HouseCard key={house.id} house={house}/>))}
    </div>
);

// ❌ Evitar
const HouseList: React.FC<{ houses: House[] }> = ({houses}) => (
    <div>
        {houses.map((house, index) => (<HouseCard key={index} house={house}/>))}
    </div>
);
```

### CSS & Tailwind

- Usar Tailwind CSS para styling - evitar CSS-in-JS quando possível
- Manter classes Tailwind organizadas: layout → spacing → sizing → colors → effects
- Usar `clsx` para classes condicionais
- Extrair componentes reutilizáveis ao invés de duplicar classes

```typescript
// ✅ Bom
const buttonClasses = clsx(
    'px-4 py-2 rounded-lg font-medium',
    'transition-colors duration-200',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
);

// ❌ Evitar
const buttonClasses = `${isActive ? 'bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200' : 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200'}`;
```

### Comments & Documentation

- Comentar lógica complexa, não código óbvio
- Usar JSDoc para funções e componentes públicos
- Manter comentários atualizados quando código muda

```typescript
/**
 * Calcula a área de um polígono usando a fórmula de Shoelace
 * @param points - Array de pontos [x, y] que formam o polígono
 * @returns Área do polígono em unidades quadradas
 */
function calculatePolygonArea(points: [number, number][]): number {
    // Implementação...
}
```

---

## 🎯 Feature-Specific Guidelines

### Canvas Editor (2D)

- Usar Fabric.js para manipulação de objetos
- Suportar undo/redo para todas as operações
- Fornecer feedback visual claro para seleção de objetos
- Implementar snap-to-grid para alinhamento preciso
- Suportar múltiplas seleções com Ctrl/Cmd+Click

### 3D Viewer

- Usar React Three Fiber para renderização 3D
- Implementar rotação, zoom e pan intuitivos
- Suportar múltiplas ângulos (superior, frontal, lateral)
- Otimizar performance para plantas complexas

### Modals & Dialogs

- Usar confirmação antes de persistir estado do canvas
- Manter modais simples e focados em uma tarefa
- Suportar fechar com ESC

### Toolbar

- Agrupar ferramentas relacionadas
- Mostrar tooltip ao passar mouse
- Indicar ferramenta ativa visualmente
- Desabilitar ferramentas não aplicáveis ao contexto

---

## 🔄 Development Workflow

### Before Starting Work

1. Ler `AGENTS.md`, este `README.md` e o `docs/README.md`
2. Entender a persona do usuário afetada e as regras de negócio aplicáveis
3. Verificar se há componentes, hooks ou utilitários reutilizáveis antes de criar algo novo

### During Development

1. Seguir as convenções daqui e do playbook
2. Verificar impacto em regras de negócio e documentação durável quando houver mudança comportamental
3. Testar os fluxos afetados
4. Verificar responsividade em mobile/tablet quando a interface for tocada

### Comandos principais (estado atual)

1. Instalação de dependências:

    ```bash
    npm install
    ```

2. Desenvolvimento local na rede:

    ```bash
    npm run dev -- --host 0.0.0.0
    ```

3. Desenvolvimento local para E2E:

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
    npm run lint
    npm run test
    npm run test:watch
    npm run test:coverage
    ```

7. Testes E2E (requer `npm run dev:local` em `127.0.0.1:5200`):

    ```bash
    npm run test:e2e
    npm run test:e2e:ui
    ```

8. Regressão completa:

    ```bash
    npm run test:regression
    ```

### Before Committing

1. Executar `npm run lint` e corrigir erros
2. Testar funcionalidade completa
3. Verificar se não quebrou features existentes
4. Escrever mensagem de commit clara

### Commit Message Format

```
<type>(<scope>): <subject>

<body>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `canvas`, `3d-viewer`, `toolbar`, `modals`, `ui`, `core`

Exemplo:

```
feat(canvas): add polygon drawing tool

- Implement polygon drawing with click-to-add-points
- Add double-click to finish polygon
- Include snap-to-grid functionality
```

## 🧪 Testes e Validação

- Smoke tests coexistem com unit/integration tests em arquivos `*.smoke.test.ts` e `*.smoke.test.tsx`
- A suíte E2E vive em `e2e/` e gera relatórios em `playwright-report/`
- `npm run test:regression` encadeia `test`, `build` e `test:e2e`; use-o quando a mudança tiver blast radius maior

## ⚙️ Configurações Importantes

| Arquivo                | Propósito                                            |
|------------------------|------------------------------------------------------|
| `src/shared/config.ts` | Constantes operacionais compartilhadas do editor     |
| `vite.config.ts`       | Build, dev server e otimizações do Vite              |
| `tailwind.config.ts`   | Tema e configuração do Tailwind                      |
| `components.json`      | Configuração e aliases do shadcn/ui                  |
| `playwright.config.ts` | Configuração da suíte E2E                            |
| `.editorconfig`        | Convenções editoriais e de formatação do repositório |

---

## 🚀 Performance Guidelines

### Canvas Performance

- Renderizar apenas objetos visíveis
- Usar debounce para eventos de mouse
- Limitar taxa de atualização para 60fps
- Otimizar Fabric.js com `renderOnAddRemove: false`

### 3D Performance

- Usar LOD (Level of Detail) para modelos complexos
- Limpar geometrias não utilizadas
- Usar instancing para objetos repetidos
- Monitorar FPS e avisar se < 30fps

### Memory Management

- Limpar listeners de eventos ao desmontar componentes
- Usar `useCallback` para evitar recriação de funções
- Implementar lazy loading para dados grandes
- Limpar canvas antes de descarregar

---

## 🔒 Security & Data Protection

### User Data

- Não armazenar dados sensíveis em localStorage sem encriptação
- Validar entrada de usuário no frontend e backend
- Sanitizar dados antes de renderizar

### File Handling

- Validar tipo de arquivo antes de processar
- Limitar tamanho máximo de arquivo
- Usar Web Workers para processamento pesado
- Implementar timeout para operações longas

---

## 📱 Accessibility & Inclusivity

### WCAG 2.1 Compliance

- Manter contraste de cores ≥ 4.5:1 para texto
- Suportar navegação por teclado (Tab, Enter, ESC)
- Adicionar ARIA labels para elementos interativos
- Testar com screen readers (NVDA, JAWS)

### Mobile Considerations

- Touch targets mínimo de 44x44px
- Suportar orientação portrait e landscape
- Testar em dispositivos reais, não apenas emuladores
- Considerar conexões lentas (3G)

## 📚 Regras de Negócio

- O índice canônico está em `docs/business-rules/README.md`
- Hoje o repositório documenta regras específicas para canvas, toolbar, vistas por tipo de casa, piloti,
  contraventamento e viewer 3D
- Mudanças comportamentais no editor devem ser confrontadas com esses documentos antes da implementação

---

## 🐛 Debugging & Troubleshooting

### Common Issues

**Canvas não renderiza:**

- Verificar se Fabric.js foi inicializado
- Verificar console para erros de JavaScript
- Validar dimensões do canvas

**3D Viewer lento:**

- Verificar quantidade de objetos renderizados
- Usar DevTools > Performance para profile
- Reduzir qualidade de texturas se necessário

**Undo/Redo não funciona:**

- Verificar se ação foi adicionada ao histórico
- Validar serialização de objetos
- Testar com diferentes tipos de objetos

### Debug Mode

- Adicionar `?debug=true` à URL para modo debug
- Mostrar grid, coordenadas e informações de performance
- Logar todas as ações para auditoria

---

## 📚 External References

- **Fabric.js Docs:** http://fabricjs.com/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **TETO ONG:** https://www.teto.org.br/

---

## 📚 Documentação Canônica e Recursos

- **Guardrails operacionais:** `AGENTS.md`
- **Índice documental do projeto:** `docs/README.md`
- **Regras de negócio:** `docs/business-rules/README.md`
- **PRDs e sidecars:** `docs/product-requirements/README.md`
- **Engineering Playbook:** `docs/engineering-playbook/README.md`
- **Code Scaffolds aprovados:** `docs/code-scaffolds/README.md`
- **Prompts duráveis de refatoração:** `.agents/prompts/refactoring-*.prompt.md`
- **Execuções e regressões de refatoração:** `.agents/refactorings/`
- **Heurísticas repo-locais:** `.agents/refactorings/heuristics/`
- **Contribuição, Git e CI:** `CONTRIBUTING.md`
