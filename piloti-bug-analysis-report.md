# Análise de bugs da mudança para pilotis configuráveis

Revisei o fluxo introduzido pela nova regra em que a família escolhe **6 alturas de pilotis** e verifiquei onde o sistema ainda continuava raciocinando como se a tabela antiga e fixa fosse sempre `1,0 / 1,5 / 2,0 / 2,5 / 3,0 / 3,5`.

A conclusão principal é direta: **a feature foi parcialmente conectada à interface, mas não ao núcleo dos cálculos**. Em termos menos cerimoniosos, a aplicação passou a perguntar ao usuário quais alturas ele queria, mas em vários pontos continuou fingindo que já sabia a resposta.

| Área afetada | Sintoma provável | Causa encontrada | Status |
|---|---|---|---|
| Recomendação automática de altura | níveis novos ainda escolhiam alturas da tabela antiga | `getRecommendedHeight()` era chamado sem o conjunto selecionado da família | Corrigido |
| Recálculo dos 12 pilotis após definir níveis dos cantos | interpolação funcionava, mas as alturas recomendadas ainda usavam a tabela fixa | `HouseAggregate.recalculateRecommendedPilotiData()` ignorava as alturas selecionadas | Corrigido |
| Fluxo inicial de definição de níveis | o limite máximo do slider podia permitir níveis incompatíveis com as 6 alturas escolhidas | uso de `MAX_AVAILABLE_PILOTI_NIVEL` global, baseado em todas as alturas possíveis | Corrigido |
| Edição individual de piloti | ao alterar o nível, a altura sugerida podia cair fora do conjunto da família | `usePilotiEditor` recalculava com regra estática | Corrigido |
| Sanitização das alturas escolhidas | duplicatas, valores fora da tabela ou conjuntos vazios poderiam gerar comportamento inconsistente | não havia normalização centralizada | Corrigido |
| Texto de altura recomendada no editor de nível | podia exibir formatação de nível em vez de formatação de altura | o valor era formatado com `formatNivel` | Corrigido |

## Bugs potenciais que a alteração podia introduzir

A mudança de regra cria uma dependência transversal: o sistema deixa de operar sobre uma tabela global e passa a operar sobre um **subconjunto dinâmico de alturas**. Quando isso acontece, há cinco classes de regressão particularmente prováveis.

| Classe de bug | Como apareceria na prática |
|---|---|
| Recomendação desatualizada | o usuário seleciona, por exemplo, `1,2` como menor piloti, mas o sistema continua sugerindo `1,0` em algum fluxo |
| Limite de nível incorreto | o slider deixa o usuário escolher um nível suportável apenas por `3,5`, mesmo quando `3,5` não está entre os 6 selecionados |
| Inconsistência entre telas | a configuração inicial da família usa uma lógica, mas o editor individual de piloti usa outra |
| Persistência lógica defeituosa | o sistema guarda as 6 alturas, porém não as usa nas regras de negócio |
| Validação frouxa | combinações inválidas ou incompletas podem ser aceitas e contaminar cálculos posteriores |

Foi exatamente esse padrão que encontrei no código: a informação nova era armazenada, mas vários cálculos ainda dependiam de constantes históricas.

## Correções aplicadas

As correções foram concentradas nos pontos em que a aplicação toma decisões sobre **altura recomendada**, **máximo de nível permitido** e **propagação das alturas da família para o domínio**.

| Arquivo | Correção aplicada |
|---|---|
| `src/shared/types/piloti.ts` | Criei normalização central das alturas disponíveis e uma função para calcular o **máximo de nível** com base no conjunto selecionado, não no catálogo completo |
| `src/domain/house/house.aggregate.ts` | Passei o conjunto de alturas selecionadas para o recálculo recomendado dos 12 pilotis |
| `src/components/rac-editor/lib/house-manager.ts` | O manager agora normaliza as 6 alturas escolhidas e as injeta no recálculo automático de alturas |
| `src/components/rac-editor/hooks/usePilotiEditor.ts` | O editor individual agora usa as alturas selecionadas para calcular altura recomendada e limite máximo do slider |
| `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx` | O editor inicial de níveis agora calcula o limite máximo com base nas 6 alturas da família e mostra a altura recomendada correta |
| `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts` | Adicionei testes cobrindo recomendação dinâmica, máximo de nível dinâmico e normalização das alturas |

## Observações importantes sobre a regra de negócio

Há uma distinção conceitual importante aqui.

> A aplicação tinha dois tipos de premissa antigas: uma sobre a **tabela de alturas disponíveis** e outra sobre valores **globais máximos/mínimos de nível**.

Eu corrigi com segurança a primeira, e corrigi também o **máximo de nível** derivado do maior piloti disponível no conjunto selecionado.

Já a semântica exata do **menor nível absoluto permitido** continua ancorada no valor-base já existente do sistema (`0,20`). Pelo código atual, isso parece ser uma regra de domínio anterior e não uma simples consequência do menor piloti fixo em `1,0`.

Em outras palavras: eu **não alterei artificialmente o piso mínimo do nível** sem evidência suficiente de que essa regra de negócio também deveria mudar. Fiz isso de propósito, para não introduzir um segundo bug ao tentar consertar o primeiro. Se você quiser, no próximo passo eu posso auditar especificamente essa regra e verificar se o `0,20` também deve passar a ser derivado do menor piloti selecionado.

## Validação executada

Depois das correções, validei o comportamento por build e por testes automatizados.

| Validação | Resultado |
|---|---|
| Testes unitários de pilotis, aggregate e contraventamento | Aprovados |
| Build de produção (`npm run build`) | Aprovado |
| Cobertura nova adicionada para alturas dinâmicas | Sim |

## Próximo passo recomendado

O sistema agora está muito mais coerente com a nova regra dos **6 pilotis configuráveis**, especialmente nos pontos que mais facilmente gerariam bugs visíveis e silenciosos ao mesmo tempo.

Minha recomendação técnica é a seguinte: no próximo passo, eu faria uma **segunda passada orientada a regra de negócio**, focada exclusivamente nestas perguntas:

| Pergunta | Motivo |
|---|---|
| O nível mínimo `0,20` ainda faz sentido para qualquer conjunto de 6 alturas? | Pode haver regra residual do modelo antigo |
| A família e as 6 alturas precisam ser persistidas junto do estado da casa? | Hoje isso parece ficar apenas em memória de execução |
| Alterar nível de um piloti mestre deve recalcular automaticamente alturas intermediárias sempre, ou preservar escolhas manuais? | Esse comportamento parece intencional, mas vale confirmar |

Se você quiser, eu sigo agora exatamente nessa segunda rodada e fecho a auditoria de consistência do fluxo inteiro dos pilotis.
