---
title: Contorno de foco cortado nos editores de componentes
doc_role: bug-analysis
status: confirmed
created: 2026-10-25
updated: 2026-10-25
tags: [regression, acessibilidade, modais]
---

# Contorno de foco cortado nos editores de componentes

## 1. Identificação

Relato do usuário com captura da edição de Casa. Ambiente local, porta 5200. Causa confirmada,
correção aplicada e verificada no navegador interno; sem operação remota, mutação Git ou alteração
de dados da casa. Esta análise não declara aceite humano posterior nem validação em aparelho físico.

## 2. Contexto e sintoma observado

O campo de texto mostrava uma linha azul inferior e fragmentos nos cantos, em vez do contorno de
foco completo. A reprodução usou a Casa já existente no Canvas, por duplo clique, sem alterar ou
confirmar seu texto. O campo tinha valor Casa e foco real; não era uma falha de digitação ou cache.

## 3. Contrato de falha observável

- Abrir um editor genérico no desktop e focar o primeiro campo: seu contorno deve permanecer
  inteiro, com a posição, largura, altura, fonte e cores aprovadas.

- Antes da correção, a reprodução E2E de Casa falha na contenção da pintura do foco contra o
  scrollport de conteúdo, reproduzindo a fronteira do relato.

- Controles: painel lateral nativo, campos de Cerca/Muro/Linha Reta, Confirmar/Cancelar, foco
  desktop/mobile, rotação, viewport visual, arrasto e rolagem exclusiva do conteúdo.

- Critério de sucesso: foco completo no navegador e medição sem corte, sem estreitar/deslocar o
  campo, ampliar a modal ou tornar toda a superfície rolável.

## 4. Escopo afetado

O GenericObjectEditor é compartilhado pelos editores textuais dos componentes. A correção de
produção altera somente sua classe de apresentação flutuante e o CSS correspondente. O Input,
ModalFrame, tema global, painel lateral, regras de texto/cor e handlers de dados ficam intactos.

## 5. Mapa de camadas e fronteiras

| Fronteira           | Responsabilidade                    | Evidência                                                |
|---------------------|-------------------------------------|----------------------------------------------------------|
| Seleção/abertura    | Abrir o editor real do componente   | Reprodução IAB e helpers nativos de E2E.                 |
| GenericObjectEditor | Campo, rascunho, paleta e ações     | Mesmos valores e handlers; classe local para a correção. |
| Input e tema        | Outline de foco e tipografia        | Outline de 2 px com offset de 3 px.                      |
| ModalFrame/content  | Recortar e rolar somente o conteúdo | Overflow auto, sem folga de pintura no primeiro campo.   |
| Persistência        | Aplicar somente ao confirmar        | Testes de confirmação, descarte e reabertura.            |

## 6. Fluxo esperado vs. fluxo real

O scrollport tinha a mesma origem e largura do campo. O foco ocupa 5 px além de sua borda; o
scrollport recortava essa pintura no topo e nas laterais. A linha inferior continuava visível porque
havia conteúdo abaixo do campo. O layout externo cabia na tela, portanto verificar somente overflow
da página não detectava o defeito.

## 7. Hipóteses causais

| Hipótese                                               | Confronto com a evidência                                                                         | Resultado              |
|--------------------------------------------------------|---------------------------------------------------------------------------------------------------|------------------------|
| Corte no scrollport                                    | Campo alinhado às bordas de uma região com overflow auto; outline externo maior que a área livre. | Confirmada.            |
| Valor, digitação ou foco ausente                       | O campo continha Casa e era o elemento ativo com focus-visible.                                   | Não explica o sintoma. |
| Correção por remover o foco ou liberar overflow global | Ocultaria o problema ou violaria a rolagem aprovada da R48.                                       | Rejeitada.             |

## 8. Evidências e pontos envolvidos

Em 1243 × 1077 px, antes e depois da correção:

