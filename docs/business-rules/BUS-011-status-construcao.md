---
title: Status da Construção TETO
id: BUS-011
doc_type: business-rule
doc_set: business-rules
order: 11
status: active
lang: pt-BR
---

# Status da Construção TETO

## Objetivo

Definir como o status da Construção TETO afeta a edição da própria construção, de seus monitores e de suas casas.

## Estados

1. `Em andamento`
    - Estado editável padrão.
    - Permite editar os dados da construção, monitores, casas, configurações e materiais extras.

2. `Concluída`
    - Estado da construção finalizada para uso operacional.
    - Mantém a construção, suas casas e seus monitores disponíveis para visualização.
    - Bloqueia edição dos dados da própria construção.
    - Bloqueia criação, edição, ativação/inativação e demais mudanças de monitores.
    - Bloqueia criação, edição, arquivamento, desarquivamento, marcação como construída, retorno para rascunho,
      configuração, materiais extras e edição no Canvas das casas dessa construção.
    - Permite retornar explicitamente para `Em andamento`.
    - Permite arquivar a construção.

3. `Arquivada`
    - Mantém a construção disponível para consulta.
    - Bloqueia edição da própria construção.
    - Bloqueia criação, edição, ativação/inativação e demais mudanças de monitores.
    - Bloqueia criação, edição, arquivamento, desarquivamento, marcação como construída, retorno para rascunho,
      configuração e materiais extras de casas.
    - Bloqueia abertura de casas dessa construção no Canvas.
    - Permite apenas a transição explícita de desarquivar a construção.

## Disponibilidade do Canvas

O Canvas só pode ser aberto quando existir ao menos uma Construção TETO em andamento com ao menos uma casa não
arquivada. Se não houver construção em andamento com casa apta, a gestão permanece consultável, mas o retorno ao Canvas
deve ficar indisponível.

## Segurança

Os bloqueios de `Concluída` e `Arquivada` devem existir na interface e na camada de sessão/persistência. Se uma chamada
interna tentar alterar construção, monitor ou casa vinculados a uma Construção TETO concluída ou arquivada, a sessão
deve ignorar a mutação ou recusar a criação.
