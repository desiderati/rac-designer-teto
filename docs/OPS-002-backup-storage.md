---
title: Backup e inventário administrativo de Storage
id: OPS-002
doc_role: runbook
doc_type: reference
status: active
lang: pt-BR
---

# Backup e inventário administrativo de Storage

## Alcance

A CLI `scripts/admin/storage-ops.ts` opera fora das rotas da aplicação. `backup-live`, com opt-in
explícito, lê `construction_site_documents` no escopo `rac-designer-teto-global` em um SELECT global
via `getDb` e baixa cada asset referenciado com o GET assinado de `server/storage.ts`. O backup
inclui todos os documentos canônicos, mesmo arquivados, com IDs, `documentVersion`, payload,
`createdAt`, `updatedAt`, `externalCode` e `status`. Referências em qualquer profundidade do payload
são extraídas das rotas `/api/private-storage/{key}` e `/manus-storage/{key}`, ou de campos
`storageKey`, incluindo fotos e imagens 3D. O ZIP guarda os binários referenciados, seus metadados e
hashes SHA-256. O arquivo `.sha256` comprova a integridade do ZIP como um todo; guarde os dois
juntos em destino protegido.

O Forge disponível em `server/storage.ts` oferece apenas presign de PUT e GET. Ele não fornece
listagem nem exclusão. Isso não bloqueia o backup global: a fonte de documentos é conhecida e o GET
atende às chaves referenciadas. O inventário gerado por `backup-live` cobre apenas referências e
nunca serve para identificar órfãos. Banco e Storage não compartilham transação; se algum GET
falhar, a captura inteira falha. Verifique o ZIP antes de considerar o backup pronto. O `updatedAt`
dos assets capturados por GET usa `Last-Modified` quando presente; caso contrário, registra o
instante de leitura. Esse fallback não é a data comprovada de upload e não serve para decisões de
retenção.

## Ledger de lifecycle e quarentena lógica

O ledger relacional (`storage_assets`, `storage_asset_references` e `storage_asset_backfill_runs`)
registra exclusivamente objetos conhecidos pela aplicação. Um PUT confirmado cria um registro
`pending`; o salvamento CAS do documento canônico promove chaves efetivamente referenciadas para
`active` e mantém uma referência por Construção. A remoção de uma referência nunca remove bytes:
apenas pode tornar o registro elegível para **quarentena lógica** depois da janela configurada.

O comando abaixo reconcilia documentos existentes. Sem parâmetros é `dry_run`; o modo de escrita
requer dois argumentos explícitos. Ambos geram uma linha auditável em `storage_asset_backfill_runs`.
O backfill é idempotente, não reescreve o payload do documento e não toca no bucket.

```sh
# Simulação segura, sem mudar o ledger de assets
pnpm exec tsx scripts/admin/backfill-storage-assets.ts

# Reconciliação idempotente do ledger, sem exclusão física
pnpm exec tsx scripts/admin/backfill-storage-assets.ts \
  --apply --confirm-apply-ledger-backfill
```

Após publicação do callback `/api/scheduled/storage-retention-quarantine`, um Heartbeat pode marcar
registros sem referência como `quarantined`. O callback aceita somente uma identidade cron
autenticada e procura a política pelo `taskUid`; ele não confia no payload HTTP. A configuração
persiste o `taskUid`, os dias de carência de `pending` e a idade mínima sem referência. Não criar o
Heartbeat antes de a versão com o callback estar publicada.

```sh
# Executar somente depois de criar o Heartbeat na plataforma e receber o task_uid.
pnpm exec tsx scripts/admin/configure-storage-retention.ts \
  --task-uid <task_uid> --enabled true \
  --min-unreferenced-age-days 30 --pending-grace-days 7
```

`quarantined` é um estado reversível no banco; não existe deleção física automática. Objetos que
nunca chegaram ao documento só podem ser conhecidos se o PUT também chegou ao ledger. O Forge ainda
não oferece a listagem integral necessária para descobrir objetos históricos desconhecidos;
portanto, qualquer deleção remota continua bloqueada até existir inventário completo, delete
condicional e autorização operacional específica.

O modo `backup` offline aceita snapshots e binários fornecidos. Para limpeza, a origem, contagem
total e instante de captura do inventário de **todos os objetos** e dos uploads pendentes são
obrigatórios. Uma contagem autodeclarada não prova completude externa; confirme essa evidência no
provedor. Sem listagem completa, a limpeza falha fechado.

## Formato de entrada

Três arquivos JSON independentes usam o envelope abaixo. `coverage` aparece somente em
`inventory.json`: `all-objects` para listagem global e `referenced-only` para backup. `complete:
true` e `expectedCount` devem refletir o resultado integral da fonte, não uma amostra. Datas são ISO
UTC com `Z`.

```json
{
  "scopeKey": "rac-designer-teto-global",
  "complete": true,
  "coverage": "all-objects",
  "evidence": {
    "source": "identificador verificável da captura integral",
    "expectedCount": 0,
    "capturedAt": "2026-10-19T12:00:00.000Z"
  },
  "items": []
}
```

- `documents.json`: `items` são linhas canônicas com `id`, `scopeKey`, `externalCode`, `status`,
  `document`, `documentVersion`, `createdAt` e `updatedAt`. `document.constructionSite.id` e
  `document.constructionSite.documentVersion` devem coincidir com a linha. Capture todas as linhas
  do escopo global em uma visão consistente do banco, com contagem na mesma visão.

