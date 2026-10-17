import {expect, test, type Page} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {expectNoConsoleErrors, startConsoleErrorCapture} from './helpers/rac-editor.helpers';

const PHOTO_URL = '/api/private-storage/rac-designer-teto/site/photos/familia_1234.png';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=', 'base64');

for (const viewport of [{width: 390, height: 844}, {width: 1280, height: 900}]) {
  test.describe(`Salvamento de casa em ${viewport.width}px`, () => {
    test.use({viewport});
    test.beforeEach(async ({page}) => {
      startConsoleErrorCapture(page);
      await page.route('**/api/private-storage/**', (route) => route.fulfill({contentType: 'image/png', body: PNG}));
      await page.route('**/api/trpc/storage.uploadImage**', (route) => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{result: {data: {json: {key: 'rac-designer-teto/site/photos/familia_1234.png', url: PHOTO_URL, bytes: PNG.length, mimeType: 'image/png'}}}}]),
      }));
      await setupSeededRacEditorPage(page, {}, {initialScreen: 'management'});
    });
    test.afterEach(async ({page}) => expectNoConsoleErrors(page));

    test('mostra validação e cria casa com foto, preservando dados após recarga', async ({page}, testInfo) => {
      await openHouses(page, viewport.width);
      await page.getByRole('button', {name: '+ Adicionar Casa'}).click();
      await page.getByRole('button', {name: 'Salvar Configurações'}).click();
      await expect(page.getByText('Revise os campos indicados antes de salvar.')).toBeVisible();
      await expect(page.getByText('Informe o nome da família.')).toBeVisible();
      await page.screenshot({path: testInfo.outputPath('validation-feedback.png')});
      await page.getByLabel('Nome da Família', {exact: true}).fill('Família nova de teste');
      await page.getByLabel('Contato Principal', {exact: true}).fill('Contato teste');
      await page.getByLabel('Foto da Família arquivo').setInputFiles({name: 'familia.png', mimeType: 'image/png', buffer: PNG});
      await page.getByRole('button', {name: 'Usar esta imagem'}).click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.getByTestId('family-photo-field').locator('img').last()).toHaveAttribute('src', /^(data:image\/|\/api\/private-storage\/)/);
      await page.getByRole('button', {name: 'Salvar Configurações'}).click();
      await expect(page.getByTestId('house-configuration-form')).toHaveCount(0);
      await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites[0].families.some((family) => family.name === 'Família nova de teste' && family.photoDataUrl === PHOTO_URL)).toBe(true);
      await page.screenshot({path: testInfo.outputPath('house-created.png')});
      await page.reload();
      const document = await readConstructionSiteDocument(page);
      expect(document?.constructionSites[0].families.find((family) => family.name === 'Família nova de teste')?.photoDataUrl).toBe(PHOTO_URL);
    });

    test('edita e reabre casa cuja foto usa a rota privada atual', async ({page}) => {
      // Reproduz o contrato retornado pelo upload remoto sem acessar dados reais.
      await page.evaluate(async (photoUrl) => {
        const request = indexedDB.open('rac-designer-teto', 2);
        await new Promise<void>((resolve, reject) => {
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction('construction-site-documents', 'readwrite');
            const store = transaction.objectStore('construction-site-documents');
            const get = store.get('construction-sites');
            get.onsuccess = () => {
              const document = get.result;
              document.constructionSites[0].families[0].photoDataUrl = photoUrl;
              store.put(document, 'construction-sites');
            };
            transaction.oncomplete = () => {database.close(); resolve();};
            transaction.onerror = () => {database.close(); reject(transaction.error);};
          };
        });
      }, PHOTO_URL);
      await page.reload();
      if (viewport.width >= 768) {
        await page.getByRole('button', {name: 'Abrir menu principal'}).click();
        await page.getByRole('button', {name: 'Construções TETO', exact: true}).click();
      }
      await openHouses(page, viewport.width);
      if (viewport.width < 700) await page.getByTestId('house-mobile-card').filter({hasText: 'Família E2E'}).click();
      else await page.getByRole('row', {name: /Família E2E/}).click();
      await expect(page.getByTestId('family-photo-field').locator('img')).toBeVisible();
      await page.getByLabel('Contato Principal', {exact: true}).fill('Contato atualizado');
      await page.getByRole('button', {name: 'Salvar Configurações'}).click();
      await expect(page.getByTestId('house-configuration-form')).toHaveCount(0);
      await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites[0].families[0].primaryContactName).toBe('Contato atualizado');
      await page.reload();
      const document = await readConstructionSiteDocument(page);
      expect(document?.constructionSites[0].families[0].photoDataUrl).toBe(PHOTO_URL);
    });
  });
}

async function openHouses(page: Page, width: number) {
  if (width < 700) await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).click();
  else await page.getByRole('row', {name: /CC2603.*Andamento/i}).click();
}
