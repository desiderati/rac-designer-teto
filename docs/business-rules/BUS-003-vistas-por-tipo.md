---
title: Regras de Vistas por Tipo de Casa
id: BUS-003
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 3
status: active
lang: pt-BR
---

# Regras de Vistas por Tipo de Casa

## Objetivo

Definir quais vistas podem ser criadas em cada tipo de casa e como funciona inserção, bloqueio e
remoção.

## Tipos de vista

1. Planta.
2. Vista frontal/posterior/lateral, conforme o tipo de casa.
3. Quadrado fechado.
4. Quadrado aberto.

## Regras de limite por tipo de casa

### Tipo 6

1. Planta: 1
2. Frontal: 1
3. Posterior: 1
4. Lateral: 2, diferenciadas no canvas como `Lateral Esquerda` e `Lateral Direita`
5. Quadrado aberto: 0

### Tipo 3

1. Planta: 1
2. Frontal: 0
3. Lateral: 2, diferenciadas no canvas como `Lateral Esquerda` e `Lateral Direita`
4. Quadrado fechado: 1
5. Quadrado aberto: 1

## Regras de inserção

1. Se ainda houver vaga
    - Inserção é permitida.

2. Se limite já foi atingido
    - Inserção é bloqueada e o usuário recebe aviso.

3. Quando necessário
    - O sistema pede seleção de lado ou de instância antes de inserir.

4. Se existir apenas uma opção válida
    - Inserção acontece direto, sem etapa extra.

## Regras de remoção

1. Ao remover uma vista, a vaga correspondente deve ser liberada.

2. Após remoção, deve ser possível inserir novamente dentro dos limites.

3. A planta segue regra especial:
    - Só pode ser removida se não houver outras vistas ativas.

4. Remover a planta retira sua representação do Canvas e libera a vaga da vista. Preserva o tipo da
   casa, a orientação e os dados dos pilotis, incluindo mestre, alturas e níveis.

5. Se a casa já estiver definida, reinserir a planta usa diretamente a configuração existente, sem
   repetir a escolha do tipo, a orientação ou a definição inicial de níveis. A ausência da vista no
   Canvas não autoriza apagar a configuração nem reaplicar seus valores iniciais.

## Redefinir Casa

`Redefinir Casa` é uma ação separada da exclusão da planta. Ela remove as vistas vinculadas à casa,
limpa sua definição estrutural e a preparação da Análise de Campo e reabre o fluxo inicial de
definição. Os demais objetos do terreno permanecem no Canvas. Os bloqueios de edição da casa e da
construção continuam valendo.

O fluxo inicial respeita as preferências de configuração vigentes. Para retirar somente a planta e
reutilizar os pilotis e níveis já definidos, use a remoção da vista e sua reinserção.

## Regras do fluxo inicial

1. Escolha de tipo de casa inicia configuração das primeiras vistas.
2. Definição de níveis faz parte da preparação inicial.
3. Após confirmar, o sistema cria a planta. As vistas elevadas podem ser inseridas depois.
4. Se o fluxo inicial for cancelado, o estado parcial deve ser limpo.

## Regras de consistência

1. Importação, desfazer/refazer e reconstrução não podem violar limites por tipo.
2. Contagem de vistas deve permanecer correta após qualquer operação.
3. Rótulos e comportamento devem continuar coerentes com o tipo de casa ativo.

## Estabilidade durante o ciclo do desenho

1. Nos tipos 3 e 6, inserir, remover ou reinserir elevações não pode deslocar a porta nem os
   marcadores de vista em relação ao corpo da planta.

2. A porta mantém o lado escolhido e a posição ao longo desse lado. Seu centro permanece sobre a
   borda do corpo da planta; etiquetas e marcadores externos não redefinem essa borda.

3. A planta mostra somente os marcadores correspondentes às elevações ativas. Remover uma elevação
   retira seu marcador; reinseri-la restaura o marcador no lado correspondente.

4. Salvar e reabrir preserva essas relações, os 12 pilotis e as transformações das vistas. A
   reabertura não pode depender de inserir outra elevação para corrigir a geometria.

## Regras de identificação no canvas

1. Cada vista elevada mantém referência interna pela ordem de inserção no canvas.

2. A vista elevada exibe apenas uma etiqueta superior com o nome da vista, logo acima da própria vista.
    - Exemplo: `Frontal`.

3. A planta exibe o marcador triangular correspondente a cada vista elevada inserida.

4. A porta aparece na planta no lado escolhido na configuração inicial da casa, mesmo antes de
   inserir a vista elevada correspondente. Inserir ou remover essa vista não oculta a porta.

5. O marcador triangular fica pareado com o lado da planta associado à vista.

6. A base do triângulo deve ficar paralela ao lado da planta.

7. A ponta do triângulo deve apontar para o lado da planta correspondente.

8. O triângulo não deve exibir número interno.

9. O texto do nome deve ficar paralelo à base do triângulo.

10. O nome da vista deve ficar do lado externo da base:
    - Superior: acima da base.
    - Inferior: abaixo da base.
    - Esquerdo: à esquerda da base.
    - Direito: à direita da base.

## Referências de regressão

- [Exclusão de objetos e
  vistas](../../client/src/components/rac-editor/@canvas/hooks/useCanvasActions.ts) e [remoção no
  agregado](../../client/src/domain/house/house.aggregate.ts): retiram a vista sem limpar a
  definição estrutural.

- [Inserção de
  vistas](../../client/src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts) e
  [decisão de inserção](../../client/src/domain/house/use-cases/house-views-layout.use-case.ts):
  reutilizam os dados atuais e inserem a planta diretamente quando há vaga.

- [Ação Redefinir Casa](../../client/src/components/rac-editor/hooks/useRacEditorController.ts) e
  [sessão da construção](../../client/src/components/rac-editor/lib/construction-site-session.ts):
  limpam a definição antes de reabrir o fluxo inicial.

- [Matriz do ciclo e
  orientação](../../client/src/components/rac-editor/@canvas/ui/adapters/house-orientation-lifecycle.smoke.test.ts):
  geometria, lados e reabertura do documento para os tipos 3 e 6.

- [E2E do ciclo e viewer 3D](../../e2e/house-lifecycle-3d.spec.ts): inserção, remoção, persistência
  local e conferência do viewer pela interface.

- [PLAY-104 — Estratégia de testes](../engineering-playbook/PLAY-104-frontend-testing.md): divisão
  da cobertura e limites da evidência automatizada.
