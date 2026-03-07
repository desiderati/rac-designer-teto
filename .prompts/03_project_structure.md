# PROJECT STRUCTURE

<ruleset name="Project Structure">

<description>
Este documento descreve tanto a estrutura atual do projeto quanto a direção arquitetural desejada.
Ele existe para evitar dois erros comuns:
1. fingir que a refatoração já aconteceu quando ainda não aconteceu.
2. deixar o agente inferir arquitetura sozinho a partir de padrões genéricos.
</description>

<rule name="Estrutura Atual">
  <description>Atualmente o projeto está organizado em camadas principais já bem definidas.</description>
  <spec>`src/domain` - lógica de negócio e contratos centrais do domínio.</spec>
  <spec>`src/infra` - implementações concretas de persistência, storage e integrações técnicas.</spec>
  <spec>`src/components` - componentes React e lógica específica das views/features.</spec>
  <spec>`src/pages` - páginas e montagem das telas.</spec>
  <spec>`src/shared` - tipos, constantes e utilitários compartilhados.</spec>
  <spec>`src/main.tsx` / `src/App.tsx` - inicialização da aplicação, providers e roteamento.</spec>
</rule>

<rule name="Direção Arquitetural Alvo">
  <description>A direção arquitetural do projeto é consolidar o editor como uma feature com estado próprio, domínio explícito e infraestrutura isolada.</description>
  <spec>`src/bootstrap` - camada oficial de wiring, composição e injeção de dependências.</spec>
  <spec>`src/components/rac-editor/store/HouseStateStore.ts` - store central do estado da casa dentro da feature editor.</spec>
  <spec>`src/components/rac-editor/canvas/*Port.ts` - contratos de renderização e eventos do canvas.</spec>
  <spec>`src/infra/canvas/FabricCanvasAdapter.ts` - implementação concreta dos ports do canvas.</spec>
  <spec>Fabric e detalhes de canvas devem ficar isolados em `src/infra` e não podem vazar para arquivos de views/features.</spec>
</rule>

<rule name="Domínio (`src/domain`)">
  <description>O domínio continua sendo o núcleo da aplicação. Ele contém regras, invariantes e casos de uso ligados ao modelo da casa.</description>
  <spec>Organização por domínio de negócio, por exemplo `house`.</spec>
  <spec>`house/house.aggregate.ts` representa o agregado central do domínio.</spec>
  <spec>`house/house-persistence.port.ts` define o contrato de persistência do agregado.</spec>
  <spec>`house/use-cases/*.use-case.ts` contém regras e transformações do domínio.</spec>
  <spec>O domínio não deve importar React, Fabric ou componentes visuais.</spec>
</rule>

<rule name="Infraestrutura (`src/infra`)">
  <description>A infraestrutura implementa contratos e detalhes técnicos concretos.</description>
  <spec>`persistence/` implementa persistência concreta.</spec>
  <spec>`storage/` contém integrações com armazenamento local.</spec>
  <spec>`canvas/` é o lugar correto para adapters concretos de Fabric e outras APIs do canvas.</spec>
  <spec>Somente `src/infra` pode importar bibliotecas técnicas sensíveis como `fabric`.</spec>
</rule>

<rule name="Feature Editor (`src/components/rac-editor`)">
  <description>O editor é tratado como uma mini-aplicação interna, com organização própria e responsabilidades bem definidas.</description>
  <spec>`ui/` - componentes visuais e presentacionais da feature.</spec>
  <spec>`hooks/` - bindings, leitura de estado e comandos da feature.</spec>
  <spec>`store/` - estado central da feature, incluindo `HouseStateStore`.</spec>
  <spec>`canvas/` - contratos e tipos da integração com canvas pertencentes à feature.</spec>
  <spec>`lib/` - lógica pura local da feature, desde que não duplique nem esconda regras de domínio.</spec>
</rule>

<rule name="Bootstrap (`src/bootstrap`)">
  <description>Esta pasta deve existir para montar e conectar dependências da feature editor sem transformar `App.tsx` ou `RacEditor.tsx` em composition roots improvisados.</description>
  <spec>Criar store, adapters e providers aqui.</spec>
  <spec>Não colocar regra de negócio em bootstrap.</spec>
  <spec>Não colocar detalhes de renderização visual em bootstrap.</spec>
</rule>

<rule name="Fluxo de Dependência">
  <description>A direção das dependências deve permanecer explícita.</description>
  <spec>`components` pode depender de `domain`, `shared` e contratos da própria feature.</spec>
  <spec>`infra` pode depender de contratos definidos fora dela para implementar adapters.</spec>
  <spec>`bootstrap` pode depender de tudo para compor a aplicação.</spec>
  <spec>`domain` não deve depender de `components` nem de detalhes concretos de `infra`.</spec>
</rule>

<rule name="Restrições Estruturais">
  <description>Estas restrições existem para evitar regressão arquitetural durante a refatoração.</description>
  <spec>Não criar `src/application`, `src/services` ou `src/store` genéricos na raiz sem decisão arquitetural explícita.</spec>
  <spec>Não usar `shared` como lixeira para regras de negócio.</spec>
  <spec>Não importar `fabric` fora de `src/infra`.</spec>
  <spec>Não tratar o canvas como fonte de verdade do estado.</spec>
</rule>

<rule name="Fase de Transição">
  <description>Enquanto a refatoração ainda estiver em andamento, é aceitável que coexistam elementos do estado atual e da arquitetura alvo, desde que isso esteja explícito e que a direção da migração seja preservada.</description>
  <spec>Documentar o que é legado e o que é estado alvo.</spec>
  <spec>Preferir PRs pequenos que movam responsabilidade de forma incremental.</spec>
</rule>

</ruleset>
