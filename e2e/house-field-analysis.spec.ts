import {expect, test, type Page} from '@playwright/test';
import type {PersistedHouseRecord} from '../client/src/shared/types/construction-site';
import type {HouseDrawingElementDocument} from '../client/src/shared/types/house-drawing-document';
import {setupMobileFirstRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';
import {getHouseSnapshot} from './helpers/rac-editor.helpers';

const selectedPilotiHeights = [1, 1.2, 1.5, 1.8, 2, 2.2, 2.5, 3];
const manualBrace = {
  originPilotiId: 'piloti_3_2',
  destinationPilotiId: 'piloti_0_2',
  side: 'top',
  isAuto: false,
};

test.use({isMobile: true, hasTouch: true});

for (const scenario of [
  {width: 360, houseType: 'tipo6', typeLabel: 'Casa Tipo 6', sideLabel: 'Inferior', setup: true,
    orientation: {front: 'bottom'}, insertionLabel: 'Frontal'},
  {width: 767, houseType: 'tipo3', typeLabel: 'Casa Tipo 3', sideLabel: 'Direito', setup: false,
    orientation: {side2: 'right'}, insertionLabel: 'Quadrado Aberto'},
] as const) {
  test.describe(`Análise de Campo ${scenario.houseType} em ${scenario.width}px`, () => {
    test.use({viewport: {width: scenario.width, height: 900}});

    test('prepara, retoma após recarregar e insere os dados confirmados no Canvas', async ({page}) => {
      await setupMobileFirstRacEditorPage(page, {houseType: null, selectedPilotiHeights}, {
        allowPilotiHeightDefinitionOnHouseInsert: scenario.setup,
        configureCornerPilotiNiveisOnHouseInsert: scenario.setup,
      });
      await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
      await expect(page.locator('canvas.upper-canvas')).toHaveCount(0);
      await openFieldAnalysis(page);

      await test.step('concluir apenas as etapas habilitadas sem salvar rascunho parcial', async () => {
        if (scenario.setup) {
          await expect(page.getByRole('heading', {name: 'Pilotis (8/8 selecionados)', exact: true})).toBeVisible();
          await page.getByRole('button', {name: 'Confirmar', exact: true}).tap();
        }
        await expect(page.getByRole('heading', {name: 'Escolha o Tipo de Casa', exact: true})).toBeVisible();
        await page.getByRole('button', {name: scenario.typeLabel, exact: true}).tap();
        await page.getByRole('button', {name: scenario.sideLabel, exact: true}).tap();
        if (scenario.setup) {
          await page.getByRole('switch', {name: 'Definir como Mestre?'}).setChecked(true);
          await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).fill('0,30');
          await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).press('Enter');
          for (let corner = 0; corner < 3; corner += 1) {
            await page.getByRole('button', {name: 'Próximo piloti', exact: true}).tap();
          }
          expect((await readHouse(page))?.fieldAnalysis).toBeUndefined();
          expect((await readHouse(page))?.houseType).toBeNull();
          await page.getByRole('button', {name: 'Inserir', exact: true}).tap();
        }
        await expectAnalysisReady(page);
        await expect.poll(async () => (await readHouse(page))?.fieldAnalysis?.status).toBe('prepared');
        expect((await readHouse(page))?.drawingDocument.house?.preAssignedSides).toMatchObject(scenario.orientation);
      });

      await test.step('confirmar mestre, altura, nível e contraventamento pelos controles', async () => {
        await page.getByRole('button', {name: 'Selecionar piloti C4', exact: true}).tap();
        await expect(page.getByRole('button', {name: 'Selecionar piloti C4', exact: true}))
          .toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('switch', {name: 'Definir como Mestre?'})).not.toBeChecked();
        await page.getByRole('switch', {name: 'Definir como Mestre?'}).setChecked(true);
        await expect.poll(async () => (await readHouse(page))?.drawingDocument.house?.pilotis.piloti_3_2.isMaster)
          .toBe(true);
        await page.getByRole('button', {name: 'Modo automático de altura dos pilotis'}).tap();
        await expect(page.getByRole('button', {name: 'Modo automático de altura dos pilotis'}))
          .toHaveAttribute('aria-pressed', 'false');
        await page.getByRole('button', {name: '1,2', exact: true}).tap();
        await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).fill('0,50');
        await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).press('Enter');
        await expect.poll(async () => (await readHouse(page))?.drawingDocument.house?.pilotis.piloti_3_2)
          .toMatchObject({height: 1.2, nivel: 0.5, isMaster: true});

        await page.getByRole('button', {name: 'Superior', exact: true}).tap();
        await page.getByRole('button', {name: 'Piloti de destino do contraventamento'}).tap();
        // A linha C é válida; a origem e as demais linhas não são destinos horizontais.
        await expect(page.getByRole('menuitemradio')).toHaveText(['Piloti C1', 'Piloti C2', 'Piloti C3']);
        await page.getByRole('menuitemradio', {name: 'Piloti C1', exact: true}).tap();
        await page.getByRole('button', {name: 'Adicionar contraventamento', exact: true}).tap();
        await expect.poll(async () => (await readHouse(page))?.fieldAnalysis?.contraventamentos)
          .toEqual(expect.arrayContaining([manualBrace]));
        await expectAnalysisReady(page);
      });

      const prepared = (await readHouse(page))!;
      expect(prepared.houseType).toBe(scenario.houseType);
      expect(prepared.designSettings.selectedPilotiHeights).toEqual(selectedPilotiHeights);
      expect(Object.values(prepared.drawingDocument.house!.pilotis).filter((piloti) => piloti.isMaster)).toHaveLength(1);
      expect(Object.values(prepared.drawingDocument.house!.views).flat()).toHaveLength(0);
      expect(prepared.drawingDocument.canvas.objects).toEqual([]);
      expect(prepared.fieldAnalysis?.contraventamentos.some((brace) => brace.isAuto)).toBe(true);

      await test.step('voltar, recarregar e retomar sem repetir as modais', async () => {
        await page.getByRole('button', {name: 'Voltar às casas', exact: true}).tap();
        await expect(page.getByTestId('house-mobile-list')).toBeVisible();
        await page.reload({waitUntil: 'domcontentloaded'});
        await openFieldAnalysis(page);
        await expectAnalysisReady(page);
        expect(configurationOf((await readHouse(page))!)).toEqual(configurationOf(prepared));
        expect((await readHouse(page))?.fieldAnalysis).toEqual(prepared.fieldAnalysis);
        expect((await readHouse(page))?.drawingDocument.canvas.objects).toEqual([]);
        await page.getByRole('button', {name: 'Selecionar piloti C4', exact: true}).tap();
        await expect(page.getByRole('textbox', {name: 'Nível do piloti em metros'})).toHaveText('0,50');
        await expect(page.getByRole('switch', {name: 'Definir como Mestre?'})).toBeChecked();
      });

      await test.step('inserir a preparação no Canvas e consumir as pendências uma única vez', async () => {
        await page.getByRole('button', {name: 'Abrir Canvas da casa', exact: true}).tap();
        await expect(page.getByText('Gire seu celular', {exact: true})).toBeVisible();
        await page.setViewportSize({width: 740, height: 420});
        await expect(page.locator('canvas.upper-canvas')).toBeVisible();
        await expect.poll(async () => (await getHouseSnapshot(page))?.views.top.length).toBe(0);
        await page.getByRole('button', {name: 'Ferramentas do Canvas', exact: true}).tap();
        await page.getByRole('button', {name: 'Casa TETO (Opções)', exact: true}).tap();
        await page.getByRole('button', {name: scenario.insertionLabel, exact: true}).tap();
        await expect.poll(async () => (await readHouse(page))?.fieldAnalysis?.status).toBe('inserted');
        await expectNoSetupModals(page);
        await expect.poll(async () => (await getHouseSnapshot(page))?.views.top.length).toBe(1);
        await expectInsertedPreparation(page, prepared);

        // No desktop, a nova sessão deve abrir diretamente o Canvas já persistido.
        await page.setViewportSize({width: 1280, height: 900});
        await page.reload({waitUntil: 'domcontentloaded'});
        await expect(page.locator('canvas.upper-canvas')).toBeVisible();
        await expect.poll(async () => (await getHouseSnapshot(page))?.views.top.length).toBe(1);
        await expectInsertedPreparation(page, prepared);
      });
    });
  });
}

