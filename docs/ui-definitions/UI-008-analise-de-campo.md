---
title: Análise de Campo
id: UI-008
doc_type: ui-definition
doc_role: ui-definition
doc_set: ui-definitions
order: 8
status: active
lang: pt-BR
created: 2026-10-24
updated: 2026-10-24
tags: [design-system, pilotis, responsividade]
---

# Análise de Campo

## Contexto e escopo

Preservar a composição responsiva da Análise de Campo consolidada nas revisões R35, R37, R39, R47 e
R48. A identidade usa o tema TETO compartilhado, mantendo o fluxo vertical da tela e o comportamento
nativo de preparação, salvamento e retomada da casa.

As regras de composição de modais ficam na [UI-007](UI-007-modais-e-acoes-compartilhadas.md). O
editor lateral do Canvas fica na [UI-005](UI-005-menus-laterais-canvas.md). A Análise de Campo é uma
tela com planta e editor inline; não adota o painel lateral com abas do Canvas.

## Planta e espaço disponível

- A planta ocupa a largura disponível entre as laterais do conteúdo, com proporção preservada.
  Evitar um teto adicional que a mantenha estreita quando a área útil crescer.

- Manter título do piloti, navegação entre pilotis e acesso às vistas conforme a tela existente. A
  seleção na planta atualiza os controles do mesmo piloti; não criar uma seleção independente.

- Preservar destaque azul da seleção, mestre em tom de madeira, níveis nos cantos, porta,
  contraventamentos e desenho do desnível.

- Após os controles, manter apenas os recuos normais da tela. Não reservar espaço para uma barra de
  confirmação ausente nem impor uma altura mínima ao card que crie o vazio inferior observado nas
  primeiras versões da prévia.

## Composição do editor inline

O card mantém a chave `Definir como Mestre?` acima da separação dos grupos. A largura de referência
é a **largura interna do card**, medida pelo container CSS; não escolher a disposição apenas pela
largura da janela.

| Largura interna | Composição                                                                  |
|-----------------|-----------------------------------------------------------------------------|
| Acima de 605 px | Nível, tamanhos e contraventamento lado a lado.                             |
| De 408 a 605 px | Nível na primeira linha; tamanhos e contraventamento lado a lado abaixo.    |
| Até 407 px      | Três grupos empilhados; contraventamento em quatro colunas na última linha. |

Na composição larga, o grupo de nível conserva a faixa de 190 a 240 px aprovada na R48. Tamanhos
ocupam 264 px e contraventamentos 136 px; o espaço entre grupos se adapta à área restante. Nas
composições mais estreitas, o nível usa a linha disponível. Não esticar os botões para compensar
espaço livre nem reintroduzir o salto de tamanho observado durante o redimensionamento.

Os botões de tamanho e contraventamento do editor inline mantêm 60 × 60 px. Tamanhos usam quatro
colunas; contraventamentos usam duas na composição larga/intermediária e quatro quando empilhados.
Essa geometria não substitui a dos botões do painel lateral ou do editor flutuante do Canvas.

## Nível e comandos

- Manter o indicador AUTO e o nome `Nível do Piloti` centralizados no grupo.

- Posicionar `−` e `+` nas extremidades da linha, alinhados à largura útil do slider; o valor fica
  centralizado. Evitar agrupar os três no centro ou acumular um recuo adicional dentro do grupo.

- O número e a unidade permanecem em uma linha, inclusive nos limites e com duas casas decimais. O
  grupo largo precisa conservar largura suficiente para valores como `0,40 m` e `1,50 m`.

- Preservar os limites atuais do slider, regras de mestre e nível automático, alturas elegíveis e
  condições de contraventamento. Aparência compartilhada não autoriza duplicar ou reescrever essas
  regras no componente visual.

As alterações continuam passando pelos comandos e pelo salvamento existentes. A tela preserva
rascunho, erro, nova tentativa e retomada após reload. Não acrescentar Cancelar/Confirmar ao editor
inline para fazê-lo parecer o editor do Canvas.

## Acesso e exceções

`Pilotis` abre a Análise de Campo nos cards. A listagem usa esses mesmos cards quando a política
nativa reconhece mobile horizontal, inclusive acima de 767 px. `Redefinir Casa` acompanha essa
disponibilidade, mantendo seus bloqueios e confirmação. A compactação dos menus por falta de altura
no desktop é somente uma apresentação e não altera a tabela para cards nem habilita automaticamente
essas ações de mobile.

O assistente inicial pode abrir as etapas nativas de alturas, tipo da casa, lado e níveis dos cantos
antes da tela pronta. Suas modais seguem a UI-007; não confundir esse assistente com o editor inline
de uma análise já preparada. Preservar as preferências que controlam quais etapas aparecem.

## Critérios de paridade

1. Redimensionar através de 605/606 e 407/408 px **internos do card**, com a mesma casa e piloti.

2. Conferir proporção e expansão da planta, recuos laterais e ausência de reserva inferior vazia.

3. Conferir valores de nível nos extremos e intermediários, sem quebra de linha ou aproximação
   indevida dos botões `−`/`+`; testar seus limites e o slider.

4. Selecionar pilotis na planta, alternar mestre, tamanho e contraventamento e conferir o destino
   escolhido na mesma planta. Preservar os bloqueios existentes.

5. Preparar, sair, retomar e recarregar a análise; inserir a casa no Canvas e conferir o documento
   persistido. Não aceitar somente uma captura estática como prova desse ciclo.

## Fontes duráveis

- [Tela de Análise de
  Campo](../../client/src/components/construction-site/ui/HouseFieldAnalysisScreen.tsx).

- [Planta da
  análise](../../client/src/components/rac-editor/@canvas/ui/HouseFieldAnalysisPreview.tsx).

- [Editor de pilotis
  compartilhado](../../client/src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.tsx).

- [Geometria e container
  queries](../../client/src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.css).

- [Composição inline](../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx).

- [Regras de preparação](../../client/src/components/construction-site/lib/house-field-analysis.ts).

- [Ciclo real da análise](../../e2e/house-field-analysis.spec.ts).

## Proveniência e limites

As comparações históricas e o relatório local de incorporação da R48 permanecem preservados como
proveniência efêmera, conforme a UI-007. Este documento consolida o comportamento aprovado e suas
fontes atuais; não redefine regras de domínio nem declara aceite em aparelho físico.
