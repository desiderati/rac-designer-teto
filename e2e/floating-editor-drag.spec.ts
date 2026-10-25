import {expect, test} from '@playwright/test';
import {createHouse, openPilotiEditorByDebug, setupRacEditorPage} from './helpers/rac-editor.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

test('arrasta o editor desktop nos dois eixos sem alterar dimensões ou a casa', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1100});
  await setupRacEditorPage(page);
  // A inserção pela UI materializa os grupos reais usados pelo editor do Canvas.
  await createHouse(page, 'tipo6');
  await expect.poll(async () => {
    const document = await readConstructionSiteDocument(page);
    return document?.constructionSites[0].houses[0].drawingDocument.house?.views.top.length ?? 0;
  }).toBe(1);
  const before = await readConstructionSiteDocument(page);
  expect(await openPilotiEditorByDebug(page, 'piloti_0_0')).toBe(true);
  const editor = page.getByRole('dialog', {name: 'Editor do item selecionado', exact: true});
  await expect(editor).toBeVisible();
  const original = (await editor.boundingBox())!;
  expect(original.y).toBe(8);
  const header = (await editor.getByText('Piloti A1', {exact: true}).boundingBox())!;
  const x = header.x + header.width / 2, y = header.y + header.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 90, y + 60, {steps: 5});
  await page.mouse.up();
  const moved = (await editor.boundingBox())!;
  expect(moved.x).toBeCloseTo(original.x + 90, 0);
  expect(moved.y).toBeCloseTo(original.y + 60, 0);
  expect(moved.width).toBe(original.width);
  expect(moved.height).toBe(original.height);
  await page.mouse.move(x + 90, y + 60);
  await page.mouse.down();
  await page.mouse.move(x + 90, 1050, {steps: 5});
  await page.mouse.up();
  const lower = (await editor.boundingBox())!;
  expect(lower.y + lower.height).toBeLessThanOrEqual(1092);
  await page.setViewportSize({width: 1440, height: 1000});
  await expect.poll(async () => {
    const box = (await editor.boundingBox())!;
    return box.y >= 8 && box.y + box.height <= 992;
  }).toBe(true);
  await page.screenshot({path: test.info().outputPath('editor-apos-arrasto.png'), animations: 'disabled'});
  await editor.getByRole('button', {name: 'Cancelar', exact: true}).click();
  const after = await readConstructionSiteDocument(page);
  expect(after?.constructionSites[0].houses[0].drawingDocument).toEqual(before?.constructionSites[0].houses[0].drawingDocument);
});
