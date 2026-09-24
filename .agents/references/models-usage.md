# Models Usage

Use esta referência para escolher um modelo da família GPT-6 e o esforço de raciocínio no Codex. Ela
tem dois modos de resposta e não altera configuração.

## Modos de uso

### 1. Catálogo

Quando o usuário chamar somente `@Models Usage`, retorne as três tabelas de exemplos por esforço
desta referência, uma para cada modelo. Não peça uma tarefa e não recomende modelos fora da família
GPT-6.

```text
@Models Usage
```

### 2. Recomendação para uma tarefa

Quando o usuário incluir um resumo da tarefa, recomende exatamente uma combinação de modelo e
esforço. Não repita as tabelas do catálogo. Responda com:

- `Modelo`: identificador recomendado
- `Esforço`: valor recomendado
- `Por quê`: justificativa curta ligada à ambiguidade, repetição, ferramentas, risco e qualidade
- `Exemplo de chamada`: uma formulação copiável da tarefa

Se faltarem detalhes, explicite a hipótese usada. Faça uma pergunta somente quando a lacuna puder
mudar materialmente a recomendação.

```text
@Models Usage
Preciso corrigir um contrato distribuído entre código, scaffold, documentação e testes, preservando
mudanças locais fora do escopo.
```

## Família GPT-6

| Modelo        | Melhor encaixe                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------|
| `gpt-6-astra` | Trabalho mais complexo, aberto ou de alto impacto que exige julgamento profundo.                |
| `gpt-6-sol`   | Trabalho cotidiano ou complexo que precisa equilibrar capacidade, velocidade e custo relativo.  |
| `gpt-6-luna`  | Trabalho claro, repetível, estruturado ou de alto volume com critério de sucesso objetivo.      |

Na dúvida entre as variantes, comece com Sol. Reserve Astra para decisões ou execuções em que a
profundidade adicional justifique seu custo; use Luna para trabalho bem delimitado. Na dúvida sobre
esforço, comece com `medium` e ajuste com uma tarefa representativa.

As tabelas refletem os esforços aceitos por cada variante: Luna e Sol vão de `none` a `max`; Astra
vai de `low` a `max` e não oferece `none`. Não invente uma combinação ausente para tornar as tabelas
simétricas.

## Exemplos por esforço

Os exemplos abaixo traduzem padrões reais recorrentes dos changelogs e work-items locais para
demandas reutilizáveis. Eles não reproduzem dados operacionais nem afirmam qual modelo foi
historicamente usado em cada mudança.

### Luna

| Esforço  | Exemplo concreto de uso                                                                                                                            |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `none`   | Extrair nome, branch, SHA e status de uma lista de pipelines e devolver um CSV, sem interpretar as falhas.                                         |
| `low`    | Atualizar a versão do mesmo pacote em 30 manifests e confirmar que nenhum arquivo fora da lista mudou.                                             |
| `medium` | Executar formatter, testes focais e `git diff --check` em 40 repositórios e entregar uma matriz verde/vermelha.                                    |
| `high`   | Reexecutar somente os steps falhos de uma lista aprovada de pipelines, impedir duplicatas e acompanhar o estado terminal.                          |
| `xhigh`  | Migrar em lote cinco pacotes de assets para um novo contrato visual, validando dimensões, transparência e regressão antes de promover cada pacote. |
| `max`    | Inventariar centenas de recursos GCP, reconciliar projeto, pasta, billing e responsável com a política vigente e justificar cada exceção.          |

### Sol

| Esforço  | Exemplo concreto de uso                                                                                                                                        |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `none`   | Trocar a paleta de um componente React pelos tokens já aprovados do Design System, sem redesenhar a tela.                                                      |
| `low`    | Adicionar estados de loading, vazio e erro à tabela de clientes usando componentes e contrato de API existentes.                                               |
| `medium` | Criar uma tela CRUD de clientes conectada à API existente, com autenticação, Design System e testes de aceite já especificados.                                |
| `high`   | Refatorar o módulo React de gestão de clientes e aplicar o Design System em lista, detalhe e formulário, preservando os contratos tRPC e Keycloak.             |
| `xhigh`  | Criar uma aplicação interna a partir de uma PRD pronta e arquitetura definida, com frontend React, API Node, login Keycloak, auditoria, testes e pipeline.     |
| `max`    | Substituir um backend administrativo mockado pela Keycloak Admin API real, ajustando backend, UI, auditoria e testes de segurança sem perder o fallback local. |

