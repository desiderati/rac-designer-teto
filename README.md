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

## 🗂️ Estrutura do Repositório

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

As convenções detalhadas de nomenclatura, componentes, hooks, estado, testes, segurança e acessibilidade vivem no
playbook em `docs/engineering-playbook/`. Este README mantém apenas o mapa geral do projeto e os comandos reais de
trabalho.

---

## 🔄 Development Workflow

### Before Starting Work

1. Ler `AGENTS.md`, este `README.md` e o `docs/README.md`
2. Entender a persona do usuário afetada e as regras de negócio aplicáveis
3. Consultar o `docs/engineering-playbook/` antes de qualquer mudança estrutural ou comportamental
4. Verificar se há componentes, hooks ou utilitários reutilizáveis antes de criar algo novo

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
4. Seguir `CONTRIBUTING.md` para formato de commit, PR e CI

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

## 📚 Regras de Negócio

- O índice canônico está em `docs/business-rules/README.md`
- Hoje o repositório documenta regras específicas para canvas, toolbar, vistas por tipo de casa, piloti,
  contraventamento e viewer 3D
- Mudanças comportamentais no editor devem ser confrontadas com esses documentos antes da implementação

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

---

## 📚 External References

- **Fabric.js Docs:** http://fabricjs.com/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **TETO ONG:** https://www.teto.org.br/
