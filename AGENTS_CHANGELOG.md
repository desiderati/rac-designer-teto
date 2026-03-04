# CHANGELOG

## 2026-03-03

### Correções

- Correção no render de contraventamento no modelo 3D: remoção do descarte indevido quando a diagonal tinha
  `originY > destinationY` (caso típico: nível de origem menor que metade do destino).
- Adição de smoke test em `House3DScene` para garantir a renderização do contraventamento nesse cenário de desnível.
- Novo módulo `terrain-volume` com fórmulas puras de volume (rachão e brita) em m³, usando `TERRAIN_SOLIDITY` e
  `HOUSE_DIMENSIONS`.
- Exibição dos volumes totais no `TerrainEditor` com atualização em tempo real conforme alteração da solidez.
- Integração do `TerrainEditor` com `pilotis` da casa para cálculo de brita por nível individual.
- Adição de smoke test para validar os cálculos de volume.
- Inclusão de `voidFactor` configurável em `TERRAIN_SOLIDITY` (1.35) e aplicação do fator de vazios no volume exibido de
  rachão e brita.
- Ajuste de regra no contraventamento: quando a coluna está inelegível para novas inserções, lados já ocupados continuam
  habilitados para remoção no editor; tentativa de inserir novo lado segue bloqueada.
- Correção adicional no fluxo de contraventamento: clique no botão de lado agora persiste alterações pendentes do editor
  de piloti (altura/nível) antes de validar elegibilidade, evitando inserção indevida por estado desatualizado.
- Revalidação de elegibilidade ao selecionar o segundo piloti do contraventamento (bloqueio extra antes de criar a
  viga).
- Clique de contraventamento passa a usar explicitamente o `pilotiId` ativo do editor, evitando validação/inserção com
  seleção global desatualizada.
- Ao soltar o drag do `NivelSlider` no editor de piloti (`onValueCommit`), o nível agora é aplicado imediatamente com a
  mesma rotina de persistência do botão Confirmar.
- O seletor on/off de piloti mestre também passa a persistir imediatamente ao alternar (`onCheckedChange`), com a mesma
  rotina de commit usada no Confirmar.
- Ao reduzir a altura do piloti, o valor do slider de nível agora é ajustado imediatamente para o novo máximo permitido
  (clamp instantâneo), evitando manter valor acima do limite.
- No editor de terreno, ao soltar o drag do slider de tipo de solo (`onValueCommit`), a alteração agora é aplicada
  imediatamente no modelo.
- Nova configuração em `Settings` para posicionamento de modais de editores:
  `openEditorsAtFixedPosition` alterna entre abertura relativa ao mouse (padrão) e abertura fixa ao lado da toolbar
  esquerda.
- Nova configuração em `Settings`: `disableDrawModeAfterFreehand`. Quando ativa, o modo Lápis é desabilitado
  automaticamente ao concluir um desenho à mão livre (`path:created`), mantendo o estado da toolbar sincronizado.
- Ajuste no `InfoBar` de dicas: agora só é exibido quando a opção de dicas está ativa e existe objeto selecionado no
  canvas; sem seleção, a barra não aparece.
- Ajuste no cálculo da escada automática: a profundidade visual agora é derivada diretamente da altura calculada
  (regra `altura = profundidade`), usando a lógica da vista elevada como referência de métricas e reaplicando o mesmo
  valor na vista planta (mudando apenas posicionamento por vista).
- `refreshAutoStairsInViews` passa a calcular primeiro as escadas das vistas elevadas e reutilizar as métricas por lado
  na planta quando disponíveis, garantindo consistência entre vistas.
- Refatoração estratégica em `house-auto-stairs`: unificação das regras de IDs médios/cantos por meio de um contexto
  único de lado + orientação de eixo (`DoorSideAxisContext`), eliminando duplicação entre os fluxos de planta e
  elevação.
- Novo smoke test garantindo igualdade de profundidade/altura da escada entre planta e elevação quando ambas as vistas
  existem.
- Atualização de `.guidelines/governance.md` com protocolo obrigatório de alinhamento prévio entre abordagem
  operacional (pontual) e estratégica (refatoração/componentização), incluindo default para estratégica.
- Atualização de `.guidelines/architectural-standards.md` para explicitar preferência por decisões de engenharia em
  nível sênior (reuso/componentização e evolução arquitetural intencional).
- Atualização do `AGENTS.md`: instrução explícita para leitura obrigatória de `.guidelines/` e `.rules/` no início de
  cada sessão, antes de análise/proposta/implementação.
- Correção dos smoke tests de `terrain-volume` para refletir as fórmulas atuais (diâmetro real via
  `HOUSE_DIMENSIONS.piloti.widthMt3`, brita lateral `TERRAIN_SOLIDITY.sideGravelWidthMt3` e fatores de vazios
  `voidFactorRachao`/`voidFactorGravel`).
- Correção de imports quebrados no editor de nível e no módulo 3D, ajustando referências indevidas de
  @/components/rac-editor/lib/canvas para @/shared/types/piloti.ts e @/shared/constants.ts.
- Validação final de imports com pm run build e px tsc --noEmit sem erros.
- Correção de lint em todo o projeto com `eslint --fix` (padronização de aspas/imports) e ajustes de regra para permitir
  `any` apenas em `*.smoke.test.*`.
- Remoção de `any` no código de produção em `useCanvasSelectionActions.ts`.
- `npm run lint` finalizado sem erros (apenas warnings de Fast Refresh).
- Regra `react-refresh/only-export-components` desativada para `src/components/ui/**/*.{ts,tsx}` conforme alinhamento de
  projeto.
