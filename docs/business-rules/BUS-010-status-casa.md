---
title: Status da Casa
id: BUS-010
doc_type: business-rule
doc_role: business-rule
doc_set: business-rules
order: 10
status: active
lang: pt-BR
---

# Status da Casa

## Objetivo

Definir como o status da casa muda entre edição, impressão do RAC, conclusão da construção e
arquivamento.

## Estados

1. `Inicial`, `Definida` e `Indefinida`
    - Estados editáveis exibidos no lugar de Rascunho, conforme a configuração atual.
    - Inicial ainda não tem casa definida; Definida tem configuração, inclusive pela Análise de Campo.
    - Indefinida indica que a configuração da casa foi removida do Canvas após uma definição anterior.
    - Permitem alterações no canvas, configurações da casa e materiais extras, respeitando a construção.

2. `Impressa`
    - Estado aplicado quando o PDF do RAC é gerado com sucesso.
    - Continua editável.
    - Alterações editoriais preservam `Impressa`; o PDF fica desatualizado e deve ser regenerado.
    - Remover a casa do Canvas exibe `Indefinida`, sem apagar o histórico de impressão.

3. `Construída`
    - Estado aplicado manualmente pela pessoa usuária.
    - Bloqueia edição do canvas, barra de ferramentas, controles laterais, nome da família, reinício do desenho,
      configurações da casa e materiais extras.
    - A casa ainda pode ser consultada e exportada.
    - Ao liberar a edição, a listagem volta a refletir a configuração atual e o histórico de impressão.

4. `Arquivada`
    - Remove a casa do canvas e dos fluxos de edição ativos.
    - Bloqueia edição de configuração da casa e materiais extras.
    - Ao desarquivar, a listagem volta a refletir a configuração atual e o histórico de impressão.
    - Pode ser excluída definitivamente somente quando a Construção TETO pai estiver navegável e em andamento.

## Transições

1. Geração de PDF
    - Se a casa ativa não estiver `Construída` nem `Arquivada`, gerar o PDF muda o status para `Impressa`.
    - Se a casa estiver `Construída`, gerar o PDF não altera o status.

2. Geração de ZIP de RACs
    - A exportação em lote considera apenas casas não arquivadas da construção.
    - Cada casa exportada com sucesso muda para `Impressa`, exceto casas `Construídas`, que permanecem
      `Construídas`.
    - Casas com falha individual de exportação não devem ter status alterado.
    - Casas `Arquivadas` não entram na impressão de RACs e não têm status alterado pelo ZIP.

3. Alteração editorial
    - Alterações no canvas, níveis, pilotis, família, configurações da casa, avaliação do terreno ou materiais extras
      preservam `Impressa` e invalidam o PDF armazenado quando afetam seu conteúdo.

4. Marcar como construída
    - A ação deve pedir confirmação.
    - Ao confirmar, a casa muda para `Construída` e passa a ficar bloqueada para edição.

5. Liberar edição
    - A ação deve pedir confirmação.
    - Ao confirmar, a casa volta a permitir edição, preservando o histórico de exportação.

6. Arquivar e desarquivar
    - Arquivar mantém o comportamento próprio de retirada da casa dos fluxos ativos.
    - Desarquivar preserva o histórico e restaura a apresentação conforme a configuração atual.

7. Exclusão definitiva
    - A ação deve pedir confirmação destrutiva explícita.
    - A exclusão é física, local e sem desfazer.
    - A casa só pode ser excluída se estiver `Arquivada` e se a Construção TETO pai estiver navegável e em andamento.
    - Ao excluir a casa, seus dados de terreno, materiais, pilotis, vistas, canvas, documento RAC e metadados próprios
      são removidos.
    - A família vinculada só deve ser removida quando nenhuma outra casa restante referenciar a mesma família.
    - Casas arquivadas dentro de Construção TETO arquivada não têm exclusão granular; nesse caso, a ação permitida é
      excluir a construção inteira.

8. Disponibilidade do Canvas
    - O Canvas só pode ser aberto quando existir ao menos uma casa não arquivada em uma construção em andamento.
    - Se nenhuma construção em andamento tiver ao menos uma casa não arquivada, o retorno ao Canvas deve ficar
      indisponível.

## Segurança

A listagem deriva Inicial/Definida/Indefinida dos dados canônicos e do histórico opcional
`hasHouseBeenDefined`. O estado interno `draft` continua aceito no transporte, sem exigir migração.
Filtros, ordenação e badges seguem a mesma classificação descrita em
[Análise de Campo](BUS-014-analise-de-campo.md).

O bloqueio de `Construída` deve existir na interface e na camada de sessão/persistência. Se uma
chamada interna tentar salvar uma mudança editorial em casa construída, a sessão deve ignorar a
mutação.

O bloqueio de `Arquivada` também deve existir na interface e na camada de sessão/persistência. Se
uma chamada interna tentar editar configuração, materiais extras ou documento visual de uma casa
arquivada, a sessão deve ignorar a mutação.

A exclusão definitiva de casa arquivada é uma exceção explícita ao bloqueio de edição da própria
casa, mas não ao bloqueio da Construção TETO pai. Se a construção estiver `Concluída` ou
`Arquivada`, a sessão deve ignorar a exclusão granular da casa.
