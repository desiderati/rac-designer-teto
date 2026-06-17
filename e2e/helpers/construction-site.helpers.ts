import {expect, type Page} from '@playwright/test';
import {applyRacEditorInitScript} from './rac-editor.helpers';
import {
  seedConstructionSiteDocument,
  type SeedConstructionSiteDocumentOptions,
} from './construction-site-storage.helpers';

export async function setupSeededRacEditorPage(
  page: Page,
  options: SeedConstructionSiteDocumentOptions = {},
) {
  await applyRacEditorInitScript(page);

  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await seedConstructionSiteDocument(page, {
    houseType: 'tipo6',
    houseSize: 'small',
    leaders: 'Liderança inicial',
    notes: 'Nota inicial da casa',
    primaryContactName: 'Maria E2E',
    ...options,
  });
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForLoadState('networkidle', {timeout: 8000}).catch(() => undefined);
  await expect(page.getByRole('button', {name: 'Abrir menu principal'})).toBeVisible({timeout: 12000});
}
