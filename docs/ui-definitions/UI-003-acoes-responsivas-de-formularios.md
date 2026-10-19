---
title: UI-003 - Ações Responsivas de Formulários
doc_type: ui-definition
doc_role: reference
doc_set: ui-definitions
status: active
lang: pt-BR
---

# UI-003 - Ações Responsivas de Formulários

## Escopo

Esta regra vale para os formulários de Construção TETO, Monitor, Configurações da Casa e Materiais
Extras no gerenciador de construções. A implementação compartilhada fica em `FormActionDock`, sobre
o componente `ActionDock`. Campos, validação e envio continuam sob responsabilidade de cada
formulário.

## Modos de apresentação

Os modos são definidos pelo layout disponível, não pelo nome ou tipo físico do dispositivo. Um
tablet e um telefone que exibam o formulário em tela inteira seguem a mesma regra de ação.

| Modo    | Layout atual do gerenciador                           | Campos           | Ação principal                                                     |
|---------|-------------------------------------------------------|------------------|--------------------------------------------------------------------|
| Full    | Card em viewport a partir de 768 px                   | Até duas colunas | Após a última seção, no fluxo da página, com largura de uma coluna |
| Compact | Card em viewport de 640 a 767 px                      | Uma coluna       | Após a última seção, no fluxo da página, com largura dessa coluna  |
| Mobile  | Formulário em tela inteira, viewport abaixo de 640 px | Uma coluna       | Fixa no rodapé da tela, com largura útil do formulário             |

Os valores acima acompanham os pontos de transição atuais do card (`sm`) e dos campos (`md`). Se o
gerenciador mudar de composição, a ação deve acompanhar a transição entre card e tela inteira; ela
não deve ter um breakpoint independente que a deixe fixa no modo Compact.

## Formulário de Construção TETO

No Full, os três campos principais dividem uma linha em três colunas. A ação fica após essa linha,
alinhada à terceira coluna e com a largura de uma coluna. No Compact, campos e ação ocupam a única
coluna. No Mobile, a ação segue a mesma regra de rodapé dos demais formulários.

## Espaçamento e rolagem

- No Full e no Compact, a distância total entre o último campo ou seção e a ação é de 32 px,
  incluindo o `gap` da grade e qualquer padding inferior da seção.

- No Mobile, a área de ação respeita a área segura inferior do dispositivo.

- O dock fixo mantém largura mínima de 360 px; o botão não se comprime quando a viewport é menor que
  essa largura.

- O formulário reserva espaço ao final da rolagem para que o último campo e suas mensagens de erro
  possam ser vistos acima da ação fixa.

- A ação preserva a ordem de foco do formulário e continua sendo o botão de envio nativo.

## Feedback de envio no formulário da casa

Na criação e edição da casa, toda tentativa bloqueada deve ter uma explicação visível junto à ação
de salvar, além do erro associado ao campo. Uma seção recolhida não pode esconder a causa: a seção
do primeiro erro deve abrir, com foco e acesso ao controle inválido, incluindo a foto.

Falha assíncrona deve manter o preenchimento e permitir nova tentativa. Enquanto o envio está em
andamento, a ação informa o estado de salvamento e bloqueia submissões repetidas. Avisos de upload
bem-sucedido não substituem o resultado da validação ou do salvamento do formulário.

O contrato entre upload, validação e persistência está em [Contrato de referências de fotos e
salvamento](../TECH-002-contrato-fotos-privadas.md). O comportamento dos painéis de edição do Canvas
com teclado segue a [UI-006 — Editores flutuantes e teclado no
mobile](UI-006-editores-flutuantes-e-teclado-mobile.md).

## Critérios de verificação

1. Nos quatro formulários, o botão não fica fixo nem sobrepõe campos no Compact.
2. No Full, a ação ocupa uma coluna de campos; em Construção TETO, ocupa a terceira coluna.
3. No Mobile, o botão permanece visível no rodapé mesmo em formulários curtos.
4. O último campo, seus erros e o botão permanecem alcançáveis por rolagem e teclado.
5. Materiais Extras mantém a apresentação de referência no Full e no Mobile.

O editor e os formulários mantêm superfícies próprias com largura mínima de 360 px. A raiz do
aplicativo não impõe mais esse mínimo globalmente, permitindo que diálogos específicos, como o de
conflito de sincronização, caibam em viewports menores. O aviso de largura mínima continua aplicável
às superfícies do editor que ainda dependem desse limite.
