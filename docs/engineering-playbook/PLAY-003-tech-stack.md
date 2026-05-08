---
title: Stack Tecnológica
id: PLAY-003
doc_type: playbook
doc_set: engineering-playbook
family: core
precedence: 3
status: active
lang: pt-BR
---

# Stack Tecnológica

## Objetivo

Este documento descreve a stack atualmente detectada no projeto `rac-designer-teto`. Ele serve como referência para
manutenção e evolução incremental do código. Tecnologias listadas aqui não são licença para expandir a arquitetura sem
necessidade real.

## Framework

- A aplicação é uma SPA construída com Vite e React.
- O roteamento é client-side com React Router DOM.
- Os perfis frontend detectados são `frontend-react-vite` e `frontend-react-router-spa`.
- O estado real do projeto deve prevalecer sobre qualquer diagrama antigo ou expectativa herdada.

## Linguagem

- O projeto é escrito em TypeScript.
- `tsconfig.app.json` está hoje com `strict: false`.
- `tsconfig.json` também mantém opções permissivas como `noImplicitAny: false` e `strictNullChecks: false`.
- Isso deve ser tratado como estado atual do repositório, não como diretriz arquitetural permanente.
- O código novo deve continuar explícito, defensivo e com tipagem útil.

## Build e gerenciador de pacotes

- O perfil operacional detectado é `build-npm`.
- `package-lock.json`, scripts em `package.json` e comandos oficiais do `README.md` padronizam o uso de npm.
- `bun.lock` existe no repositório, mas não há documentação operacional vigente que padronize Bun para este projeto.
- Não troque o gerenciador de pacotes nem reescreva lockfiles sem decisão explícita.

## Estilização

- A estilização atual usa TailwindCSS.
- Reutilize utilitários e helpers já existentes antes de introduzir novos padrões visuais.

Exemplo recomendado:

```tsx
import { cn } from "@/components/rac-editor/lib/utils.ts";

function MyComponent({ isActive }: { isActive: boolean }) {
  return <div className={cn("p-4", isActive && "bg-blue-500 text-white")} />;
}
```

## Biblioteca de componentes

- O projeto usa shadcn/ui como base de componentes.
- Primitives base de shadcn/ui usam Lucide React.
- O editor RAC ainda usa FontAwesome em toolbar, modais, tutorial e visualização 3D.
- O princípio dominante é composição sobre reinvenção.
- Não padronize a biblioteca de ícones por substituição ampla sem uma migração explícita.

## Estado e arquitetura

- O projeto não usa biblioteca genérica de estado global como Zustand ou Redux.
- `RacEditorStoreProvider` injeta `EditorStore` e ports do editor por contexto.
- `EditorStore` é uma store serializável de interação do editor, hoje centrada em seleção pública e commands.
- O estado compartilhado do editor é coordenado pela própria feature, principalmente por `editor-house-controller`,
  `useSyncExternalStore` e hooks locais.
- A store injetada não substitui ainda o estado lógico da casa nem autoriza uma store genérica na raiz.
- Estados simples devem continuar em `useState` ou `useReducer`.
- Não abra automaticamente uma camada genérica de store na raiz nem uma segunda fonte de verdade para a casa.

## Data fetching

- TanStack Query está presente no projeto.
- A aplicação registra `QueryClientProvider`, mas hoje não há uso ativo de `useQuery` ou `useMutation` em `src`.
- Use-o quando houver query ou mutation remota real.
- Não transforme fluxos puramente locais do editor em data fetching apenas porque React Query existe no repositório.
- Não crie uma camada genérica de services por reflexo.

## Validação e formulários

- React Hook Form está disponível principalmente via primitive base de formulário.
- Zod está instalado, mas não é usado ativamente em `src` hoje.
- Use-os quando o escopo realmente envolver formulários ou contratos de entrada.
- Não introduza esse aparato em ciclos que não pedem validação formal.

## Testes

- Testes unitários e de integração usam Vitest e React Testing Library.
- Fluxos E2E usam Playwright.
- Smoke tests coexistem com a suíte principal para lógica crítica do domínio e da feature.
- `npm run test:architecture` executa a guarda arquitetural de fronteira do editor RAC.

## Bibliotecas específicas do domínio

- Fabric.js concentra o desenho 2D.
- Three.js, `@react-three/fiber` e `@react-three/drei` suportam a visualização 3D.
- jsPDF cobre exportação em PDF.
- Toque nessas bibliotecas apenas quando o escopo envolver canvas, 3D ou exportação.

## Guardrails para agentes

- Não use este documento para inventar dependências novas ou pastas novas por padrão.
- Não assuma React Query como centro arquitetural.
- Não assuma Zod ou React Hook Form como padrão ativo de todo fluxo de entrada.
- Não trate `strict: false` como preferência estrutural.
- Não introduza services genéricos nem uma store genérica na raiz sem necessidade explícita e evidência arquitetural.
