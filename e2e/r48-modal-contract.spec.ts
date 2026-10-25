import {expect, test} from '@playwright/test';
import {setupSeededRacEditorPage} from './helpers/construction-site.helpers';
import {ensureOverflowMenuOpen} from './helpers/rac-editor.helpers';

test('R48: somente o conteúdo rola e a ordem das ações acompanha o limite de 460 px', async ({page}) => {
  await page.setViewportSize({width:1280,height:800});
  await setupSeededRacEditorPage(page,{insertInitialViews:true});
  await ensureOverflowMenuOpen(page);
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  for(const width of [360,390,459,460,461]) {
    await page.setViewportSize({width,height:240});
    const modal=page.getByRole('dialog',{name:'Configurações',exact:true});
    const content=modal.locator('[data-rac-modal-region="content"]');
    const header=modal.getByRole('heading',{name:'Configurações',exact:true});
    const actions=modal.locator('[data-rac-modal-region="actions"] button');
    await expect(modal).toBeVisible();
    await expect(modal).toBeInViewport({ratio:1});
    await expect(actions).toHaveText(width<460?['Confirmar','Cancelar']:['Cancelar','Confirmar']);
    await expect.poll(()=>content.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
    await expect.poll(()=>content.evaluate(element=>element.clientHeight)).toBeGreaterThan(0);
    const before=await Promise.all([header.boundingBox(),actions.nth(0).boundingBox(),actions.nth(1).boundingBox()]);
    for(const box of before) {
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
      expect(box!.y+box!.height).toBeLessThanOrEqual(241);
    }
    await content.hover();
    await page.mouse.wheel(0,600);
    await expect.poll(()=>content.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    const after=await Promise.all([header.boundingBox(),actions.nth(0).boundingBox(),actions.nth(1).boundingBox()]);
    for(let index=0;index<before.length;index++) {
      expect(after[index]!.x).toBeCloseTo(before[index]!.x,1);
      expect(after[index]!.y).toBeCloseTo(before[index]!.y,1);
    }
    expect(await modal.evaluate(element=>element.scrollTop)).toBe(0);
  }
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Configurações',exact:true})).toHaveCount(0);
});