- Correção de três regressões em smoke tests: fallback seguro de `getActiveObject` em `useCanvasSelectionActions`,
  reexport de `getAllPilotiIds` no barrel de canvas e ajuste de import em `factory/house/shared.smoke.test.ts`.
- Validação: `npx vitest run smoke.test` com 58/58 arquivos e 140/140 testes passando.
- Reestruturação completa dos documentos em `.rules` com foco em linguagem para usuário (objetivo, comportamento
  esperado, regras funcionais e erros comuns).
- Atualização de referências para a estrutura real atual (`ui/hooks/lib/domain/shared/e2e`) e remoção de caminhos
  legados.
- Validação automática das referências citadas em `.rules`: sem links locais quebrados.
- Reescrita aprofundada dos arquivos em `.rules` com base em análise de código-fonte e testes (UI, hooks, lib, domínio e
  E2E/smoke), substituindo a versão resumida anterior.
- Regras agora incluem fluxos de bloqueio/cancelamento, limites por tipo de casa, critérios estruturais de
  piloti/contraventamento e rastreabilidade para arquivos reais.
- Inclusão explícita de mapeamento de caminhos legados (`src/components/hooks`, `src/components/libs`,
  `src/components/lib`) para caminhos canônicos atuais.
- Validação automática final: referências locais em `.rules` sem links quebrados.
- Visualizador 3D: piloti agora renderiza com segmentação em duas partes (2/3 inferiores em cinza escuro e 1/3 superior
  mantendo a cor atual, inclusive para piloti mestre).
- Novo smoke test no `House3DScene` validando que cada piloti é renderizado com dois cilindros.
- Visualizador 3D: novo toggle no menu para ocultar elementos abaixo do terreno.
- Quando ativo, o viewer recorta visualmente os pilotis no nível do terreno e oculta a face inferior do terreno.
- Novo util de domínio visual `src/components/rac-editor/lib/3d/piloti-visibility.ts` com smoke test dedicado.
- Ajuste de regra no recorte: a divisão de cor do piloti (1/3 superior e 2/3 inferior cinza escuro) agora preserva a
  proporção do piloti completo, mesmo com ocultação da parte abaixo do terreno.
- Correção do flip no lado de 6m (front/back) ao ocultar abaixo do terreno no viewer 3D:
  ajuste do mapeamento UV de coluna no cálculo do recorte dos pilotis.
- Correção na edição de níveis: ao alterar o nível de pilotis de canto, o `houseManager` agora recalcula os níveis
  interpolados dos pilotis intermediários (sem sobrescrever altura desses intermediários).
- Novo smoke test no `house-manager` cobrindo a atualização de níveis intermediários após mudança dos cantos.
- Unificação de métodos no agregado da casa: interpolação de pilotis consolidada em um único método
  (`recalculateRecommendedPilotiData`) com controle por parâmetro para atualizar ou não as alturas recomendadas.
- Simplificação do gatilho de recálculo no `houseManager.updatePiloti`: removida validação defensiva redundante
  (`Number.isFinite(Number(...))`) em favor de checagem direta de patch tipado (`nivel !== undefined`).
- Ajuste no recorte de piloti em desnível íngreme (modo “ocultar abaixo do terreno”): o nível de corte agora considera
  amostras ao redor do raio do piloti (menor Y local), reduzindo sobrecorte em relação ao cálculo pelo ponto central.
- Refino adicional do recorte em desnível: amostragem expandida por anéis (0, 0.5 e 1.0 raio) com 32 ângulos no contorno
  para reduzir sobrecorte residual observado principalmente nos pilotis menores.
- Regra de corte simplificada no modo ocultar: quando o nível local é menor que `0.5 m`, o ponto de corte passa a usar
  `0.5 m` como piso mínimo visual.
- Implementação da escada no visualizador 3D com geometria em degraus, respeitando o padrão visual de referência:
  corpo/laterais claras e piso dos degraus em marrom.
- Nova extração de dados de escada a partir das vistas elevadas (`stairs-parser`), reutilizando metadados do 2D
  (`isAutoStairs`, `stairsHeight`, `stairsStepCount`) como fonte de verdade para dimensões e quantidade de degraus.
- Regra estrutural aplicada no 3D: `altura = profundidade` (em cada degrau `stepRise = stepRun`), mantendo consistência
  com a regra funcional da escada no 2D.
- Integração do `House3DViewer` com parsing de escadas e renderização no `House3DScene`, com smoke tests cobrindo parser
  e render da malha de escada.
- Ajuste de orientação dos degraus no 3D: o último degrau (maior altura) agora fica encostado na porta.
- Ajuste exclusivo do 3D: altura renderizada da escada passa a descontar `AUTO_STAIR_HEIGHT_EXTRA_MTS`, sem alterar
  cálculo/metadata no modelo 2D.
- Ajuste exclusivo do 3D: degrau mais alto da escada não é renderizado; a escada é deslocada em direção à casa pela
  profundidade do degrau removido.
- Visualizador 3D: terreno passa a ser renderizado com volume (topo + laterais + base) e espessura fixa equivalente
  a `20 cm`.

### Atualização desta conversa (limite de nível inicial com piloti 3.5)

- Problema:
    - o fluxo inicial (`NivelDefinitionEditor`) mantinha limite fixo de `1.50 m`, incompatível com a nova altura de
      piloti `3.5 m`.
