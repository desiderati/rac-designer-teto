import {format} from 'node:util';

type TestConsole = Pick<Console, 'error' | 'warn'>;

// Assinaturas do React: não transformar mensagens de negócio ou exemplos de uso em falhas.
const actWarnings = [
  /\bnot wrapped in act\(\.\.\.\)/,
  /\bnot configured to support act\(/,
  /\bYou called act\(async .* without await\b/,
  /\boverlapping act\(\) calls\b/,
  /\bReactDOMTestUtils\.act.*deprecated\b/,
  /\bMessageChannel implementation, so enqueuing tasks via await act\(/,
];

export function installReactActWarningGuard(target: TestConsole) {
  const pending: string[] = [];
  const originals = {error: target.error, warn: target.warn};

  function wrap(method: 'error' | 'warn') {
    return (...args: unknown[]) => {
      originals[method].apply(target, args);
      const message = args[0];
      if (typeof message === 'string' && actWarnings.some((pattern) => pattern.test(message))) {
        pending.push(format(...args));
      }
    };
  }

  const wrappers = {error: wrap('error'), warn: wrap('warn')};
  target.error = wrappers.error;
  target.warn = wrappers.warn;

  return {
    assertNoWarnings() {
      const warnings = pending.splice(0);
      if (warnings.length > 0) {
        throw new Error(`Avisos React act detectados (${warnings.length}). Aguarde as interações e atualizações React.\n\n${warnings.join('\n\n')}`);
      }
    },
    restore() {
      // Não substituir um método que outro consumidor tenha instalado depois desta guarda.
      if (target.error === wrappers.error) target.error = originals.error;
      if (target.warn === wrappers.warn) target.warn = originals.warn;
    },
  };
}
