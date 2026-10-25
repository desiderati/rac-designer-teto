---
title: UI-006 - Editores flutuantes e teclado no mobile
id: UI-006
doc_role: reference
doc_type: ui-definition
doc_set: ui-definitions
status: active
lang: pt-BR
created: 2026-10-18
updated: 2026-10-25
tags: [mobile, teclado, correction-pattern]
---

# UI-006 - Editores flutuantes e teclado no mobile

## Contexto e escopo

Definir o acesso aos campos e às ações dos editores de propriedades do Canvas apresentados como
painel flutuante por FloatingEditor ou painel lateral por CanvasSideEditorPanel. Os formulários do
gerenciador seguem a [UI-003](UI-003-acoes-responsivas-de-formularios.md).

A composição incorporada da R48 segue a [UI-007](UI-007-modais-e-acoes-compartilhadas.md):
cabeçalho, conteúdo e ações são regiões explícitas, com rolagem exclusiva do conteúdo. A escolha
entre apresentação flutuante e lateral fica na [UI-005](UI-005-menus-laterais-canvas.md).

O caso de referência é o texto opcional da cerca: foco automático abria o teclado e o painel ficava
acima da área visível, sem rolagem para recuperar o campo. A regra do texto e sua persistência não
eram a causa reproduzida.

## Posição e arrasto no desktop

O editor flutuante abre a 8 px do topo e mantém a largura e a composição definidas na UI-005.
Arrastar pelo cabeçalho move o painel nos dois eixos; quando não há cabeçalho, a superfície externa
recebe o arrasto. Botões, campos, links e regiões marcadas sem arrasto mantêm suas interações.

O deslocamento parte da posição efetivamente desenhada, inclusive quando o CSS limita a lateral. Não
fixar novamente o topo após iniciar o movimento. Conservar margem mínima de 8 px e limitar a posição
à viewport; ao reduzir a altura da janela ou mudar a altura do painel, reajustar sua posição
vertical para manter o acesso ao conteúdo e às ações. O arrasto não amplia o editor nem modifica a
casa, seu histórico ou seu documento persistido.

A disposição horizontal abaixo de 730 px de altura e o painel lateral no modo FAB são decisões de
apresentação, não autorização para descartar o eixo vertical do arrasto. Essas regras não se aplicam
ao editor inline da Análise de Campo.

## Foco e intenção de editar

- Abrir o editor genérico no mobile não deve focar automaticamente seu campo de texto.

- O teclado aparece quando a pessoa toca no campo. O foco inicial de desktop permanece.

- Confirmar aplica o rascunho; Cancelar o descarta.

- Ao entrar no modo mobile do Canvas, fechar os editores de piloti, objetos de parede, linhas/setas
  e terreno pelo fluxo de cancelamento. Fechá-los também ao voltar ao retrato mobile, cancelando a
  escolha de destino de contraventamento. Alterações já aplicadas permanecem. Em paisagem, permitir
  abrir novamente os editores pelas ações disponíveis da seleção.

- Enquanto o aviso de rotação estiver ativo, impedir que esses editores sejam apresentados,
  inclusive quando o estado aberto já existir na montagem ou uma seleção tardia tentar reabri-los.

- Fechar sem alterações ou cancelar a escolha de destino não deve emitir toast de erro. O fechamento
  automático só cancela o contraventamento quando esse fluxo estiver ativo.

- O aviso de rotação mantém “Voltar às construções” como ação secundária, com fundo cinza fixo
  também em hover e ao pressionar, preservando o acesso por toque e teclado.

## Área visível e acesso às ações

O painel deve usar a viewport visual disponível, acompanhando resize e scroll de VisualViewport,
inclusive quando a altura da janela não muda. A implementação usa a altura da janela como fallback
quando essa API não está disponível.

- Limitar a altura do painel e posicioná-lo acima da área coberta pelo teclado, considerando também
  o deslocamento vertical da viewport visual.