- Ajustes aplicados:
    - `src/shared/types/piloti.ts`
        - extração de `getMaxNivelForPilotiHeight(height)` como fonte única de cálculo (`height / 2`);
        - criação de `MAX_AVAILABLE_PILOTI_HEIGHT` e `MAX_AVAILABLE_PILOTI_NIVEL` com base em
          `DEFAULT_HOUSE_PILOTI_HEIGHTS`;
        - `clampNivelByHeight` passou a reutilizar o helper extraído;
        - `clampNivel` passou a usar `MAX_AVAILABLE_PILOTI_NIVEL` como máximo padrão.
    - `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx`
        - remoção do limite fixo `1.50`;
        - uso de `MAX_AVAILABLE_PILOTI_NIVEL` no slider e no clamp do valor digitado/arrastado.
    - `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`
        - novo teste garantindo `3.5 -> 1.75` e clamp padrão respeitando esse teto.
    - `.rules/piloti-nivel.md`
        - documentação do fluxo inicial atualizada para máximo dinâmico (atualmente `1.75 m`).

### Atualização desta conversa (unificação estratégica das regras de proporção de piloti)

- Problema:
    - após elevar o teto de nível para `1.75`, a regra de altura recomendada ainda usava `nivel * 3`, gerando
      recomendação incoerente para níveis altos (ex.: `1.75` não recomendava `3.5`).
- Decisão arquitetural:
    - unificar limite, recomendação e validação de proporção na mesma base estrutural (`altura mínima = nivel * 2`),
      removendo duplicação de fórmula entre camadas.
- Ajustes aplicados:
    - `src/shared/types/piloti.ts`
        - novo helper `getMinimumPilotiHeightForNivel`;
        - `isPilotiOutOfProportion` passou a reutilizar o helper unificado;
        - `getRecommendedHeight` passou a usar a mesma proporção (`*2`) e fallback no maior valor da tabela
          (`MAX_AVAILABLE_PILOTI_HEIGHT`).
    - `src/domain/house/house-aggregate.ts`
        - `recalculateRecommendedPilotiData` passou a reutilizar `getRecommendedHeight` (remoção da regra duplicada
          local).
    - `src/components/rac-editor/lib/house-manager.ts`
        - JSDoc atualizado para refletir a nova regra unificada.
    - Testes atualizados:
        - `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`
        - `src/components/rac-editor/lib/canvas/contraventamento.smoke.test.ts`
        - `src/components/rac-editor/lib/house-auto-contraventamento.smoke.test.ts`
        - `src/domain/house/house-aggregate.smoke.test.ts`
    - `.rules/piloti-nivel.md`
        - seção de recomendação atualizada para `nivel * 2` e tabela de alturas atual (`1.0` a `3.5`).

### Atualização desta conversa (correção de regressão no auto contraventamento)

- Problema:
    - a unificação da proporção para recomendação (`nivel * 2`) acabou alterando também a elegibilidade de
      contraventamento automático, reduzindo casos que antes geravam contraventamento.
- Ajuste aplicado:
    - separação explícita das regras de domínio em `src/shared/types/piloti.ts`:
        - `getMinimumPilotiHeightForNivel` (`*2`) para recomendação/consistência de nível;
        - `getMinimumPilotiHeightForNivel` (`*3`) para elegibilidade de contraventamento;
        - `isPilotiOutOfProportion` dedicado ao fluxo de contraventamento.
    - `house-auto-contraventamento.ts` e `useContraventamentoQueries.ts` passaram a usar a função dedicada de
      contraventamento (`*3`), restaurando o comportamento esperado do auto contraventamento.
    - testes atualizados para cobrir a separação de regras sem regressão:
        - `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`
        - `src/components/rac-editor/lib/canvas/contraventamento.smoke.test.ts`
        - `src/components/rac-editor/lib/house-auto-contraventamento.smoke.test.ts`
    - documentação ajustada:
        - `.rules/piloti-nivel.md`
        - `.rules/contraventamento.md`

### Atualização desta conversa (padronização de tolerância numérica)

- Problema:
    - uso repetido de literal `0.0001` em comparações de ponto flutuante (domínio e geometria), sem fonte única.
- Ajustes aplicados:
    - `src/shared/constants.ts`
        - adição de `NUMERIC_EPSILON = 1e-4` como tolerância padrão global.
    - substituição de literais por constante compartilhada em:
        - `src/shared/types/piloti.ts`
        - `src/components/rac-editor/lib/canvas/terrain.ts`
        - `src/components/rac-editor/lib/house-auto-stairs.ts`
    - documentação adicionada:
        - `.rules/README.md` com seção **Tolerância Numérica** (regra de uso e objetivo).
        - `.rules/piloti-nivel.md` com referência explícita ao `NUMERIC_EPSILON`.

### Atualização desta conversa (regra de recomendação corrigida para `nivel * 3`)

- Ajuste solicitado:
    - `getMinimumPilotiHeightForNivel` voltou para `nivel * 3`.
    - o problema real era o fallback fixo em `3.0`, não a proporção.
- Correções aplicadas:
    - `src/shared/types/piloti.ts`
        - `getMinimumPilotiHeightForNivel` ajustado para `*3`;
        - `getMinimumPilotiHeightForNivel` reaproveita a mesma base (`getMinimumPilotiHeightForNivel`);
        - fallback de recomendação permanece dinâmico no maior piloti disponível (`MAX_AVAILABLE_PILOTI_HEIGHT`).
    - `src/components/rac-editor/lib/house-manager.ts`
        - JSDoc atualizado para `Minimum required height = nivel × 3`.
    - testes ajustados:
        - `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`
        - `src/domain/house/house-aggregate.smoke.test.ts`
        - cenário continua cobrindo `nivel=1.75` recomendando `3.5` via fallback dinâmico.

