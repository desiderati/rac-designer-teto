---
title: UI-006 - Editores flutuantes e teclado no mobile
id: UI-006
doc_role: reference
doc_type: ui-definition
doc_set: ui-definitions
status: active
lang: pt-BR
created: 2026-10-18
updated: 2026-10-18
tags: [mobile, teclado, correction-pattern]
---

# UI-006 - Editores flutuantes e teclado no mobile

## Contexto e escopo

Definir o acesso aos campos e às ações dos editores de propriedades do Canvas apresentados como
painel flutuante mobile por FloatingEditor. Os formulários do gerenciador seguem a
[UI-003](UI-003-acoes-responsivas-de-formularios.md).

O caso de referência é o texto opcional da cerca: foco automático abria o teclado e o painel ficava
acima da área visível, sem rolagem para recuperar o campo. A regra do texto e sua persistência não
eram a causa reproduzida.

## Foco e intenção de editar

- Abrir o editor genérico no mobile não deve focar automaticamente seu campo de texto.

- O teclado aparece quando a pessoa toca no campo. O foco inicial de desktop permanece.

- Confirmar aplica o rascunho; Cancelar o descarta. Girar o aparelho deve preservar o rascunho
  enquanto a edição continuar aberta.

## Área visível e acesso às ações

O painel deve usar a viewport visual disponível, acompanhando resize e scroll de VisualViewport,
inclusive quando a altura da janela não muda. A implementação usa a altura da janela como fallback
quando essa API não está disponível.

- Limitar a altura do painel e posicioná-lo acima da área coberta pelo teclado, considerando também
  o deslocamento vertical da viewport visual.

- Manter o campo focado alcançável por rolagem quando o teclado ou a orientação mudar.

- Com altura suficiente, permitir rolagem do conteúdo e manter as ações separadas.

- Abaixo de 160 px de altura visual, colocar conteúdo e ações no mesmo fluxo rolável. Nesse caso,
  reservar um rodapé pode consumir o espaço necessário para tocar no campo.

A margem atual do painel é de 8 px em relação à altura visual. Esses limites ficam localizados em
FloatingEditor; não redefinem o comportamento do Drawer global ou dos formulários do gerenciador. O
reposicionamento automático de inputs do Vaul fica desativado somente nesse painel, evitando duas
estratégias concorrentes de deslocamento.

## Validação e limites

Exercitar o toque no campo e nas ações em paisagem baixa, confirmar e reabrir após recarga, cancelar
e girar mantendo o rascunho. A proteção de orientação do Canvas continua vigente: se o aviso cobrir
a edição em retrato, conferir a continuidade ao retornar à paisagem.

Altura reduzida e VisualViewport simulada são evidência local do contrato de layout. O aceite do
teclado Android real depende de teste no aparelho. O roteiro e as camadas de teste estão no
[PLAY-104](../engineering-playbook/PLAY-104-frontend-testing.md).

## Fontes duráveis

- [FloatingEditor](../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx).

- [Leitura da viewport
  visual](../../client/src/components/rac-editor/@modals/hooks/useFloatingEditorViewport.ts).

- [Editor genérico e
  foco](../../client/src/components/rac-editor/@modals/ui/editors/generic/GenericObjectEditor.tsx).

- [Regressão mobile de texto opcional](../../e2e/optional-text-mobile.spec.ts).

- [Análise do
  caso](../../.agents/bug-analysis/2026-10/20261017-editor-texto-opcional-mobile.bug-analysis.md).
