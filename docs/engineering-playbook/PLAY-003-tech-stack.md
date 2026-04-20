# TECHNOLOGY STACK

<ruleset name="Technology Stack">

<description>
Esta é a stack atualmente detectada no projeto `rac-designer-teto`.
Ela serve como referência para manutenção e evolução incremental do código.
O agente não deve assumir que toda tecnologia listada aqui é obrigatória em todo ciclo de desenvolvimento.
Novas dependências, novos padrões ou novas camadas só podem ser introduzidos quando forem realmente necessários ao escopo solicitado.
</description>

<rule name="Framework">
  <description>O projeto atual é uma Single-Page Application construída com Vite e React, com roteamento no cliente via React Router.</description>
  <spec>Framework detectado: Vite (v7+)</spec>
  <spec>Core detectado: React (v18+)</spec>
  <spec>Roteamento detectado: React Router DOM (v6+)</spec>
</rule>

<rule name="Linguagem">
  <description>O projeto é escrito em TypeScript. Hoje o `tsconfig.json` está com `strict: false`. Isso deve ser tratado como estado atual do repositório, não como diretriz arquitetural permanente.</description>
  <spec>Linguagem: TypeScript (v5+)</spec>
  <spec>Estado atual: `"strict": false`</spec>
  <spec>Diretriz: escrever código defensivo, explícito e com tipagem útil, sem assumir que a tipagem frouxa é desejável por padrão.</spec>
</rule>

<rule name="Estilização">
  <description>A estilização atual usa TailwindCSS. Sempre reutilize utilitários e helpers já existentes antes de introduzir novos padrões visuais.</description>
  <spec>CSS Framework detectado: TailwindCSS (v3+)</spec>
  <example type="DO">
    ```tsx
    import { cn } from "@/lib/utils";

    function MyComponent({ isActive }: { isActive: boolean }) {
      return <div className={cn("p-4", isActive && "bg-blue-500 text-white")} />;
    }
    ```
  </example>
</rule>

<rule name="Component Library">
  <description>O projeto usa shadcn/ui como biblioteca base de componentes. Sempre prefira compor a partir dos componentes já existentes antes de criar novos primitivos.</description>
  <spec>Component Library detectada: shadcn/ui</spec>
  <spec>Ícones detectados: Lucide React</spec>
  <spec>Princípio: composição sobre reinvenção.</spec>
</rule>

<rule name="Estado e Arquitetura">
  <description>O projeto não usa uma biblioteca genérica de estado global como Zustand ou Redux. A direção arquitetural atual é concentrar estado complexo do editor em stores de domínio próprios da feature, em vez de criar um `src/store` genérico na raiz.</description>
  <spec>Não criar Zustand/Redux automaticamente.</spec>
  <spec>Estados simples: `useState` / `useReducer`.</spec>
  <spec>Estados compartilhados da feature: Context + stores de domínio próprios da feature.</spec>
</rule>

<rule name="Data Fetching">
  <description>TanStack Query está presente no projeto e deve ser usado quando houver integração remota real. Isso não significa que todo fluxo do sistema gira em torno de fetch. Em especial, o editor e o canvas são guiados por estado local/feature state, não por React Query.</description>
  <spec>Biblioteca detectada: @tanstack/react-query (v5+)</spec>
  <spec>Usar apenas quando houver query ou mutation remota real.</spec>
  <spec>Não criar camadas genéricas de `services/` automaticamente.</spec>
</rule>

<rule name="Validação e Formulários">
  <description>Zod e React Hook Form estão presentes no projeto e podem ser usados quando houver formulários ou contratos de entrada que realmente precisem disso. Não introduzir esses padrões em ciclos de desenvolvimento que não envolvam formulários.</description>
  <spec>Validação detectada: Zod (v3+)</spec>
  <spec>Formulários detectados: React Hook Form (v7+)</spec>
</rule>

<rule name="Testes">
  <description>Testes unitários e de integração usam Vitest e React Testing Library. Fluxos end-to-end usam Playwright.</description>
  <spec>Unit/Integration: Vitest (v3+)</spec>
  <spec>Component testing: @testing-library/react (v16+)</spec>
  <spec>E2E: Playwright (v1+)</spec>
</rule>

<rule name="Bibliotecas de Domínio Específico">
  <description>O projeto contém bibliotecas pesadas e específicas para desenho 2D/3D e geração de PDF. Elas só devem ser tocadas quando o escopo envolver diretamente canvas, 3D ou exportação.</description>
  <spec>Desenho 2D detectado: Fabric.js (v6+)</spec>
  <spec>Renderização 3D detectada: Three.js + @react-three/fiber + @react-three/drei</spec>
  <spec>PDF detectado: jsPDF</spec>
</rule>

<rule name="Restrições para Agentes">
  <description>O agente não deve usar este arquivo para inventar novas pastas ou novas dependências por padrão. Este documento descreve o que já existe ou o que já está autorizado no repositório, não uma licença para expandir a stack sem necessidade.</description>
  <spec>Não criar `src/services/` genérico automaticamente, a não ser que seja EXPLICITAMENTE requisitado.</spec>
  <spec>Não assumir React Query como centro da arquitetura.</spec>
  <spec>Não assumir que `strict: false` é uma preferência de design.</spec>
</rule>

</ruleset>
