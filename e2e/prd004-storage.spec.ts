import {expect, test} from '@playwright/test';
import {resolve} from 'node:path';
import type * as legacy from '../client/src/infra/storage/indexed-db-construction-sites.storage';
import type * as journal from '../client/src/infra/storage/remote-sync-journal';
import type {createReactiveConstructionSiteSessionStorage} from '../client/src/bootstrap/useRemoteConstructionSiteSessionStorage';
import type {ConstructionSiteState} from '../client/src/shared/types/construction-site';

declare global {
  interface Window {
    __prd004: typeof legacy & typeof journal & {createReactiveConstructionSiteSessionStorage: typeof createReactiveConstructionSiteSessionStorage};
    __prd004Sent: number;
  }
}

const fixture = `/@fs${resolve('e2e/fixtures/prd004-storage.html')}`;
const base: ConstructionSiteState = {
  constructionSite: {id: 'synthetic-site', externalCode: 'SINTETICO', communityId: 'synthetic-community',
    constructionDate: '2026-10-19', status: 'in_progress', documentVersion: 3,
    createdAt: '2026-10-19', updatedAt: '2026-10-19'},
  communities: [], families: [], monitors: [], houses: [],
};

test.beforeEach(async ({page}) => {
  await page.goto(fixture);
  await page.waitForFunction(() => Boolean(window.__prd004));
});

test('sondagem não cria base inexistente nem apaga uma base antiga antes do consentimento', async ({page}) => {
  const result = await page.evaluate(async () => {
    const api = window.__prd004;
    const first = await api.inspectLegacyConstructionSiteData();
    const absent = !(await indexedDB.databases()).some((db) => db.name === 'rac-designer-teto');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('rac-designer-teto', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('old-projects');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('old-projects', 'readwrite');
        tx.objectStore('old-projects').put({note: 'sintético a preservar'}, 'fixture');
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
    const found = await api.inspectLegacyConstructionSiteData();
    await new api.IndexedDbConstructionSiteStorageDriver().read();
    const snapshot = await new Promise<{version: number; stores: string[]; value: unknown}>((resolve) => {
      const request = indexedDB.open('rac-designer-teto');
      request.onsuccess = () => {
        const db = request.result;
        const get = db.transaction('old-projects', 'readonly').objectStore('old-projects').get('fixture');
        get.onsuccess = () => { resolve({version: db.version, stores: Array.from(db.objectStoreNames), value: get.result}); db.close(); };
      };
    });
    return {first, absent, found, snapshot};
  });
  expect(result).toEqual({first: false, absent: true, found: true,
    snapshot: {version: 1, stores: ['old-projects'], value: {note: 'sintético a preservar'}}});
});

test('limpeza confirmada apaga os dados antigos sem migrar a base ou apagar o journal remoto', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const identity = api.remoteJournalIdentity('synthetic-user-A');
    const queue = new api.IndexedDbRemoteSyncJournal(identity);
    await queue.read();
    await queue.write({document: [state], synchronized: []});
    await new Promise<void>((resolve) => {
      const request = indexedDB.open('rac-designer-teto', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('old-projects');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('old-projects', 'readwrite');
        tx.objectStore('old-projects').put({synthetic: true}, 'fixture');
        tx.oncomplete = () => {db.close(); resolve();};
      };
    });
    await api.clearConfirmedLegacyConstructionSiteData();
    return {legacyRemaining: await api.inspectLegacyConstructionSiteData(), journalCode: (await queue.read())?.document[0].constructionSite.externalCode,
      version: (await indexedDB.databases()).find((db) => db.name === 'rac-designer-teto')?.version};
  }, JSON.stringify(base));
  expect(result.legacyRemaining).toBe(false);
  expect(result.version).toBe(1);
  expect(result.journalCode).toBe(base.constructionSite.externalCode);
});

