import {afterEach, describe, expect, it, vi} from 'vitest';
import {IndexedDbConstructionSiteStorageDriver} from '@/infra/storage/indexed-db-construction-sites.storage.ts';

afterEach(() => vi.unstubAllGlobals());

describe('IndexedDbConstructionSiteStorageDriver', () => {
  it('falha explicitamente sem IndexedDB quando a persistência local é obrigatória', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const driver = new IndexedDbConstructionSiteStorageDriver(undefined, 'rac-designer-teto-isolated', true);

    await expect(driver.read()).rejects.toThrow('IndexedDB indisponível');
    await expect(driver.write({version: 1, constructionSites: []})).rejects.toThrow('IndexedDB indisponível');
  });

  it('preserva a leitura vazia permissiva para a verificação legada do modo remoto', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const driver = new IndexedDbConstructionSiteStorageDriver();

    await expect(driver.read()).resolves.toEqual({version: 1, constructionSites: []});
  });
});
