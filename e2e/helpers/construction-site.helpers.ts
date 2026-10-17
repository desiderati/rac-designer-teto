import {expect, type Page} from '@playwright/test';
import type {AppSettings} from '../../client/src/shared/types/settings';
import {applyRacEditorInitScript, showCanvasTopBar} from './rac-editor.helpers';
import {
  seedConstructionSiteDocument,
  type SeedConstructionSiteDocumentOptions,
} from './construction-site-storage.helpers';

/** Prepara a origem sem montar React nem passar pelo Canvas desktop antes do mobile. */
export async function setupMobileFirstRacEditorPage(
  page: Page,
  options: SeedConstructionSiteDocumentOptions = {},
  settings: Partial<AppSettings> = {},
) {
  const bootstrapPath = '**/__e2e/mobile-storage';
  await page.route(bootstrapPath, (route) => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><head><title>Fixture local</title></head><body></body></html>',
  }));
  await page.goto('/__e2e/mobile-storage');
  await seedConstructionSiteDocument(page, options);
  await page.unroute(bootstrapPath);
  await applyRacEditorInitScript(page, settings);
  await page.goto('/', {waitUntil: 'domcontentloaded'});
}

export async function setupSeededRacEditorPage(
  page: Page,
  options: SeedConstructionSiteDocumentOptions = {},
  navigation: {initialScreen?: 'canvas' | 'management'} = {},
) {
  const requestedViewport = page.viewportSize();
  const seedAtDesktop = navigation.initialScreen === 'management' || (requestedViewport?.width ?? 1280) < 768;
  if (seedAtDesktop) {
    // Hidratar o documento antes da rotação; gestão mobile começa na listagem.
    await page.setViewportSize({width: 1280, height: 900});
  }
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
  await showCanvasTopBar(page);
  if (navigation.initialScreen === 'management') {
    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
    if (requestedViewport) await page.setViewportSize(requestedViewport);
  } else if (seedAtDesktop && requestedViewport) {
    await page.setViewportSize(requestedViewport);
    await showCanvasTopBar(page);
  }
}
