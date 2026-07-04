---
title: UI-001 - Texto, Overflow e Áreas Impressas
doc_type: ui-definition
doc_role: reference
doc_set: ui-definitions
status: active
lang: pt-BR
---

# UI-001 - Texto, Overflow e Áreas Impressas

## Regra

Todo texto exibido em uma área com largura ou altura controlada deve ter tratamento explícito de
overflow antes de ser considerado pronto para entrega.

Isso vale para:

- tabelas e listas operacionais;
- cards de resumo;
- cabeçalhos e rodapés;
- campos de formulário com valor preenchido;
- tags, badges e botões com texto;
- áreas exportadas para PDF ou destinadas à impressão.

## Critérios mínimos

1. A largura das colunas, grades ou regiões fixas não pode ser alterada por valores longos.

2. Textos contínuos sem espaços devem ser testados, porque são o pior caso para tabelas, flexbox e
   PDF.

3. Quando o conteúdo não couber, a interface deve escolher explicitamente entre truncar, quebrar
   linha ou paginar. A escolha não pode ficar implícita no comportamento padrão do navegador ou do
   renderer de PDF.

4. Quando houver truncamento visual, o valor completo deve continuar acessível quando isso for útil
   para a tarefa, por exemplo com `title`, detalhe expansível, página de continuação ou campo
   completo no PDF.

5. Em PDFs, o texto deve ser medido contra a área real de desenho. Não é aceitável confiar apenas no
   limite de caracteres do formulário.

6. Quando um trecho resumido na primeira página do PDF continuar no verso, o indicador visual deve
   ser explícito, usando `(continua atrás...)` em vez de reticências isoladas.

7. Estados com dados máximos aceitos pelo domínio devem ter validação automatizada ou inspeção
   visual registrada.

## Evidência esperada

Para mudanças que exibem texto em área dimensionada, a validação deve cobrir pelo menos uma destas
evidências:

- teste de componente ou smoke com o maior valor aceito pelo formulário;
- teste com texto contínuo sem espaços;
- screenshot ou inspeção visual em viewport relevante;
- renderização do PDF para imagem quando a área afetada for impressa/exportada.

## Exemplo de aplicação

Na listagem de monitores, o nome e o e-mail do monitor não podem deslocar as colunas de `Status` e
`Contato`. A célula de identidade deve conter o texto em largura controlada, aplicar truncamento
quando necessário e preservar o telefone em uma linha.