### Atualização desta conversa (diretriz de simplicidade sem encadeamento desnecessário)

- Preferência registrada:
    - quando não há divergência de regra, evitar criar funções/wrappers em cadeia que não reduzem código nem
      aumentam clareza.
- Aplicação:
    - fluxo de proporção de piloti mantido em funções diretas (`isPilotiOutOfProportion` +
      `getMinimumPilotiHeightForNivel`),
      sem camadas adicionais.
    - `.guidelines/architectural-standards.md` atualizado com anti-padrão explícito contra encadeamento sem ganho.

### Atualização desta conversa (acessibilidade de modal com DialogTitle obrigatório)

- Problema:
    - warning de acessibilidade do Radix: `DialogContent requires a DialogTitle`.
    - no `ConfirmDialogModal`, quando `title` não era informado, o `DialogTitle` não era renderizado.
- Correção:
    - `src/components/rac-editor/ui/modals/ConfirmDialogModal.tsx`
        - passa a renderizar `DialogTitle` sempre (fallback: `Janela de confirmação`);
        - quando não há título visual, o `DialogTitle` fica em `sr-only`;
        - alinhamento equivalente aplicado no drawer móvel (`DrawerTitle` + `DrawerDescription` `sr-only`).
    - novo teste:
        - `src/components/rac-editor/ui/modals/ConfirmDialogModal.smoke.test.tsx`
        - valida fallback de título acessível quando `title` não é informado.

### Atualização desta conversa (setting: mostrar escada na planta)

- Nova configuração adicionada:
    - `showStairsOnTopView` (`false` por padrão) em `APP_SETTINGS_DEFAULTS`.
    - opção exposta no modal de configurações:
        - `Mostrar escada na vista superior (planta)`.
- Comportamento no canvas:
    - quando desabilitado, a escada automática da vista superior é removida/ocultada;
    - vistas elevadas continuam com escada automática;
    - ao confirmar Settings, o canvas reaplica imediatamente a automação de escadas com a configuração atual.
- Arquivos principais:
    - `src/shared/config.ts`
    - `src/infra/settings.ts`
    - `src/components/rac-editor/ui/modals/SettingsModal.tsx`
    - `src/components/rac-editor/lib/house-auto-stairs.ts`
    - `src/components/rac-editor/lib/house-manager.ts`
    - `src/components/rac-editor/ui/RacEditor.tsx`
    - `src/components/rac-editor/hooks/useContraventamentoCommands.ts`
- Testes:
    - `src/infra/settings.smoke.test.ts` (default/persistência da nova chave)
    - `src/components/rac-editor/lib/house-auto-stairs-settings.smoke.test.ts` (remoção da escada da planta quando
      desabilitado)

------------------------------------------------------------------------------------------

## 2026-03-01

### Correções

- Ajuste do lint para ignorar artefatos gerados e evitar ruídos em exports de UI.
- Atualização dos smoke tests de contraventamento e house-dimensions após a refatoração.
- Correções pontuais em hooks (dependências) e testes utilitários.
- Ajustes nos testes E2E (label de confirmação, ações de toolbar e robustez na abertura do menu).

------------------------------------------------------------------------------------------

## 2026-02-28

### Novas funcionalidades (ROADMAP)

- Escadas automáticas implementadas:
- criação automática na `TopView` com base no lado da porta;
- criação automática na vista elevada que contém porta;
- na vista elevada, a escada agora usa exatamente a mesma geometria da planta (`retângulo + linhas de degrau`);
- ajuste de posicionamento para encostar o contorno da escada na base da porta (sem gap visual de `stroke`);
- ajuste de cálculo de altura para considerar `nível baixo + 10cm + piso + viga` (garantindo contato com o terreno);
- ajuste de deslocamento na planta para a escada não sobrepor metade da porta;
- alinhamento horizontal da escada da elevação usando o mesmo `X` da porta (origem esquerda);
- cálculo da altura da escada em desnível por interpolação binomial do terreno nos dois lados da escada, usando o lado
  mais próximo do terreno;
- altura de degrau ajustada para `20 cm` (antes `10 cm`);
- profundidade visual de cada degrau ajustada proporcionalmente à altura do degrau para evitar escada visualmente "pela
  metade";
- cálculo automático dos níveis laterais da escada e mesma quantidade de degraus entre vistas;
- botão manual de escada desabilitado na toolbar.

- Contraventamento atualizado:
- remoção da restrição anterior de nível `> 40 cm`;
- elegibilidade ajustada para `nível >= 20 cm`;
- posicionamento dinâmico na elevação conforme regra:
- `20 cm -> offset 5 cm`;
- `30 cm -> offset 10 cm`;
- `>= 40 cm -> offset 20 cm`.
- adição de rotina de contraventamento automático por coluna quando piloti fica fora de proporção (
  `altura < nível * 3`);
- remoção automática apenas dos contraventamentos automáticos quando a coluna volta a ficar proporcional;
- preservação de contraventamentos manuais já existentes na coluna (sem duplicação automática);
- nova metadata serializável `isAutoContraventamento` para distinguir fluxos automático/manual;
- sincronização imediata das elevações após criação/remoção automática.

- Terreno editável nas vistas elevadas:
- adição de cama de rachão com padrão gráfico no canvas 2D;
- adição de britas laterais com largura de `10 cm` em cada lado;
- suporte a tipo de terreno de `1` a `5` com espessuras:
- `1: 13 cm`, `2: 25 cm`, `3: 38 cm`, `4: 50 cm`, `5: 63 cm`;
- clique no terreno abre editor com slider para alteração de tipo de solo;
- persistência do tipo de terreno no modelo serializado do canvas.
- desenho de rachão/britas alterado para ficar ao redor de cada piloti (laterais + base), em vez de faixa contínua sob a
  linha de terreno.