| Medida                         | Antes                | Depois              |
|--------------------------------|----------------------|---------------------|
| Modal: x/y/largura/altura      | 88 / 8 / 304 / 299   | 88 / 8 / 304 / 299  |
| Campo: x/y/largura/altura      | 105 / 25 / 270 / 40  | 105 / 25 / 270 / 40 |
| Scrollport: x/y/largura/altura | 105 / 25 / 270 / 193 | 99 / 19 / 282 / 205 |
| Outline / offset               | 2 / 3 px             | 2 / 3 px            |

Fonte Inter 14 px/20 px, cor, fundo e valor permaneceram iguais nas medidas do navegador. As
capturas e os JSONs antes/depois estão preservados na continuidade local desta correção.

## 9. Classe do defeito

Recorte de pintura de um estado de acessibilidade em contêiner rolável. Não é overflow do valor,
erro de regra de negócio ou falta de largura da modal.

## 10. Correção aplicada

Marcar a apresentação flutuante genérica e reservar 6 px no scrollport, compensados por margem
negativa de mesmo valor. Assim, o foco cabe no padding já existente da superfície, sem somar recuo
ao campo ou mudar a geometria externa. O overflow continua auto; o painel lateral com padding
próprio é controle de regressão. A Análise de Campo e o editor de pilotis não recebem a regra.

## 11. Edge cases e controles

Conferir nomes vazios/longos, diferentes tipos de componente, passagem para painel compacto,
Cancelamento, edição confirmada, retorno ao retrato e viewport visual reduzida. Os testes de campo
não substituem os testes específicos de gestos ou o teclado físico Android.

## 12. Validação executada

A reprodução falhou antes da correção pelo corte na região content. Depois, passou a conferência IAB
com geometria idêntica. A execução conjunta final passou nos 14 cenários E2E, sem falhas,
instabilidade ou repetições: quatro cenários desktop de foco, sete cenários mobile e três controles
de arrasto, edição e regiões de rolagem. O relatório final e os resultados estáticos estão
preservados no work-item desta correção.

Os 27 testes focados de componentes, tipos da aplicação/E2E, lint focado e build passaram. O build
mantém o aviso de tamanho de chunks. Não se declara execução da suíte global ou de outro navegador.

Os roteiros E2E receberam somente preparação compatível com o estado de um usuário que já concluiu
as dicas, abertura pela ação explícita Editar e o cancelamento ao entrar no retrato já definido na
UI-006. As tentativas anteriores com bloqueios de tutorial ou abertura antiga foram preservadas; não
houve mudança nos tours, nos gestos ou no cancelamento da aplicação para fazer os testes passar.

## 13. Status de evidência

Reproduced, root-cause-confirmed, fixed-in-test e validated-at-original-boundary no navegador local.
O aceite posterior do usuário e o comportamento de teclado físico permanecem evidências distintas.

## 14. Dúvidas residuais de regra de negócio

Nenhuma regra de negócio precisou ser alterada. O fluxo nativo de seleção/Editar e o fechamento no
retrato foram preservados; os testes antigos foram confrontados com esses contratos.

## 15. Fontes e proveniência

- [GenericObjectEditor](../../../client/src/components/rac-editor/@modals/ui/editors/generic/GenericObjectEditor.tsx).

- [CSS dos editores
  flutuantes](../../../client/src/components/rac-editor/@modals/ui/editors/FloatingEditor.css).

- [Composição ModalFrame](../../../client/src/components/ui/ModalFrame.tsx).

- [Tema e foco](../../../client/src/rac-ui.css).

- [Contrato de editores e
  teclado](../../../docs/ui-definitions/UI-006-editores-flutuantes-e-teclado-mobile.md).

O teste de regressão local novo é e2e/component-editor-focus.spec.ts; a regressão de teclado usa
e2e/optional-text-mobile.spec.ts. A continuidade e os originais estão em
.agents/work-items/2026-10/20261025-foco-editores-componentes.work-item.md e sua pasta adjacente.
Esses registros efêmeros são proveniência, não links duráveis. Não houve commit, push ou deploy.
