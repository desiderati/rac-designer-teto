import {expect, test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {
  createHouse,
  expectNoConsoleErrors,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

const pdfExportSeed = {
  houseSize: 'large' as const,
  leaders: 'Ana + Bruno',
  extraMaterials: {
    floorBeams: 12,
    rafters: 24,
    secondaryBeams: 8,
    gutters: 4,
    justification: 'Material extra aprovado pela monitoria.',
  },
  notes: 'Casa deve manter acesso lateral livre.',
  selectedPilotiHeights: [1, 1.5, 2, 2.5],
  siteAssessment: {
    soilProfile: 'water_table' as const,
    hasHydraulicObstacles: true,
    hasElevatedObstacles: true,
  },
  monitors: [
    {name: 'Carioca', phone: '(41) 98889-7269', status: 'active' as const},
    {name: 'Senna', phone: '(41) 99512-0514', status: 'inactive' as const},
    {name: 'John', phone: '(51) 99117-9216', status: 'active' as const},
  ],
  pilotis: {
    piloti_0_0: {height: 1, nivel: 0.1, isMaster: true},
    piloti_1_0: {height: 1.5, nivel: 0.3},
    piloti_3_2: {height: 2, nivel: 0.8},
  },
};

async function expectPdfPreviewRendered(page: Parameters<typeof test>[0]['page']) {
  await expect(page.getByTestId('pdf-preview-surface')).toBeVisible();
  const canvas = page.getByTestId('pdf-preview-canvas-1');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => Number(await canvas.getAttribute('width'))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await canvas.getAttribute('height'))).toBeGreaterThan(0);
  await expect(page.getByTestId('pdf-preview-loading')).toHaveCount(0);
}

