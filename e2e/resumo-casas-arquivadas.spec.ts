import {expect, test} from '@playwright/test';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {showCanvasTopBar} from './helpers/rac-editor.helpers';

const evidence = resolve('outputs/resumo-casas-arquivadas');
mkdirSync(resolve(evidence, 'screenshots'), {recursive: true});
mkdirSync(resolve(evidence, 'artifacts'), {recursive: true});
const phase = process.env.SUMMARY_SCREENSHOT_PHASE ?? 'after';

for (const viewport of [{width: 1280, height: 900}, {width: 390, height: 844}]) {
  test(`resumo arquivado opaco e sobre a lista em ${viewport.width}px`, async ({page}) => {
    // Preparar o armazenamento no Canvas desktop e só então abrir a gestão mobile.
    await page.setViewportSize({width: 1280, height: 900});
    await setupSeededRacEditorPage(page, {insertInitialViews: true,
      pilotis: {piloti_0_0: {height: 1.5, nivel: 0.5, isMaster: true}},
      extraMaterials: {gutterCount: 2, gutterCaps: 2, gutterElbows: 1, gutters: 16}});
    const stored = (await readConstructionSiteDocument(page))!;
    const site = stored.constructionSites[0];
    const baseHouse = site.houses[0], baseFamily = site.families[0];
    site.houses = Array.from({length: 6}, (_, index) => {
      const house = structuredClone(baseHouse);
      house.id = `house_summary_${index}`;
      house.familyId = `family_summary_${index}`;
      house.status = index === 5 ? 'draft' : 'archived';
      house.drawingDocument.house!.id = house.id;
      return house;
    });
    site.families = site.houses.map((house, index) => ({...baseFamily, id: house.familyId,
      name: index === 5 ? 'Casa ativa demonstração' : `Casa arquivada ${index + 1}`}));
    site.constructionSite.activeHouseId = site.houses[5].id;
    await page.evaluate<void, unknown>(data => new Promise<void>((done, reject) => {
      const request = indexedDB.open('rac-designer-teto', 2);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('construction-site-documents', 'readwrite');
        tx.objectStore('construction-site-documents').put(data, 'construction-sites');
        tx.oncomplete = () => {db.close(); done();};
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    }), stored);
    await page.reload({waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible();
    await showCanvasTopBar(page);
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
    await page.setViewportSize(viewport);
    if (viewport.width < 700) await page.getByRole('button', {name: /^Abrir casas da construção CC2603/}).click();
    else await page.getByRole('row', {name: /CC2603.*Andamento/}).click();
    const list = page.getByTestId(viewport.width < 700 ? 'house-mobile-list' : 'house-desktop-table');
    const trigger = list.getByRole('button', {name: 'Resumo da Casa de Casa arquivada 2', exact: true});
    await trigger.click();
    const tooltip = page.getByRole('dialog', {name: 'Resumo da Casa'});
    await expect(tooltip).toHaveText(/Resumo da Casa/);
    const popup = tooltip;
    await expect(popup).toBeVisible();
    await page.screenshot({path: resolve(evidence, 'screenshots', `${phase}-${viewport.width}.png`), animations: 'disabled'});
    const state = await popup.evaluate(element => {
      const ancestors = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (Number(style.opacity) < 1 || style.filter !== 'none') ancestors.push({tag: node.tagName, opacity: style.opacity, filter: style.filter});
      }
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + Math.min(35, rect.height / 2);
      return {dimmedAncestors: ancestors, insideList: Boolean(element.closest('[data-testid="house-mobile-card"],tr')),
        topElementInside: element.contains(document.elementFromPoint(x, y)), rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
        viewport: {width: innerWidth, height: innerHeight}};
    });
    writeFileSync(resolve(evidence, 'artifacts', `${phase}-${viewport.width}.json`), JSON.stringify(state, null, 2));
    expect(state.dimmedAncestors).toEqual([]);
    expect(state.insideList).toBe(false);
    expect(state.topElementInside).toBe(true);
    expect(state.rect.x).toBeGreaterThanOrEqual(0);
    expect(state.rect.x + state.rect.width).toBeLessThanOrEqual(viewport.width);
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await expect(list).toBeVisible();
  });
}
