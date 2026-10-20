import {expect, test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import type {CanvasGroup} from '../client/src/components/rac-editor/@canvas/lib/canvas';
import {setupRacEditorPage, createHouse, triggerHouseAction, updatePilotiByDebug,
  openPilotiEditorByDebug, getPilotiScreenPositionByDebug, closePilotiEditorByDebug} from './helpers/rac-editor.helpers';

const evidence = resolve('outputs/contraventamento-planta-existente-20261019');

test('insere contraventamentos tangentes na planta existente após inserir a frontal', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1000});
  await setupRacEditorPage(page);
  await createHouse(page, 'tipo6');
  for (const id of ['piloti_0_0', 'piloti_0_1', 'piloti_0_2', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0']) {
    await updatePilotiByDebug(page, id, {height: 1.5, nivel: 0.4});
  }
  await triggerHouseAction(page, 'Frontal');
  await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await page.getByRole('button', {name: 'Configurações', exact: true}).click();
  await page.getByLabel('Permitir o contraventamento mesmo que os pilotis estejam dentro da proporção').check();
  await page.getByRole('button', {name: 'Confirmar', exact: true}).click();
  await page.getByRole('button', {name: /Zoom atual/}).click();
  await page.getByRole('button', {name: /^Seleção/}).click();
  await page.keyboard.press('Escape');
  // Vistas novas nascem sobrepostas; mover a frontal para expor a planta, como no uso real.
  await page.mouse.move(720, 440);
  await page.mouse.down();
  await page.mouse.move(1120, 790, {steps: 12});
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => {
    const debug = (window as unknown as {__racDebug: {getHouse: () => {views: {front: {group: CanvasGroup}[]}}}}).__racDebug;
    return debug.getHouse().views.front[0].group.left;
  })).toBeGreaterThan(900);
  for (const [side, targetId] of [['Esquerdo', 'piloti_0_2'], ['Direito', 'piloti_0_2'], ['Inferior', 'piloti_3_0']]) {
    expect(await openPilotiEditorByDebug(page, 'piloti_0_0')).toBe(true);
    await page.getByRole('button', {name: side, exact: true}).click();
    const target = await getPilotiScreenPositionByDebug(page, targetId);
    expect(target).not.toBeNull();
    expect(target!.x).toBeGreaterThan(100);
    expect(target!.y).toBeLessThan(900);
    await page.mouse.click(target!.x, target!.y);
  }
  await closePilotiEditorByDebug(page);
  const geometry = await page.evaluate(() => {
    const top = (window as unknown as {__racDebug: {getHouse: () => {views: {top: {group: CanvasGroup}[]}}}}).__racDebug.getHouse().views.top[0].group;
    const objects = top.getObjects() as ReturnType<CanvasGroup['getCanvasObjects']>;
    const circle = objects.find(o => o.isPilotiCircle && o.pilotiId === 'piloti_0_0')!;
    const center = circle.getRelativeCenterPoint();
    const radius = circle.width * circle.scaleX / 2;
    return objects.filter(o => o.isContraventamento).map(o => ({
      side: o.contraventamentoSide, left: o.left, top: o.top, width: o.width, height: o.height,
      centerX: center.x, centerY: center.y, radius,
    }));
  });
  expect(geometry).toHaveLength(3);
  for (const beam of geometry) {
    if (beam.side === 'left' || beam.side === 'right') {
      expect(beam.top).toBeCloseTo(beam.centerY, 5);
      expect(beam.left).toBeCloseTo(beam.centerX + (beam.side === 'right' ? beam.radius : -beam.radius - beam.width), 5);
    } else {
      expect(beam.left).toBeCloseTo(beam.centerX, 5);
      expect(beam.top).toBeCloseTo(beam.centerY + beam.radius, 5);
    }
  }
  mkdirSync(evidence, {recursive: true});
  await page.screenshot({path: resolve(evidence, 'contraventamentos-alinhados.png'), animations: 'disabled'});
});
