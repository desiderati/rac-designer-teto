import {describe, expect, it} from 'vitest';
import {
  isSupportedPhotoDataUrl,
  PHOTO_UPLOAD_ERROR_MESSAGE,
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
});
