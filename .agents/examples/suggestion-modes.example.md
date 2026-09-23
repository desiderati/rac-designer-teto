# Suggestion Modes Example

> Installed by `agents-bootstrap` as `.agents/examples/suggestion-modes.example.md`.

Use this example only to calibrate the three modes. Scenario: the user asks for a table listing a
customer's orders.

## Automatic

The agent silently classifies the request as definition stage, with collection/discovery,
transaction/commerce, and identity/access families. Only strong candidates appear:

```text
Melhorias sugeridas:
- [P1 | oportunidade funcional] Busca, filtros e paginação — podem reduzir o tempo para localizar um pedido e limitar o volume carregado. Quer incluir isso no PRD? Antes, confirme o volume esperado, os campos pesquisáveis e os filtros de maior valor.
```

If the request already limits the list to a few recent orders, or explicitly excludes discovery
controls, omit the suggestion.

## `!suggest`

Return exactly one recommendation:

```text
[P1 | oportunidade funcional]

Recomendação: definir busca por número do pedido e paginação antes de fechar o PRD.

Evidência: a funcionalidade é uma coleção de pedidos por cliente, mas o volume esperado e a forma de localizar um item ainda não foram definidos.

Benefício: mantém o tempo de localização e o volume de consulta previsíveis.

Próxima decisão: confirmar a cardinalidade esperada, os campos pesquisáveis e se a navegação será por páginas ou carregamento contínuo. Isto é uma opção, não escopo aceito.
```

Do not edit the PRD or implement the controls until the user accepts them.

## `!suggest explore`

Generate a broad but bounded map, then rank no more than three candidates:

```text
Shortlist:
1. [P1 | oportunidade funcional] Busca por número, referência ou texto — reduz o custo de localização.
2. [P1 | risco transversal] Paginação com ordenação estável — controla volume, latência e duplicidade entre páginas.
3. [P1 | lacuna de artefato] Estados vazio, carregando, erro e atualização — tornam o comportamento verificável.

Mapa de candidatos:
- Descoberta: filtros por status, período e faixa de valor; ordenação; colunas configuráveis; visão salva.
- Ações: abrir detalhe, copiar referência, exportar seleção e ações em lote, condicionadas por permissão.
- Contexto: totais e status com definições claras; histórico ou última atualização quando relevante.
- UX: seleção persistente, feedback de filtros, densidade da tabela e alternativa responsiva para telas estreitas.
- Segurança: escopo obrigatório pelo cliente, autorização por ação e proteção contra enumeração de pedidos.
- Escala: limite de página, busca server-side, índice dos campos pesquisáveis e estratégia para dados desatualizados.
- Qualidade: cenários de lista vazia, múltiplas páginas, mudança de ordenação, falha parcial e acesso negado.

Hipóteses a confirmar: volume por cliente, frequência de uso, dispositivos, perfis de acesso, necessidade de exportação e latência aceitável.
```

Exploration exposes options; it does not approve requirements, invoke councils, or authorize
implementation.
