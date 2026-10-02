---
title: "Toast com fechamento escuro sobre superfície clara"
doc_role: bug-analysis
status: confirmed
created: 2026-10-02
updated: 2026-10-02
tags: [bug-analysis, ui, regression]
---

# Toast com fechamento escuro sobre superfície clara

## Identificação e contexto

Relato de QA visual no ambiente local: screenshots do erro PDF e do sucesso da inserção 3D mostram
um botão preto para fechar, embora a identidade aprovada use um X discreto sobre superfície clara.
Correção aplicada no código; evidência `fixed-in-test`, ainda `partial` na fronteira visual.

## Contrato de falha e escopo

O host deve permanecer claro mesmo quando o ambiente está escuro. Reprodução substituta: montar o
Toaster com tema escuro e verificar o atributo de tema do host. Controles: ação PWA permanece
clicável e erro PDF permanece fechável. A confirmação na fronteira original requer novo screenshot.

Afeta a apresentação dos toasts Sonner, não as regras de geração PDF ou inserção 3D.

## Camadas, fluxo e causa

O CSS da aplicação fixa a superfície clara, mas `sonner.tsx` ainda repassava `useTheme()` ao host. A
biblioteca aplica uma regra específica de fechamento quando `data-theme='dark'`, com fundo
`--normal-bg: #000` e texto claro. Essa regra prevalece sobre a regra local menos específica.

A hipótese de tema parcialmente fixado é sustentada pelo CSS instalado e pelo teste que recebeu
`data-theme='dark'` antes da correção. A conexão IAB está interrompida após timeout; não houve
reprodução em navegador neste ciclo. O substituto cobre o estado DOM que ativa a regra causal.

## Correção e controles

Removida a dependência de `useTheme` do adaptador; `theme='light'` é aplicado após as propriedades
do host, preservando o contrato claro inclusive com uma propriedade de tema divergente. Não foi
necessário aumentar especificidade ou usar `!important`. Ações, dimensões e cores semânticas
permanecem como aprovadas.

O teste verifica ambiente escuro, propriedade escura explícita e fechamento manual. Os testes de
ação PWA e transição de carregamento para erro permanecem como controles.

## Validação

- Antes: o teste de tema falhou com valor real `dark`, esperado `light`.
- Depois: 10 testes aprovados em `sonner.smoke.test.tsx` e `sonner-dismissal.smoke.test.tsx`.
- ESLint dos dois arquivos alterados: exit 0.
- Sem nova conexão de navegador, screenshot ou alegação de aceite visual final.

## Esclarecimento posterior — duração

O usuário confirmou fechamento automático após 30 segundos, pausado enquanto o mouse estiver sobre
o toast. O adaptador passou a fixar 30 segundos para `toast.error`; o PDF deixou de solicitar
`Infinity`. O Sonner mantém a pausa por hover e retoma apenas o tempo restante. Teste com o
componente real e relógio controlado aprovou a transição de carregamento para erro, pausa por
60 segundos e fechamento após consumir os 20 segundos restantes. Conferência visual segue pendente.

## Referências de código

- `client/src/components/ui/sonner.tsx`.
- `client/src/components/ui/sonner-dismissal.smoke.test.tsx`.
- `client/src/index.css`.
- `node_modules/sonner/dist/styles.css`: regra de fechamento escuro, dependência local instalada.
- `docs/ui-definitions/UI-004-avisos-e-progresso-pdf.md`: identidade aprovada.
