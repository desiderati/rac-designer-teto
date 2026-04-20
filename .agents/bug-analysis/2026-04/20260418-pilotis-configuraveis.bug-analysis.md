# Análise Técnica de Bug ou Regressão

> Migrado de `.agents/bug-analysis/piloti.bug-analysis.md` para a convenção
> `YYYY-MM/yyyyMMdd-{bug-slug}.bug-analysis.md`.
>
> Se o mesmo caso também tiver incidente operacional, manter o `.incident.md`
> correlato como artefato separado e registrar apenas cross-link explícito.

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: regra de pilotis configuráveis conectada parcialmente à interface, mas não ao
  núcleo dos cálculos
- origem do relato: auditoria
- ambiente: `rac-designer-teto`
- status analítico: confirmado
- estado da correção: aplicada | validada

## 2. Contexto e Sintoma Observado

- contexto funcional: mudança de regra em que a família escolhe 6 alturas de pilotis, em vez de operar sempre sobre a
  tabela fixa histórica
- sintoma observado: a aplicação passou a perguntar ao usuário quais alturas queria usar, mas vários fluxos ainda
  calculavam como se a tabela antiga fosse sempre `1,0 / 1,5 / 2,0 / 2,5 / 3,0 / 3,5`
- impacto percebido: recomendação incorreta de altura, limite de nível potencialmente inválido, inconsistência entre
  telas e risco de persistir combinações logicamente incoerentes
- limitações ou incertezas iniciais: a semântica do menor nível absoluto permitido (`0,20`) não tinha evidência
  suficiente para ser alterada junto com a correção principal

## 3. Escopo Afetado

| Fluxo ou superfície                                     | Sintoma provável                                                                                  | Causa encontrada                                                                     | Status    |
|---------------------------------------------------------|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|-----------|
| Recomendação automática de altura                       | níveis novos ainda escolhiam alturas da tabela antiga                                             | `getRecommendedHeight()` era chamado sem o conjunto selecionado da família           | Corrigido |
| Recálculo dos 12 pilotis após definir níveis dos cantos | interpolação funcionava, mas as alturas recomendadas ainda usavam a tabela fixa                   | `HouseAggregate.recalculateRecommendedPilotiData()` ignorava as alturas selecionadas | Corrigido |
| Fluxo inicial de definição de níveis                    | o limite máximo do slider podia permitir níveis incompatíveis com as 6 alturas escolhidas         | uso de `MAX_AVAILABLE_PILOTI_NIVEL` global, baseado em todas as alturas possíveis    | Corrigido |
| Edição individual de piloti                             | ao alterar o nível, a altura sugerida podia cair fora do conjunto da família                      | `usePilotiEditor` recalculava com regra estática                                     | Corrigido |
| Sanitização das alturas escolhidas                      | duplicatas, valores fora da tabela ou conjuntos vazios poderiam gerar comportamento inconsistente | não havia normalização centralizada                                                  | Corrigido |
| Texto de altura recomendada no editor de nível          | podia exibir formatação de nível em vez de formatação de altura                                   | o valor era formatado com `formatNivel`                                              | Corrigido |

- regras de negócio afetadas: recomendação de altura, máximo de nível permitido, propagação das 6 alturas selecionadas
  da família para o domínio
- módulos, componentes ou serviços envolvidos: aggregate da casa, manager do editor, editor individual de piloti,
  editor inicial de níveis e tipagem compartilhada de pilotis
- contratos, schemas ou interfaces envolvidos: conjunto dinâmico de alturas disponíveis por família

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: uma vez escolhidas as 6 alturas da família, todo cálculo de recomendação, limite e recálculo deve
  operar exclusivamente sobre esse subconjunto
- fluxo real: a informação nova era armazenada, mas vários cálculos continuavam dependentes de constantes históricas e
  de um catálogo global fixo
- ponto de divergência identificado: a interface passou a coletar o subconjunto dinâmico, mas o domínio e partes dos
  hooks ainda assumiam a tabela global anterior

## 5. Hipóteses Causais

