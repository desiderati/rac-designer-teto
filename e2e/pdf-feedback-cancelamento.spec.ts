import {expect, test, type Page} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

const evidence = resolve('outputs/pdf-feedback-cancelamento');
mkdirSync(resolve(evidence, 'screenshots'), {recursive: true});
mkdirSync(resolve(evidence, 'artifacts'), {recursive: true});
const capture = (page: Page, name: string) => page.screenshot({path: resolve(evidence, 'screenshots', name), animations: 'disabled'});

async function fixture(page: Page) {
  await setupSeededRacEditorPage(page, {houseType: 'tipo6', insertInitialViews: true,
    selectedPilotiHeights: [1.5], leaders: '',
    pilotis: {piloti_0_0: {height: 1.5, nivel: 0.5, isMaster: true}}});
}

async function openExport(page: Page, entry: 'listagem' | 'canvas' | 'zip') {
  if (entry === 'canvas') await page.getByRole('button', {name: 'Exportar RAC em PDF', exact: true}).click();
  else {
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
    if (entry === 'zip') {
      await page.getByRole('button', {name: 'Exportar RACs ZIP da construção CC2603'}).click();
      await page.getByRole('button', {name: 'Exportar RACs ZIP', exact: true}).click();
      return;
    }
    await page.getByRole('row', {name: /CC2603.*Andamento/}).click();
    await page.getByTestId('house-desktop-table').getByRole('button', {name: /^Exportar RAC PDF da casa/}).click();
  }
  await expect(page.getByRole('heading', {name: 'Checklist da RAC', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Gerar PDF', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Checklist da RAC', exact: true})).toHaveCount(0);
}

for (const entry of ['listagem', 'canvas', 'zip'] as const) {
  test(`${entry}: progresso aparece e X cancela antes da ilustração terminar`, async ({page}) => {
    test.setTimeout(90_000);
    let release!: () => void;
    const gate = new Promise<void>(resolve => {release = resolve;});
    let requests = 0;
    const failures: string[] = [];
    const downloads: string[] = [];
    page.on('requestfailed', request => {
      if (request.url().includes('generateHouseIllustration')) failures.push(request.failure()?.errorText ?? '');
    });
    page.on('download', download => {downloads.push(download.suggestedFilename());});
    await page.route('**/api/trpc/storage.generateHouseIllustration**', async route => {
      const request = route.request().postDataJSON();
      const input = (request['0'] ?? request).json;
      const number = ++requests;
      if (number === 1) await gate;
      // Porta IA simulada: devolve a entrada; não comprova geração artística conectada.
      if (route.request().failure()) return;
      await route.fulfill({contentType: 'application/json', body: JSON.stringify([{result: {data: {json: {
        dataUrl: `data:image/png;base64,${input.base64}`, url: null,
      }}}}])});
    });
    await fixture(page);
    const before = (await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].status;
    await openExport(page, entry);
    await expect.poll(() => requests).toBe(1);
    await expect(page.getByRole('list', {name: 'Etapas da geração do PDF'})).toBeVisible();
    await expect(page.locator('[data-sonner-toast][data-type="warning"]')).toHaveCount(0);
    const cancel = page.getByRole('button', {name: entry === 'zip' ? 'Cancelar geração dos PDFs' : 'Cancelar geração do PDF', exact: true});
    await expect(cancel).toBeEnabled();
    await capture(page, `${entry}-progresso-cancelavel.png`);
    await cancel.click();
    await expect(page.getByText(entry === 'zip' ? 'Geração dos PDFs cancelada.' : 'Geração do PDF cancelada.', {exact: true})).toBeVisible();
    await expect(page.getByRole('list', {name: 'Etapas da geração do PDF'})).toHaveCount(0);
    await expect.poll(() => failures.length).toBe(1);
    release();
    expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].status).toBe(before);
    expect(downloads).toEqual([]);
    await expect(page.getByRole('heading', {name: 'Prévia da RAC em PDF', exact: true})).toHaveCount(0);
    await capture(page, `${entry}-cancelado.png`);
    if (entry === 'listagem') {
      await page.getByTestId('house-desktop-table').getByRole('button', {name: /^Exportar RAC PDF da casa/}).click();
      await page.getByRole('button', {name: 'Gerar PDF', exact: true}).click();
      await expect(page.getByRole('heading', {name: 'Prévia da RAC em PDF', exact: true})).toBeVisible();
      expect(requests).toBe(2);
      await capture(page, 'listagem-retentativa-previa.png');
      expect((await readConstructionSiteDocument(page))!.constructionSites[0].houses[0].status).toBe(before);
    }
    writeFileSync(resolve(evidence, 'artifacts', `${entry}-resultado.json`), JSON.stringify({entry,
      viewport: page.viewportSize(), integration: 'IA simulada devolvendo entrada; sem chamada externa',
      requests, cancelledHttpFailures: failures, noDownloadAfterCancel: downloads.length === 0,
      houseStatusPreserved: true, retryPreview: entry === 'listagem'}, null, 2));
  });
}