- `inventory.json`: cada item tem `key`, `sizeBytes`, `sha256` hexadecimal, `contentType` e
  `updatedAt`. Para limpeza, `coverage` deve ser `all-objects` e o inventário cobrir **todo** o
  namespace sob avaliação. O backup aceita `referenced-only`; a restauração sempre produz essa
  cobertura, mesmo quando o inventário de origem era global. Os arquivos físicos ficam em
  `assets/{key}`. A CLI confere tamanho, hash e assinatura de PNG, JPEG ou WebP; cada objeto tem
  limite administrativo de 7,5 MiB.

- `pending.json`: inventário **completo** de uploads confirmados no Storage que ainda podem ser
  associados a documentos. Cada item tem `key`; se esse estado não puder ser obtido com confiança,
  não planeje exclusão. Uma lista vazia só é válida quando a ausência de pendências foi confirmada.

- `policy.json`: `{"minAgeDays": 30}` é **apenas exemplo de formato**. O operador define a retenção
  aplicável. A ferramenta não escolhe uma janela padrão.

Referências malformadas, chaves com travessia, binários ausentes, hashes divergentes, contagens
inconsistentes e inventários incompletos bloqueiam a operação. URLs externas contendo uma rota de
Storage devem ser normalizadas no snapshot de origem para a rota relativa canônica antes do backup;
a ferramenta não adivinha a origem externa.

## Comandos locais

Todos os comandos são executados a partir da raiz do repositório, sem instalar dependências. Nos
exemplos, `/caminho/canonico/rac-admin` representa uma pasta existente fora do Git, resolvida sem
links simbólicos. Não grave exportações reais no Git.

```sh
rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts backup \
  --documents /caminho/canonico/rac-admin/documents.json \
  --inventory /caminho/canonico/rac-admin/inventory.json \
  --assets /caminho/canonico/rac-admin/assets --out /caminho/canonico/rac-admin/backup.zip

# Leitura global real: executar somente com autorização específica do operador.
# Usa a configuração já disponível a getDb e storageGetSignedUrl; não cria .env.
rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts backup-live \
  --authorize-live-read CAPTURE_GLOBAL_BACKUP --out /caminho/canonico/rac-admin/backup-live.zip

rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts verify \
  --archive /caminho/canonico/rac-admin/backup.zip \
  --sha256-file /caminho/canonico/rac-admin/backup.zip.sha256

rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts restore \
  --archive /caminho/canonico/rac-admin/backup.zip \
  --sha256-file /caminho/canonico/rac-admin/backup.zip.sha256 \
  --out /caminho/canonico/rac-admin/restauracao-isolada

rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts cleanup-plan \
  --documents /caminho/canonico/rac-admin/documents.json \
  --inventory /caminho/canonico/rac-admin/inventory.json \
  --pending /caminho/canonico/rac-admin/pending.json \
  --policy /caminho/canonico/rac-admin/policy.json \
  --out /caminho/canonico/rac-admin/plano.json
```

`restore` cria uma pasta que não pode existir previamente, com `documents.json`, `inventory.json` e
`assets/{key}`. Diretórios novos usam `0700`; todos os arquivos novos usam `0600` e criação
exclusiva. Links simbólicos nas cadeias de output/assets são bloqueados. Ela não escreve em banco
nem em Storage. Para migrar para outro backend, importe esses dados por um procedimento próprio após
validar IDs, versões, referências e política de conflitos do destino. Não restaure automaticamente
sobre a base real.

`cleanup-plan` é sempre dry-run: exige `coverage: all-objects`, mostra candidatos e hash do plano,
sem exclusão. Referências ativas, uploads pendentes e objetos mais recentes que a retenção ficam
fora. A exclusão física de construções arquivadas segue o fluxo existente e não é alterada aqui.

## Exclusão controlada de fixtures locais

`cleanup-apply` exclui **somente arquivos físicos no diretório `--assets`**. Não exclui objetos
Manus/S3. Use apenas quando a ação, o alvo e a política foram autorizados especificamente; nunca use
a pasta de um backup como alvo. O arquivo de autorização deve conter exatamente `DELETE ORPHANS
<planHash>` para o plano revisado. O comando relê documentos, inventário e uploads pendentes,
recalcula o hash, confere a política e a retenção atual, e bloqueia planos alterados.

```sh
rtk proxy node node_modules/tsx/dist/cli.mjs scripts/admin/storage-ops.ts cleanup-apply \
  --plan /caminho/canonico/rac-admin/plano.json \
  --documents /caminho/canonico/rac-admin/documents.json \
  --inventory /caminho/canonico/rac-admin/inventory.json \
  --pending /caminho/canonico/rac-admin/pending.json \
  --policy /caminho/canonico/rac-admin/policy.json \
  --assets /caminho/canonico/rac-admin/assets \
  --authorization-file /caminho/canonico/rac-admin/autorizacao.txt
```

Antes de cada objeto, o `apply` relê documentos, inventário e uploads pendentes, exige o mesmo hash
do plano e confere tamanho/hash dos bytes locais imediatamente antes de `unlink`. Se o estado mudar,
pode haver exclusão parcial dos candidatos anteriores, e a execução para. Ainda existe uma janela
TOCTOU entre conferir o arquivo e removê-lo. Uma fonte externa que muda nesse intervalo precisa de
coordenação ou exclusão condicional; este adapter não garante atomicidade com banco ou bucket. O
hash do plano detecta drift dos snapshots fornecidos, mas não comprova que arquivos manuais são o
estado corrente de um serviço externo. A limpeza **remota** permanece indisponível: Forge não
oferece listagem ou delete, e este comando só remove arquivos locais. Sem inventário global e
evidência atual de referências e uploads pendentes, não execute limpeza real.
