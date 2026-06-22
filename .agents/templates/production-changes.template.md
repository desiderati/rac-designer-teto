---
title: "{título da alteração em produção}"
status: concluído
post_execution_audit: true
environment: prod
executed_at: "{AAAA-MM-DDTHH:mm:ssZ ou timezone local explícito}"
authorized_by: "{usuário ou referência da autorização}"
executor: "{agente, pessoa ou ferramenta que executou}"
---

# Production Change

Template instalado em `.agents/templates/production-changes.template.md`.

Destino canônico: `.agents/production-changes/YYYY-MM/YYYYMMDD-{slug}.production-change.md`.

Use este registro somente após a execução de uma alteração de estado autorizada em produção. Não
crie este arquivo antes da mutação; registre o que realmente foi executado.

## Regras de Sanitização

- Nunca inclua segredos completos, tokens, cookies, chaves privadas, dados pessoais sensíveis,
  payloads financeiros intactos ou logs crus com credenciais.

- Mascare valores semelhantes a credenciais e inclua apenas a menor evidência necessária para
  sustentar a auditoria.

- Reduza comandos, saídas de terminal, capturas e links para a forma operacionalmente útil e não
  sensível.

- Se disponível, valide este arquivo com `.agents/scripts/validate_production_changes.py` antes do
  fechamento quando houver comandos, logs, links, capturas ou payloads relevantes.

## Resumo

- objetivo:
- escopo afetado:
- ambiente:
- janela de execução:
- resultado:

## Pré-classificação

- classificação pré-ação:
- alvo Prod/security identificado:
- por que a ação não era somente read-only:
- incertezas resolvidas antes da mutação:

## Autorização

- solicitante:
- aprovador:
- referência da autorização:
- confirmação recebida em:
- autorização literal registrada:
- ação exata autorizada:
- alvo exato autorizado:
- ambiente autorizado:
- validação esperada autorizada:
- condição de rollback ou parada aceita:

## Mudança Executada

- tipo de mudança:
- comandos, ferramenta ou console usado:
- recursos afetados:
- arquivos criados, alterados ou removidos:
- configurações criadas, alteradas ou removidas:
- recursos GCP criados, alterados ou removidos:

## Evidência

- evidência antes:
- evidência depois:
- logs, links ou capturas relevantes:
- evidência sanitizada usada no chat final:
- valores redigidos ou mascarados:
- limitações da evidência:

## Validação

- checks executados:
- resultado dos checks:
- impacto observado:

## Risco e Rollback

- risco residual:
- rollback planejado:
- condição de rollback:
- rollback executado ou justificativa para não executar:
- observações:

## Pendências

- pendências:
- follow-up:
