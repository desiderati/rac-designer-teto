---
title: Identidade visual e comportamento dos Toasts
id: UI-004
doc_type: ui-definition
doc_role: ui-definition
doc_set: ui-definitions
order: 4
status: active
lang: pt-BR
---

# Identidade visual e comportamento dos Toasts

## Objetivo e escopo

Toasts comunicam resultados, orientações e progresso sem tirar o foco do desenho. Esta definição
consolida a identidade TETO aprovada em 02/10/2026 para mensagens simples, notificações com ações,
uploads, atualização da aplicação, geração de PDF e inserção de imagem 3D.

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

O botão principal segue o azul do formulário: `#2563eb`, texto branco, hover `#1d4ed8` e raio de 8
px. O secundário tem fundo branco, texto `#334155` e borda `#cbd5e1`. Ambos usam texto de 14 px,
peso 600, altura mínima de 40 px e alvo de 44 px no celular.

Quando apresentados juntos, **Inserir** e **Descartar** têm a mesma largura e altura. A igualdade de
dimensões não remove a hierarquia: Inserir permanece azul; Descartar permanece contornado. Preservar
foco visível, rótulos acessíveis e acionamento por teclado.

## Mensagens e notificações com ações

O host Sonner mantém a fila, o ciclo de exibição e o fechamento. No desktop, a pilha fica no canto
inferior direito com até três avisos visíveis; no celular, no topo central, respeitando a área
segura e o limite de dois. Conteúdo longo no celular pode rolar sem ampliar o aviso indefinidamente.

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

Testes de componentes e CSS não substituem a conferência visual em navegador. Essa conferência
permanece pendente nesta entrega por indisponibilidade da ponte de controle do IAB.

## Fontes de implementação

- [Adaptador e host de notificações](../../client/src/components/ui/sonner.tsx).

- [Estilos compartilhados](../../client/src/index.css).

- Progresso do PDF: `client/src/components/rac-editor/@modals/ui/RacPdfExportProgress.tsx`.

- [Pendência de imagem
  3D](../../client/src/components/rac-editor/@viewer-3d/ui/House3DImagePendingToast.tsx).