- refinamento de alinhamento/largura: uso do envelope visual do piloti (incluindo `stroke` e faixa hachurada) para
  evitar deslocamento lateral e base menor que o piloti.
- ajuste adicional de envelope para usar somente o retângulo real do piloti (eliminando micro-deslocamento causado pela
  faixa hachurada).
- clique no terreno robustecido: seleção não depende mais do `target` direto do Fabric, varrendo grupos de casa na
  posição do ponteiro.
- recálculo explícito de bounds do grupo (`_calcBounds`) antes de `setCoords` no fluxo de escada automática.
- inclusão explícita do `terrainHitArea` no conjunto de elementos adicionados à vista (hit-test do terreno volta a
  funcionar).
- ajuste de posição vertical do rachão para iniciar abaixo da base do piloti.
- recálculo de bounds (`_calcBounds` + `setCoords`) ao final de `updateGroundInGroup`.
- `terrainHitArea` passou a ser `evented=true` e a seleção de terreno usa também `subTargets` do Fabric.
- correção de requisito: labels de **Nível do terreno** foram restauradas e as labels de **altura dos pilotis** nas
  vistas elevadas foram removidas.
- ajuste adicional no recálculo de coords/bounds do grupo após regenerar terreno (`setCoords` em novos elementos +
  `requestRenderAll`).
- altura do preenchimento de terreno ajustada para considerar `fundo do piloti + cama de rachão + padding`.
- ordem de renderização ajustada: pilotis/estrutura ficam na frente de brita/rachão nas vistas elevadas.
- clique no terreno não dispara quando o ponteiro está sobre piloti (prioridade para edição de piloti).
- recálculo de bounds do grupo reforçado para grupo ativo após atualização de terreno.
- editor de terreno passa a abrir apenas com duplo clique (`mouse:dblclick`), não mais com clique simples.
- tipo de terreno (solidez) migrado para estado global da casa (`terrainType`), deixando de ser por vista elevada.
- aplicação de alteração de terreno agora propaga para todas as vistas elevadas registradas da casa.
- ao abrir o editor de terreno, o valor exibido no slider sempre reflete o `terrainType` global da casa.

### Validações executadas

- `npm run test` (todos os smoke tests passaram).
- `npm run build` (build de produção concluído com sucesso).
- `npm run lint` continua com passivo preexistente amplo fora do escopo desta entrega.

------------------------------------------------------------------------------------------

## 2026-02-27

### Resumo geral da conversa

- Atualização da seção "File Structure" do README para refletir a estrutura atual de diretórios.
- Revisão dos arquivos em `.rules` com regras faltantes e referências atualizadas para a estrutura atual do código.
- Fase 3 do plano de refatoração: `useCanvasViewport` migrado para `useReducer` e extração de estado local do
  `RacEditor` para hooks dedicados.
- Adição de smoke tests para todos os arquivos em `src/domain`.
- Adição de smoke tests para todos os arquivos em `src/components/lib`.
- Reversão do acesso direto da UI a Use Cases de domínio, mantendo a regra de segurança.
- Correção do `useCanvasViewport` para suportar setters com função, restaurando o recálculo de viewport no carregamento.
- Refatoração ampla de padronização no projeto `rac-designer-teto`.
- Centralização de constantes e estilos.
- Correções de bugs de renderização em vista planta/top e terreno.
- Simplificação arquitetural progressiva, removendo abstrações consideradas desnecessárias no cenário atual.

### Padronização de código e constantes

- Solicitação para substituir aspas duplas por aspas simples em `.ts` e `.tsx`, sem quebrar comportamento.
- Solicitação para mapear valores chumbados e consolidar defaults/constantes em arquivos centrais.
- Alinhamento de nomenclatura para nomes autoexplicativos e redução de duplicação de variáveis entre arquivos.
- Migração de estilos para objetos centralizados de configuração.
- Renomeação de sufixo de cor de `Hex` para `Color` para maior clareza semântica.

### Ajustes de configuração de estilo (canvas)

- Consolidação de configurações em estruturas únicas de estilo.
- Evolução de `CANVAS_STYLE_COLORS` e `CANVAS_TEXT_DEFAULTS` para um modelo unificado em `CANVAS_STYLE`.
- Consolidação e renomeação para `CANVAS_ELEMENT_STYLE`.
- Unificação progressiva de `fontSize`, `strokeColor`, `fillColor` e `strokeWidth` segundo regras discutidas.
- Normalização de `fontSize` para valor único (`15px`) conforme solicitado.
- Introdução/ajuste de campos por tipo de elemento para `strokeColor`.
- Unificação posterior de `strokeWidth` para valor único conforme decisão da conversa.

### Tipagem e casts Fabric

- Normalização do uso de casts para objetos de canvas com helpers:
- `toCanvasGroup(group: Group): CanvasGroup`
- `toCanvasObject(object: FabricObject | null | undefined): CanvasObject | null`
- Aplicação desse padrão em pontos amplos do código para reduzir cast direto espalhado.

### Dimensões 2D/3D e documentação

- Unificação de dimensões estruturais em arquivo central (`house-dimensions.ts`).
- Documentação das variáveis de dimensão em português.
- Ajustes de legibilidade e explicações de parâmetros como:
- `frontBackPanelOffsetRatio`
- `segments` do terreno
- fatores de escala do viewer 3D (`HOUSE_3D_SCALE`, `VIEWER_MODEL_SCALE`, etc.).
- Correções de texto/documentação para acentuação em português.

