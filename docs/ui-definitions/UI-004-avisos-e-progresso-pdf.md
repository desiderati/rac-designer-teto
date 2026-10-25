---
title: Identidade visual e comportamento dos Toasts
id: UI-004
doc_type: ui-definition
doc_role: ui-definition
doc_set: ui-definitions
order: 4
status: active
lang: pt-BR
updated: 2026-10-24
---

# Identidade visual e comportamento dos Toasts

## Objetivo e escopo

Toasts comunicam resultados, orientações e progresso sem tirar o foco do desenho. Esta definição
consolida a identidade TETO aprovada em 02/10/2026 para mensagens simples, notificações com ações,
uploads, atualização da aplicação, geração de PDF e inserção de imagem 3D.

A R48 preserva essas cores e comportamentos e consolida a centralização mobile, o fechamento e a
rolagem interna. A composição comum das modais está na
[UI-007](UI-007-modais-e-acoes-compartilhadas.md).

O padrão combina uma faixa compacta de estado com uma trilha interna quando a operação possui
etapas. Mensagens simples não recebem etapas artificiais. As regras de domínio continuam nos fluxos
que emitem as notificações.

## Anatomia compartilhada

- Cartão de até 360 px, com 16 px de margem lateral em telas estreitas e raio de 8 px.

- Faixa de estado discreta à esquerda, ícone, título e descrição opcional.

- Inter; título de 14 px em negrito, detalhes e etapas de 12 px; rótulo de estado de 11 px.

- Sombra discreta e conteúdo que se adapta à largura disponível.

- Ações e fechamento apenas quando fazem parte do fluxo. Mensagens não devem ganhar botões
  decorativos ou títulos redundantes.

- O fundo neutro é cinza-claro fixo `#f8fafc`, inclusive quando o ambiente está no tema escuro.

## Cores e estados

| Estado                            | Superfície              | Texto e significado                                     |
|-----------------------------------|-------------------------|---------------------------------------------------------|
| Neutro, informação e carregamento | `#f8fafc`               | Texto escuro; ícone de informação ou atividade.         |
| Sucesso                           | `hsl(145 54% 95%)`      | Verde-escuro `hsl(151 67% 24%)`, com check.             |
| Aviso                             | `hsl(45 95% 94%)`       | Amarelo-escuro `hsl(36 82% 27%)`, com ícone de atenção. |
| Erro                              | Token `--error-surface` | Token `--error-ink`, com `CircleAlert`.                 |

A cor nunca é a única indicação de estado: usar também ícone e texto. Informação não deve adotar o
amarelo de aviso. A superfície clara solicitada não acompanha automaticamente o tema do sistema.

## Botões

O botão principal do toast preserva `#2563eb`, texto branco, hover `#1d4ed8` e raio de 8 px. O
secundário tem fundo branco, texto `#334155` e borda `#cbd5e1`. Ambos usam texto de 14 px, peso 600,
altura mínima de 40 px e alvo de 44 px no celular.

Essas cores são próprias dos toasts e da decisão de imagem 3D; não herdam automaticamente o ciano
dos formulários e modais com `.rac-theme`.

Quando apresentados juntos, **Inserir** e **Descartar** têm a mesma largura e altura. A igualdade de
dimensões não remove a hierarquia: Inserir permanece azul; Descartar permanece contornado. Preservar
foco visível, rótulos acessíveis e acionamento por teclado.

## Mensagens e notificações com ações

O host Sonner mantém a fila, o ciclo de exibição e o fechamento. No desktop, a pilha fica no canto
inferior direito com até três avisos visíveis; no celular, no topo central, respeitando a área
segura e o limite de dois. Conteúdo longo no celular pode rolar sem ampliar o aviso indefinidamente.
O reconhecimento mobile compartilha a condição do Canvas: largura de até 767 px ou ponteiro de toque
com altura de até 600 px. Assim, celulares deitados com largura maior também usam o topo central,
incluindo avisos cujo emissor definiu uma posição de canto.

