import {expect, test} from '@playwright/test';
import type {HouseSide, HouseViewType} from '../client/src/shared/types/house';
import {expectNoConsoleErrors, setupRacEditorPage, startConsoleErrorCapture, triggerHouseAction}
  from './helpers/rac-editor.helpers';
import {expectPlantAnnotations, expectViews, inspectViewer, moveViewThroughUI, removeElevationThroughUI,
  saveAndReloadHouse, type Face}
  from './helpers/house-lifecycle.helpers';

const scenarios: Array<{type: 'tipo3' | 'tipo6'; side: HouseSide; choice: string; face: Face}> = [
  {type: 'tipo6', side: 'top', choice: 'Superior', face: 'front'},
  {type: 'tipo6', side: 'bottom', choice: 'Inferior', face: 'back'},
  {type: 'tipo3', side: 'left', choice: 'Esquerdo', face: 'right'},
  {type: 'tipo3', side: 'right', choice: 'Direito', face: 'left'},
];
const opposite: Record<HouseSide, HouseSide> = {top: 'bottom', bottom: 'top', left: 'right', right: 'left'};

test.describe('Ciclo da casa pela interface e cena 3D', () => {
  test.use({viewport: {width: 1440, height: 1000}});
  test.beforeEach(async ({page}) => {
    startConsoleErrorCapture(page);
    await setupRacEditorPage(page);
  });
  test.afterEach(({page}) => expectNoConsoleErrors(page));

  for (const scenario of scenarios) {
    test(`${scenario.type}, porta ${scenario.side}: planta, elevações, salvar/reabrir e 3D`, async ({page}, testInfo) => {
      // Cinco ciclos reais de reload + WebGL por orientação, sem aumentar limites globais.
      test.setTimeout(120_000);
      const expected = ['top:'];
      const doorView: HouseViewType = scenario.type === 'tipo6' ? 'front' : 'side2';
      const otherView: HouseViewType = scenario.type === 'tipo6' ? 'back' : 'side1';
      const lateralView: HouseViewType = scenario.type === 'tipo6' ? 'side1' : 'back';
      const doorLabel = scenario.type === 'tipo6' ? 'Frontal' : 'Quadrado Aberto';
      const otherLabel = scenario.type === 'tipo6' ? 'Posterior' : 'Quadrado Fechado';
      const lateralSides: HouseSide[] = scenario.type === 'tipo6' ? ['left', 'right'] : ['top', 'bottom'];
      const checkpoints = async (label: string) => test.step(label, async () => {
        await expectViews(page, expected);
        const sides = expected.filter(slot => slot !== 'top:').map(slot => slot.split(':')[1] as HouseSide);
        await expectPlantAnnotations(page, scenario.side, sides);
        await saveAndReloadHouse(page, expected);
        await expectPlantAnnotations(page, scenario.side, sides);
        await page.screenshot({path: testInfo.outputPath(`${label}-planta.png`)});
        const viewer = await inspectViewer(page, scenario.face, scenario.type);
        const screenshot = testInfo.outputPath(`${label}-3d.png`);
        await viewer.screenshot({path: screenshot});
        await testInfo.attach(`${label}-3d`, {path: screenshot, contentType: 'image/png'});
        await viewer.locator('button[title="Fechar"]').click();
        await expect(viewer).toBeHidden();
      });

      await test.step('inserir planta pelo menu e definir os quatro cantos', async () => {
        await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
        const confirm = page.getByRole('button', {name: 'Confirmar', exact: true});
        if (await confirm.isVisible()) await confirm.click();
        await page.getByRole('button', {name: scenario.type === 'tipo6' ? 'Casa Tipo 6' : 'Casa Tipo 3'}).click();
        await page.getByRole('button', {name: scenario.choice, exact: true}).click();
        const master = page.getByRole('switch', {name: 'Definir como Mestre?'});
        await expect(master).toBeVisible();
        if (await master.getAttribute('data-state') !== 'checked') await master.click();
        for (let corner = 0; corner < 3; corner++) await page.locator('button.h-8.w-8.rounded-full.bg-white').nth(1).click();
        await page.getByRole('button', {name: 'Inserir', exact: true}).click();
        await expectViews(page, expected);
        await moveViewThroughUI(page, 'top', undefined, {x: 720, y: 250});
      });
      await checkpoints('01-planta-isolada');

      const targets = [{x: 340, y: 430}, {x: 1100, y: 430}, {x: 480, y: 760}, {x: 960, y: 760}];
      for (const [index, elevation] of [
        {label: doorLabel, view: doorView, side: scenario.side},
        {label: otherLabel, view: otherView, side: opposite[scenario.side]},
        {label: 'Lateral', view: lateralView, side: lateralSides[0]},
        {label: 'Lateral', view: lateralView, side: lateralSides[1]},
      ].entries()) {
        await triggerHouseAction(page, elevation.label, elevation.side === 'left' ? 'Esquerdo'
          : elevation.side === 'right' ? 'Direito' : elevation.side === 'top' ? 'Superior' : 'Inferior');
        expected.push(`${elevation.view}:${elevation.side}`);
        await expectViews(page, expected);
        await moveViewThroughUI(page, elevation.view, elevation.side, targets[index]);
      }
      await checkpoints('02-quatro-elevacoes');
      await removeElevationThroughUI(page, doorView, scenario.side);
      expected.splice(expected.indexOf(`${doorView}:${scenario.side}`), 1);
      await checkpoints('03-sem-fachada-porta');
      for (const slot of [...expected].filter(slot => slot !== 'top:')) {
        const [view, side] = slot.split(':') as [HouseViewType, HouseSide];
        await removeElevationThroughUI(page, view, side);
        expected.splice(expected.indexOf(slot), 1);
        await expectViews(page, expected);
      }
      await checkpoints('04-planta-restante');
      await triggerHouseAction(page, doorLabel);
      expected.push(`${doorView}:${scenario.side}`);
      await checkpoints('05-fachada-reinserida');
    });
  }
});
