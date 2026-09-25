const SAFE_ERROR_CODES = new Set([
  'ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ECONNABORTED', 'ETIMEDOUT',
  'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN',
  'ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT',
  'PROTOCOL_CONNECTION_LOST',
]);

/** Registra apenas metadados conhecidos; erros HTTP e SQL podem conter tokens ou payloads. */
export function logSafeServerError(operation: string, error: unknown): void {
  const details = error && typeof error === 'object'
    ? error as {code?: unknown; response?: {status?: unknown}}
    : null;
  const rawStatus = details?.response?.status;
  const status = typeof rawStatus === 'number'
    && Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599
    ? rawStatus
    : undefined;
  const code = typeof details?.code === 'string' && SAFE_ERROR_CODES.has(details.code)
    ? details.code
    : 'UNEXPECTED';

  console.error(operation, {code, ...(status ? {status} : {})});
}