Na largura de até 767 px, somente o corpo longo rola, limitado a `min(28dvh, 12rem) - 24px`. O
cartão não se torna a região rolável: ícone e X mantêm sua posição. A moldura compartilhada deve
posicionar o fechamento da mesma forma em mensagens simples e em progresso de PDF. A condição de
toque/altura reduzida também centraliza a pendência de imagem 3D, preservando seu ciclo próprio.

O cartão e seu X permanecem interativos quando uma modal bloqueia os eventos do restante da tela.
Interagir com o toast não fecha a modal nem aciona controles atrás dele; o bloqueio do fundo
continua ativo. O fechamento manual funciona por mouse, toque e teclado.

O tempo padrão permanece o da biblioteca quando o fluxo não define duração. Erros emitidos por
`toast.error` e pelos estados de erro de `toast.promise`, incluindo falhas de PDF, fecham após 30
segundos de contagem ativa, independentemente de uma duração solicitada pelo emissor. Com o mouse
sobre a pilha de toasts, o Sonner pausa a contagem; ao sair, retoma o tempo restante, sem reiniciar
os 30 segundos. O fechamento manual continua disponível. `toast.promise` mantém callbacks, retorno
de `unwrap()`, carregamento e duração de sucesso nativos. O host padroniza somente a duração do
erro, inclusive quando não há mensagem de carregamento. O aviso de atualização da aplicação é
persistente e só inicia a atualização pela ação existente, que revalida as condições do domínio.

## PDF com etapas

A trilha mostra todas as fases desde o início:

1. Capturar o desenho 2D do Canvas.
2. Capturar a vista 3D da casa.
3. Preparar fotos da família e do terreno.
4. Organizar dados da casa e da construção.
5. Compor as páginas do PDF.
6. Preparar a prévia para revisão.

Cada etapa apresenta estado pendente, em andamento, concluído ou com falha. A etapa atual usa
indicador animado; conclusão usa check; falha usa X. Texto e ícone das etapas concluídas ficam
verdes, na mesma cor do sucesso global, mesmo que outra etapa falhe e o cartão se torne vermelho.
Uma falha posterior não transforma etapas já concluídas em erro. Não exibir porcentagens de tempo
que a operação não fornece.

As atualizações pertencem à mesma tentativa e mantêm a identidade da notificação. Falha de PDF
inicia a contagem de 30 segundos quando o erro é exibido, com pausa por hover e fechamento manual.
Fechar dispensa a comunicação; não cancela a geração. Tentar novamente pertence à prévia do PDF, não
a uma ação nova inventada no toast.

A barra da prévia do PDF mantém seu controle de minimização e restauração, independentemente do
toast. A notificação não substitui os bloqueios ou as validações da exportação.

A prévia deve caber na altura dinâmica da viewport, com margem mínima de 8px no mobile horizontal.
Título e fechamento permanecem acessíveis. A página se ajusta à área restante, incluindo zoom abaixo
de 40% quando necessário; a barra ocupa espaço próprio e mantém navegação, download e restauração
visíveis. Ao ampliar, a rolagem pertence à superfície do PDF, sem aumentar a modal. No mobile
horizontal usa Dialog, inclusive em telas largas com toque; no mobile vertical mantém Drawer. A
prévia usa superfície branca própria, centralizada, com largura útil de até 892 px e recuo de 8 px
por lateral no Dialog. Sua altura acompanha a área disponível, com teto de 760 px e ajuste da página
ao espaço restante. Ela não herda a largura geral de 75% dos modais padrão nem a antiga restrição de
50%. Em 510 × 493, o documento e a toolbar continuam aproveitando a área disponível.

O visualizador 3D mantém suas apresentações próprias: em paisagem até 999 px, a superfície padrão
segue `min(75vw, 720px)`; em mobile horizontal mais largo, o ramo nativo conserva 50vw. Fora desse
modo, mantém o teto `max-w-3xl`. Expandido, usa `100vw - 16px` e `100dvh - 16px`, preservando a
margem de 8 px e a exceção à regra geral de 75%. A cena ocupa o espaço restante do cabeçalho, sem
altura mínima rígida nem espaçamento duplo; os controles podem quebrar linha quando necessário.