test('journal sobrevive à recarga e isola contas e sessões; escritor obsoleto não sobrescreve a fila', async ({page}) => {
  await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const queue = new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-A'));
    await queue.read();
    await queue.write({document: [state], synchronized: []});
  }, JSON.stringify(base));
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__prd004));
  const result = await page.evaluate(async () => {
    const api = window.__prd004;
    const identity = api.remoteJournalIdentity('synthetic-user-A');
    const current = new api.IndexedDbRemoteSyncJournal(identity);
    const stale = new api.IndexedDbRemoteSyncJournal(identity);
    const snapshot = (await current.read())!;
    await stale.read();
    const otherUser = await new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-B')).read();
    const otherSession = await new api.IndexedDbRemoteSyncJournal({...identity, sessionId: 'another-tab'}).read();
    snapshot.document[0].constructionSite.externalCode = 'MAIS-RECENTE';
    await current.write(snapshot);
    let blocked = false;
    try { await stale.write({document: [], synchronized: []}); } catch { blocked = true; }
    return {code: (await current.read())?.document[0].constructionSite.externalCode,
      otherUser: otherUser === null, otherSession: otherSession === null, blocked};
  });
  expect(result.otherUser).toBe(true);
  expect(result.otherSession).toBe(true);
  expect(result.blocked).toBe(true);
  expect(result.code).toBe('MAIS-RECENTE');
});

test('fila real do IndexedDB recupera intenção e base após recarga e confirma o envio', async ({page}) => {
  await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const queue = new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-A'));
    await queue.read();
    await queue.write({document: [state], synchronized: [state]});
    const storage = api.createReactiveConstructionSiteSessionStorage([state], async () => false, {journal: queue});
    storage.write([{...state, constructionSite: {...state.constructionSite, externalCode: 'PENDENTE'}}]);
  }, JSON.stringify(base));
  await expect.poll(() => page.evaluate(async () => {
    const api = window.__prd004;
    const value = await new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-A')).read();
    return [value?.document[0].constructionSite.externalCode, value?.synchronized[0].constructionSite.documentVersion];
  })).toEqual(['PENDENTE', 3]);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__prd004));
  await page.evaluate(async () => {
    const api = window.__prd004;
    const queue = new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-A'));
    const recovered = (await queue.read())!;
    window.__prd004Sent = 0;
    const storage = api.createReactiveConstructionSiteSessionStorage(recovered.document, async (next, previous) => {
      if (previous[0].constructionSite.documentVersion !== 3) throw new Error('Versão-base foi perdida');
      window.__prd004Sent += 1;
      next[0].constructionSite.documentVersion = 4;
      return true;
    }, {journal: queue, initialSynchronized: recovered.synchronized});
    storage.resume?.();
  });
  await expect.poll(() => page.evaluate(async () => {
    const api = window.__prd004;
    const value = await new api.IndexedDbRemoteSyncJournal(api.remoteJournalIdentity('synthetic-user-A')).read();
    return [window.__prd004Sent, value?.synchronized[0].constructionSite.externalCode, value?.synchronized[0].constructionSite.documentVersion];
  })).toEqual([1, 'PENDENTE', 4]);
});

test('lista apenas sessões pendentes da mesma conta e ignora só a versão canônica e a ordem das chaves', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const currentIdentity = {...api.remoteJournalIdentity('synthetic-user-A'), sessionId: 'current'};
    const make = (userId: string, sessionId: string) => new api.IndexedDbRemoteSyncJournal(
      {userId, sessionId, scopeId: api.REMOTE_SCOPE_ID});
    const pending = new api.IndexedDbRemoteSyncJournal({...currentIdentity, sessionId: 'old-pending'});
    await pending.write({document: [state], synchronized: []});
    await make('synthetic-user-B', 'other-user').write({document: [state], synchronized: []});
    await make('synthetic-user-A', 'current').write({document: [state], synchronized: []});
    const reordered = {...state, constructionSite: Object.fromEntries(
      Object.entries({...state.constructionSite, documentVersion: 99}).reverse()) as unknown as ConstructionSiteState['constructionSite']};
    await make('synthetic-user-A', 'version-only').write({document: [reordered], synchronized: [state]});
    const differentNestedField = {...state, constructionSite: {...state.constructionSite, updatedAt: '2026-10-20'}};
    await make('synthetic-user-A', 'nested-change').write({document: [differentNestedField], synchronized: [state]});
    return new api.IndexedDbRemoteSyncJournal(currentIdentity).pendingSessions();
  }, JSON.stringify(base));
  expect(result.map((entry) => entry.sessionId)).toEqual(['nested-change', 'old-pending']);
  expect(result.find((entry) => entry.sessionId === 'old-pending')).toMatchObject({revision: 1, documentCount: 1});
});

