const ALLOWED_PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const DATA_URL_PATTERN = /^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/i;
const MAX_PHOTO_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_PHOTO_DATA_URL_LENGTH = Math.ceil(MAX_PHOTO_UPLOAD_BYTES * 4 / 3) + 64;

type AllowedPhotoMimeType = typeof ALLOWED_PHOTO_MIME_TYPES[number];

export const PHOTO_UPLOAD_ACCEPT = ALLOWED_PHOTO_MIME_TYPES.join(',');
export const PHOTO_UPLOAD_ERROR_MESSAGE = 'Use PNG, JPG ou WEBP com até 2 MB.';

export function isSupportedPhotoDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_PHOTO_DATA_URL_LENGTH) return false;

  const match = DATA_URL_PATTERN.exec(trimmed);
  if (!match) return false;

  return hasMatchingImageSignature(match[1].toLowerCase() as AllowedPhotoMimeType, match[2]);
}

export function hasValidOptionalPhotoDataUrl(value: string): boolean {
  return value.length === 0 || isSupportedPhotoDataUrl(value);
}

export function normalizeOptionalPhotoDataUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || !isSupportedPhotoDataUrl(trimmed)) return undefined;
  return trimmed;
}

export async function validatePhotoFile(file: File): Promise<string | null> {
  if (file.size > MAX_PHOTO_UPLOAD_BYTES) return PHOTO_UPLOAD_ERROR_MESSAGE;
  const mimeType = file.type.toLowerCase();
  if (!isAllowedPhotoMimeType(mimeType)) return PHOTO_UPLOAD_ERROR_MESSAGE;

  const header = await readBlobHeader(file);
  return hasImageSignature(mimeType, header) ? null : PHOTO_UPLOAD_ERROR_MESSAGE;
}

function isAllowedPhotoMimeType(value: string): value is AllowedPhotoMimeType {
  return ALLOWED_PHOTO_MIME_TYPES.includes(value as AllowedPhotoMimeType);
}

function hasMatchingImageSignature(mimeType: AllowedPhotoMimeType, base64Payload: string): boolean {
  const bytes = decodeBase64Header(base64Payload);
  return bytes ? hasImageSignature(mimeType, bytes) : false;
}

async function readBlobHeader(file: File): Promise<Uint8Array> {
  const blob = file.slice(0, 12);
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Falha ao ler cabeçalho da foto.'));
    });
    reader.readAsArrayBuffer(blob);
  });
}

function decodeBase64Header(base64Payload: string): Uint8Array | null {
  const prefixLength = Math.min(base64Payload.length, 64);
  const alignedLength = prefixLength - (prefixLength % 4);
  if (alignedLength < 4) return null;

  try {
    const binary = globalThis.atob(base64Payload.slice(0, alignedLength));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function hasImageSignature(mimeType: AllowedPhotoMimeType, bytes: Uint8Array): boolean {
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a;
  }

  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;
  }

  return bytes.length >= 12
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}