| Hipótese                                                                                  | Evidências a favor                                                                                                   | Evidências contra                                                                                             | Status       |
|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|--------------|
| A feature foi conectada à UI, mas não ao núcleo dos cálculos                              | sintomas espalhados por recomendação, slider, editor individual e recálculo; uso recorrente de constantes históricas | nenhuma evidência relevante contra                                                                            | confirmada   |
| A persistência lógica das 6 alturas existe, mas não é consumida pelas regras de negócio   | o conjunto é armazenado, porém vários pontos continuam ignorando-o                                                   | nenhuma evidência relevante contra                                                                            | confirmada   |
| O piso mínimo absoluto (`0,20`) também deveria mudar junto com o menor piloti selecionado | a nova regra torna plausível revisar esse limite                                                                     | o código atual sugere regra de domínio anterior e independente; faltou evidência para alterá-la com segurança | inconclusiva |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- fluxo revisado após a mudança para pilotis configuráveis
- presença de chamadas que recalculavam recomendação sem receber o conjunto selecionado da família
- uso de constante global de máximo de nível em fluxos que deveriam depender do subconjunto
- ausência de normalização centralizada das alturas escolhidas

### Pontos de código, contrato ou regra

| Arquivo                                                                 | Responsabilidade no defeito ou na correção                                                                 |
|-------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `src/shared/types/piloti.ts`                                            | normalização central das alturas disponíveis e cálculo do máximo de nível com base no conjunto selecionado |
| `src/domain/house/house.aggregate.ts`                                   | recálculo recomendado dos 12 pilotis usando as alturas selecionadas                                        |
| `src/components/rac-editor/lib/house-manager.ts`                        | normalização das 6 alturas escolhidas e injeção delas no recálculo automático                              |
| `src/components/rac-editor/hooks/usePilotiEditor.ts`                    | cálculo da altura recomendada e do limite máximo do slider no editor individual                            |
| `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx` | cálculo do limite máximo e exibição correta da altura recomendada no fluxo inicial                         |
| `src/components/rac-editor/lib/canvas/piloti.smoke.test.ts`             | cobertura para recomendação dinâmica, máximo de nível dinâmico e normalização das alturas                  |

## 7. Classe do Defeito ou Regressão

- classe: integração parcial de regra de negócio com regressão semântica
- por que esta classificação se aplica: a nova regra foi aceita na interface, mas não propagada de forma transversal
  para os pontos que de fato tomam decisões sobre altura e nível

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente: concentrar a normalização das alturas, propagar explicitamente o conjunto selecionado para os
  pontos de cálculo e trocar limites derivados de constantes globais por limites derivados do subconjunto real
- por que resolve a causa: a divergência não estava na coleta da informação, mas no consumo dela; a correção elimina a
  dependência residual da tabela fixa nos fluxos que ainda a assumiam
- riscos e impactos laterais: alterar sem evidência o piso mínimo absoluto de nível; introduzir nova inconsistência ao
  tentar derivar tudo automaticamente a partir do menor piloti

## 9. Validação Executada

- testes executados: testes unitários de pilotis, aggregate e contraventamento
- validação manual: revisão do comportamento dos fluxos críticos ligados à recomendação e aos limites de nível
- build, lint ou smoke relevante: `npm run build` aprovado; cobertura adicionada em `piloti.smoke.test.ts`
- critério de sucesso observado: recomendação dinâmica, máximo de nível dinâmico e normalização das alturas passaram a
  refletir o conjunto selecionado da família

## 10. Dúvidas Residuais de Regra de Negócio

| Dúvida                                                                                                                          | Por que ainda importa                                  |
|---------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| O nível mínimo `0,20` ainda faz sentido para qualquer conjunto de 6 alturas?                                                    | pode haver regra residual do modelo antigo             |
| A família e as 6 alturas precisam ser persistidas junto do estado da casa?                                                      | hoje isso parece ficar apenas em memória de execução   |
| Alterar nível de um piloti mestre deve recalcular automaticamente alturas intermediárias sempre, ou preservar escolhas manuais? | o comportamento parece intencional, mas vale confirmar |

## 11. Artefatos Relacionados

- incidente correlato: não identificado
- PR, commit ou diff relacionado: não registrado neste artefato
- sidecar de anexos: não utilizado
- documentos correlatos: `docs/piloti-nivel.md`, `docs/piloti-mestre.md`
