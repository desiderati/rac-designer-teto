---
title: Status da Casa
id: BUS-010
doc_type: business-rule
doc_set: business-rules
order: 10
status: active
lang: pt-BR
---

# Status da Casa

## Objetivo

Definir como o status da casa muda entre edição, impressão do RAC, conclusão da construção e arquivamento.

## Estados

1. `Rascunho`
    - Estado editável padrão.
    - Permite alterações no canvas, configurações da casa e materiais extras.

2. `RAC Impressa`
    - Estado aplicado quando o PDF do RAC é gerado com sucesso.
    - Continua editável.
    - Qualquer alteração editorial posterior deve retornar a casa para `Rascunho`.

3. `Construída`
    - Estado aplicado manualmente pela pessoa usuária.
    - Bloqueia edição do canvas, barra de ferramentas, controles laterais, nome da família, reinício do desenho,
      configurações da casa e materiais extras.
    - A casa ainda pode ser consultada e exportada.
    - Para voltar a editar, deve ser retornada manualmente para `Rascunho`.

4. `Arquivada`
    - Remove a casa do canvas e dos fluxos de edição ativos.
    - Bloqueia edição de configuração da casa e materiais extras.
    - Pode ser desarquivada, retornando para `Rascunho`.

## Transições

1. Geração de PDF
    - Se a casa ativa não estiver `Construída` nem `Arquivada`, gerar o PDF muda o status para `RAC Impressa`.
    - Se a casa estiver `Construída`, gerar o PDF não altera o status.

2. Geração de ZIP de RACs
    - A exportação em lote considera apenas casas não arquivadas da construção.
    - Cada casa exportada com sucesso muda para `RAC Impressa`, exceto casas `Construídas`, que permanecem
      `Construídas`.
    - Casas com falha individual de exportação não devem ter status alterado.
    - Casas `Arquivadas` não entram na impressão de RACs e não têm status alterado pelo ZIP.

3. Alteração editorial
    - Alterações no canvas, níveis, pilotis, família, configurações da casa, avaliação do terreno ou materiais extras
      devem mudar `RAC Impressa` para `Rascunho`.

4. Marcar como construída
    - A ação deve pedir confirmação.
    - Ao confirmar, a casa muda para `Construída` e passa a ficar bloqueada para edição.

5. Voltar para rascunho
    - A ação deve pedir confirmação.
    - Ao confirmar, a casa muda para `Rascunho` e volta a permitir edição.

6. Arquivar e desarquivar
    - Arquivar mantém o comportamento próprio de retirada da casa dos fluxos ativos.
    - Desarquivar retorna a casa para `Rascunho`.

7. Disponibilidade do Canvas
    - O Canvas só pode ser aberto quando existir ao menos uma casa não arquivada em uma construção em andamento.
    - Se nenhuma construção em andamento tiver ao menos uma casa não arquivada, o retorno ao Canvas deve ficar
      indisponível.

## Segurança

O bloqueio de `Construída` deve existir na interface e na camada de sessão/persistência. Se uma chamada interna tentar
salvar uma mudança editorial em casa construída, a sessão deve ignorar a mutação.

O bloqueio de `Arquivada` também deve existir na interface e na camada de sessão/persistência. Se uma chamada interna
tentar editar configuração, materiais extras ou documento visual de uma casa arquivada, a sessão deve ignorar a mutação.