test.describe('Rascunho da Análise de Campo em 420px', () => {
  test.use({viewport: {width: 420, height: 844}});

  test('cancelar os níveis descarta as etapas anteriores e permite recomeçar', async ({page}) => {
    await setupMobileFirstRacEditorPage(page, {houseType: null, selectedPilotiHeights}, {
      allowPilotiHeightDefinitionOnHouseInsert: true,
      configureCornerPilotiNiveisOnHouseInsert: true,
    });
    const original = await readHouse(page);
    await openFieldAnalysis(page);
    await page.getByRole('button', {name: 'Confirmar', exact: true}).tap();
    await page.getByRole('button', {name: 'Casa Tipo 6', exact: true}).tap();
    await page.getByRole('button', {name: 'Inferior', exact: true}).tap();
    await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).fill('0,40');
    await page.getByRole('textbox', {name: 'Nível do piloti em metros'}).press('Enter');
    await page.getByRole('button', {name: 'Cancelar', exact: true}).tap();
    await expect(page.getByTestId('house-mobile-list')).toBeVisible();
    expect(await readHouse(page)).toEqual(original);
    await page.reload({waitUntil: 'domcontentloaded'});
    await openFieldAnalysis(page);
    await expect(page.getByRole('heading', {name: 'Pilotis (8/8 selecionados)', exact: true})).toBeVisible();
    expect(await readHouse(page)).toEqual(original);
  });
});

