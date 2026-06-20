import {expect, test} from '@playwright/test';
import {
  expectNoConsoleErrors,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.describe('Bloqueios por status', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupSeededRacEditorPage(page, {insertInitialViews: true});
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('casa construída bloqueia configuração e materiais extras até voltar para rascunho', async ({page}) => {
    await openHousesList(page);

    await page.getByRole('row', {name: /Família E2E.*Tipo 6.*Rascunho/i})
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
    await builtRow.getByRole('button', {name: 'Abrir materiais extras da casa Família E2E'}).click();
    await expect(page.getByRole('heading', {name: 'Materiais Extras', level: 1})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Salvar Materiais Extras'})).toBeDisabled();

    await page.getByRole('button', {name: 'Voltar'}).click();
    await builtRow.getByRole('button', {name: 'Voltar casa Família E2E para rascunho'}).click();
    await expect(page.getByRole('heading', {name: 'Voltar casa para rascunho?'})).toBeVisible();
    await page.getByRole('button', {name: 'Voltar para rascunho'}).click();
    await expect(page.getByRole('row', {name: /Família E2E.*Tipo 6.*Rascunho/i})).toBeVisible();
  });

  test('construção arquivada exibe apenas desarquivar e não abre formulário', async ({page}) => {
    await openConstructionList(page);

    await page.getByRole('row', {name: /CC2603.*Em andamento/i})
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
  });
});

async function openConstructionList(page: Parameters<typeof setupSeededRacEditorPage>[0]) {
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO'}).click();
  await expect(page.getByRole('row', {name: /CC2603.*Em andamento/i})).toBeVisible();
}

async function openHousesList(page: Parameters<typeof setupSeededRacEditorPage>[0]) {
  await openConstructionList(page);
  await page.getByRole('row', {name: /CC2603.*Em andamento/i})
    .getByRole('button', {name: 'Gerenciar casas da construção CC2603'})
    .click();
  await expect(page.getByRole('heading', {name: /^Casas - CC2603/})).toBeVisible();
}