### Astra

| Esforço  | Exemplo concreto de uso                                                                                                                                     |
|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `low`    | Revisar o diff que habilita logging temporário em um load balancer produtivo e verificar exposição, evidência e rollback.                                   |
| `medium` | Transformar um objetivo de negócio ainda incompleto em MVP de aplicação, definindo arquitetura, jornadas, Design System, implementação e testes.            |
| `high`   | Configurar o ambiente produtivo de uma aplicação com VMs, containers, DNS, load balancer, segredos, CI/CD, observabilidade e plano de rollback.             |
| `xhigh`  | Refatorar uma aplicação legada para Clean Architecture e aplicar o Design System por etapas, preservando regras de negócio e integrações reais.             |
| `max`    | Diagnosticar um `403` produtivo que cruza load balancer, política de segurança, VPN e aplicação, com contenção, causa raiz, correção permanente e rollback. |

Combinações como Luna com `max` ou Sol com `none` são suportadas, mas raramente são o melhor ponto
de partida. Em geral, troque primeiro a variante quando o perfil da tarefa mudou; aumente o esforço
quando a mesma variante precisa de mais planejamento, análise ou verificação.

## Como interpretar o esforço

| Opção                | Tipo             | Use quando                                                                                                                                                   |
|----------------------|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `none`               | Esforço          | A tarefa é transformação ou extração direta e a latência é a prioridade.                                                                                     |
| `low` / Light        | Esforço          | O escopo é curto, claro e tem condição de sucesso óbvia.                                                                                                     |
| `medium`             | Esforço          | O trabalho geral precisa equilibrar velocidade, planejamento e profundidade.                                                                                 |
| `high`               | Esforço          | Há várias etapas, ferramentas, fontes ou verificações relevantes.                                                                                            |
| `xhigh` / Extra High | Esforço          | A tarefa difícil exige análise profunda de trade-offs ou debugging.                                                                                          |
| `max`                | Esforço          | O problema single-agent mais difícil justifica profundidade máxima acima de velocidade e uso.                                                                |
| `Ultra`              | Modo multiagente | Criar uma aplicação full-stack quando UX/Design System, backend/integrações, testes/segurança e CI/CD/documentação podem avançar como frentes independentes. |

Os nomes exibidos podem variar por superfície. O Codex pode mostrar Light em vez de `low` e Extra
High em vez de `xhigh`; algumas superfícies podem expor apenas parte dos valores. `Ultra` coordena
subagentes e não é um valor de esforço de raciocínio. Quando a superfície oferecer esse modo,
prefira Sol para a maioria das execuções paralelas e Astra quando as frentes também exigirem o maior
nível de julgamento. Evite-o em tarefas simples, estritamente sequenciais ou tão acopladas que a
orquestração custaria mais que o paralelismo.

## Regras de recomendação

1. Escolha Luna para volume e repetição, Sol para o cotidiano e tarefas complexas, e Astra para o
   trabalho mais exigente ou de alto impacto.

2. Escolha o esforço separadamente; capacidade do modelo e profundidade de raciocínio não são a
   mesma decisão.

3. Use o menor esforço que atenda de forma confiável aos critérios de aceite.

4. Prefira melhorar escopo, restrições e evidência de sucesso antes de compensar um prompt vago com
   mais esforço.

5. Revalide a disponibilidade no seletor ou com `/model` antes de persistir um identificador em
   configuração compartilhada.

## Formato da recomendação contextual

```text
Modelo: gpt-6-sol
Esforço: high
Por quê: a tarefa é multiarquivo, usa ferramentas e exige regressão cuidadosa, mas tem contrato e
critério de sucesso claros.
Exemplo de chamada: Corrija o contrato distribuído entre código, scaffold, documentação e testes;
preserve mudanças fora do escopo e execute a suíte focal antes de concluir.
```

## Fontes atuais

- [Seleção de modelos no Codex](https://learn.chatgpt.com/docs/models)
- [Guia atual da família GPT-6](https://developers.openai.com/api/docs/guides/latest-model)
