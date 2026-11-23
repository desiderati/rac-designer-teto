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

- Preserve a identidade operacional mínima necessária para comprovar quem solicitou, autorizou,
  executou, recebeu ou perdeu acesso. Prefira principal imutável, ticket ou referência equivalente;
  use nome ou e-mail somente quando não houver rastreabilidade equivalente e omita atributos
  pessoais adicionais.

- Reduza comandos, saídas de terminal, capturas e links para a forma operacionalmente útil e não
  sensível.

- Se disponível, valide este arquivo com `.agents/scripts/validate_production_changes.py` antes do
  fechamento quando o registro contiver evidência de comandos, logs, links, capturas, payloads ou
  configuração.

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

- configuração declarada antes: fonte, revisão ou versão e escopo esperado (por exemplo, commit e
  caminho da configuração);

- estado observado antes: alvo, ambiente, horário e evidência do que estava efetivamente em execução
  (por exemplo, digest implantado ou regras efetivas);

- evidência depois:

- logs, links ou capturas relevantes:

- evidência sanitizada usada no chat final:

- valores redigidos ou mascarados:

- limitações da evidência:

Registre os dois estados separadamente: o arquivo em disco ou o commit não comprova o que estava em
execução. Em caso de divergência, indique o que foi reconciliado e o que ficou inconclusivo. Se a
comparação usar hash, indique o objeto e a forma de cálculo; quando a ordem não tiver efeito
semântico, preserve a observação original e identifique separadamente o resultado normalizado.
Quando uma evidência não existir ou não se aplicar, registre a limitação ou a justificativa.

## Validação

- checks executados:

- resultado dos checks:

- impacto observado:

- **Cloud Armor em preview (quando aplicável):** antes de criar o preview, confirme, por host, o
  backend efetivo, se o logging está habilitado, a taxa de amostragem, o acesso aos logs e como
  correlacionar a sonda autorizada (por exemplo, host, janela e identificador não sensível). Após a
  execução, registre por host a referência sanitizada do log, a política, a prioridade e a decisão
  simulada (`previewSecurityPolicy`), separadas da política, da prioridade e da decisão efetivamente
  aplicada (`enforcedSecurityPolicy`) e do status HTTP observado. Se faltar evidência para a
  correlação ou para distinguir as decisões, marque a validação daquele host como **pendente**. Não
  atribua o status HTTP à regra em preview.

## Risco e Rollback

- risco residual:

- artefato de reversão: referência protegida da preimagem ou versão recuperável, alvo e evidência de
  integridade quando aplicável; indicar se o artefato foi apenas localizado ou também validado para
  recuperação;

- rollback planejado:

- condição de rollback:

- rollback executado ou justificativa para não executar:

- observações:

O hash identifica uma observação, mas não substitui o artefato necessário para recuperar o estado.
Se a reversão não se aplicar ou não estiver comprovada, explicite a limitação e seu efeito no risco.
Registre apenas referências e evidência sanitizada, sem anexar configurações brutas com segredos.

## Pendências

- pendências:
- follow-up:
