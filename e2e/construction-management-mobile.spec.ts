import {expect, test, type Page} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {readConstructionSiteDocument} from './helpers/construction-site-storage.helpers';

test.use({
  viewport: {width: 390, height: 844},
  isMobile: true,
  hasTouch: true,
});

test.describe('Gestão mobile sem overflow horizontal', () => {
  test.beforeEach(async ({page}) => {
    await setupSeededRacEditorPage(page, {
      monitors: [{
        name: 'Monitoria E2E',
        phone: '(41) 99999-8888',
        email: 'monitoria@example.com',
      }],
    });
  });

  test('cria Construção TETO ocupando a largura disponível', async ({page}) => {
    await openConstructionManagement(page);
    await page.getByRole('button', {name: '+ Adicionar Construção'}).click();

    await expect(page.getByRole('heading', {name: 'Adicionar Construção TETO'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', 'form');

    await page.getByLabel('Código da CC').fill('CC2610');
    await page.getByLabel('Comunidade').fill('Comunidade Mobile');
    await selectConstructionDate(page);
    await page.getByRole('button', {name: 'Criar Construção'}).click();

    await expect(page.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    await expect(page.getByTestId('construction-mobile-list').getByText('CC2610')).toBeVisible();
  });

  test('edita Construção TETO ocupando a largura disponível', async ({page}) => {
    await openConstructionManagement(page);
    await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'}).click();

    await expect(page.getByRole('heading', {name: 'Editar Construção TETO'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', 'form');

    await page.getByLabel('Comunidade').fill('Tiradentes Atualizada');
    await page.getByRole('button', {name: 'Salvar Construção'}).click();

    await expect(page.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    await expect(page.getByTestId('construction-mobile-list').getByText('Tiradentes Atualizada')).toBeVisible();
  });

  test('cria Casa ocupando a largura disponível', async ({page}) => {
    await openHouseManagement(page);
    await page.getByRole('button', {name: '+ Adicionar Casa'}).click();

    await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', '[data-testid="house-configuration-form"]');
    await expect(page.getByTestId('site-actions-grid')).toHaveClass(/sticky/);

    await page.getByRole('button', {name: 'Alternar seção Detalhes da Família'}).click();
    await expect(page.getByLabel('Nome da Família')).toBeHidden();
    await page.getByRole('button', {name: 'Salvar Configurações'}).click();
    await expect(page.getByLabel('Nome da Família')).toBeVisible();

    await page.getByLabel('Nome da Família').fill('Família Mobile Nova');
    await page.getByLabel('Contato Principal').fill('Maria Mobile');
    await page.getByLabel('Telefone').fill('41999990000');
    await expect(page.getByTestId('section-dirty-indicator')).toHaveAttribute('aria-label', 'Alterações não salvas');
    await page.getByRole('button', {name: 'Salvar Configurações'}).click();

    await expect(page.getByTestId('house-mobile-list')).toBeVisible();
    await expect(page.getByTestId('house-mobile-list').getByText('Família Mobile Nova')).toBeVisible();
  });

  test('edita Casa ocupando a largura disponível', async ({page}) => {
    await openHouseManagement(page);
    await page.getByTestId('house-mobile-card').filter({hasText: 'Família E2E'}).click();

    await expect(page.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', '[data-testid="house-configuration-form"]');

    const familyNameField = page.getByLabel('Nome da Família');
    await familyNameField.fill('Família E2E Atualizada');
    await expect(familyNameField).toHaveValue('Família E2E Atualizada');
    await familyNameField.blur();
    await page.getByRole('button', {name: 'Salvar Configurações'}).click();

    await expect(page.getByTestId('house-mobile-list')).toBeVisible();
    await expect.poll(async () => {
      const persistedDocument = await readConstructionSiteDocument(page);
      return persistedDocument?.constructionSites[0]?.families[0]?.name;
    }, {timeout: 10_000}).toBe('Família E2E Atualizada');
    await expect(page.getByTestId('house-mobile-list').getByText('Família E2E Atualizada')).toBeVisible();
  });

  test('mantém cards abaixo de 680px e tabela a partir de 680px', async ({page}) => {
    await openHouseManagement(page);
    await page.setViewportSize({width: 679, height: 900});
    await expect(page.getByTestId('house-mobile-list')).toBeVisible();
    await expect(page.getByTestId('house-desktop-table')).toBeHidden();

    await page.setViewportSize({width: 680, height: 900});
    await expect(page.getByTestId('house-mobile-list')).toBeHidden();
    await expect(page.getByTestId('house-desktop-table')).toBeVisible();
  });

  test('mantém cards de construções e monitores abaixo de 680px', async ({page}) => {
    await openConstructionManagement(page);

    await page.setViewportSize({width: 679, height: 900});
    await expect(page.getByTestId('construction-mobile-list')).toBeVisible();
    await expect(page.getByTestId('construction-desktop-table')).toBeHidden();

    await page.setViewportSize({width: 680, height: 900});
    await expect(page.getByTestId('construction-mobile-list')).toBeHidden();
    await expect(page.getByTestId('construction-desktop-table')).toBeVisible();

    await page.getByRole('button', {name: 'Gerenciar monitores da construção CC2603'}).click();
    await expect(page.getByTestId('monitor-desktop-table')).toBeVisible();
    await page.setViewportSize({width: 679, height: 900});
    await expect(page.getByTestId('monitor-mobile-list')).toBeVisible();
    await expect(page.getByTestId('monitor-desktop-table')).toBeHidden();

    await page.setViewportSize({width: 680, height: 900});
    await expect(page.getByTestId('monitor-mobile-list')).toBeHidden();
    await expect(page.getByTestId('monitor-desktop-table')).toBeVisible();
  });

  test('cria Monitor ocupando a largura disponível', async ({page}) => {
    await openMonitorManagement(page);
    await page.getByRole('button', {name: '+ Adicionar Monitor'}).click();

    await expect(page.getByRole('heading', {name: 'Cadastrar Monitor'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', '[data-testid="monitor-form"]');
    await expect(page.getByTestId('monitor-actions-grid')).toHaveClass(/sticky/);

    await page.getByRole('button', {name: 'Alternar seção Dados do Monitor'}).click();
    await expect(page.getByLabel('Nome do Monitor')).toBeHidden();
    await page.getByRole('button', {name: 'Cadastrar Monitor'}).click();
    await expect(page.getByLabel('Nome do Monitor')).toBeVisible();

    await page.getByLabel('Nome do Monitor').fill('Monitor Mobile Novo');
    await page.getByLabel('Telefone').fill('41999990001');
    await expect(page.getByTestId('section-dirty-indicator')).toHaveAttribute('aria-label', 'Alterações não salvas');
    await page.getByRole('button', {name: 'Cadastrar Monitor'}).click();

    await expect(page.getByTestId('monitor-mobile-list')).toBeVisible();
    await expect(page.getByTestId('monitor-mobile-list').getByText('Monitor Mobile Novo')).toBeVisible();
  });

  test('edita Monitor ocupando a largura disponível', async ({page}) => {
    await openMonitorManagement(page);
    await page.getByTestId('monitor-mobile-card').filter({hasText: 'Monitoria E2E'}).click();

    await expect(page.getByRole('heading', {name: 'Editar Monitor'})).toBeVisible();
    await expectMobileFormToFit(page, 'construction-management-shell', '[data-testid="monitor-form"]');

    await page.getByLabel('Nome do Monitor').fill('Monitoria E2E Atualizada');
    await page.getByRole('button', {name: 'Salvar Monitor'}).click();

    await expect(page.getByTestId('monitor-mobile-list')).toBeVisible();
    await expect(page.getByTestId('monitor-mobile-list').getByText('Monitoria E2E Atualizada')).toBeVisible();
  });
});

async function openConstructionManagement(page: Page) {
  await page.getByRole('button', {name: 'Abrir menu principal'}).click();
  await page.getByRole('button', {name: 'Construções TETO'}).click();
  await expect(page.getByTestId('construction-mobile-list')).toBeVisible();
}

async function openHouseManagement(page: Page) {
  await openConstructionManagement(page);
  await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'})
    .getByRole('button', {name: 'Gerenciar casas da construção CC2603'})
    .click();
  await expect(page.getByTestId('house-mobile-list')).toBeVisible();
}

async function openMonitorManagement(page: Page) {
  await openConstructionManagement(page);
  await page.getByTestId('construction-mobile-card').filter({hasText: 'CC2603'})
    .getByRole('button', {name: 'Gerenciar monitores da construção CC2603'})
    .click();
  await expect(page.getByTestId('monitor-mobile-list')).toBeVisible();
}

async function expectMobileFormToFit(page: Page, shellSelector: string, formSelector: string) {
  const metrics = await page.evaluate(({shellSelector, formSelector}) => {
    const viewportWidth = document.documentElement.clientWidth;
    const shell = document.querySelector<HTMLElement>(`[data-testid="${shellSelector}"]`);
    const form = document.querySelector<HTMLElement>(formSelector);
    if (!shell || !form) return null;

    const shellBox = shell.getBoundingClientRect();
    const formBox = form.getBoundingClientRect();
    return {
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      shellLeft: shellBox.left,
      shellRight: shellBox.right,
      shellWidth: shellBox.width,
      formLeft: formBox.left,
      formRight: formBox.right,
      formWidth: formBox.width,
    };
  }, {shellSelector, formSelector});

  expect(metrics).not.toBeNull();
  expect(metrics!.documentScrollWidth).toBeLessThanOrEqual(metrics!.viewportWidth + 1);
  expect(metrics!.bodyScrollWidth).toBeLessThanOrEqual(metrics!.viewportWidth + 1);
  expect(metrics!.shellLeft).toBeGreaterThanOrEqual(-1);
  expect(metrics!.shellRight).toBeLessThanOrEqual(metrics!.viewportWidth + 1);
  expect(metrics!.formLeft).toBeGreaterThanOrEqual(-1);
  expect(metrics!.formRight).toBeLessThanOrEqual(metrics!.viewportWidth + 1);
  expect(metrics!.formWidth).toBeGreaterThan(metrics!.viewportWidth * 0.8);
}

async function selectConstructionDate(page: Page) {
  await page.getByLabel('Data da Construção').click();
  const calendar = page.getByTestId('construction-date-picker-calendar');
  await expect(calendar).toBeVisible();
  await calendar.getByRole('gridcell', {name: '15', exact: true}).click();
}
