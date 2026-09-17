import {racTrpcClient} from '@/lib/trpc-client.ts';
import {dataUrlToStorageImageUploadPayload} from '@/shared/lib/storage-image-upload.ts';
import type {HouseIllustrationPort, HouseIllustrationResult} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';

export function createHouseIllustrationPort(): HouseIllustrationPort {
  return {
    generateFromDataUrl: generateHouseIllustrationFromDataUrl,
    persistDataUrl: persistHouseImageDataUrl,
  };
}

/**
 * Converte a captura WebGL em uma ilustração arquitetônica transparente e
 * devolve simultaneamente a representação transitória para o Canvas e a
 * referência persistente do Storage Manus.
 */
export async function generateHouseIllustrationFromDataUrl(dataUrl: string): Promise<HouseIllustrationResult | null> {
  const [, base64] = dataUrl.split(',', 2);
  if (!base64) return null;

  const result = await racTrpcClient.storage.generateHouseIllustration.mutate({
    base64,
  });

  return {
    dataUrl: result.dataUrl ?? (result.url ? await imageUrlToDataUrl(result.url) : null),
    storageUrl: result.url ?? null,
  };
}

export async function persistHouseImageDataUrl(dataUrl: string, fileName: string): Promise<string | null> {
  const payload = dataUrlToStorageImageUploadPayload(dataUrl, fileName);
  const result = await racTrpcClient.storage.uploadImage.mutate(payload);
  return result.url ?? null;
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
