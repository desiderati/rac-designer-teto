import {getSessionHeaders} from '@/_core/session-headers.ts';

export function isProtectedImageSource(source: string): boolean {
  try {
    const url = new URL(source, window.location.href);
    return url.origin === window.location.origin && url.pathname.startsWith('/manus-storage/');
  } catch {
    return false;
  }
}

/** Credenciais ficam nos headers; a URL persistida nunca contém token ou dados temporários. */
export async function resolveProtectedImageSource(source: string, signal?: AbortSignal): Promise<string> {
  if (!isProtectedImageSource(source)) return source;
  const response = await fetch(source, {
    credentials: 'include',
    headers: getSessionHeaders(),
    cache: 'no-store',
    redirect: 'error',
    signal: signal ?? AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Não foi possível carregar a imagem protegida.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem protegida.'));
    reader.readAsDataURL(blob);
  });
}