test('recupera explicitamente em nova sessão e invalida escritor da sessão anterior', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const identity = api.remoteJournalIdentity('synthetic-user-A');
    const source = new api.IndexedDbRemoteSyncJournal(identity);
    const snapshot = {document: [{...state, constructionSite: {...state.constructionSite, externalCode: 'PENDENTE'}}],
      synchronized: [state]};
    await source.write(snapshot);
    const oldWriter = new api.IndexedDbRemoteSyncJournal(identity);
    await oldWriter.read();
    sessionStorage.removeItem(`rac-remote-session:${JSON.stringify([api.REMOTE_SCOPE_ID, identity.userId])}`);
    const newIdentity = api.remoteJournalIdentity(identity.userId);
    const destination = new api.IndexedDbRemoteSyncJournal(newIdentity);
    await destination.read();
    const [candidate] = await destination.pendingSessions();
    await destination.recover(candidate.sessionId, candidate.revision);
    const recovered = await destination.read();
    let sourceReadBlocked = false;
    try { await source.read(); } catch { sourceReadBlocked = true; }
    let staleWriterBlocked = false;
    try { await oldWriter.write(snapshot); } catch { staleWriterBlocked = true; }
    const freshSource = new api.IndexedDbRemoteSyncJournal(identity);
    let freshReadBlocked = false;
    try { await freshSource.read(); } catch { freshReadBlocked = true; }
    let freshWriteBlocked = false;
    try { await freshSource.write(snapshot); } catch { freshWriteBlocked = true; }
    const sourceMarker = await new Promise<{revision: number; transferredTo: string; documentCount: number; synchronizedCount: number}>((resolve, reject) => {
      const request = indexedDB.open('rac-designer-teto-remote-sync');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const key = JSON.stringify([identity.scopeId, identity.userId, identity.sessionId]);
        const get = database.transaction('sessions', 'readonly').objectStore('sessions').get(key);
        get.onsuccess = () => {resolve({revision: get.result.revision, transferredTo: get.result.transferredTo,
          documentCount: get.result.document.length, synchronizedCount: get.result.synchronized.length}); database.close();};
        get.onerror = () => reject(get.error);
      };
    });
    return {candidate: candidate.sessionId, recovered, sourceReadBlocked, staleWriterBlocked,
      freshReadBlocked, freshWriteBlocked, sourceMarker, newSessionId: newIdentity.sessionId,
      candidatesAfter: await destination.pendingSessions()};
  }, JSON.stringify(base));
  expect(result.candidate).toBeTruthy();
  expect(result.recovered?.document[0].constructionSite.externalCode).toBe('PENDENTE');
  expect(result.recovered?.synchronized[0].constructionSite.externalCode).toBe(base.constructionSite.externalCode);
  expect(result.sourceReadBlocked).toBe(true);
  expect(result.staleWriterBlocked).toBe(true);
  expect(result.freshReadBlocked).toBe(true);
  expect(result.freshWriteBlocked).toBe(true);
  expect(result.newSessionId).not.toBe(result.candidate);
  expect(result.sourceMarker).toEqual({revision: 2, transferredTo: result.newSessionId,
    documentCount: 0, synchronizedCount: 0});
  expect(result.candidatesAfter).toEqual([]);
});

test('revisão alterada na origem bloqueia recuperação sem mover os dados', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const identity = api.remoteJournalIdentity('synthetic-user-A');
    const source = new api.IndexedDbRemoteSyncJournal(identity);
    await source.write({document: [state], synchronized: []});
    const destination = new api.IndexedDbRemoteSyncJournal({...identity, sessionId: 'next-session'});
    const [candidate] = await destination.pendingSessions();
    const writer = new api.IndexedDbRemoteSyncJournal(identity);
    const updated = (await writer.read())!;
    updated.document[0].constructionSite.externalCode = 'NOVA-INTENCAO';
    await writer.write(updated);
    let blocked = false;
    try { await destination.recover(candidate.sessionId, candidate.revision); } catch { blocked = true; }
    return {blocked, destination: await destination.read(), source: await source.read(),
      stillListed: (await destination.pendingSessions())[0]?.revision};
  }, JSON.stringify(base));
  expect(result.blocked).toBe(true);
  expect(result.destination).toBeNull();
  expect(result.source?.document[0].constructionSite.externalCode).toBe('NOVA-INTENCAO');
  expect(result.stillListed).toBe(2);
});

