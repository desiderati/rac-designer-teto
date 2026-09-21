const ALLOWED_PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const DATA_URL_PATTERN = /^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/]+={0,2})$/i;
const MANUS_STORAGE_URL_PATTERN = /^\/manus-storage\/[A-Za-z0-9][A-Za-z0-9._\-/]*$/;
export const MAX_PHOTO_UPLOAD_BYTES = 7.5 * 1024 * 1024;
export const PHOTO_COMPRESSION_THRESHOLD_BYTES = 4 * 1024 * 1024;
const MAX_PHOTO_DATA_URL_LENGTH = Math.ceil(MAX_PHOTO_UPLOAD_BYTES * 4 / 3) + 64;
const MAX_COMPRESSION_DIMENSION = 3200;

type AllowedPhotoMimeType = typeof ALLOWED_PHOTO_MIME_TYPES[number];

export const PHOTO_UPLOAD_ACCEPT = ALLOWED_PHOTO_MIME_TYPES.join(',');
export const PHOTO_UPLOAD_LIMIT_LABEL = '7,5 MB';
export const PHOTO_UPLOAD_ERROR_MESSAGE = `Use PNG, JPG ou WEBP com até ${PHOTO_UPLOAD_LIMIT_LABEL}.`;
export const PHOTO_COMPRESSION_ERROR_MESSAGE = 'Não foi possível otimizar esta imagem no navegador. Tente uma imagem menor ou outro arquivo.';

export interface PreparedPhotoFile {
  file: File;
  compressed: boolean;
  originalBytes: number;
  finalBytes: number;
  reductionPercent: number;
  warning?: string;
}

export function isSupportedPhotoDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_PHOTO_DATA_URL_LENGTH) return false;

  const match = DATA_URL_PATTERN.exec(trimmed);
  if (!match) return false;

  return hasMatchingImageSignature(match[1].toLowerCase() as AllowedPhotoMimeType, match[2]);
}

export function hasValidOptionalPhotoDataUrl(value: string): boolean {
  return value.length === 0 || isSupportedPhotoDataUrl(value) || isManusStoragePhotoUrl(value);
}

export function normalizeOptionalPhotoDataUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || (!isSupportedPhotoDataUrl(trimmed) && !isManusStoragePhotoUrl(trimmed))) return undefined;
  return trimmed;
}

export function isManusStoragePhotoUrl(value: unknown): value is string {
  return typeof value === 'string' && MANUS_STORAGE_URL_PATTERN.test(value.trim());
}

export async function validatePhotoFile(
  file: File,
  options: {allowCompression?: boolean} = {},
): Promise<string | null> {
  if (file.size > MAX_PHOTO_UPLOAD_BYTES && !options.allowCompression) return PHOTO_UPLOAD_ERROR_MESSAGE;
  const mimeType = file.type.toLowerCase();
  if (!isAllowedPhotoMimeType(mimeType)) return PHOTO_UPLOAD_ERROR_MESSAGE;

  const header = await readBlobHeader(file);
  return hasImageSignature(mimeType, header) ? null : PHOTO_UPLOAD_ERROR_MESSAGE;
}

export function needsPhotoCompression(file: File): boolean {
  return file.size > PHOTO_COMPRESSION_THRESHOLD_BYTES;
}

export async function preparePhotoFileForUpload(
  file: File,
  onProgress?: (percent: number) => void,
  options: {preserveOriginalQuality?: boolean} = {},
): Promise<PreparedPhotoFile> {
  if (!needsPhotoCompression(file) || options.preserveOriginalQuality) {
    return {
      file,
      compressed: false,
      originalBytes: file.size,
      finalBytes: file.size,
      reductionPercent: 0,
    };
  }

  onProgress?.(8);
  try {
    const compressedFile = await compressPhotoFile(file, onProgress);
    if (compressedFile.size >= file.size) {
      if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
        throw new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);
      }
      return {
        file,
        compressed: false,
        originalBytes: file.size,
        finalBytes: file.size,
        reductionPercent: 0,
        warning: 'Não foi possível reduzir o arquivo; a imagem original será enviada.',
      };
    }

    return {
      file: compressedFile,
      compressed: true,
      originalBytes: file.size,
      finalBytes: compressedFile.size,
      reductionPercent: calculateReductionPercent(file.size, compressedFile.size),
    };
  } catch (error) {
    if (file.size <= MAX_PHOTO_UPLOAD_BYTES) {
      return {
        file,
        compressed: false,
        originalBytes: file.size,
        finalBytes: file.size,
        reductionPercent: 0,
        warning: 'Não foi possível otimizar a imagem; a imagem original será enviada.',
      };
    }
    throw error instanceof Error ? error : new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);
  }
}

export function calculateReductionPercent(originalBytes: number, finalBytes: number): number {
  if (originalBytes <= 0 || finalBytes >= originalBytes) return 0;
  return Math.max(0, Math.min(100, ((originalBytes - finalBytes) / originalBytes) * 100));
}

async function compressPhotoFile(file: File, onProgress?: (percent: number) => void): Promise<File> {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    throw new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);

    const scale = Math.min(1, MAX_COMPRESSION_DIMENSION / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    onProgress?.(35);

    const outputType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    const qualities = [0.86, 0.74, 0.62, 0.5];
    let smallestBlob: Blob | null = null;

    for (const [index, quality] of qualities.entries()) {
      const blob = await canvasToBlob(canvas, outputType, quality);
      if (!blob) continue;
      if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
      onProgress?.(40 + Math.round(((index + 1) / qualities.length) * 45));
      if (blob.size <= PHOTO_COMPRESSION_THRESHOLD_BYTES) break;
    }

    if (!smallestBlob) throw new Error(PHOTO_COMPRESSION_ERROR_MESSAGE);
    const extension = outputType === 'image/jpeg' ? 'jpg' : 'webp';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagem';
    return new File([smallestBlob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(PHOTO_COMPRESSION_ERROR_MESSAGE));
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
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
