import {expect, test} from '@playwright/test';
import {
  createHouse,
  ensureOverflowMenuOpen,
  expectNoConsoleErrors,
  getCanvasObjectsSummary,
  setupRacEditorPage,
  startConsoleErrorCapture,
} from './helpers/rac-editor.helpers';

test.describe('RAC 3D viewer', () => {
  test.describe.configure({mode: 'serial'});

  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });

  test.afterEach(async ({page}) => {
    expectNoConsoleErrors(page);
  });

  test('viewer 3D: abre modal, executa controles e insere snapshot no canvas', async ({page}) => {
    await createHouse(page, 'tipo6');

    const beforeObjects = await getCanvasObjectsSummary(page);
    const beforeImageCount = beforeObjects.filter((obj) => obj.type === 'image').length;

    await ensureOverflowMenuOpen(page);
    await page.getByRole('button', {name: 'Visualização 3D'}).click();
    await expect(page.getByRole('heading', {name: 'Visualizador 3D'})).toBeVisible();

    await page.locator('button[title="Cor das Paredes"]').click();
    await page.locator('button[title="Terracota"]').click();

    await page.locator('button[title="Resetar Câmera"]').click();
    await page.locator('button[title="Fullscreen"]').click();
    await expect(page.locator('button[title="Sair do Fullscreen"]')).toBeVisible();

    await expect.poll(async () => page.locator('canvas').count()).toBeGreaterThan(1);
    const insertButton = page.locator('button[title="Inserir no Canvas"]');
    await expect(insertButton).toBeEnabled();
    await insertButton.click();

    await expect
      .poll(async () => {
        const objects = await getCanvasObjectsSummary(page);
        return objects.filter((obj) => obj.type === 'image').length;
      })
      .toBeGreaterThan(beforeImageCount);

    await page.locator('button[title="Fechar"]').click();
    await expect(page.getByRole('heading', {name: 'Visualizador 3D'})).toBeHidden();
  });

  test('viewer 3D: não renderiza casa quando o tipo foi escolhido mas nenhuma vista foi inserida', async ({page}) => {
    const now = new Date().toISOString();
    await page.addInitScript((timestamp) => {
      localStorage.setItem('rac-tutorial-completed', 'true');
      localStorage.setItem('rac-piloti-tip-shown', 'true');
      localStorage.setItem('rac-wall-tip-shown', 'true');
      localStorage.setItem('rac-line-tip-shown', 'true');
      localStorage.setItem('rac-arrow-tip-shown', 'true');
      localStorage.setItem('rac-distance-tip-shown', 'true');
      localStorage.setItem('rac-settings', JSON.stringify({
        autoNavigatePiloti: false,
        zoomEnabledByDefault: true,
        openEditorsAtFixedPosition: false,
        disableDrawModeAfterFreehand: false,
        showStairsOnTopView: false,
      }));
      localStorage.setItem('rac-projects', JSON.stringify({
        version: 1,
        projects: [{
          project: {
            id: 'project_empty_3d',
            name: 'Projeto RAC',
            status: 'draft',
            activeHouseId: 'house_empty_3d',
            leaderAssignments: [],
            monitorAssignments: [],
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          communities: [],
          families: [{
            id: 'family_empty_3d',
            projectId: 'project_empty_3d',
            name: 'Família E2E',
            notes: '',
          }],
          people: [],
          houses: [{
            id: 'house_empty_3d',
            projectId: 'project_empty_3d',
            familyId: 'family_empty_3d',
            houseType: 'tipo6',
            terrainType: 1,
            status: 'draft',
            designSettings: {selectedPilotiHeights: [1, 1.5, 2, 2.5, 3]},
            siteAssessment: {
              desnivelCm: 0,
              hasConcreteGross: false,
              hasConcreteFine: false,
              hasStone: false,
              hasWater: false,
              hasRoots: false,
              hasPipe: false,
              hasBranches: false,
              hasWires: false,
            },
            pilotiLayout: {points: []},
            drawingDocument: {schemaVersion: 1, views: {}},
            notes: '',
            version: 1,
            createdAt: timestamp,
            updatedAt: timestamp,
          }],
        }],
      }));
    }, now);

    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await expect(page.getByRole('button', {name: 'Casa TETO (Opções)'})).toBeVisible();

    await page.getByRole('button', {name: 'Visualização 3D'}).click();
    const viewerDialog = page.getByRole('dialog', {name: 'Visualizador 3D'});
    await expect(viewerDialog).toBeVisible();
    await expect(viewerDialog.getByText('Nenhuma casa criada. Adicione uma planta primeiro.')).toBeVisible();
    await expect(viewerDialog.locator('canvas')).toHaveCount(0);
  });
});