test.describe('Exportação PDF do RAC', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('gera download de um relatório PDF A4 paisagem a partir do editor', async ({page}) => {
    await setupRacEditorPage(page);
    await createHouse(page, 'tipo6');
    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Exportar RAC em PDF'}).click();
    await expect(page.getByRole('dialog', {name: 'Checklist da RAC'})).toBeVisible();
    await page.getByRole('button', {name: 'Gerar PDF'}).click();
    await expect(page.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    await expectPdfPreviewRendered(page);
    await page.getByRole('button', {name: 'Baixar PDF'}).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('RAC-CC2603-FAMILIA-E2E.pdf');
    await expect(page.getByText('PDF salvo com sucesso!')).toBeVisible();

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const pdf = readFileSync(downloadPath!);
    const pdfText = pdf.toString('latin1');

    expect(pdfText.startsWith('%PDF')).toBe(true);
    expect(pdfText).toContain('/Creator (RAC Designer TETO)');
    expect(pdfText).toMatch(/\/MediaBox \[0 0 841\.88\d* 595\.27\d*\]/);
    expect((pdfText.match(/\/Type \/Page\b/g) ?? []).length).toBe(2);
    await expect.poll(async () => {
      const document = await readConstructionSiteDocument(page);
      return document?.constructionSites[0]?.houses[0]?.status ?? null;
    }).toBe('rac_printed');
    const exportedDocument = await readConstructionSiteDocument(page);
    expect(exportedDocument?.constructionSites[0]?.houses[0]?.lastRacExportedAt)
      .toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await page.getByRole('button', {name: 'Abrir menu principal'}).click();
    await page.getByRole('button', {name: 'Construções TETO'}).click();
    const documentAfterOpeningConstructionList = await readConstructionSiteDocument(page);
    expect(documentAfterOpeningConstructionList?.constructionSites[0]?.houses[0]?.status).toBe('rac_printed');
    await page.getByRole('row', {name: /CC2603.*Andamento/i})
      .getByRole('button', {name: 'Gerenciar casas da construção CC2603'})
      .click();
    const documentAfterOpeningHouseList = await readConstructionSiteDocument(page);
    expect(documentAfterOpeningHouseList?.constructionSites[0]?.houses[0]?.status).toBe('rac_printed');
    await expect(page.getByRole('row', {name: /Família E2E.*Tipo 6.*RAC Impressa/i})).toBeVisible();
  });

  test('gera download pelo menu móvel da conta', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
    });

    await expect(page.getByRole('button', {name: 'Exportar RAC em PDF'})).toHaveCount(0);

    await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
    const exportButton = page.getByRole('button', {name: 'Exportar RAC em PDF'});
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    await expect(page.getByRole('dialog', {name: 'Checklist da RAC'})).toBeVisible();
    await page.getByRole('button', {name: 'Gerar PDF'}).click();
    await expect(page.getByText('Prévia da RAC em PDF')).toBeVisible();
    await page.getByRole('button', {name: 'Baixar PDF'}).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('RAC-CC2603-FAMILIA-E2E.pdf');
  });

  test('gera a prévia quando o documento legado contém uma imagem persistida no Storage', async ({page}) => {
    await page.route('**/manus-storage/**', async (route) => {
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'),
      });
    });
    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
      canvasObjects: [{
        id: 'legacy-photo-e2e',
        kind: 'image',
        shape: 'image',
        geometry: {left: 72, top: 64, width: 1, height: 1, scaleX: 100, scaleY: 100},
        resource: {
          src: 'https://legacy.example.test/manus-storage/rac-designer-teto/unassigned/photos/foto.png',
          storageUrl: 'https://legacy.example.test/manus-storage/rac-designer-teto/unassigned/photos/foto.png',
        },
      }],
    });

    await page.getByRole('button', {name: 'Exportar RAC em PDF'}).click();
    await page.getByRole('button', {name: 'Gerar PDF'}).click();

    await expect(page.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    await expect(page.getByText(/^Falha ao .*PDF\.$/)).toHaveCount(0);
  });

  test('gera a prévia sem tocar um Canvas vivo que já esteja contaminado', async ({page}) => {
    await page.addInitScript(() => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'crossOrigin');
      if (!descriptor?.set || !descriptor.get) throw new Error('API crossOrigin indisponível no navegador.');

      let firstAnonymousAssignment = true;
      Object.defineProperty(HTMLImageElement.prototype, 'crossOrigin', {
        configurable: true,
        get() {
          return descriptor.get!.call(this);
        },
        set(value: string | null) {
          // Simula o legado: a primeira hidratação ignora crossOrigin e carrega
          // a imagem como uma fonte externa sem CORS. As tentativas posteriores
          // do exportador ainda configuram anonymous normalmente.
          if (firstAnonymousAssignment && value === 'anonymous') {
            firstAnonymousAssignment = false;
            return;
          }
          descriptor.set!.call(this, value);
        },
      });
    });
    await page.route('https://uncors.example.test/photo.png', async (route) => {
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'),
      });
    });
    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
      canvasObjects: [{
        id: 'uncors-photo-e2e',
        kind: 'image',
        shape: 'image',
        geometry: {left: 72, top: 64, width: 1, height: 1, scaleX: 100, scaleY: 100},
        resource: {src: 'https://uncors.example.test/photo.png'},
      }],
    });

    const isLiveCanvasTainted = await page.evaluate(() => {
      const liveCanvas = Array.from(document.querySelectorAll('canvas'))
        .find((candidate) => candidate.width === 1667 && candidate.height === 1300 && candidate.classList.contains('lower-canvas'));
      if (!liveCanvas) throw new Error('Canvas Fabric vivo não encontrado para a regressão de taint.');

      try {
        liveCanvas.getContext('2d')?.getImageData(0, 0, 1, 1);
        return false;
      } catch (error) {
        return error instanceof DOMException && error.name === 'SecurityError';
      }
    });
    expect(isLiveCanvasTainted).toBe(true);

    await page.getByRole('button', {name: 'Exportar RAC em PDF'}).click();
    await page.getByRole('button', {name: 'Gerar PDF'}).click();

    await expect(page.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    await expect(page.getByTitle('Prévia do PDF da RAC')).toBeVisible();
    await expect(page.getByText(/^Falha ao .*PDF\.$/)).toHaveCount(0);
  });

  test('renderer individual da casa não falha com imagem legada sem CORS', async ({page}) => {
    await page.route('https://uncors.example.test/house-photo.png', async (route) => {
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'),
      });
    });

    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
      canvasObjects: [{
        id: 'legacy-house-photo',
        kind: 'image',
        shape: 'image',
        geometry: {left: 72, top: 64, width: 1, height: 1, scaleX: 100, scaleY: 100},
        resource: {src: 'https://uncors.example.test/house-photo.png'},
      }],
    });

    const imageDataUrl = await page.evaluate(async () => {
      const {renderHouseDrawingCanvasImageDataUrl} = await import(
        `${location.origin}/@fs/home/ubuntu/editor-planta-baixa/client/src/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts`
      );

      return renderHouseDrawingCanvasImageDataUrl({
        drawingDocument: {
          canvas: {
            schemaVersion: 1,
            objects: [{
              id: 'legacy-house-photo',
              kind: 'image',
              shape: 'image',
              geometry: {left: 20, top: 20, width: 1, height: 1, scaleX: 100, scaleY: 100},
              resource: {src: 'https://uncors.example.test/house-photo.png'},
            }],
          },
        },
      } as never);
    });

    expect(imageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('renderer individual sanitiza Pattern legado sem CORS', async ({page}) => {
    await page.route('https://uncors.example.test/legacy-pattern.png', async (route) => {
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'),
      });
    });
    await setupSeededRacEditorPage(page, pdfExportSeed);

    const imageDataUrl = await page.evaluate(async () => {
      const {renderHouseDrawingCanvasImageDataUrl} = await import(
        `${location.origin}/@fs/home/ubuntu/editor-planta-baixa/client/src/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts`
      );

      return renderHouseDrawingCanvasImageDataUrl({
        drawingDocument: {
          canvas: {
            schemaVersion: 1,
            objects: [{
              id: 'legacy-pattern',
              kind: 'terrain',
              shape: 'rect',
              geometry: {left: 80, top: 80, width: 120, height: 80},
              style: {
                fill: {
                  type: 'pattern',
                  source: 'https://uncors.example.test/legacy-pattern.png',
                  repeat: 'repeat',
                },
              },
            }],
          },
        },
      } as never);
    });

    expect(imageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('recria o Canvas descartável quando as duas primeiras capturas já estão tainted', async ({page}) => {
    await page.addInitScript(() => {
      const originalToDataUrl = HTMLCanvasElement.prototype.toDataURL;
      let taintedIsolatedCanvasCount = 0;
      Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
        configurable: true,
        value(this: HTMLCanvasElement, ...args: Parameters<HTMLCanvasElement['toDataURL']>) {
          if (taintedIsolatedCanvasCount < 2 && this.style.left === '-10000px') {
            taintedIsolatedCanvasCount += 1;
            throw new DOMException('Tainted canvases may not be exported.', 'SecurityError');
          }
          return originalToDataUrl.apply(this, args);
        },
      });
    });
    await setupSeededRacEditorPage(page, {
      ...pdfExportSeed,
      insertInitialViews: true,
    });

    await page.getByRole('button', {name: 'Exportar RAC em PDF'}).click();
    await page.getByRole('button', {name: 'Gerar PDF'}).click();

    await expect(page.getByRole('dialog', {name: 'Prévia da RAC em PDF'})).toBeVisible();
    await expect(page.getByTitle('Prévia do PDF da RAC')).toBeVisible();
    await expect(page.getByText(/^Falha ao .*PDF\.$/)).toHaveCount(0);
  });
});
