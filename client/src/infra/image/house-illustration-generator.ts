import {racTrpcClient} from '@/lib/trpc-client.ts';
import type {HouseIllustrationPort} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';

export function createHouseIllustrationPort(): HouseIllustrationPort {
  return {
    generateFromDataUrl: generateHouseIllustrationFromDataUrl,
    resolveDataUrl: imageUrlToDataUrl,
  };
}

/**
 * Converte a captura WebGL em uma referência gerada no Storage Manus.
 * A chamada é deliberadamente explícita: gerar uma ilustração é mais lento que
 * capturar o WebGL, portanto os consumidores podem exibir estado de progresso
 * e manter o screenshot como fallback.
 */
export async function generateHouseIllustrationFromDataUrl(dataUrl: string): Promise<string | null> {
  const [, base64] = dataUrl.split(',', 2);
  if (!base64) return null;

  const result = await racTrpcClient.storage.generateHouseIllustration.mutate({
    base64,
  });

  return result.dataUrl ?? (result.url ? toAbsoluteUrl(result.url) : null);
}

export async function imageUrlToDataUrl(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url;

  const response = await fetch(toAbsoluteUrl(url), {credentials: 'include'});
  if (!response.ok) return null;

  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.origin).toString();
}
