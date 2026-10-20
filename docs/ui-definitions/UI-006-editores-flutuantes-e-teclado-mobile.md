---
title: UI-006 - Editores flutuantes e teclado no mobile
id: UI-006
doc_role: reference
doc_type: ui-definition
doc_set: ui-definitions
status: active
lang: pt-BR
created: 2026-10-18
updated: 2026-10-20
tags: [mobile, teclado, correction-pattern]
---

# UI-006 - Editores flutuantes e teclado no mobile

## Contexto e escopo

Definir o acesso aos campos e às ações dos editores de propriedades do Canvas apresentados como
painel flutuante por FloatingEditor ou painel lateral por CanvasSideEditorPanel. Os formulários do gerenciador seguem a
[UI-003](UI-003-acoes-responsivas-de-formularios.md).

O caso de referência é o texto opcional da cerca: foco automático abria o teclado e o painel ficava
acima da área visível, sem rolagem para recuperar o campo. A regra do texto e sua persistência não
eram a causa reproduzida.

## Foco e intenção de editar

- Abrir o editor genérico no mobile não deve focar automaticamente seu campo de texto.

- O teclado aparece quando a pessoa toca no campo. O foco inicial de desktop permanece.

- Confirmar aplica o rascunho; Cancelar o descarta.

- Ao entrar no modo mobile do Canvas, fechar os editores de piloti, objetos de parede,
  linhas/setas e terreno pelo fluxo de cancelamento. Fechá-los também ao voltar ao retrato mobile,
  cancelando a escolha de destino de contraventamento. Alterações já aplicadas permanecem.
  Em paisagem, permitir abrir novamente os editores pelas ações disponíveis da seleção.

- Enquanto o aviso de rotação estiver ativo, impedir que esses editores sejam apresentados,
  inclusive quando o estado aberto já existir na montagem ou uma seleção tardia tentar reabri-los.

- Fechar sem alterações ou cancelar a escolha de destino não deve emitir toast de erro.
  O fechamento automático só cancela o contraventamento quando esse fluxo estiver ativo.

- O aviso de rotação mantém “Voltar às construções” como ação secundária, com fundo cinza fixo
  também em hover e ao pressionar, preservando o acesso por toque e teclado.

## Área visível e acesso às ações

O painel deve usar a viewport visual disponível, acompanhando resize e scroll de VisualViewport,
inclusive quando a altura da janela não muda. A implementação usa a altura da janela como fallback
quando essa API não está disponível.

- Limitar a altura do painel e posicioná-lo acima da área coberta pelo teclado, considerando também
  o deslocamento vertical da viewport visual.

- Manter o campo focado alcançável por rolagem quando o teclado ou a orientação mudar.

- Com altura suficiente, permitir rolagem do painel e manter as ações no rodapé.

- Abaixo de 160 px de altura visual, colocar conteúdo e ações no mesmo fluxo rolável. Nesse caso,
  reservar um rodapé pode consumir o espaço necessário para tocar no campo.

A margem atual do painel é de 8 px em relação à altura visual. A superfície lateral do Canvas mobile
horizontal compartilha essa leitura da viewport, usa altura de conteúdo até 425 px para objetos e
terreno e altura de 425 px para pilotis, sempre limitada à área disponível. A direita fica colada e
somente os cantos esquerdos são arredondados; conteúdo e abas rolam com o painel inteiro.
Esses limites ficam localizados nos editores; não redefinem o comportamento do Drawer global ou dos formulários do gerenciador. O
reposicionamento automático de inputs do Vaul fica desativado somente nesse painel, evitando duas
estratégias concorrentes de deslocamento.

## Validação e limites

Exercitar o toque no campo e nas ações em paisagem baixa, confirmar e reabrir após recarga e cancelar.
Conferir o fechamento dos editores ao entrar no mobile e ao girar para retrato; retornar à paisagem
deve liberar o Canvas sem reabrir o editor anterior. Redimensionar dentro da mesma orientação não
deve fechar uma edição, inclusive ao abrir o teclado.

Altura reduzida e VisualViewport simulada são evidência local do contrato de layout. O aceite do
teclado Android real depende de teste no aparelho. O roteiro e as camadas de teste estão no
[PLAY-104](../engineering-playbook/PLAY-104-frontend-testing.md).

## Fontes duráveis

- [FloatingEditor](../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx).

- [Superfície lateral compartilhada](../../client/src/components/rac-editor/@modals/ui/editors/CanvasSideEditorPanel.tsx).

- [Leitura da viewport
  visual](../../client/src/components/rac-editor/@modals/hooks/useFloatingEditorViewport.ts).

- [Editor genérico e
  foco](../../client/src/components/rac-editor/@modals/ui/editors/generic/GenericObjectEditor.tsx).

- [Regressão mobile de texto opcional](../../e2e/optional-text-mobile.spec.ts).

- [Análise do
  caso](../../.agents/bug-analysis/2026-10/20261017-editor-texto-opcional-mobile.bug-analysis.md).
