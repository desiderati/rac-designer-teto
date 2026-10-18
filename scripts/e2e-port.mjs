/** Resolve a porta dos E2E sem aceitar fallback silencioso para valores inválidos. */
export function resolveE2EPort(value = undefined) {
  if (value === undefined) return 5200;
  const port = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('[E2E] E2E_PORT deve ser um inteiro decimal entre 1 e 65535; omita a variável para usar 5200.');
  }
  return port;
}