async function openFieldAnalysis(page: Page) {
  await expect(page.getByRole('heading', {name: 'Construções TETO', exact: true})).toBeVisible();
  if (page.viewportSize()!.width < 700) {
    await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).tap();
  } else {
    await page.getByRole('row', {name: 'Abrir casas da construção CC2603 Andamento', exact: true}).tap();
  }
  await page.getByRole('button', {name: 'Pilotis da casa Família E2E', exact: true}).tap();
}

async function expectNoSetupModals(page: Page) {
  await expect(page.getByRole('heading', {name: 'Escolha o Tipo de Casa', exact: true})).toBeHidden();
  await expect(page.getByRole('heading', {name: /^Pilotis \(/})).toBeHidden();
  await expect(page.getByRole('button', {name: 'Inserir', exact: true})).toBeHidden();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function expectAnalysisReady(page: Page) {
  const analysis = page.getByRole('region', {name: 'Análise de Campo da casa Família E2E', exact: true});
  await expect(analysis).toHaveAttribute('aria-busy', 'false');
  await expect(analysis.getByRole('heading', {name: /^Piloti [ABC][1-4]$/, level: 1})).toBeVisible();
  await expect(analysis.getByRole('button', {name: /^Selecionar piloti /})).toHaveCount(12);
  await expect(page.getByLabel('Prévia ilustrativa da casa').locator('canvas.lower-canvas')).toBeVisible();
  await expectNoSetupModals(page);
  const width = page.viewportSize()!.width;
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const preview = await page.getByLabel('Prévia ilustrativa da casa').boundingBox();
  expect(preview!.x).toBeGreaterThanOrEqual(0);
  expect(preview!.x + preview!.width).toBeLessThanOrEqual(width);
}

async function readHouse(page: Page): Promise<PersistedHouseRecord | undefined> {
  const document = await readConstructionSiteDocument(page);
  return document?.constructionSites[0]?.houses[0] as PersistedHouseRecord | undefined;
}

function configurationOf(record: PersistedHouseRecord) {
  return {
    houseType: record.houseType,
    terrainType: record.terrainType,
    designSettings: record.designSettings,
    pilotis: record.drawingDocument.house?.pilotis,
    preAssignedSides: record.drawingDocument.house?.preAssignedSides,
  };
}

function flattenElements(elements: HouseDrawingElementDocument[]): HouseDrawingElementDocument[] {
  return elements.flatMap((element) => [element, ...flattenElements(element.children ?? [])]);
}

async function expectInsertedPreparation(page: Page, prepared: PersistedHouseRecord) {
  const inserted = (await readHouse(page))!;
  expect(configurationOf(inserted)).toEqual(configurationOf(prepared));
  expect(inserted.fieldAnalysis).toEqual({status: 'inserted', contraventamentos: []});
  expect(inserted.drawingDocument.house?.views.top).toHaveLength(1);
  expect(Object.values(inserted.drawingDocument.house!.views).flat()).toHaveLength(1);
  const braces = flattenElements(inserted.drawingDocument.canvas.objects)
    .filter((element) => element.metadata?.isContraventamento);
  expect(braces).toHaveLength(prepared.fieldAnalysis!.contraventamentos.length);
  expect(braces.map((element) => element.metadata)).toContainEqual(expect.objectContaining({
    contraventamentoOrientation: 'horizontal',
    contraventamentoAnchorPilotiId: 'piloti_3_2',
    contraventamentoSide: 'top',
    contraventamentoStartCol: 0,
    contraventamentoEndCol: 3,
    isAutoContraventamento: false,
  }));
  const runtime = await getHouseSnapshot(page);
  expect(runtime?.pilotis).toEqual(prepared.drawingDocument.house?.pilotis);
  expect(runtime?.preAssignedSides).toEqual(prepared.drawingDocument.house?.preAssignedSides);
}
