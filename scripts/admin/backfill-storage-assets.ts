#!/usr/bin/env node

import {
  backfillStorageAssetReferences,
  getStorageAssetLifecycleSummary,
} from '../../server/db.ts';
import {logSafeServerError} from '../../server/_core/safe-error-log.ts';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const confirmation = args.has('--confirm-apply-ledger-backfill');

if (args.size > (apply ? 2 : 0) || (apply && !confirmation)) {
  console.error(JSON.stringify({
    ok: false,
    error: apply
      ? 'Para aplicar o ledger, use exatamente --apply --confirm-apply-ledger-backfill.'
      : 'Uso: dry-run (sem argumento) ou --apply --confirm-apply-ledger-backfill.',
  }));
  process.exitCode = 2;
} else {
  const mode = apply ? 'apply' : 'dry_run';
  try {
    const result = await backfillStorageAssetReferences(mode);
    const lifecycle = await getStorageAssetLifecycleSummary();
    console.log(JSON.stringify({ok: true, ...result, lifecycle}));
  } catch (error) {
    logSafeServerError('[storage-assets] backfill administrativo falhou', error);
    console.error(JSON.stringify({
      ok: false,
      error: 'O backfill não foi concluído. Nenhuma exclusão física foi tentada.',
    }));
    process.exitCode = 1;
  }
}

// O cliente Drizzle mantém um pool MySQL aberto. Este é um comando finito de
// administração e não um worker; depois de escrever o JSON, encerra de modo
// explícito para não manter o processo/CI pendurado.
process.exit(process.exitCode ?? 0);
