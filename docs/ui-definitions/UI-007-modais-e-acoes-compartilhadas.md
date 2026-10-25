---
title: Modais e ações compartilhadas
id: UI-007
doc_type: ui-definition
doc_role: ui-definition
doc_set: ui-definitions
order: 7
status: active
lang: pt-BR
created: 2026-10-24
updated: 2026-10-25
tags: [design-system, modais, responsividade]
---

# Modais e ações compartilhadas

## Contexto e escopo

Consolidar o contrato acumulado da R48 incorporado à aplicação: confirmações, configurações,
checklist, conta e sincronização, inserção de casa, imagens, fotos, PDF, 3D e editores flutuantes.
As regras de negócio, estados, callbacks, preferências e persistência continuam nos fluxos nativos.

O [DESIGN.md](../../DESIGN.md) define a identidade geral. Esta definição organiza a composição; a
[UI-004](UI-004-avisos-e-progresso-pdf.md) mantém as particularidades de toast, PDF e 3D; a
[UI-005](UI-005-menus-laterais-canvas.md) mantém os menus e editores do Canvas; a
[UI-006](UI-006-editores-flutuantes-e-teclado-mobile.md) mantém foco e teclado. A Análise de Campo
segue a [UI-008](UI-008-analise-de-campo.md), com editor inline na página.

## Resumo da Casa

O botão de materiais da listagem abre `Resumo da Casa` como Dialog centralizado no desktop e Drawer
inferior no mobile. A política nativa usa largura até 767 px ou ponteiro coarse com altura até 600
px; a compactação dos menus por altura, sozinha, não troca a apresentação desktop.

Abrir por clique, toque ou ativação pelo teclado, sem abertura automática por hover ou foco. No
mobile, o título fica centralizado e a barra horizontal superior é um botão de fechamento com alvo
de 44 px. No desktop, manter o título à esquerda e usar o botão de fechar no cabeçalho. Escape e
clique fora também fecham e devolvem o foco ao botão de origem. O cabeçalho e o fechamento ficam
fixos; somente o conteúdo rola.

Preservar a mini planta, a orientação da porta, os valores e a ordem dos materiais. O resumo
continua disponível para casas arquivadas, opaco e fora da superfície esmaecida do card. Abrir ou
fechar o resumo não navega para a edição da casa. Alterar a viewport mantém o resumo aberto e troca
somente sua apresentação.

## Regiões e propriedade da rolagem

`ModalFrame` compõe três regiões explícitas: `header`, `content` e `actions`. Cabeçalho e ações,
quando presentes, ficam fora da região rolável e não encolhem para acomodar o conteúdo. Apenas
`content` pode rolar; a superfície externa permanece limitada à viewport e sem rolagem própria.

Essa composição vale para Dialog, AlertDialog, Drawer, Sheet e painéis laterais. Não aplicar
`overflow-auto` ao contêiner externo para corrigir falta de altura. O conteúdo precisa de
`min-height: 0` para ocupar somente o espaço restante. A superfície comum limita a altura a `100dvh
- 16px`; editores com teclado usam também a viewport visual descrita na UI-006.

Na edição lateral de pilotis, planta, abas e controles pertencem juntos ao conteúdo rolável. Nos
painéis com Cancelar/Confirmar, as ações ficam na região própria. Isso conserva o fluxo da planta
sem criar uma segunda rolagem ou deslocar os botões para fora do painel.

A Análise de Campo e os formulários são telas com rolagem de página. Não transformar seu editor
inline em uma modal nem reservar um rodapé de confirmação que esses fluxos não possuem.

## Cabeçalhos, recuos e superfícies

- O padrão usa Inter, título de 20 px/26 px e descrição de 14 px/21 px. O título comum fica à
  esquerda; centralizar somente as apresentações que adotaram esse alinhamento.

- Configurações e `Checklist da RAC` usam `headerTone='section'`: título centralizado e superfície
  cinza-clara, compatível com a região das ações. O alerta do checklist é o primeiro conteúdo e
  conserva recuo superior após o cabeçalho; não fica colado à faixa cinza.

- Cabeçalho, descrição e primeiro bloco devem ter recuos coerentes. Arquivo, prévia e estatísticas
  da revisão de imagem alinham com o texto, também no Drawer. Não somar um segundo padding lateral
  do consumidor ao padding já fornecido pela composição.

- O padrão tem padding e espaçamento de 16 px. Variações explícitas de cabeçalho e rodapé pertencem
  ao componente compartilhado ou à exceção documentada. Eliminar margens redundantes entre conteúdo
  e ações, sem remover o espaço da superfície cinza do rodapé.

- Confirmações usam ícone e título na primeira linha; a explicação ocupa a largura disponível na
  região de conteúdo. Riscos, avisos e comparação de versões permanecem completos. A versão remota
  mantém a superfície azul; erros continuam usando o feedback do fluxo.

## Ações e ordem de foco

`ModalActions` decide a composição pela **largura da viewport**, e não pela largura do painel ou
pelo tipo de dispositivo:

| Largura            | Apresentação de duas ações                   | Ordem no DOM e no teclado |
|--------------------|----------------------------------------------|---------------------------|
| Menor que 460 px   | Uma coluna; ação principal acima de Cancelar | Principal, Cancelar       |
| A partir de 460 px | Duas colunas iguais; Cancelar à esquerda     | Cancelar, principal       |

O valor de 460 px já usa duas colunas. Uma ação única ocupa a largura disponível; não criar um
Cancelar artificial. Texto longo pode quebrar dentro do botão, sem ultrapassar a superfície.

