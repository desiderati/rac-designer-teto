import {describe, expect, it} from 'vitest';
import {
  calculateReductionPercent,
  isSupportedPhotoDataUrl,
  needsPhotoCompression,
  MAX_PHOTO_SOURCE_BYTES,
  PHOTO_SOURCE_SIZE_ERROR_MESSAGE,
  PHOTO_UPLOAD_ERROR_MESSAGE,
  PHOTO_UPLOAD_FINAL_SIZE_ERROR_MESSAGE,
  PHOTO_COMPRESSION_THRESHOLD_BYTES,
  preparePhotoFileForUpload,
  validatePreparedPhotoSize,
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

  it('aceita arquivos crus até 50 MB e deixa o limite de 7,5 MB para o pós-preparo', async () => {
    const sevenPointFiveMbPayload = new Uint8Array(7.5 * 1024 * 1024);
    sevenPointFiveMbPayload.set(PNG_SIGNATURE);
    const aboveFinalLimitPayload = new Uint8Array((7.5 * 1024 * 1024) + 1);
    aboveFinalLimitPayload.set(PNG_SIGNATURE);
    const aboveSourceLimitPayload = new Uint8Array(MAX_PHOTO_SOURCE_BYTES + 1);
    aboveSourceLimitPayload.set(PNG_SIGNATURE);

    await expect(validatePhotoFile(new File([sevenPointFiveMbPayload], 'limite.png', {type: 'image/png'})))
      .resolves.toBeNull();
    await expect(validatePhotoFile(new File([aboveFinalLimitPayload], 'acima-final.png', {type: 'image/png'})))
      .resolves.toBeNull();
    await expect(validatePhotoFile(new File([aboveSourceLimitPayload], 'acima-cru.png', {type: 'image/png'})))
      .resolves.toBe(PHOTO_SOURCE_SIZE_ERROR_MESSAGE);
  });

  it('identifica imagens acima de 2,5 MB e preserva arquivos menores sem reprocessar', async () => {
    const smallFile = new File([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD_BYTES)], 'pequena.png', {type: 'image/png'});
    const largeFile = new File([new Uint8Array(PHOTO_COMPRESSION_THRESHOLD_BYTES + 1)], 'grande.png', {type: 'image/png'});

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

  it('valida o limite efetivo depois da preparação', () => {
    const oversized = new File([new Uint8Array((7.5 * 1024 * 1024) + 1)], 'grande.png', {type: 'image/png'});
    const accepted = new File([new Uint8Array(7.5 * 1024 * 1024)], 'limite.png', {type: 'image/png'});

    expect(validatePreparedPhotoSize(oversized)).toBe(PHOTO_UPLOAD_FINAL_SIZE_ERROR_MESSAGE);
    expect(validatePreparedPhotoSize(accepted)).toBeNull();
  });
});