### Correções funcionais e bugs discutidos

- Correção de marcador de porta na vista top que não aparecia.
- Causa identificada e tratada: inconsistência de propriedade entre `doorMarkerSide` e `markerSide`.
- Correção de marcador de porta top fora de posição.
- Ajuste para usar geometria renderizada da porta (consistente com fórmulas das vistas), em vez de coordenada bruta
  incompatível.
- Ajustes de cenário envolvendo atualização de terreno (`createGroundElements`/`updateGroundInGroup`) e timing de
  chamada após criação de vistas.
- Discussões e ajustes em stroke de piloti/contraventamento durante investigação visual.

### Limpeza de estado de elementos da casa

- Decisão de remover o estado de `HouseElement` do estado principal da casa.
- Remoção de referências a `HouseElement`, `HouseElementDraft` e fluxo associado de elementos no domínio/manager/UI.
- Remoção de módulos antigos relacionados a `house-elements` e seus testes, quando ficaram órfãos.
- Ajustes no viewer/mapper 3D para operar sem depender desse estado removido.

### Discussão arquitetural e decisões finais

- Debate sobre `Port/Adapter`, `HouseAggregate` e papel do `HouseManager`.
- Conclusão pragmática para o contexto atual:
- manter apenas abstrações com ganho real imediato.
- Evolução acordada para facilitar persistência futura:
- criação de `HousePersistencePort`.
- implementação inicial `InMemoryHousePersistence` para manter estado da casa em memória.
- Remoção de `HouseAggregate` por baixa relação custo/benefício no estado atual do projeto.
- Remoção de `house-ports.ts`, substituindo aliases por tipos concretos (`HouseRepository`/`HouseViewsRepository`)
  diretamente no `HouseManager`.

### Itens novos/alterados relevantes no final da conversa

- `src/domain/house-persistence-port.ts` criado.
- `src/infra/persistence/in-memory-house-persistence.ts` criado.
- `src/infra/persistence/in-memory-house-persistence.smoke.test.ts` criado.
- `src/domain/house-aggregate.ts` removido.
- `src/domain/house-ports.ts` removido.
- `src/components/lib/house-manager.ts` atualizado para persistência via porta em memória e sem aggregate.

### Validações executadas ao longo do chat

- Execuções repetidas de `build` com sucesso após correções incrementais.
- Execuções de `tsc --noEmit` com sucesso após ajustes de tipagem.
- Smoke tests direcionados para fluxos alterados com sucesso, incluindo:
- `house-manager`
- `house-top-door-marker`
- `openings-mapper`
- `in-memory-house-persistence`

### Estado final consolidado

- Arquitetura simplificada, com menos camadas anêmicas.
- Persistência preparada para migração futura via `HousePersistencePort`.
- Bugs críticos discutidos na planta/top e mapeamento de porta tratados.
- Configuração e nomenclatura mais consistentes e centralizadas.

### Atualização desta conversa (House Factory Strategies)

- Solicitação atendida para criar Strategy para cada elemento/vista definido no `House Factory` da casa.
- Evolução do contrato de strategy em `src/lib/canvas/factory/elements/element-strategy.ts`:
- `ElementStrategy` passou a aceitar `options` opcionais em `create(canvas, options?)`.
- Implementação de registry de strategies por vista em `src/lib/canvas/factory/house-factory.ts`:
- `createHouseViewStrategies(factories)` cobrindo `top`, `front`, `back`, `side1`, `side2`.
- `getHouseViewStrategy(viewType, factories?)` para resolver Strategy por tipo de vista.
- Refatoração de `src/components/rac-editor/helpers/house-view-creation.ts`:
- remoção do `switch` manual por tipo de vista.
- delegação para `getHouseViewStrategy(...).create(canvas, { side })`.
- Compatibilidade preservada com as factories atuais (`createHouseTop`, `createHouseFrontBack`, `createHouseSide`),
  mantendo mesma regra de orientação por `side`.

### Validação desta conversa

- Teste executado com sucesso:
- `npm run test -- src/components/rac-editor/helpers/house-view-creation.smoke.test.ts`
- Resultado: `2 tests passed`.

### Atualização desta conversa (CanvasObject / customProps)

- Solicitação para recriar a lista de propriedades customizadas usando apenas propriedades de `CanvasObject`, sem
  incluir propriedades herdadas de `FabricObject`.
- Definição/uso da tipagem: `CanvasObjectProps = Exclude<keyof CanvasObject, keyof FabricObject>`.
- Ajuste da lista de serialização para conter apenas propriedades custom do domínio (ex.: `myType`, `houseViewType`,
  `pilotiId`, `isContraventamento`, etc.), removendo itens de `FabricObject`.
- Esclarecimento técnico registrado:
- `CanvasObjectProps` é apenas tipo (compile-time) e não substitui, sozinho, a lista de strings em runtime.
- A abordagem correta é manter o array runtime tipado com `CanvasObjectProps`.
- Discussão sobre naming da lista (`customProps` vs `canvasObjectProps`), com foco em tipagem forte e sem incluir campos
  do Fabric.
- Solicitação atendida para ordenar as strings da lista na mesma sequência em que as propriedades custom aparecem em
  `CanvasObject`.
- Resultado esperado da conversa:
- serialização com lista de propriedades custom tipada;
- sem dependência de campos de `FabricObject`;
- ordem do array alinhada com a declaração de `CanvasObject`.

### Atualização desta conversa (correção de `HouseElement`)

