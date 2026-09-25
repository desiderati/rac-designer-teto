---
title: "Bug Analysis - Altura manual dos pilotis intermediários"
doc_role: bug-analysis
status: probable
created: 2026-09-24
updated: 2026-09-24
supersedes:
superseded_by:
tags: [ bug-analysis, pilotis, rac-editor, persistência ]
aliases: [ altura manual dos pilotis do meio ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- Tipo: análise técnica de bug relatado pelo usuário.
- Sintoma: após desativar o modo automático, mudar valores dos pilotis intermediários e confirmar ou navegar, os valores não se mantêm.
- Ambiente desta análise: checkout local; nenhuma consulta ou mutação remota.
- Status analítico: provável falha de vínculo do controller com o canvas vigente; ver refinamento nas seções 16 e 17. O percurso estático em modo manual não demonstrou descarte da altura.
- Estado da correção: aplicada e validada por testes de remount e projeção visual; reprodução no navegador original pendente.
- Status de evidência: `fixed-in-test`, sem `validated-at-original-boundary`.

## 2. Contexto e Sintoma Observado

O usuário confirmou que alterou os botões de **Tamanho dos Pilotis** no A2, de **1,8 m para 1,5 m**, e também mudou o nível; após confirmar ou navegar, nenhuma das alterações foi percebida. O valor inicial/final do nível, a vista, o tipo de casa, a idade do projeto e a versão da aplicação não foram informados.

## 3. Contrato de Falha Observável

- Cenário original: desativar o modo automático, escolher uma altura diferente para um piloti intermediário e confirmar ou navegar ao próximo.
- Fronteira: valor observado no editor e no desenho após confirmação/navegação e ao retornar ao piloti.
- Reprodução mínima alinhada ao relato: A2 inicialmente em 1,8 m; desativar automático; escolher 1,5 m, alterar o nível dentro do limite de 0,75 m, confirmar ou navegar, reabrir e comparar.
- Controle: altura e nível dos demais pilotis permanecem intactos no modo manual; nível continua limitado à metade da altura.
- Evidência de resolução: altura escolhida preservada no modelo, objeto visual e documento salvo, inclusive após retorno/reabertura, com modo manual comprovado em cada etapa.

## 4. Escopo Afetado

- Regra: `docs/business-rules/BUS-004-piloti-nivel.md`, modos manual/automático e regras de edição 2, 4 e 5.
- Superfícies: `PilotiEditor`, `usePilotiEditor`, `usePilotiEditorActions`, adapter dos ports, controller, runtime visual e histórico/documento da casa.
- O arquivo localmente alterado `CanvasOverlays.tsx` concentra minimapa, indicadores e filhos; não contém o vínculo de props do editor de pilotis.

## 5. Mapa de Camadas e Fronteiras

| Camada | Responsabilidade | Evidência | Status |
|---|---|---|---|
| Modal e hook | Capturar altura, confirmar e navegar | `PilotiEditor.tsx`, `usePilotiEditor.ts` | observado em código |
| Adapter e controller | Aplicar patch e devolver estado atualizado | `editor-house-port-adapters.ts`, `editor-house-piloti-command-service.ts` | observado em código |
| Domínio e runtime visual | Alterar piloti e sincronizar vistas | `house-piloti.use-case.ts`, `house-visual-runtime.ts`, `piloti-visual.ts` | observado em código e testes existentes |
| Histórico e documento | Exportar estado após alteração | `useCanvasHistory.ts`, `useHouseDocumentLifecycle.ts` | observado em código |
| Seleção real pelo canvas | Reabrir editor a partir do objeto visual | `piloti-selection.ts` | observado em código; interação ainda não verificada nesta análise |
| Confirmação/navegação no browser | Reproduzir o relato | E2E por helper passou em outro valor; tentativa com A2 1,8 → 1,5 m parou na inicialização da página | parcial |

## 6. Fluxo Esperado vs. Fluxo Real

O clique de altura chama `handleHeightClick`, que envia imediatamente `height: h` e o nível limitado para `updatePiloti`. O adapter executa o comando e retorna `getPilotiData` atualizado; o hook informa a alteração e sincroniza a seleção.

No modo manual, `commitDraftChanges` preserva a altura do rascunho. `updateHousePiloti` aplica o patch e só interpola quando a alteração envolve nível de canto **e** o modo automático está ativo. O salvamento do histórico agenda a exportação do modelo atual; não reidrata a casa nesse caminho.

Não foi identificado ponto de divergência determinístico nesse percurso manual. Há uma distinção importante para a reprodução: a seleção por clique real lê altura/nível do objeto Fabric, enquanto `openPilotiEditorByDebug` usa o modelo lógico. Um teste baseado apenas no helper pode não detectar divergência entre ambos.

## 7. Hipóteses Causais

| Hipótese | A favor | Contra / limite | Validação necessária | Status |
|---|---|---|---|---|
| O modo usado no commit retorna a automático | No automático, `commitDraftChanges` sempre calcula altura pelo nível; efeitos releem a preferência. `updateSetting` engole falha de storage. | Nenhuma falha de storage ou reversão do modo foi observada. | Observar `aria-pressed`, preferência persistida e altura antes/depois de cada ação. | inconclusiva |
| Modelo muda, mas seleção/desenho usa objeto visual desatualizado | Seleção real usa metadados Fabric; helper de abertura usa modelo. | Runtime possui sincronização explícita das vistas. | Comparar modelo, objeto Fabric, rótulo e reabertura por clique real. | inconclusiva |
| Patch do intermediário é descartado pelo domínio em manual | Compatível com a percepção relatada. | Código aplica patch sem interpolação em manual; testes existentes dos 12 IDs passam. | Exercitar mudança real de altura no intermediário com ports reais. | não sustentada pela evidência atual |
| Falha de commit do slider de julho voltou | O nível também foi alterado no relato. | Altura usa clique com atualização imediata; precedente cobria nível de canto. | Conferir se o nível digitado foi confirmado por Enter/perda de foco e inspecionar modelo logo após. | não demonstrada |

## 8. Evidências e Pontos Envolvidos

- `usePilotiEditor.ts:263`: clique de altura aplica patch imediatamente.
- `usePilotiEditor.ts:326`: confirmação/navegação passa por `commitDraftChanges`; com automático ativo, a altura é recomendada novamente mesmo sem novo nível.
- `usePilotiEditor.ts:150`: sincronização de props também relê a preferência de modo.
- `editor-house-port-adapters.ts:188`: comando seguido de leitura atualizada.
- `house-visual-runtime.ts:57` e `:76`: limitação em manual e condição explícita para interpolação automática.
- `piloti-selection.ts:46`: seleção por canvas lê o objeto visual.
- `useHouseDocumentLifecycle.ts:156`: salvamento exporta documento atual e cancela hidratação agendada.

## 9. Classe do Defeito ou Regressão

A classe causal ainda não está estabelecida. O relato cruza estado do modal, modelo da casa, projeção visual e transição de seleção; a evidência disponível não permite escolher uma dessas fronteiras como causa raiz.

## 10. Correção Aplicada ou Recomendada

Não há correção causal recomendada antes de localizar a primeira divergência na reprodução. Contrato mínimo para eventual implementação: no modo manual, altura escolhida em intermediário deve continuar igual após clique, confirmação e navegação, com nível limitado apenas quando necessário, demais pilotis preservados e documento coerente.

Há um caso separado a caracterizar se necessário: com automático ativo, confirmar/navegar chama recomendação mesmo quando a pessoa escolheu a altura manualmente. Esse comportamento deve ser comparado à regra de edição 5 da BUS-004; ainda não foi atribuído ao relato com automático desativado.

## 11. Edge Cases e Cenários de Controle

- Desativar automático no próprio modal ou nas configurações; comprovar modo após navegação.
- Navegação manual e automática após escolha da altura.
- Intermediário interno na planta e intermediário visível em elevação.
- Diminuir altura com nível acima do novo limite; aumentar altura com nível compatível.
- Reabrir por clique real e pelo helper, verificando eventual diferença.
- Retornar/recarregar casa existente, além de criar casa nova.

## 12. Validação Executada

- Comando: `rtk npx vitest run --config vite.config.ts client/src/components/rac-editor/@modals/hooks/usePilotiEditor.smoke.test.tsx client/src/components/rac-editor/lib/editor-house-controller.smoke.test.ts --reporter=dot`.
- Resultado: 29 testes passaram e 1 falhou.
- A falha ocorreu em `editor-house-controller.smoke.test.ts:184`, no caso de nome da família: esperado `Família Formulário`, recebido vazio. Não comprova falha no fluxo de piloti e não foi corrigida nesta tarefa.
- Os testes de modo manual nos 12 IDs passaram, mas usam altura 1,0 m igual à altura padrão; portanto não caracterizam mudança real de altura nem confirmação/navegação.
- O smoke do hook passou, cobrindo nível no canto e alternância de modo com ports simulados.
- Novo teste de componente em `PilotiEditor.smoke.test.tsx`: A2 iniciado em 1,8 m, modo manual, clique em 1,5 m, nível de exemplo 0,40 → 0,35 m e confirmação. Passou; o teste usa ports simulados e não observa canvas nem documento. Esses valores de nível são apenas dados de teste, não os valores informados pelo usuário.
- E2E de controle em casa recém-criada, por `openPilotiEditorByDebug`: 1,0 → 1,5 m persistiu no modelo e IndexedDB após confirmar. O helper abre a partir do modelo, não por clique no objeto Fabric.
- Tentativa E2E do caso A2 1,8 → 1,5 m com navegação: bloqueada no `beforeEach` pela inicialização instável da página no servidor local isolado; nenhuma asserção do cenário foi alcançada. Tentativa de clique visual usando coordenada do helper não abriu o modal, sem evidência suficiente para atribuir isso ao produto.
- A configuração temporária de teste foi removida. Nenhum código de aplicação foi alterado; permanece apenas o teste de caracterização de componente.

## 13. Status de Evidência

`partial`: a leitura, o teste de componente e o E2E de controle restringem hipóteses, mas o relato exato não foi reproduzido na fronteira original. Não há `root-cause-confirmed`, `fixed-in-test` ou `validated-at-original-boundary` para este caso.

## 14. Dúvidas Residuais de Regra de Negócio

A regra manual é explícita, e altura/ID já foram esclarecidos. Ainda faltam os valores de nível, a vista, se a casa é recém-criada ou já salva, o modo efetivo após cada ação e o comportamento no projeto afetado.

## 15. Artefatos Relacionados

- `.agents/bug-analysis/2026-07/20260709-piloti-slider-manual-auto.bug-analysis.md`: correção anterior do primeiro commit de slider; E2E cobre nível em canto, não altura de intermediário.
- `.agents/bug-analysis/2026-06/20260617-terreno-manual-nivel-piloti.bug-analysis.md`: correção da projeção do terreno com âncoras individuais; validação anterior restrita à geometria/testes, sem browser.
- `e2e/piloti.spec.ts`: cobertura existente não inclui o cenário atual de altura intermediária e transições.
- Incidente operacional: não criado; nenhuma falha de infraestrutura ou impacto de produção confirmado.

## 16. Refinamento após evidência visual do usuário

### Novo fato e revisão da conclusão

O usuário informou um segundo caso em casa recém-criada: A1 inicia em altura 1,0 m e nível 0,20 m. Após edição, fechamento e reabertura, o modal apresenta altura 1,5 m e nível 0,50 m; planta e vistas elevadas permanecem visualmente em 1,0 m / 0,20 m. O agente principal recebeu a captura e repassou esses valores para esta análise.

**Conclusão revisada:** a investigação passa a priorizar a ligação entre modelo e runtime Fabric. A nova evidência indica que os valores chegam ao estado usado pelo editor; o desenho continua divergente. A hipótese inicial de simples perda do rascunho tem menor sustentação diante desse fato. Ainda é necessário observar os objetos Fabric para distinguir metadados antigos de pixels não redesenhados.

### Primeira divergência provável: ciclo de vida do canvas

1. `useRacEditorController.ts:73` mantém um `canvasRef` estável no controller pai.
2. `useRacEditorCanvasFlowController.ts:17` chama `useCanvasHouseInitialization` nesse pai.
3. `useCanvasHouseInitialization.ts:14` roda seu efeito somente quando mudam `canvasRef` ou `houseRuntimePort`. Ele procura um canvas, inicializa uma vez e encerra a busca; se ainda não há canvas, abandona após o limite de tentativas.
4. `config.ts:229` define 100 ms de intervalo e máximo de 50 tentativas; a comparação `tries > limite` encerra a busca após cerca de 5,1 s.
5. `RacEditorLayout.tsx:67` renderiza o gerenciador **ou** o canvas. Enquanto o gerenciador está aberto, o canvas não está montado. Abrir o gerenciador depois também desmonta o canvas existente.
6. `useCanvasFabricSetup.ts:265` limpa o ref e descarta a instância Fabric no teardown. Ao retornar ao desenho, surge outra instância.
7. A mudança de `canvasRef.current` não altera a identidade de `canvasRef`; portanto não reexecuta o efeito do controller pai. O controller pode ficar sem runtime inicializado, ou continuar ligado à instância Fabric descartada.
8. `fabric-canvas-house-runtime-port.ts:12` fecha seus callbacks sobre uma instância específica de Fabric. `EditorHouseVisualRuntime` resolve grupos usando esse port.
9. `editor-house-piloti-command-service.ts:52` altera o agregado e passa as vistas resolvidas pelo runtime para `updateHousePiloti`. Com runtime ausente/antigo, o modelo muda, mas a sincronização visual não encontra os grupos do canvas atual. Isso corresponde à classe de divergência descrita no novo relato.

Essa cadeia está sustentada por leitura direta, mas continua **provável** até reprodução do ciclo de vida no browser. Não foi marcado `root-cause-confirmed` com base somente nela.

### Hipótese alternativa examinada

O registro lógico da vista ocorre antes de sua inserção no canvas e pode materializar temporariamente um snapshot sem grupo. Contudo, os métodos `refreshTopDoorMarkersForCurrentHouse`, `refreshHouseViewReferenceMarkersForCurrentHouse` e `refreshAutoContraventamentoForCurrentHouse` invalidam o cache após a inserção. Essa evidência enfraquece a hipótese de cache inicial vazio como causa independente do vínculo incorreto com a instância Fabric.

### Reprodução discriminante e contrato de correção

- Permanecer no gerenciador inicial por mais de 5,1 s, entrar no canvas, criar casa padrão e editar A1 para 1,5 m / 0,50 m. Comparar estado lógico, grupos resolvidos pelo runtime, grupos do canvas visível, texto e geometria.
- Controle adicional: com canvas já funcional, abrir gerenciador, voltar e repetir a edição. Comprovar que o runtime continua apontando para a instância atual.
- A evidência decisiva é o canvas visível conter grupos válidos com `houseInstanceId`, enquanto o runtime do controller resolve zero grupos ou grupos de outra instância.
- Correção mínima recomendada, caso a reprodução confirme: vincular `initializeCanvas` a cada criação/montagem real de Fabric, renovar o vínculo ao remontar e invalidar referências/snapshots associados à instância anterior. A inicialização não deve depender apenas de uma busca temporária executada no controller pai.
- Critério de sucesso: no mesmo cenário que falhar, o modal, o modelo, os objetos Fabric, os rótulos, o terreno e o documento exportado concordam após confirmar/navegar, inclusive depois de ida e volta ao gerenciador.

### Limites atuais

Não houve alteração de aplicação ou testes nesta retomada do diagnóstico. O agente principal está reproduzindo a fronteira visual. As seções anteriores preservam o histórico da primeira rodada; as dúvidas sobre valores e casa recém-criada foram parcialmente resolvidas pelo novo caso A1.

## 17. Correção aplicada após o refinamento

O vínculo do runtime visual foi movido do controller pai (`useRacEditorCanvasFlowController`) para `RacEditorCanvas`. Assim, cada montagem do canvas executa `initializeCanvas` sobre a instância Fabric vigente. A inicialização anterior rodava uma vez no pai, mesmo quando o gerenciador desmontava o canvas. A mudança não altera as regras de altura, nível ou persistência dos pilotis.

Validação executada:

- Novo teste de `RacEditorCanvas`: desmontar e remontar registra dois runtimes visuais distintos; passou.
- Novo teste de `editor-house-controller`: após trocar a instância visual, editar A1 de 1,0 m / 0,20 m para 1,5 m / 0,50 m atualiza metadados, altura e rótulos do grupo atual; passou.
- Os sete testes focados de `RacEditorCanvas` e `PilotiEditor` passaram; TypeScript, ESLint dos arquivos alterados e os 13 testes de fronteira arquitetural passaram após a correção.

**Status:** `fixed-in-test` para o vínculo entre remontagem e projeção visual. A reprodução no navegador do cenário original permanece pendente porque as tentativas E2E anteriores não chegaram à asserção de edição. A causa do caso relatado é fortemente sustentada pela cadeia de ciclo de vida e pelos testes, mas ainda não foi observada diretamente no navegador do usuário.