- Manter o campo focado alcançável por rolagem quando o teclado ou a orientação mudar.

- Preservar o contorno completo do foco nos campos, inclusive quando o primeiro campo encosta no
  início do conteúdo. A região rolável deve reservar espaço de pintura sem deslocar ou estreitar os
  controles; não remover o indicador nem liberar overflow da modal inteira para evitar o corte.

- Manter as ações na região de rodapé e permitir rolagem somente do conteúdo. Isso também vale
  quando a altura visual diminui; o contêiner externo, o cabeçalho e os botões não se tornam uma
  única região rolável.

- Usar os recuos reduzidos e limites da composição compartilhada em alturas baixas, preservando
  foco, acesso ao campo e às ações. A antiga exceção de juntar conteúdo e ações abaixo de 160 px não
  pertence à composição atual.

O painel lateral compartilha essa leitura da viewport visual, usa altura de conteúdo até 425 px para
objetos e terreno e altura de 425 px para pilotis, limitada a `viewport.height - 16px` e
centralizada com recuos verticais mínimos de 8 px. Até 999 px de largura, a direita fica colada e
somente os cantos esquerdos são arredondados; a partir de 1000 px, há recuo direito de 16 px e
quatro cantos arredondados. Planta, abas e controles rolam juntos dentro de `content`, e ações
presentes ficam fora. O Drawer do editor flutuante mantém o limite visual e o deslocamento inferior
calculados por `useFloatingEditorViewport`, com `repositionInputs={false}` para evitar duas
estratégias concorrentes de deslocamento. Esses ajustes de foco e teclado ficam localizados nos
editores; não mudam os modos dos formulários do gerenciador.

Compactar menus por altura no desktop não ativa o protocolo touch nem o aviso de rotação. Fechar
automaticamente ao entrar em mobile ou retrato usa a classificação nativa, preservando uma edição
durante resize ou abertura do teclado dentro da mesma orientação.

## Validação e limites

No desktop, abrir no topo aprovado, arrastar nos dois eixos e conferir dimensões estáveis. Levar o
painel até o limite inferior, reduzir a altura e verificar a contenção. Cancelar e comparar o
documento da casa antes e depois: mover o editor não é mover o desenho.

Exercitar o toque no campo e nas ações em paisagem baixa, confirmar e reabrir após recarga e
cancelar. Conferir o fechamento dos editores ao entrar no mobile e ao girar para retrato; retornar à
paisagem deve liberar o Canvas sem reabrir o editor anterior. Redimensionar dentro da mesma
orientação não deve fechar uma edição, inclusive ao abrir o teclado.

Altura reduzida e VisualViewport simulada são evidência local do contrato de layout. O aceite do
teclado Android real depende de teste no aparelho. O roteiro e as camadas de teste estão no
[PLAY-104](../engineering-playbook/PLAY-104-frontend-testing.md).

## Fontes duráveis

- [FloatingEditor](../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx).

- [Posição e limites do
  arrasto](../../client/src/components/rac-editor/@modals/hooks/useFloatingEditor.ts).

- [Regressão do arrasto no
  componente](../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.drag.test.tsx)
  e [no Canvas real](../../e2e/floating-editor-drag.spec.ts).

- [Superfície lateral
  compartilhada](../../client/src/components/rac-editor/@modals/ui/editors/CanvasSideEditorPanel.tsx).

- [Leitura da viewport
  visual](../../client/src/components/rac-editor/@modals/hooks/useFloatingEditorViewport.ts).

- [Editor genérico e
  foco](../../client/src/components/rac-editor/@modals/ui/editors/generic/GenericObjectEditor.tsx).

- [Regressão mobile de texto opcional](../../e2e/optional-text-mobile.spec.ts).

- [Análise do
  caso](../../.agents/bug-analysis/2026-10/20261017-editor-texto-opcional-mobile.bug-analysis.md).
