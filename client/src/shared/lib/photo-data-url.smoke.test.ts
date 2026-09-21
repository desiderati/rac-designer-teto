import {describe, expect, it} from 'vitest';
import {
  calculateReductionPercent,
  isSupportedPhotoDataUrl,
  needsPhotoCompression,
  PHOTO_UPLOAD_ERROR_MESSAGE,
  preparePhotoFileForUpload,
  validatePhotoFile,
} from '@/shared/lib/photo-data-url.ts';

const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('photo-data-url.ts', () => {
  it('aceita apenas DataURLs de imagem suportada com assinatura compatível', () => {
    expect(isSupportedPhotoDataUrl(VALID_PNG_DATA_URL)).toBe(true);
    expect(isSupportedPhotoDataUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe(false);
    expect(isSupportedPhotoDataUrl('data:image/png;base64,conteudo-invalido')).toBe(false);
  });

  it('valida tipo, tamanho e assinatura do arquivo antes da leitura', async () => {
    await expect(validatePhotoFile(new File([PNG_SIGNATURE], 'monitor.png', {type: 'image/png'})))
      .resolves.toBeNull();
    await expect(validatePhotoFile(new File(['<svg/>'], 'monitor.svg', {type: 'image/svg+xml'})))
      .resolves.toBe(PHOTO_UPLOAD_ERROR_MESSAGE);
    await expect(validatePhotoFile(new File(['texto'], 'monitor.png', {type: 'image/png'})))
      .resolves.toBe(PHOTO_UPLOAD_ERROR_MESSAGE);
  });

  it('aceita fotos ate 7,5 MB e rejeita arquivos acima do limite', async () => {
    const sevenPointFiveMbPayload = new Uint8Array(7.5 * 1024 * 1024);
    sevenPointFiveMbPayload.set(PNG_SIGNATURE);
    const aboveLimitPayload = new Uint8Array((7.5 * 1024 * 1024) + 1);
    aboveLimitPayload.set(PNG_SIGNATURE);

    await expect(validatePhotoFile(new File([sevenPointFiveMbPayload], 'limite.png', {type: 'image/png'})))
      .resolves.toBeNull();
    await expect(validatePhotoFile(new File([aboveLimitPayload], 'acima.png', {type: 'image/png'})))
      .resolves.toBe(PHOTO_UPLOAD_ERROR_MESSAGE);
    await expect(validatePhotoFile(new File([aboveLimitPayload], 'acima.png', {type: 'image/png'}), {allowCompression: true}))
      .resolves.toBeNull();
  });

  it('identifica imagens acima de 4 MB e preserva arquivos menores sem reprocessar', async () => {
    const smallFile = new File([new Uint8Array(4 * 1024 * 1024)], 'pequena.png', {type: 'image/png'});
    const largeFile = new File([new Uint8Array((4 * 1024 * 1024) + 1)], 'grande.png', {type: 'image/png'});

    expect(needsPhotoCompression(smallFile)).toBe(false);
    expect(needsPhotoCompression(largeFile)).toBe(true);
    await expect(preparePhotoFileForUpload(smallFile)).resolves.toMatchObject({
      file: smallFile,
      compressed: false,
      originalBytes: smallFile.size,
      finalBytes: smallFile.size,
      reductionPercent: 0,
    });

    await expect(preparePhotoFileForUpload(largeFile, undefined, {preserveOriginalQuality: true})).resolves.toMatchObject({
      file: largeFile,
      compressed: false,
      originalBytes: largeFile.size,
      finalBytes: largeFile.size,
      reductionPercent: 0,
    });
    expect(calculateReductionPercent(10_000, 7_500)).toBe(25);
  });
});
