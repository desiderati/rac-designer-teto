import {expect, test, type Page} from '@playwright/test';
import {
  expectNoConsoleErrors,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';

test.describe('Configuração da casa', () => {
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupSeededRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('edita e reabre a seção Sobre a Casa preservando dados opcionais', async ({page}) => {
    await openHouseConfiguration(page);

    const familySection = page.locator('section').filter({has: page.getByRole('heading', {name: 'Detalhes da Família'})});
    const aboutHouseSection = page.locator('section').filter({has: page.getByRole('heading', {name: 'Sobre a Casa'})});

    await expect(aboutHouseSection.getByLabel('Tamanho da Casa')).toContainText('Pequena');
    await expect(aboutHouseSection.getByLabel('Líderes')).toHaveValue('Liderança inicial');
    await expect(aboutHouseSection.getByLabel('Notas')).toHaveValue('Nota inicial da casa');
    await expect(familySection.getByLabel('Notas')).toHaveCount(0);

    await selectVisualOption(page, 'Tamanho da Casa', 'Grande');
    await aboutHouseSection.getByLabel('Líderes').fill('Ana e Bruno');
    await aboutHouseSection.getByLabel('Notas').fill('Casa deve manter acesso lateral livre.');
    await page.getByRole('button', {name: 'Salvar Configurações'}).click();

    await reopenHouseConfiguration(page);

    await expect(page.getByLabel('Tamanho da Casa')).toContainText('Grande');
    await expect(page.getByLabel('Líderes')).toHaveValue('Ana e Bruno');
    await expect(page.getByLabel('Notas')).toHaveValue('Casa deve manter acesso lateral livre.');

    await selectVisualOption(page, 'Tamanho da Casa', 'Sem seleção');
    await page.getByLabel('Líderes').fill('');
    await page.getByLabel('Notas').fill('');
    await page.getByRole('button', {name: 'Salvar Configurações'}).click();

    await reopenHouseConfiguration(page);

    await expect(page.getByLabel('Tamanho da Casa')).toHaveText('');
    await expect(page.getByLabel('Líderes')).toHaveValue('');
    await expect(page.getByLabel('Notas')).toHaveValue('');
  });
});

async function openHouseConfiguration(page: Page) {
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO'}).click();
  await page.getByRole('row', {name: /CC2603.*Em andamento/i})
    .getByRole('button', {name: 'Gerenciar casas da construção CC2603'})
    .click();
  await page.getByRole('row', {name: /Família E2E.*Tipo 6.*Rascunho/i}).click();
  await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
}

async function reopenHouseConfiguration(page: Page) {
  await expect(page.getByRole('heading', {name: 'Casas da Construção', hidden: true})).toBeAttached();
  await page.getByRole('row', {name: /Família E2E.*Tipo 6.*Rascunho/i}).click();
  await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
}

async function selectVisualOption(
  page: Page,
  label: string,
  option: string,
) {
  await page.getByLabel(label).click();
  await page.getByTestId(`${label}-menu`).getByRole('menuitemradio', {name: option}).click();
}
