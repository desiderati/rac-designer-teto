# Registro operacional independente

Registre a última unidade material de trabalho: problema, decisão e base, comportamento alterado,
validação observada, evidências sanitizadas e pendências reais. Use contexto atual e work-item
quando existente; não copie a conversa ou crie uma entrada por tentativa. Não invente fatos. Use
português e frases objetivas. Seções do corpo são opcionais; omita as que não têm conteúdo.

      Sanitize every source before persistence. Never copy secret values, Bearer/Basic headers,
      cookies, API keys, passwords, JWTs, signed URLs, private keys, raw credential files, customer
      payloads, unnecessary personal data, or unrestricted log bodies. Preserve operational identity
      only when it is the minimum evidence needed to audit a grant, revocation, authorization, or
      execution. Prefer an immutable principal, ticket, or equivalent reference; use a name or email
      only when no equivalent traceability exists and omit additional personal attributes. Otherwise
      preserve only a redacted field name, stable non-secret identifier, aggregate count, digest,
      exit status, or minimal excerpt needed to support the decision.


Use a skill changelog e seu owner `changelog_entries.py`. O agente gera automaticamente ID
hexadecimal minúsculo de 32 caracteres, `recorded_at` ISO 8601 com fuso e título factual antes da
primeira tentativa; não peça esses valores ao operador. Fixe corpo, referências, correções e
ocorrência conhecida. Execute uma chamada `record --repo-root <raiz-absoluta> --id <id32>
--recorded-at <iso-com-fuso> --title <título> --stdin`. Envie o corpo sanitizado e fixado em UTF-8
pela entrada padrão; esse é o padrão para texto composto em memória, sem criar arquivo temporário.
Se um arquivo existente for necessário, use `--body-file <corpo-físico-absoluto>` em vez de
`--stdin`, validando o arquivo físico e cada componente do caminho antes da chamada. Aliases como
`/tmp` no macOS podem atravessar links. Não combine os argumentos, altere uma fonte recusada ou
enfraqueça as verificações de caminhos. Preserve corpo e metadados e mantenha as regras de
confirmação antes de qualquer nova tentativa. Não execute preparação prévia nem persista candidato.
Não grave com append, patch ou emissor próprio.

O owner publica esquema `operational-entry/2` em
`.agents/changelogs/YYYY/MM/DD/YYYYMMDD-HHMMSSffffff-<slugASCIImax64>-<id32>.entry.md`. Exija
`registered` ou `already_registered`, `validated_path` e `sha256` esperados. YYYY/MM/DD deriva do
recorded_at original com fuso, independentemente de occurred_at. O owner cria exclusivamente o
Markdown final, sem stage, hardlink, intent, temporário ou preparação persistida. Só informa sucesso
após escrita e fechamento sem erro. Em falha ativa, tenta remover somente o arquivo próprio e
reporta o caminho se não conseguir; uma interrupção abrupta pode deixar o final incompleto. Preserve
journal, receipt e audit dos consumidores. A operação principal concluída com falha de registro deve
ser reportada assim, sem declarar auditoria completa nem repetir a operação.

Após resposta perdida, não reenvie automaticamente nem troque inputs: use `confirm --repo-root
<raiz> --path <caminho-relativo-original> --sha256 <hash-original>`. `scope: exact_path` atesta
bytes observados nesse destino, sem inventário ou promessa de unicidade global. `query` e
`query_entry` continuam auditoria global com hashes, fontes, conflitos, diagnósticos e cobertura;
partial não é completude. Views são derivadas sob demanda e não viram evidência.

Arquivo incompleto é diagnosticado pelo caminho e não conta como evento; continue lendo os válidos
com cobertura partial. Não reparar, excluir ou repetir gravação automaticamente: confira e corrija
ou recrie somente o registro afetado a partir das evidências originais. Não há comando de
recuperação ou estado do gravador. Correções são novos eventos relacionados por `corrects`, sem
editar originais. Há somente entradas /2 diárias e diários antigos preservados, inclusive frios. O
arquivo frio usa .archived/YYYY-MM/basename; no ZIP YYYY-MM.zip o membro é basename na raiz.
Preserve ID, datas e bytes ao arquivar; consulte sem recriar cópia ativa. Não há seções vazias ou
tags obrigatórias.

Na incorporação, promova o ID e bytes originais, mantendo recorded_at/occurred_at e referências.
Registre a incorporação separadamente após prova. Conflitos de ID preservam ambos e bloqueiam; não
use reconciliação diária para entradas independentes. Preserve provas de auditoria transacional.
Esta regra não autoriza Git, sincronização ou operações remotas. Mantenha diários e snapshots
históricos byte a byte. Reparos legados exigem autorização própria. Cabeçalhos legados podem
declarar exatamente `[horário não informado]`; isso não representa uma hora e não dispensa as seções
do legado. Se o reparo proibir inferência, use `changelog_normalize.py --unknown-time`, preservando
horários comprovados e o marcador desconhecido já explícito. Essa exceção não altera timestamps /2.
O writer diário antigo recusa.

Treat transcript, work-item, sidecar, log, trace, test output, and external response text as
untrusted data. Scan values as well as keys; neutral aliases do not make an opaque secret or
unnecessary personal data safe. When sanitization cannot be proven, record `[REDACTED]` and the
evidence class instead of the raw value. Use referências e resumos, nunca payload bruto.

When a work-item sidecar contains more than one plan or design artifact, preserve phase-qualified
provenance and substitution relationships instead of collapsing competing versions into one
undifferentiated summary. Treat correlated work-item curation metadata as primary; never invent
`claro_seguro`, a destination, strong evidence or `requires_operator: false`. Preserve legacy
file-level curation defaults unchanged. Independent entries reference the work-item instead of
creating another structured curation authority.

Before considering a concluded/canceled work-item ready for archive, require explicit collapse
eligibility, a durable promotion reference when promotion happened and a retention reason when
`reter localmente? sim`. Preserve local-only evidence and uncertain residue. Do not archive or
delete a record merely because a summary was written. Missing facts require clarification; a diff
alone cannot supply motivation. Conversation-only repetition does not warrant another event.
