import {expect, test, type Page} from '@playwright/test';
import {
  expectNoConsoleErrors,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

test.describe('Bloqueios por status', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('casa construída bloqueia configuração e materiais extras até liberar edição', async ({page}) => {
    await openHousesList(page);

    await page.getByRole('row', {name: /Família E2E.*Tipo 6.*Definida/i})
      .getByRole('button', {name: 'Marcar casa Família E2E como construída'})
      .click();
    await expect(page.getByRole('heading', {name: 'Marcar casa como construída?'})).toBeVisible();
    await page.getByRole('button', {name: 'Marcar como construída'}).click();

    const builtRow = page.getByRole('row', {name: /Família E2E.*Tipo 6.*Construída/i});
    await expect(builtRow).toBeVisible();
    await builtRow.click();
    await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Salvar Configurações'})).toBeDisabled();

    await page.getByRole('button', {name: 'Voltar'}).click();
    await builtRow.click();
    await expandSection(page, 'Materiais Extras');
    await expect(page.getByLabel('Vigas p/ Escada')).toBeDisabled();
    await expect(page.getByRole('button', {name: 'Salvar Configurações'})).toBeDisabled();

    await page.getByRole('button', {name: 'Voltar'}).click();
    await builtRow.getByRole('button', {name: 'Liberar edição da casa Família E2E'}).click();
    await expect(page.getByRole('heading', {name: 'Liberar edição da casa?'})).toBeVisible();
    await page.getByRole('button', {name: 'Liberar edição', exact: true}).click();
    await expect(page.getByRole('row', {name: /Família E2E.*Tipo 6.*Definida/i})).toBeVisible();
  });

  test('construção arquivada exibe apenas desarquivar e não abre formulário', async ({page}) => {
    await openConstructionList(page);

    await page.getByRole('row', {name: /CC2603.*Andamento/i})
      .getByRole('button', {name: 'Arquivar construção CC2603'})
      .click();
    await expect(page.getByRole('heading', {name: 'Arquivar construção?'})).toBeVisible();
    await page.getByRole('button', {name: 'Arquivar construção'}).click();

    const archivedRow = page.getByRole('row', {name: /CC2603.*Arquivada/i});
    await expect(archivedRow).toBeVisible();
    await expect(archivedRow.getByRole('button', {name: 'Desarquivar construção CC2603'})).toBeVisible();
    await expect(archivedRow.getByRole('button', {name: 'Gerenciar casas da construção CC2603'})).toHaveCount(0);
    await expect(archivedRow.getByRole('button', {name: 'Gerenciar monitores da construção CC2603'})).toHaveCount(0);

    await archivedRow.click({force: true});
    await expect(page.getByTestId('construction-form-grid')).toHaveCount(0);

    await archivedRow.getByRole('button', {name: 'Excluir definitivamente construção CC2603'}).click();
    await expect(page.getByRole('heading', {name: 'Excluir construção definitivamente?'})).toBeVisible();
    await page.getByRole('button', {name: 'Excluir definitivamente'}).click();

    await expect(page.getByRole('row', {name: /CC2603/i})).toHaveCount(0);
    await expect.poll(async () => (await readConstructionSiteDocument(page))?.constructionSites.length).toBe(0);
  });
});

async function openConstructionList(page: Parameters<typeof setupSeededRacEditorPage>[0]) {
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO'}).click();
  await expect(page.getByRole('row', {name: /CC2603.*Andamento/i})).toBeVisible();
}

async function openHousesList(page: Parameters<typeof setupSeededRacEditorPage>[0]) {
  await openConstructionList(page);
  await page.getByRole('row', {name: /CC2603.*Andamento/i})
    .click();
  await expect(page.getByRole('heading', {name: /^Casas - CC2603/})).toBeVisible();
}

async function expandSection(page: Page, title: string) {
  const trigger = page.getByRole('button', {name: `Alternar seção ${title}`});
  if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click();
}
