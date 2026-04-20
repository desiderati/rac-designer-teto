# HOOKS AND STATE MANAGEMENT

<ruleset name="Hooks and State Management">

<description>
Este documento descreve o estado atual do gerenciamento de hooks e estado no projeto, além da direção de refatoração já acordada para o editor.
O objetivo é guiar a transição sem fingir que ela já terminou.
</description>

<rule name="Quando Criar um Hook Customizado">
  <description>Extraia lógica para um hook customizado (`use...`) quando houver comportamento reutilizável, ligação com estado compartilhado ou coordenação entre UI e dependências externas.</description>
</rule>

<rule name="Retorno de Hooks">
  <description>Prefira retornar um objeto em vez de array. Isso deixa o contrato mais explícito e reduz erro de ordem em desestruturação.</description>
</rule>

<rule name="Hierarquia de Estado">
  <description>Siga esta hierarquia para decidir onde o estado deve viver.</description>
  <spec>**1. Estado Local (`useState`, `useReducer`)** - primeiro nível para UI simples e isolada.</spec>
  <spec>**2. Estado Elevado (lifting state up)** - quando irmãos compartilham o mesmo dado.</spec>
  <spec>**3. Contexto (`useContext`)** - quando múltiplos níveis da árvore precisam consumir a mesma instância.</spec>
  <spec>**4. Store de Domínio da Feature** - para estado complexo do editor, com fonte de verdade explícita.</spec>
</rule>

<rule name="Estado Atual do Projeto">
  <description>Hoje o projeto não usa uma biblioteca genérica de estado global como Zustand ou Redux. Parte do estado ainda pode estar distribuída entre hooks, contextos e estruturas legadas da feature editor.</description>
  <spec>Não criar `src/store` genérico na raiz.</spec>
  <spec>Não introduzir Zustand/Redux automaticamente.</spec>
  <spec>O estado do editor deve evoluir para um store de domínio próprio da feature, não para uma solução global genérica.</spec>
</rule>

<rule name="Direção Arquitetural do Editor">
  <description>A direção oficial da refatoração é centralizar o estado complexo do editor em `HouseStateStore`.</description>
  <spec>`HouseStateStore` deve ser a fonte de verdade do estado da casa dentro da feature editor.</spec>
  <spec>Ele deve ser criado no `bootstrap`, não como singleton global.</spec>
  <spec>Ele deve ser exposto via Context/Provider e consumido por hooks e componentes da feature.</spec>
  <spec>Ele deve receber comandos, atualizar estado e notificar listeners.</spec>
</rule>

<rule name="HouseStateStore vs. HouseManager">
  <description>Enquanto a refatoração não estiver concluída, pode existir convivência entre estruturas antigas e a nova direção. Isso deve ser tratado explicitamente como fase de transição.</description>
  <spec>Não documentar o `HouseManager` legado como arquitetura final.</spec>
  <spec>Se o código atual ainda depender dele, tratar isso como estado transitório.</spec>
  <spec>A arquitetura alvo é `HouseStateStore` no centro, não `HouseManager` singleton global.</spec>
</rule>

<rule name="Papel dos Hooks na Feature Editor">
  <description>Os hooks da feature editor devem separar claramente leitura de estado, dispatch de comandos e bindings com dependências externas.</description>
  <spec>`hooks/state` - leitura e seleção de estado.</spec>
  <spec>`hooks/commands` - dispatch de comandos a partir da UI.</spec>
  <spec>`hooks/bindings` - integração com canvas, listeners e outros eventos externos.</spec>
</rule>

<rule name="O que Hooks Podem Fazer">
  <description>Hooks são a cola entre UI, store e adapters. Eles podem coordenar consumo de estado e eventos, mas não devem absorver responsabilidade de domínio.</description>
  <spec>Podem ler estado do store.</spec>
  <spec>Podem despachar comandos no store.</spec>
  <spec>Podem registrar listeners e bindings do canvas.</spec>
</rule>

<rule name="O que Hooks Não Podem Fazer">
  <description>Estas restrições evitam que hooks virem o novo lugar da bagunça arquitetural.</description>
  <spec>Não importar `fabric` diretamente.</spec>
  <spec>Não conter regra de domínio.</spec>
  <spec>Não alterar estado complexo por fora do fluxo de `dispatch`.</spec>
  <spec>Não transformar o hook em um "god-hook" que mistura state, command e binding em um único arquivo sem necessidade.</spec>
</rule>

<rule name="Store da Feature não é Singleton Global">
  <description>Uma instância única por árvore do editor é aceitável. O que não é aceitável é exportar uma instância global diretamente de módulo.</description>
  <example type="DO">
    ```ts
    // criado no bootstrap e injetado via Context
    const store = createHouseStateStore(...);
    ```
  </example>
  <example type="DO_NOT">
    ```ts
    export const houseStateStore = new HouseStateStore(...);
    ```
  </example>
</rule>

</ruleset>