- Solicitação para corrigir sintaxe inválida de TypeScript em definição de tipo/interface:
- trecho enviado com `export interface HouseElement = HouseElementDraft & { ... }`.
- Correção registrada com duas opções válidas:
- `export type HouseElement = HouseElementDraft & { id: string }`
- `export interface HouseElement extends HouseElementDraft { id: string }`
- Observação aplicada na resposta: ao usar herança/interseção com `HouseElementDraft`, não é necessário repetir campos
  já existentes (`type`, `face`, `x`, `y`, `width`, `height`).

### Conversa registrada neste chat

1. Foi analisado o arquivo `useObjectEditorActions.ts` (
   `rac-designer-teto/src/components/rac-editor/modals/editors/generic/hooks/useObjectEditorActions.ts`).
2. Foi esclarecido que o artefato não é uma classe, e sim um hook React (`useObjectEditorActions`).
3. Foi explicado o comportamento principal do hook:
    - `handleObjectApply`: aplica nome/cor no objeto selecionado, salva histórico e exibe mensagem.
    - `resolveWallEditorColor`: resolve a cor atual do objeto para o editor.
4. Foi avaliada a complexidade:
    - O hook em si está simples.
    - A função `applyWallEditorChange` está no limite (ou levemente acima) de complexidade ideal para manutenção, por
      concentrar múltiplas responsabilidades e vários ramos condicionais.
5. Pontos de atenção levantados:
    - Cor padrão `#00000` (5 dígitos) inválida; sugerido `#000000`.
    - Uso de `objectSelection.object` sem guarda nula direta em `handleObjectApply`, dependendo de contrato externo de
      chamada.
6. Foi respondida a dúvida sobre label não aumentar ao redimensionar grupo (`normalizeWallCanvasObjectToLength`):
    - `IText` no Fabric não cresce visualmente via `width/height`.
    - Tamanho visual depende de `fontSize` (ou escala).
    - `scaleX/scaleY` sendo resetados para `1` no label e no grupo impedem ganho visual por escala.
    - Sugestão técnica: ajustar `fontSize` proporcionalmente (ou usar escala), e considerar `Textbox` se a intenção for
      controle de quebra por largura.

### Status

- Nenhuma alteração de código foi aplicada automaticamente no projeto durante esta conversa.
- Este arquivo foi criado para documentar o conteúdo discutido no chat.

### Contexto do chamado

- Problema reportado: o editor de `Linha`/`Seta` não carregava o valor da `label` ao abrir e a mudança de cor não era
  aplicada corretamente ao selecionar nova cor.
- Arquivos inicialmente apontados para investigação:
    - `src/lib/canvas/factory/elements-factory.ts`
    - `src/components/rac-editor/hooks/useArrowEditorActions.ts`
    - `src/components/rac-editor/hooks/usePilotiEditor.ts`

### Diagnóstico realizado

- O fluxo de `Piloti` (`usePilotiEditor.ts`) não era a causa do problema de Linha/Seta.
- O estado inicial do editor de Linha/Seta vinha de `readLineArrowEditorState` (`src/lib/canvas/line-arrow-editor.ts`).
- Foram identificados problemas de compatibilidade e leitura:
    - Leitura de label sem compatibilidade completa com objetos legados (`lineArrowLabel`).
    - Leitura de cor com cobertura incompleta para estruturas aninhadas de `group`.
- Na aplicação de alterações (hooks de ações):
    - Atualização de cor não era robusta para filhos aninhados.
    - Em alguns cenários de objeto agrupado, a estratégia de criação/atualização de label podia prejudicar o fluxo de
      edição posterior.

### Alterações implementadas

#### 1) Leitura de estado do editor (label + cor)

- Arquivo: `src/lib/canvas/line-arrow-editor.ts`
- Ajustes:
    - Suporte a `lineLabel`, `arrowLabel` e `lineArrowLabel`.
    - Leitura recursiva/achatada de filhos para encontrar label e cor em estruturas aninhadas.
    - Fallback de cor para cenários de `arrow` e `line` fora de `group`.

#### 2) Aplicação de mudanças no editor de Linha

- Arquivo: `src/components/rac-editor/hooks/useLineEditorActions.ts`
- Ajustes:
    - Detecção de label com compatibilidade para tipos legados.
    - Atualização de cor da linha de forma recursiva em grupos.
    - Quando o objeto já é `group`, adiciona label no próprio grupo (sem re-encapsular desnecessariamente).
    - Normalização do `myType` da label atualizada para `lineLabel`.

#### 3) Aplicação de mudanças no editor de Seta

- Arquivo: `src/components/rac-editor/hooks/useArrowEditorActions.ts`
- Ajustes:
    - Detecção de label com compatibilidade para tipos legados.
    - Atualização de cor recursiva para `rect`/`triangle`/`line` dentro de grupos.
    - Quando o objeto já é `group`, adiciona label no próprio grupo.
    - Normalização do `myType` da label atualizada para `arrowLabel`.

#### 4) Compatibilidade de normalização de escala com labels legados

- Arquivo: `src/lib/canvas/factory/elements-factory.ts`
- Ajustes:
    - `normalizeLineGroupScaling` passou a considerar `lineArrowLabel` junto de `lineLabel`.
    - `normalizeArrowCanvasObjectToLength` passou a considerar `lineArrowLabel` junto de `arrowLabel`.

### Arquivos alterados

- `src/lib/canvas/line-arrow-editor.ts`
- `src/components/rac-editor/hooks/useLineEditorActions.ts`
- `src/components/rac-editor/hooks/useArrowEditorActions.ts`
- `src/lib/canvas/factory/elements-factory.ts`

