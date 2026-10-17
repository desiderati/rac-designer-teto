---
title: "Navegação e enquadramento do Canvas em celular horizontal"
doc_role: bug-analysis
status: confirmed
created: 2026-10-17
updated: 2026-10-17
tags: [bug-analysis, bug, mobile, canvas]
---

# Navegação e enquadramento do Canvas em celular horizontal

## 1. Identificação

- Relato: pinça altera o zoom, mas não permite reposicionar e enquadrar toda a cena.
- Fonte: vídeo de 24 segundos fornecido pelo usuário, sem áudio.
- Ambiente da investigação: local-only; interface publicada não alterada.
- Estado: correção aplicada e validada em testes; `fixed-in-test`.

## 2. Contexto e sintoma

O vídeo mostra rotação para paisagem e mudanças de escala, com partes da cena fora da área
visível. Não há acionamento visível de Fit to View; o relato inclui dificuldade em recentralizar
após zoom alto. Os testes exercitam tanto os gestos quanto o enquadramento explícito.

## 3. Contrato de falha observável

- Celular horizontal em viewport de 915 × 320 px, com toque e zoom alto.
- Arrastar com um dedo deve deslocar a câmera, inclusive acima de 767 px de largura.
- Mover dois dedos e alterar sua distância deve combinar deslocamento e zoom no mesmo gesto.
- Fit to View deve considerar a altura visível e mostrar a página completa, centralizada.
- Navegação não deve mover objetos nem alterar o documento do desenho.
- Controles: panning desktop, wheel, minimapa, zoom normal e troca de casa.

## 4. Escopo afetado

Interação touch, estado e persistência da viewport, cálculo de zoom e três contêineres do Canvas.
Sem mudanças nas coordenadas do desenho, domínio da casa, sincronização ou dados reais.

## 5. Camadas e fronteiras

| Fronteira | Defeito observado em fonte e reprodução |
|---|---|
| Touch | Um dedo dependia apenas de largura máxima de 767 px |
| Pinça | Pan era aplicado antes do zoom, cujo recálculo sobrescrevia esse deslocamento |
| Layout | Mínimo de 480 px em três contêineres excedia a altura visível horizontal |
| Zoom | Mínimo fixo de 25% recortava página de 1300 px em viewport baixa |
| Persistência | Normalização também limitava o zoom salvo a 25% |

## 6. Fluxo esperado e real

Esperado: obter coordenadas locais do gesto, calcular escala e deslocamento juntos e projetar
a página dentro da área realmente visível. Real: o arraste podia ser ignorado; quando a pinça
alterava escala, a atualização de zoom perdia o pan. O enquadramento usava altura maior que a tela.

## 7. Hipóteses causais

| Hipótese | Evidência e conclusão |
|---|---|
| Detecção mobile exclui paisagem larga | Confirmada: pan não alterava viewport em 915 px |
| Zoom sobrescreve translação | Confirmada: esperado x=340; recebido x=451,5 no gesto de teste |
| Altura mínima maior que tela | Confirmada em navegador: contêiner com 480 px em tela de 320 px |
| Limite impede redução suficiente | Confirmada: página de 325 px após fit em área de 280 px |
| Objetos precisam ser deslocados para corrigir | Descartada: câmera corrigida e documento preservado nos testes |

## 8. Evidências

- Antes: três testes unitários falharam e seis controles passaram.
- Antes: três E2E falharam nas fronteiras de layout, arraste touch e pinça combinada.
- Depois: 38 testes em sete arquivos aprovados, incluindo a guarda arquitetural.
- Depois: três novos E2E aprovados com eventos touch nativos via CDP em Chromium emulado,
  usando uma casa desenhada e documento com objetos comprovadamente presentes.
- Quatro E2E existentes aprovados: wheel com zoom, wheel/minimapa, panning desktop e touch/pinça.

## 9. Classe do defeito

Inconsistência entre navegação touch, projeção da câmera e dimensões responsivas do Canvas.

## 10. Correção aplicada

- Usar o próprio evento touch para habilitar arraste, sem depender da largura da tela.
- Aplicar zoom e translação em um único cálculo, ancorado no ponto médio dos dedos e na
  posição real do contêiner.
- Reutilizar a projeção existente para respeitar eixos em que a página já está centralizada.
- Remover altura mínima de 480 px somente dos três contêineres do Canvas.
- Calcular mínimo de zoom pela área disponível: manter 25% em janelas normais e permitir
  redução até 10% quando necessária em tela baixa.
- Preservar esse zoom no armazenamento da viewport e na reabertura.

## 11. Cenários de controle

Preservados os limites de pan, zoom máximo, geometria e documento. Testes verificam arraste com
um dedo, translação com dois dedos sem zoom, gesto combinado, enquadramento, reabertura com
zoom abaixo de 25%, mínimo normal desktop e preservação de zoom na troca de casa.

## 12. Validação executada

- Vitest: 38 testes aprovados em sete arquivos.
- Playwright: sete cenários únicos aprovados; três novos e quatro existentes.
- TypeScript da aplicação e dos E2E: aprovado.
- ESLint nos arquivos alterados: aprovado, sem avisos.
- Diff dos arquivos alterados: sem erros de whitespace.
- Fortalecer a fixture após inspeção visual: criar uma casa pela interface e exigir objetos
  presentes antes dos gestos; a primeira fixture tinha apenas estados de vistas e página vazia.
- Ajuste de fixture: aguardar o estado atualizado da viewport antes de calcular a expectativa
  do E2E de pinça; a leitura imediata anterior capturava o pan antes da atualização React.

## 13. Status de evidência

`fixed-in-test`: reprodução e validação na interface local com emulação de celular horizontal.
Não equivale a publicação ou teste posterior no aparelho do usuário.

## 14. Dúvidas residuais

Nenhuma dúvida de comportamento impede o fechamento local. Aceite no aparelho real depende de
uma publicação posterior, fora desta tarefa.

## 15. Artefatos relacionados

- `e2e/canvas-mobile-navigation.spec.ts`
- `client/src/components/rac-editor/@canvas/hooks/useCanvasViewport.smoke.test.ts`
- `client/src/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasPointerInteractions.smoke.test.ts`
- `.agents/work-items/2026-10/20261017-canvas-gestos-mobile.work-item.md`
- `.agents/changelogs/2026-10/20261017.changelog.md`

O vídeo e seus frames permanecem fora do registro versionado; testes usam dados sintéticos.
