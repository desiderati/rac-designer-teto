---
title: UI-002 - Tabelas e Largura Proporcional de Colunas
doc_type: ui-definition
doc_role: reference
doc_set: ui-definitions
status: active
lang: pt-BR
---

# UI-002 - Tabelas e Largura Proporcional de Colunas

## Regra

Em tabelas e listagens operacionais, a largura das colunas deve ser definida de forma proporcional
ao tamanho máximo dos campos exibidos em cada coluna.

Colunas que exibem campos maiores, ou combinações de campos maiores, devem receber mais largura.
Colunas de estado, datas, telefones, ícones e ações devem ter largura suficiente para leitura e
operação, mas não devem consumir espaço que pertence à coluna de maior conteúdo textual.

## Como definir as proporções

1. Identifique quais campos aparecem em cada coluna.

2. Para cada campo textual, use como referência o limite efetivo de exibição aprovado para a
   superfície. A precedência é:

    1. limite de exibição definido para a tela, relatório ou PDF;
    2. maior tamanho aceito pelo formulário quando ele representa o limite real exibível;
    3. limite do schema, domínio ou contrato de entrada;
    4. pior caso prático aprovado quando o limite técnico for maior que o que a interface deve
       sustentar visualmente.

   Limites de armazenamento ou integração não devem ser usados automaticamente como largura visual
   quando eles excedem o conteúdo que a superfície precisa exibir.

3. Quando uma coluna agrupar mais de um campo, use a soma ou o pior caso prático dos campos
   exibidos. Exemplo: uma coluna com nome e e-mail deve ser tratada como maior que uma coluna que
   exibe apenas status.

4. Reserve largura mínima para colunas de leitura rápida ou operação fixa, como status, data,
   telefone e ações. Essas colunas não precisam crescer por causa de textos longos das demais.

5. Distribua o espaço restante de forma proporcional ao peso dos campos. A proporção final pode ser
   arredondada para valores simples, desde que preserve a prioridade de leitura.

6. Materialize a decisão com um contrato explícito de layout, por exemplo `table-fixed` com
   `colgroup`, CSS grid com trilhas fixas/proporcionais ou outro mecanismo equivalente já usado na
   superfície.

7. Aplique tratamento explícito de overflow dentro das células, conforme `UI-001`.

## Critérios mínimos

1. A coluna mais textual da tabela deve ser a mais larga, salvo decisão funcional explícita em
   contrário.

2. O navegador não deve decidir sozinho a distribuição das colunas em tabelas sensíveis a dados
   longos.

3. Campos longos não podem deslocar colunas de status, datas, contatos ou ações.

4. Células com truncamento devem usar uma caixa com largura controlada, como `min-w-0`, e preservar
   o valor completo quando isso for útil para a tarefa, por exemplo com `title`.

5. Textos contínuos sem espaço devem ser tratados como caso obrigatório de validação quando o campo
   aceitar valores longos.

6. A largura definida para a coluna deve considerar o conteúdo real exibido, não apenas o nome do
   cabeçalho.

## Exemplos de aplicação

| Superfície              | Coluna que deve receber mais espaço | Referência de campo                       |
|-------------------------|-------------------------------------|-------------------------------------------|
| Listagem de construções | `Construções`                       | código da construção e nome da comunidade |
| Listagem de monitores   | `Monitores`                         | nome do monitor e e-mail                  |
| Listagem de casas       | `Casas`                             | nome da família e tipo da casa            |

Em uma tabela de monitores, por exemplo, a coluna `Monitores` deve ser maior que `Status` e
`Contato`, porque agrega nome e e-mail. `Status` pode ser estreita e centralizada. `Contato` precisa
preservar telefone e ação, mas não deve reduzir a área útil do nome/e-mail.

## Evidência esperada

Mudanças em tabelas ou listagens devem registrar pelo menos uma evidência de que a proporção foi
respeitada:

- teste de componente ou smoke validando o contrato de colunas;
- teste com o maior valor permitido pelo campo;
- teste com texto contínuo sem espaços;
- inspeção visual ou screenshot em viewport relevante quando o risco for de composição visual.

Quando a tabela também aparece em PDF ou impressão, a evidência deve considerar a área renderizada
final, não apenas o componente em tela.
