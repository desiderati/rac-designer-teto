import {expect, test, type Page} from '@playwright/test';
import {seedConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {expectCanvasObjectsPersisted} from './helpers/rac-editor.helpers';

type FixtureWindow = Window & {
  __readinessReads?: number;
  __racDebug?: {
    getHouse: () => {id: string};
    getCanvasObjectsSummary: () => Array<{type: string; myType: string}>;
  };
};

async function setRuntime(page: Page, kinds: string[], houseId = 'house_e2e') {
  await page.evaluate(({kinds, houseId}) => {
    const fixture = window as FixtureWindow;
    fixture.__racDebug = {
      getHouse: () => ({id: houseId}),
      getCanvasObjectsSummary: () => {
        fixture.__readinessReads = (fixture.__readinessReads ?? 0) + 1;
        return kinds.map(myType => ({type: 'group', myType}));
      },
    };
  }, {kinds, houseId});
}

async function setPersisted(page: Page, kinds: string[]) {
  await seedConstructionSiteDocument(page, {
    canvasObjects: kinds.map((kind, index) => ({id: `object_${index}`, kind, shape: 'group'})),
  });
}

test.beforeEach(async ({page}) => {
  // Contrato do helper: página mínima e IndexedDB real, sem inicializar React ou Fabric.
  await page.route('**/__e2e/canvas-readiness', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><title>Contrato local de prontidão</title>',
  }));
  await page.goto('/__e2e/canvas-readiness');
  await setRuntime(page, []);
  await setPersisted(page, []);
});

test('aceita os tipos esperados nas duas camadas e permite objetos extras', async ({page}) => {
  await setRuntime(page, ['house', 'fence', 'tree']);
  await setPersisted(page, ['house', 'fence', 'line']);
  await expectCanvasObjectsPersisted(page, ['house', 'fence']);
});

for (const scenario of [
  {name: 'ambas as camadas vazias', runtime: [], persisted: []},
  {name: 'objetos somente no Canvas', runtime: ['fence'], persisted: []},
  {name: 'objetos somente no documento', runtime: [], persisted: ['fence']},
  {name: 'camadas preenchidas com outro tipo', runtime: ['house'], persisted: ['house']},
]) {
  test(`recusa ${scenario.name}`, async ({page}) => {
    await setRuntime(page, scenario.runtime);
    await setPersisted(page, scenario.persisted);
    await expect(expectCanvasObjectsPersisted(page, ['fence'], {timeout: 100}))
      .rejects.toThrow('Objetos esperados no Canvas e no documento persistido: fence');
  });
}

test('não usa o tipo da casa ou as vistas como substituto dos objetos', async ({page}) => {
  await seedConstructionSiteDocument(page, {insertInitialViews: true});
  await expect(expectCanvasObjectsPersisted(page, ['house'], {timeout: 100}))
    .rejects.toThrow('Objetos esperados no Canvas e no documento persistido: house');
});

test('exige a multiplicidade de cada tipo nas duas camadas', async ({page}) => {
  await setRuntime(page, ['fence', 'fence']);
  await setPersisted(page, ['fence']);
  await expect(expectCanvasObjectsPersisted(page, ['fence', 'fence'], {timeout: 100}))
    .rejects.toThrow('documentoPersistido');
  await setPersisted(page, ['fence', 'fence']);
  await expectCanvasObjectsPersisted(page, ['fence', 'fence']);
});

test('não aceita objetos persistidos de outra casa', async ({page}) => {
  await setRuntime(page, ['fence'], 'outra_casa');
  await setPersisted(page, ['fence']);
  await expect(expectCanvasObjectsPersisted(page, ['fence'], {timeout: 100}))
    .rejects.toThrow('casaPersistidaEncontrada');
});

test('recusa uma lista vazia de expectativas', async ({page}) => {
  await expect(expectCanvasObjectsPersisted(page, []))
    .rejects.toThrow('Informe ao menos um tipo de objeto esperado.');
});

test('recusa tipos vazios para não aprovar expectativas sem significado', async ({page}) => {
  for (const kind of ['', '   ']) {
    await expect(expectCanvasObjectsPersisted(page, [kind]))
      .rejects.toThrow('Os tipos esperados não podem ser vazios.');
  }
});

for (const delayedLayer of ['Canvas', 'documento'] as const) {
  test(`aguarda a chegada dos objetos no ${delayedLayer}`, async ({page}) => {
    if (delayedLayer === 'Canvas') await setPersisted(page, ['fence']);
    else await setRuntime(page, ['fence']);

    let completed = false;
    const waiting = expectCanvasObjectsPersisted(page, ['fence'], {timeout: 5000})
      .then(() => { completed = true; });
    // Observar uma leitura prova que o helper já começou, sem sleep ou atraso de parede.
    await expect.poll(() => page.evaluate(() => (window as FixtureWindow).__readinessReads ?? 0))
      .toBeGreaterThan(0);
    expect(completed).toBe(false);
    if (delayedLayer === 'Canvas') await setRuntime(page, ['fence']);
    else await setPersisted(page, ['fence']);
    await waiting;
    expect(completed).toBe(true);
  });
}
