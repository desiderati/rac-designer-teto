---
title: "Edição do texto opcional da cerca no celular horizontal"
doc_role: bug-analysis
status: confirmed
created: 2026-10-17
updated: 2026-10-17
tags: [bug-analysis, bug, mobile, keyboard, canvas]
---

# Edição do texto opcional da cerca no celular horizontal

## 1. Identificação

- Origem: vídeo fornecido pelo usuário, 58,68 segundos sem áudio.
- Ambiente de intervenção: local-only; sem push ou publicação.
- Causa confirmada em reprodução local; correção aplicada, status de evidência `fixed-in-test`.

## 2. Contexto e Sintoma Observado

O usuário seleciona itens no Canvas em paisagem. Ao editar a cerca, o teclado aparece e o
formulário fica praticamente fora da área visível. O vídeo também mostra deslocamentos dos
objetos durante as tentativas; a investigação não atribui esses movimentos à persistência.

## 3. Contrato de Falha Observável

- Abrir a cerca por toque e editar o campo com placeholder Texto opcional.
- Evitar abrir automaticamente o teclado para uma propriedade opcional.
- Manter campo e ações alcançáveis ao reduzir a altura, inclusive quando apenas a viewport
  visual muda e a janela mantém a altura de layout.
- Confirmar deve salvar o texto e reabri-lo; Cancelar deve descartar o rascunho.
- Controle: edição desktop de Casa e Cerca e os demais editores compartilhados.

## 4. Escopo Afetado

GenericObjectEditor e a apresentação mobile do FloatingEditor. Novo hook local para altura e
posição da viewport visual. Nenhuma alteração nas regras do texto, limite de 50 caracteres,
coordenadas dos objetos, domínio, persistência, gestos do Canvas ou Drawer global.

## 5. Mapa de Camadas e Fronteiras

| Fronteira | Evidência | Status |
|---|---|---|
| Seleção touch | Cerca aberta por touchscreen.tap no navegador | observado |
| Campo | autoFocus incondicional em GenericObjectEditor | observado |
| Painel | Drawer sem altura máxima e sem conteúdo rolável | observado |
| Teclado | Vaul reposicionava o painel, sem criar rolagem para o conteúdo | observado em fonte |
| Viewport | Resize/scroll de VisualViewport com janela estável | simulado no navegador |
| Persistência | Texto confirmado aparece após reload e navegação mobile até o Canvas | observado |
| Aparelho do relato | Não disponível para validação posterior | não verificado |

## 6. Fluxo Esperado vs. Fluxo Real

Esperado: abrir propriedades, tocar no campo se necessário, digitar e alcançar as ações.
Real: o campo focava imediatamente, disparando o teclado; conteúdo maior que a altura visível
ficava acima da tela e não havia rolagem interna para recuperar o campo.

## 7. Hipóteses Causais

| Hipótese | Evidência e conclusão |
|---|---|
| Foco automático dispara teclado antes da intenção de digitar | Confirmada: teste unitário e E2E por toque falharam antes da correção |
| Falta de restrição e rolagem torna campo inacessível | Confirmada: painel começa em y=-184 numa janela de 680 × 180 px |
| Basta limitar altura e fixar ações | Insuficiente: em 120 px o rodapé interceptou o toque no campo; necessário permitir rolagem conjunta nessa condição |
| Texto opcional não é persistido | Não reproduzida: confirmar e reabrir preservam o valor, sem mudança no armazenamento |

## 8. Evidências e Pontos Envolvidos

- Reprodução antes: dois E2E falharam no foco e na geometria; Cancelar passou.
- Unitário antes: um teste de foco mobile falhou; quatro controles passaram.
- Primeiro helper de fixture usava duplo clique desktop, ignorado no mobile por contrato.
  A fixture final deriva a posição da cerca persistida, enquadra a câmera e toca no objeto real.
- A fixture aguarda a persistência antes de buscar a cerca e usa a navegação mobile existente
  depois do reload; a listagem inicial mobile não é uma perda de objetos.
- `GenericObjectEditor.tsx`: foco inicial condicionado ao desktop.
- `FloatingEditor.tsx`: altura, deslocamento inferior, rolagem, visibilidade do campo e ações.
- `useFloatingEditorViewport.ts`: inscrição e limpeza dos eventos de viewport enquanto aberto.

## 9. Classe do Defeito ou Regressão

Overflow de overlay e interação inadequada entre foco e teclado virtual em tela baixa.
A regra de texto opcional e seu salvamento não eram a causa reproduzida.

## 10. Correção Aplicada

- Preservar foco inicial no desktop; no mobile, aguardar o usuário tocar no campo.
- Limitar a altura do drawer à viewport visual e posicioná-lo acima da área coberta pelo teclado.
- Desativar o reposicionamento concorrente de inputs pelo Vaul apenas nesse drawer.
- Separar conteúdo rolável e ações, mantendo o campo focado em vista após mudanças da viewport.
- Abaixo de 160 px de altura visível, colocar conteúdo e ações no mesmo fluxo rolável:
  reservar um rodapé nessa condição deixa menos espaço que um campo de entrada.
- Usar altura da janela como fallback quando VisualViewport não estiver disponível.

## 11. Edge Cases e Cenários de Controle

- Janela de 680 × 180 px e altura extrema de 120 px, com toque real no campo.
- VisualViewport simulada com altura de 180 px e offsetTop de 20 px sem resize da janela.
- Preservar rascunho ao girar e retornar à paisagem. A proteção existente Gire seu celular
  continua cobrindo o Canvas em retrato; o teste aguarda esse estado antes de retornar.
- Confirmar, Cancelar, reload e navegação de retorno até a cerca.
- Foco desktop, limites de texto e controles dos editores de piloti, terreno e nível.

## 12. Validação Executada

- Vitest: 43 testes em nove arquivos aprovados, incluindo guarda arquitetural.
- Playwright: seis novos cenários mobile aprovados e um controle desktop existente aprovado.
  Cinco mobile passaram juntos; o cenário de rotação foi ajustado à proteção existente em
  retrato e aprovado isoladamente. A tentativa anterior usava boundingBox em diálogo oculto
  pela proteção de orientação e não era evidência de perda do rascunho.
- TypeScript da aplicação e dos E2E e ESLint: aprovados.
- Build Vite/PWA: aprovado em diretório isolado do sidecar; aviso de chunks grandes registrado.
- Inspeção visual: painel e campo acessíveis na captura com viewport visual reduzida.
- Navegador Codex acessado primeiro; runner Playwright usado para fixtures e emulação mobile.

## 13. Status de Evidência

`fixed-in-test`: falha de foco e layout reproduzida e resolvida localmente, com seleção por toque,
edição, ações e persistência. A API VisualViewport do teclado foi simulada em Chromium.
Não equivale a teste do teclado Android real ou validação no ambiente publicado.

## 14. Dúvidas Residuais de Regra de Negócio

Nenhuma dúvida de regra impede o fechamento local. Aceite no aparelho depende de uma publicação
posterior, fora desta rodada. Não foi demonstrada causa única para todos os movimentos de
objetos exibidos no vídeo.

## 15. Artefatos Relacionados

- e2e/optional-text-mobile.spec.ts.
- Testes de GenericObjectEditor e useFloatingEditorViewport.
- .agents/work-items/2026-10/20261017-editor-texto-opcional-mobile.work-item.md.
- Sidecar local do work-item: logs unitários, E2E, capturas e build isolado.
- .agents/changelogs/2026-10/20261017.changelog.md.

Vídeo e frames permanecem fora do registro versionado; testes usam somente dados sintéticos.