## Dicas do Canvas mobile

Com “Dicas” ativado, selecionar um objeto no Canvas mobile horizontal mostra o hint contextual como
toast de informação por 5 segundos, com fundo neutro e ícone de informação. O aviso substitui o hint
fixo nessa viewport, mantém a formatação do texto e usa um único ID para evitar acúmulo. Uma nova
seleção reapresenta a dica, mesmo que o texto seja igual ao do objeto anterior. Limpar a seleção,
desativar Dicas, carregar outra casa ou sair do Canvas dispensa o aviso. Na orientação vertical, não
aparece sobre o aviso para girar o aparelho. No desktop, o hint permanece na apresentação fixa
existente.

## Imagem 3D pendente

A imagem preservada exige uma decisão explícita: Inserir no Canvas ou Descartar. Por isso, a
pendência não oferece fechamento genérico que possa ocultar uma decisão sem caminho de retorno. O
componente compartilha a identidade visual dos demais toasts; a imagem e sua inserção continuam sob
responsabilidade do contexto existente.

Inserir mantém a integração com o histórico do editor e o aviso de sucesso existente. Descartar
remove a pendência. A refatoração visual não autoriza descartar imagens por tempo, fechamento ou
substituição de toast. A posição da pendência 3D é preservada pelo fluxo, sem disputar a política da
fila de mensagens temporárias.

## Reutilização e extensão

`ToastMessage`, em `client/src/components/ui/ToastMessage.tsx`, concentra título, detalhe e corpo
opcional, sendo usado pelas mensagens do adaptador, pela trilha PDF e pela decisão 3D. A moldura
compartilha os estilos de `index.css`; Sonner continua responsável pelo transporte das mensagens,
enquanto o contexto 3D mantém a decisão persistente.

Telas e hooks importam o adaptador `@/components/ui/sonner.tsx`, preservando IDs, durações dos
demais estados, descrições e ações. Não importar Sonner diretamente em novos emissores nem criar
outra moldura local para um novo tipo de notificação.

Ciclos simples de carregamento e resultado podem usar `beginToastTask(id, loadingTitle)`, que
fornece `success(title)`, `error(title)` e `dismiss()`. Cada operação concorrente precisa de ID
próprio. Operações com etapas continuam fornecendo seus estados; o componente visual não executa
upload, captura 3D, geração de PDF ou atualização da aplicação.

## Validação e limites

Mudanças devem verificar mensagens, ações e tarefas; fechamento dos erros após 30 segundos ativos,
pausa por hover e retomada do tempo restante; IDs durante atualizações; decisão 3D; e permanência do
verde das etapas concluídas após falha. Verificar também mobile, textos longos, foco, fechamento e
contraste sobre a superfície real.

Testes de componentes e CSS não substituem a conferência visual em navegador. A incorporação R48
registrou comparações técnicas locais dos treze estados de toast e dos visualizadores, além de
interação do toast durante o PDF. Isso substitui a antiga anotação de indisponibilidade total da
ponte, sem declarar novo aceite humano da aplicação ou de aparelho físico. Novas mudanças precisam
reverificar os estados afetados, conforme o
[PLAY-104](../engineering-playbook/PLAY-104-frontend-testing.md).

## Fontes de implementação

- [Adaptador e host de notificações](../../client/src/components/ui/sonner.tsx).

- [Estilos compartilhados](../../client/src/index.css).

- [Composição responsiva do produto](../../client/src/rac-ui.css).

- [Prévia de PDF](../../client/src/components/rac-editor/@modals/ui/RacPdfPreviewModal.tsx).

- [Viewer 3D](../../client/src/components/rac-editor/@viewer-3d/ui/House3DViewer.tsx).

- Progresso do PDF: `client/src/components/rac-editor/@modals/ui/RacPdfExportProgress.tsx`.

- [Pendência de imagem
  3D](../../client/src/components/rac-editor/@viewer-3d/ui/House3DImagePendingToast.tsx).