### Validação executada durante o chat

- `npm run test -- line-arrow-editor.smoke.test.ts`
    - Resultado final: **passou** (3/3).
- `npm run lint`
    - Resultado: **falhou**, com diversos erros preexistentes no projeto (não relacionados diretamente a este ajuste).
- `npm run test -- elements-factory.smoke.test.ts`
    - Resultado: **falhou** por expectativas de testes desalinhadas com o estado atual da factory (ex.: expectativa de
      placeholder label que não existe na criação atual de line/arrow/dimension).

### Observações finais

- A cor e a label do editor de Linha/Seta agora são lidas e aplicadas com maior robustez para estruturas atuais e
  legadas.
- O fluxo de Piloti não foi alterado, pois não fazia parte da causa raiz identificada para este problema.

### Atualização desta conversa (refatoração incremental + correções Linha/Seta)

#### Diretrizes alinhadas durante o chat

- Continuar refatoração sem interrupção em `RacEditor` e `Canvas`.
- Manter atualizados os arquivos de regra (`.rules`) e os logs de execução (`.codex`) a cada incremento relevante.
- Executar validações após cada etapa para reduzir risco de regressão funcional.
- Corrigir problemas de lint/tipagem por ajuste de código, sem desabilitar regras.

#### Documentação e organização de hooks

- `useEditorDraft` recebeu JSDoc completo e depois foi reescrito em linguagem mais didática (foco em programador
  júnior), explicando claramente o conceito de `draft` como rascunho temporário.
- Separação do fluxo combinado de Linha/Seta:
    - remoção do hook combinado anterior;
    - criação de hooks dedicados para Linha e Seta;
    - ajuste de wiring no `RacEditor` para orquestrar os dois fluxos sem mudar contrato de tela.

#### Ajuste solicitado de arquitetura (apply separado por tipo)

- Foi removida a abordagem com apply combinado compartilhado.
- O apply passou a ficar separado por tipo (Linha e Seta), em hooks específicos.
- Resultado: menor acoplamento entre comportamentos e melhor manutenção por responsabilidade única.

#### Redução de duplicação de comportamento (scaling)

- Linha:
    - centralização da regra longitudinal de escala em helper único no factory;
    - reutilização desse helper no apply da Linha.
- Seta:
    - centralização da regra longitudinal de escala em helper único no factory;
    - reutilização dessa regra no apply da Seta.
- Objetivo atendido: evitar duplicação de lógica entre criação (`createLine`/`createArrow`) e edição (`apply`).

#### Bugs reportados e corrigidos (Linha/Seta)

- Corrigidos os 4 pontos reportados:
    1. Linha/Seta não esticavam longitudinalmente em cenários de redimensionamento após edição.
    2. Cor da Linha não era aplicada corretamente em alguns fluxos de editor.
    3. Editor podia abrir com texto em branco mesmo havendo label definida.
    4. Primeira abertura podia não marcar a cor padrão.
- Restrição respeitada: sem alterar a regra de posicionamento da label.

#### Ajustes técnicos aplicados para estabilizar o fluxo

- Restauração de placeholder `" "` na criação de `line`/`arrow` (e `dimensionLabel`) para manter contrato de
  seleção/edição.
- Unificação de `myType` de label para `lineArrowLabel` com compatibilidade para legados (`lineLabel`/`arrowLabel`).
- Leitura de estado do editor de Linha/Seta (`line-arrow-editor`) com busca recursiva em grupos aninhados.
- Normalização de cores default legadas (`black`/`#333`) para `#000000` no estado inicial do editor.
- Ajustes de fallback para objetos legados sem label, adicionando label no próprio grupo sem quebrar escala.

#### Arquivos principais envolvidos nesta rodada

- `src/components/rac-editor/hooks/useLineEditorActions.ts`
- `src/components/rac-editor/hooks/useArrowEditorActions.ts`
- `src/lib/canvas/factory/elements-factory.ts`
- `src/lib/canvas/line-arrow-editor.ts`
- `.rules/canvas.md`
- `.codex/refactoring-2026-02-20/regression-run.md`

#### Validação consolidada da rodada

- `npm run test -- --run`: **PASS** (suite verde na rodada final).
- `npm run build`: **PASS**.
- `npm run test:e2e -- --workers=1`: **PASS** (16/16).
- `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`: **FAIL** por pendências preexistentes fora deste
  escopo (notadamente em `useCanvasFabricSetup.ts` e `GenericEditor.smoke.test.tsx`).

### Atualização desta conversa (.guidelines / padrões arquiteturais)

- Solicitação atendida para formalizar instruções arquiteturais com foco em:
    - evitar criação de funcionalidade paralela;
    - auditar reutilização antes de criar componente novo;
    - padronizar critérios de extração de comuns (componentes/hooks).
- Novo guia criado:
    - `.guidelines/architecture-patterns.md`
- Conteúdo estruturado no novo guia:
    - princípios obrigatórios (`reuse-first`, simplificação pragmática, `one source of truth`);
    - fluxo obrigatório antes de codar (inventário, decisão e implementação);
    - matriz de decisão (reutilizar vs. extrair comum vs. criar novo);
    - padrões por camada (`UI`, hooks, factory/canvas, domínio/persistência);
    - critérios para novas abstrações (`Port`, `Strategy`, `Factory`, `Aggregate`);
    - regras de compatibilidade, anti-padrões e checklist de PR.
- Ajuste complementar:
    - `ux-design.md` atualizado com seção de referência para usar
      `.guidelines/architecture-patterns.md` em decisões arquiteturais.