`ActionDock` posiciona a região, mas não define sozinho a ordem dos botões. Usar `ModalActions` para
preservar a correspondência entre ordem visual, DOM e teclado. Os alvos comuns têm pelo menos 44 px;
**os botões dos editores flutuantes conservam os 40 px aprovados**, enquanto os painéis laterais
usam o padrão de 44 px. Não uniformizar essas exceções por conveniência.

Os formulários do gerenciador mantêm `FormActionDock` e seus pontos de transição próprios na
[UI-003](UI-003-acoes-responsivas-de-formularios.md). O limite de 460 px não substitui os modos
Full, Compact e Mobile desses formulários.

## Responsividade e exceções aprovadas

| Família                              | Contrato a preservar                                                                                                                                                                                         |
|--------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Modais comuns em paisagem até 999 px | A apresentação padrão usa 75% da largura, com teto de 720 px para Dialog e 512 px para AlertDialog. O assistente de pilotis conserva seu teto de 400 px.                                                     |
| PDF                                  | Superfície branca própria, largura útil até 892 px, limite da viewport e toolbar completa. Não herdar a redução geral para 75% nem restaurar a antiga regra de 50%.                                          |
| 3D                                   | Cena ocupa o espaço restante do cabeçalho, sem espaçamento duplo. A expansão preserva a largura total disponível e a margem de 8 px; não limitar fullscreen pela regra de 75%.                               |
| Imagens e fotos                      | Revisão de imagem segue os recuos comuns; PhotoViewer preserva sua apresentação escura e seus controles. Processamento, qualidade e erros permanecem nativos.                                                |
| Toasts                               | Preservar anatomia, cores, durações, ações e dispensa da UI-004. No mobile, centralizar e rolar somente o conteúdo longo, mantendo o X no cartão.                                                            |
| Tour e orientação                    | Preservar o balão amarelo, o progresso salvo e os alvos. O aviso de orientação tem prioridade no Canvas vertical bloqueado. PDF e tour usam a mesma política de compactação dos menus do restante do Canvas. |
| Landing                              | Preservar a apresentação original; a aplicação de `.rac-theme` é explícita nas superfícies do produto e nos portais necessários.                                                                             |

Não aplicar a largura de uma família a todas as demais. O PDF usa `appearance='native'`; o viewer de
fotos usa a apresentação escura. Essas exceções visuais continuam respeitando a separação entre
cabeçalho, conteúdo e ações quando a composição possuir essas regiões.

## Critérios de paridade

1. Em conteúdo longo e viewport baixa, rolar somente o conteúdo; título, fechamento e ações
   permanecem acessíveis e a superfície externa não ganha scrollbar.

2. Conferir 459, 460 e 461 px com teclado e texto longo: ordem visual e DOM devem coincidir.

3. Abrir Configurações e checklist e conferir título cinza centralizado, primeiro conteúdo com recuo
   superior e ausência de borda interna redundante.

4. Em revisão de imagem, alinhar arquivo, prévia e métricas com título e descrição, sem recuo
   lateral acumulado. Não oferecer preservar qualidade quando o arquivo não foi reduzido.

5. Em PDF a 510 × 493 e 390 × 240, conferir largura útil, zoom, páginas e download sem corte da
   toolbar. No 3D, conferir cena e controles antes e depois de expandir.

6. Reabrir os fluxos e verificar callbacks de Confirmar/Cancelar, rascunho, histórico, persistência
   e bloqueios nativos. Paridade visual não substitui essa verificação funcional.

7. No Resumo da Casa, conferir 767/768 px, retrato e paisagem com toque e desktop baixo com ponteiro
   fino. Abrir pelo teclado, fechar pela barra/X e por Escape, devolver o foco e manter o resumo
   aberto durante a troca de apresentação. Conferir mini planta, porta e materiais, conteúdo longo
   rolável e título centralizado somente no Drawer.

## Fontes duráveis

- [Resumo da Casa](../../client/src/components/construction-site/ui/HouseMaterialsSummary.tsx).
- [Regressão do resumo responsivo](../../e2e/house-summary-responsive.spec.ts).
- [Composição ModalFrame](../../client/src/components/ui/ModalFrame.tsx).
- [Ordem responsiva de ações](../../client/src/components/ui/ModalActions.tsx).
- [ActionDock](../../client/src/components/ui/ActionDock.tsx).
- [Primitiva Dialog](../../client/src/components/ui/dialog.tsx).
- [Tema e regras compartilhadas](../../client/src/rac-ui.css).
- [Prévia real do PDF](../../client/src/components/rac-editor/@modals/ui/RacPdfPreviewModal.tsx).
- [Viewer 3D](../../client/src/components/rac-editor/@viewer-3d/ui/House3DViewer.tsx).
- [Regressão de rolagem e ações](../../e2e/r48-modal-contract.spec.ts).
- [Estratégia de validação frontend](../engineering-playbook/PLAY-104-frontend-testing.md).

## Proveniência local e limites

O conjunto acumulado aprovado da R48 tem digest de fontes
`25bf54bb4893933ea9c858bd954166fc8784451df8f25fbfd97b97d0f9198355`. A cópia selada em
`outputs/proposta-identidade-visual-20261021/reference-r48-final/` e o relatório de incorporação no
work-item local de 24/10/2026 são proveniência efêmera preservada, sem funcionar como links duráveis
ou requisito para iniciar um servidor de revisão. As fontes e testes acima sustentam o contrato
atual. O aceite humano das decisões da R48 e as provas técnicas da incorporação são evidências
distintas; esta documentação não declara novo aceite visual da aplicação ou de aparelho físico.
