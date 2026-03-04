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
- Novo util de domínio visual `src/components/rac-editor/lib/3d/piloti-parser.ts` com smoke test dedicado.
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