test('recuperação recusa revisão obsoleta ou intenção pendente no destino', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const sourceIdentity = api.remoteJournalIdentity('synthetic-user-A');
    const source = new api.IndexedDbRemoteSyncJournal(sourceIdentity);
    await source.write({document: [state], synchronized: []});
    const destinationIdentity = {...sourceIdentity, sessionId: 'new-tab'};
    const staleDestination = new api.IndexedDbRemoteSyncJournal(destinationIdentity);
    const activeDestination = new api.IndexedDbRemoteSyncJournal(destinationIdentity);
    await staleDestination.write({document: [state], synchronized: [state]});
    await activeDestination.read();
    await activeDestination.write({document: [state], synchronized: [state]});
    let staleBlocked = false;
    try { await staleDestination.recover(sourceIdentity.sessionId, 1); } catch { staleBlocked = true; }
    const currentDestination = new api.IndexedDbRemoteSyncJournal(destinationIdentity);
    await currentDestination.read();
    await currentDestination.write({document: [state], synchronized: []});
    let pendingBlocked = false;
    try { await currentDestination.recover(sourceIdentity.sessionId, 1); } catch { pendingBlocked = true; }
    return {staleBlocked, pendingBlocked, source: await source.read(), destination: await currentDestination.read()};
  }, JSON.stringify(base));
  expect(result.staleBlocked).toBe(true);
  expect(result.pendingBlocked).toBe(true);
  expect(result.source?.document).toHaveLength(1);
  expect(result.destination?.document).toHaveLength(1);
  expect(result.destination?.synchronized).toHaveLength(0);
});

test('candidata com data inválida interrompe listagem e preserva registro', async ({page}) => {
  const result = await page.evaluate(async (serialized: string) => {
    const state = JSON.parse(serialized) as ConstructionSiteState;
    const api = window.__prd004;
    const identity = api.remoteJournalIdentity('synthetic-user-A');
    const source = new api.IndexedDbRemoteSyncJournal(identity);
    await source.write({document: [state], synchronized: []});
    const key = JSON.stringify([identity.scopeId, identity.userId, identity.sessionId]);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('rac-designer-teto-remote-sync');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('sessions', 'readwrite');
        const get = transaction.objectStore('sessions').get(key);
        get.onsuccess = () => transaction.objectStore('sessions').put({...get.result, savedAt: 'not-a-date'}, key);
        transaction.oncomplete = () => {database.close(); resolve();};
        transaction.onerror = () => reject(transaction.error);
      };
    });
    let rejected = false;
    try { await new api.IndexedDbRemoteSyncJournal({...identity, sessionId: 'new-tab'}).pendingSessions(); }
    catch { rejected = true; }
    const preserved = await new Promise<string>((resolve, reject) => {
      const request = indexedDB.open('rac-designer-teto-remote-sync');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const get = database.transaction('sessions', 'readonly').objectStore('sessions').get(key);
        get.onsuccess = () => {resolve(get.result.savedAt); database.close();};
        get.onerror = () => reject(get.error);
      };
    });
    return {rejected, preserved};
  }, JSON.stringify(base));
  expect(result).toEqual({rejected: true, preserved: 'not-a-date'});
});

test('read de registro local inválido rejeita e preserva bytes e versão do banco', async ({page}) => {
  const result = await page.evaluate(async () => {
    const name = 'rac-designer-teto';
    const raw = {version: 777, constructionSites: 'conteudo-invalido', marker: 'preservar'};
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 2);
      request.onupgradeneeded = () => request.result.createObjectStore('construction-site-documents');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('construction-site-documents', 'readwrite');
        transaction.objectStore('construction-site-documents').put(raw, 'construction-sites');
        transaction.oncomplete = () => {database.close(); resolve();};
        transaction.onerror = () => reject(transaction.error);
      };
    });
    let rejected = false;
    try { await new window.__prd004.IndexedDbConstructionSiteStorageDriver(indexedDB, name, true).read(); }
    catch { rejected = true; }
    const legacyDetected = await window.__prd004.inspectLegacyConstructionSiteData(indexedDB);
    const preserved = await new Promise<{version: number; raw: unknown}>((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const read = database.transaction('construction-site-documents', 'readonly')
          .objectStore('construction-site-documents').get('construction-sites');
        read.onsuccess = () => {resolve({version: database.version, raw: read.result}); database.close();};
        read.onerror = () => reject(read.error);
      };
    });
    return {rejected, legacyDetected, preserved};
  });
  expect(result).toEqual({rejected: true, legacyDetected: true,
    preserved: {version: 2, raw: {version: 777, constructionSites: 'conteudo-invalido', marker: 'preservar'}}});
});
