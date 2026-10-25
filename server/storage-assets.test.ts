import {describe, expect, it} from 'vitest';
import {
  classifyStorageAssetPurpose,
  extractStorageKeys,
  hashStorageKey,
  storageKeyFromReference,
  validateStorageKey,
} from './storage-assets.ts';

describe('storage-assets', () => {
  it('normaliza referências canônicas, legadas e absolutas para a mesma chave física', () => {
    const key = 'rac-designer-teto/construction-1/photos/terreno_a1b2c3d4.png';
    expect(storageKeyFromReference(`/api/private-storage/${key}`)).toBe(key);
    expect(storageKeyFromReference(`/manus-storage/${key}`)).toBe(key);
    expect(storageKeyFromReference(`https://tetopr.manus.space/api/private-storage/${key}`)).toBe(key);
  });

  it('deduplica chaves e inclui a compatibilidade explícita storageKey', () => {
    const photo = 'rac-designer-teto/construction-1/photos/terreno_a1b2c3d4.png';
    const illustration = 'rac-designer-teto/temp/house-3d/illustration_1a2b3c4d.png';
    expect(extractStorageKeys({
      photo: `/api/private-storage/${photo}`,
      legacy: `/manus-storage/${photo}`,
      drawing: {metadata: {storageKey: illustration}},
      list: [{src: `https://tetopr.manus.space/api/private-storage/${illustration}`}],
    })).toEqual([photo, illustration].sort());
  });

  it('rejeita chaves inseguras sem transformar URL externa em referência do projeto', () => {
    expect(() => validateStorageKey('../secreto.png')).toThrow(/insegura/i);
    expect(() => validateStorageKey('rac-designer-teto/%2e%2e/secreto.png')).toThrow(/insegura/i);
    expect(storageKeyFromReference('https://example.com/image.png')).toBeNull();
    expect(storageKeyFromReference('data:image/png;base64,AAA')).toBeNull();
  });

  it('classifica tipos conhecidos e gera hash estável para a unicidade física', () => {
    expect(classifyStorageAssetPurpose('rac-designer-teto/x/photos/foto_a1b2.png')).toBe('house-photo');
    expect(classifyStorageAssetPurpose('rac-designer-teto/temp/house-3d/casa_a1b2.png')).toBe('generated-3d');
    expect(classifyStorageAssetPurpose('rac-designer-teto/x/other/object.png')).toBe('unknown');
    expect(hashStorageKey('rac-designer-teto/x/photos/foto_a1b2.png')).toMatch(/^[a-f0-9]{64}$/);
  });
});
