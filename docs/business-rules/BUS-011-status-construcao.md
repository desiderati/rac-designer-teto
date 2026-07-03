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

Definir como o status da Construção TETO afeta a edição da própria construção, de seus monitores e
de suas casas.

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
    - Mantém a construção disponível na listagem para consulta resumida, desarquivamento ou exclusão definitiva.
    - Bloqueia edição da própria construção.
    - Bloqueia criação, edição, ativação/inativação e demais mudanças de monitores.
    - Bloqueia criação, edição, arquivamento, desarquivamento, marcação como construída, retorno para rascunho,
      configuração e materiais extras de casas.
    - Bloqueia abertura de casas dessa construção no Canvas.
    - Permite desarquivar a construção.
    - Permite excluir definitivamente a construção inteira, removendo seus dados filhos em cascata.

## Exclusão Definitiva

1. Construção TETO arquivada
    - A ação deve pedir confirmação destrutiva explícita.
    - A exclusão é física, local e sem desfazer.
    - Ao excluir a construção, devem ser removidos a construção, comunidades agregadas, famílias, casas, monitores,
      documentos RAC, canvas, pilotis, vistas, materiais, avaliações de terreno e demais dados filhos persistidos no
      estado local da construção.
    - Construções `Em andamento` ou `Concluídas` não podem ser excluídas diretamente; devem ser arquivadas antes.

2. Casa arquivada
    - A exclusão granular de casa só é permitida quando a Construção TETO pai estiver navegável e em andamento.
    - Casas dentro de Construção TETO arquivada não têm exclusão granular pela navegação de detalhe.

3. Monitor inativo
    - A exclusão granular de monitor só é permitida quando a Construção TETO pai estiver navegável e em andamento.
    - Monitores dentro de Construção TETO arquivada não têm exclusão granular pela navegação de detalhe.

## Disponibilidade do Canvas

O Canvas só pode ser aberto quando existir ao menos uma Construção TETO em andamento com ao menos
uma casa não arquivada. Se não houver construção em andamento com casa apta, a gestão permanece
consultável, mas o retorno ao Canvas deve ficar indisponível.

## Segurança

Os bloqueios de `Concluída` e `Arquivada` devem existir na interface e na camada de
sessão/persistência. Se uma chamada interna tentar alterar construção, monitor ou casa vinculados a
uma Construção TETO concluída ou arquivada, a sessão deve ignorar a mutação ou recusar a criação.

A exclusão definitiva da construção inteira é a única exceção destrutiva permitida para Construção
TETO `Arquivada`. Essa exceção não libera edição nem exclusão granular de casas ou monitores dentro
da construção arquivada.
