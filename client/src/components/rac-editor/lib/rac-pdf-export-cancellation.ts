export function throwIfPdfExportAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Geração do PDF cancelada.', 'AbortError');
}

/** Para de aguardar adapters sem suporte a aborto e consome respostas tardias. */
export function waitForPdfExport<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new DOMException('Geração do PDF cancelada.', 'AbortError'));
    promise.then(value => {
      signal.removeEventListener('abort', aborted);
      if (signal.aborted) aborted(); else resolve(value);
    }, error => {
      signal.removeEventListener('abort', aborted);
      reject(error);
    });
    if (signal.aborted) aborted();
    else signal.addEventListener('abort', aborted, {once: true});
  });
}
