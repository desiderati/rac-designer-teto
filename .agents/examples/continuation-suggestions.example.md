# Continuation Suggestions Example

> Installed by `agents-bootstrap` as `.agents/examples/continuation-suggestions.example.md`.

Use this only as final-delivery calibration after the mechanism in
`.agents/references/suggestion-system.md` produced grounded optional improvements. It is not a fixed
feature checklist.

````text
Próximos passos:
Revisar o fluxo mobile de captura da nota e validar a leitura em uma imagem real antes de ampliar o dashboard.

Melhorias sugeridas:
- Reprocessar nota com erro — permitir nova tentativa a partir do histórico, sem novo upload.
- Filtro por período — aplicar mês, trimestre ou tudo aos gráficos de gastos.
- Exportar PDF — gerar um resumo mensal por categoria para controle financeiro pessoal.

Sugestão de prompt para próxima ação:

```text
Validar o fluxo mobile de captura da nota fiscal com uma imagem real, corrigir falhas de OCR ou categorização encontradas e manter o dashboard atual sem adicionar novas funcionalidades ainda.
```
````

For outcome-oriented shortcuts, routine commit, push, publication, or catalog synchronization may
appear only as a final delivery note:

```text
Nenhuma pendência funcional ou contextual.
Nota de entrega: alterações locais ainda não publicadas.
```

The note is secondary delivery residue, not the only next action.

Omit `Melhorias sugeridas:` for trivial, administrative-only, weakly grounded, or generic work.
Preserve accepted scope and present adjacent capabilities as options, not requirements or defects.
After a validated dry-run or plan, prefer a direct confirmation phrase over another planning turn
when the action, target, scope, evidence, and rollback or stop condition are already unambiguous.

````text
Próximos passos:
Falta apenas a confirmação explícita da execução real; o dry-run já validou alvo, escopo, evidência e rollback.

Sugestão de prompt para próxima ação:

```text
Confirmo executar a criação real do acesso já validado no dry-run para o usuário, alvo e escopo informados, com rollback habilitado e sem ações fora do plano aprovado.
```
````

For `!next-prompt ultra`, recommend the task configuration without claiming that the shortcut
changed it, then return exactly one fenced `text` block:

````text
Configuração recomendada: `gpt-5.6-sol` no modo `Ultra`. O atalho não altera o modelo, o modo ou o nível de raciocínio nem ativa agentes.

```text
## Objetivo

Implementar autonomamente a mudança local aprovada no componente identificado.

## Resultado esperado

Entregar o comportamento implementado, documentado e comprovado pelos testes aplicáveis.

## Escopo autorizado

Alterar somente o componente e seus testes, documentação e versão diretamente relacionados.

## Restrições

Não sincronizar instalações, fazer push, acessar produção ou modificar sistemas externos.

## Método

Orientar a execução por estratégia, critérios de decisão e evidências; permitir que o modo Ultra
escolha e adapte ferramentas, sequência e quantidade de ciclos, salvo obrigação contratual ou
instrução explícita do operador.

## Validação obrigatória

Executar testes focados, regressão relevante e gates determinísticos do componente.

## Conclusão

Entregar evidências, limitações e commit local quando autorizado; parar somente por conflito Git,
acesso obrigatório ausente, contrato contraditório ou mutação não autorizada.
```
````

The concrete objective and boundaries must come from the invocation or the single unambiguous
evidence-backed next action. Do not reuse the example's generic component wording in a real prompt,
manufacture operations or authorizations, or impose a fixed length limit.
