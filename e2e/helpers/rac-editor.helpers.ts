import {expect, Page} from '@playwright/test';
import {HousePiloti, HouseSide, HouseSnapshot, HouseType, HouseViewType} from '../../src/shared/types/house';
import {CanvasGroup, CanvasObjectSummary, CanvasPosition} from '../../src/components/rac-editor/lib/canvas';
import {RacEditorUiState} from '../../src/components/rac-editor/lib/rac-editor';

interface ActiveCanvasObjectSummary {
  type: string | null;
  myType: string | null;
  labelText: string | null;
  color: string | null;
}

interface RacEditorDebugApi {
  getHouse?: () => HouseSnapshot<CanvasGroup> | null;
  getHousePiloti?: (pilotiId: string) => HousePiloti | null;
  updatePiloti?: (
    pilotiId: string,
    payload: { isMaster?: boolean; height?: number; nivel?: number }
  ) => void;
  openPilotiEditor?: (pilotiId: string) => boolean;
  closePilotiEditor?: () => void;
  removeView?: (houseViewType: HouseViewType, side?: HouseSide) => boolean;
  getCanvasPosition?: () => CanvasPosition | null;
  setCanvasPosition?: (x: number, y: number) => boolean;
  selectCanvasObjectByMyType?: (myType: string, fromEnd?: boolean, triggerInlineEditor?: boolean) => boolean;
  getActiveCanvasObjectSummary?: () => ActiveCanvasObjectSummary | null;
  getCanvasObjectsSummary?: () => CanvasObjectSummary[] | null;
  getUiState?: () => RacEditorUiState | null;
}

interface CreateHouseOptions {
  dismissInitialHouseTour?: boolean;
}

const pageConsoleErrors = new WeakMap<Page, string[]>();
const IGNORED_CONSOLE_ERROR_PATTERNS = [
  '`DialogContent` requires a `DialogTitle`',
  'Unable to preventDefault inside passive event listener invocation',
];

export function startConsoleErrorCapture(page: Page): void {
  const errors: string[] = [];
  pageConsoleErrors.set(page, errors);

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`[console] ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`[pageerror] ${error.message}`);
  });
}

export function expectNoConsoleErrors(page: Page): void {
  const errors = (pageConsoleErrors.get(page) ?? []).filter(
    (message) => !IGNORED_CONSOLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
  );
  expect(errors, errors.join('\n')).toEqual([]);
}

export async function setupRacEditorPage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-initial-views:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-initial-views:completed:revision', 'top-view');
    localStorage.setItem('guided-tour:rac-tip:piloti', 'true');
    localStorage.setItem('guided-tour:rac-tip:wall', 'true');
    localStorage.setItem('guided-tour:rac-tip:line', 'true');
    localStorage.setItem('guided-tour:rac-tip:arrow', 'true');
    localStorage.setItem('guided-tour:rac-tip:distance', 'true');
    localStorage.setItem('rac-settings', JSON.stringify({
      autoNavigatePiloti: false,
      zoomEnabledByDefault: true,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      showStairsOnTopView: false,
    }));
    localStorage.removeItem('rac-projects');
  });

  const houseButton = page.getByRole('button', {name: 'Casa TETO (Opções)'});
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await page.waitForLoadState('networkidle', {timeout: 8000}).catch(() => undefined);

    if (await houseButton.isVisible({timeout: 8000}).catch(() => false)) {
      return;
    }
  }

  await expect(houseButton).toBeVisible({timeout: 12000});
}

export async function ensureMainMenuOpen(page: Page) {
  await expect(page.getByRole('button', {name: 'Casa TETO (Opções)'})).toBeVisible();
}

async function completeNivelDefinition(page: Page) {
  const masterSwitch = page.getByRole('switch', {name: 'Definir como Mestre?'});
  await expect(masterSwitch).toBeVisible();
  if ((await masterSwitch.getAttribute('data-state')) !== 'checked') {
    await masterSwitch.click();
  }

  const nextCornerButton = page.locator('button.h-8.w-8.rounded-full.bg-white').nth(1);
  for (let i = 0; i < 3; i += 1) {
    await nextCornerButton.click();
  }

  await page.getByRole('button', {name: 'Inserir'}).click();
  await expect(page.getByRole('button', {name: 'Inserir'})).toBeHidden();
}

export async function dismissInitialHouseGuidedTourIfVisible(page: Page): Promise<void> {
  const topViewDialog = page.getByRole('dialog').filter({hasText: 'Vista Planta'});
  if (!(await topViewDialog.isVisible({timeout: 1500}).catch(() => false))) {
    return;
  }

  await topViewDialog.getByRole('button', {name: 'OK'}).click({force: true});
  const elevationDialog = page.getByRole('dialog').filter({hasText: 'Vista Elevada'});
  await expect(elevationDialog).toBeVisible({timeout: 3000});
  await elevationDialog.getByRole('button', {name: 'OK'}).click({force: true});
  await expect(elevationDialog).toBeHidden({timeout: 3000});
}

export async function createHouse(page: Page, houseType: HouseType, options: CreateHouseOptions = {}) {
  await ensureMainMenuOpen(page);
  await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();

  const pilotisConfirmButton = page.getByRole('button', {name: 'Confirmar'});
  if (await pilotisConfirmButton.isVisible({timeout: 1000}).catch(() => false)) {
    await pilotisConfirmButton.click();
  }

  await page.getByRole('button', {name: houseType === 'tipo6' ? 'Casa Tipo 6' : 'Casa Tipo 3'}).click();
  await page.getByRole('button', {name: houseType === 'tipo6' ? 'Superior' : 'Esquerdo'}).click();
  await completeNivelDefinition(page);
  if (options.dismissInitialHouseTour ?? true) {
    await dismissInitialHouseGuidedTourIfVisible(page);
  }
}

export async function triggerHouseAction(
  page: Page,
  actionLabel: string,
  sideChoice?: 'Superior' | 'Inferior' | 'Esquerdo' | 'Direito'
) {
  await ensureMainMenuOpen(page);
  const actionButton = page.getByRole('button', {name: actionLabel});

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await actionButton.isVisible({timeout: 500}).catch(() => false)) {
      break;
    }
    await page.getByRole('button', {name: 'Casa TETO (Opções)'}).click();
  }

  await expect(actionButton).toBeVisible({timeout: 2000});
  await actionButton.click({force: true});

  if (sideChoice) {
    const sideButton = page.getByRole('button', {name: sideChoice});
    if (await sideButton.isVisible()) {
      await sideButton.click();
    }
  }
}

export async function ensureOverflowMenuOpen(page: Page) {
  const settingsButton = page.getByRole('button', {name: 'Configurações'});
  if (await settingsButton.isVisible({timeout: 500}).catch(() => false)) {
    return;
  }

  await page.getByRole('button', {name: 'Abrir menu da conta'}).click();
  await expect(settingsButton).toBeVisible();
}

export async function triggerElementsAction(page: Page, actionLabel: string) {
  await ensureMainMenuOpen(page);
  const actionButton = page.getByRole('button', {name: actionLabel});

  if (!(await actionButton.isVisible({timeout: 500}).catch(() => false))) {
    await page.getByRole('button', {name: 'Elementos'}).click();
  }

  await expect(actionButton).toBeVisible();
  await actionButton.click({force: true});
}

export async function triggerLinesAction(page: Page, actionLabel: string) {
  await ensureMainMenuOpen(page);
  const actionButton = page.getByRole('button', {name: actionLabel});

  if (!(await actionButton.isVisible({timeout: 500}).catch(() => false))) {
    await page.getByRole('button', {name: 'Linhas'}).click();
  }

  await expect(actionButton).toBeVisible();
  await actionButton.click({force: true});
}

export async function getHouseSnapshot(page: Page): Promise<HouseSnapshot<CanvasGroup> | null> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getHouse?.() ?? null;
  });
}

export async function removeViewByDebug(page: Page, HouseViewType: HouseViewType, side?: HouseSide): Promise<boolean> {
  return page.evaluate(
    ({type, targetSide}) => {
      const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
      return debug?.removeView?.(type, targetSide) ?? false;
    },
    {type: HouseViewType, targetSide: side}
  );
}

export async function getCanvasPosition(page: Page): Promise<CanvasPosition | null> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getCanvasPosition?.() ?? null;
  });
}

export async function setCanvasPositionByDebug(page: Page, x: number, y: number): Promise<boolean> {
  return page.evaluate(
    ({targetX, targetY}) => {
      const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
      return debug?.setCanvasPosition?.(targetX, targetY) ?? false;
    },
    {targetX: x, targetY: y}
  );
}

export async function getCanvasObjectsSummary(page: Page): Promise<CanvasObjectSummary[]> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getCanvasObjectsSummary?.() ?? [];
  });
}

export async function getActiveCanvasObjectSummaryByDebug(page: Page): Promise<ActiveCanvasObjectSummary | null> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getActiveCanvasObjectSummary?.() ?? null;
  });
}

export async function selectCanvasObjectByMyTypeByDebug(
  page: Page,
  myType: string,
  fromEnd = true,
  triggerInlineEditor = false
): Promise<boolean> {
  return page.evaluate(
    ({targetType, useFromEnd, shouldTriggerInlineEditor}) => {
      const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
      return debug?.selectCanvasObjectByMyType?.(targetType, useFromEnd, shouldTriggerInlineEditor) ?? false;
    },
    {targetType: myType, useFromEnd: fromEnd, shouldTriggerInlineEditor: triggerInlineEditor}
  );
}

export async function getUiState(page: Page): Promise<RacEditorUiState | null> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getUiState?.() ?? null;
  });
}

export async function setPilotiMasterByDebug(page: Page, pilotiId: string) {
  await page.evaluate((targetId) => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    debug?.updatePiloti?.(targetId, {isMaster: true});
  }, pilotiId);
}

export async function getHousePilotiByDebug(page: Page, pilotiId: string): Promise<HousePiloti | null> {
  return page.evaluate((targetId) => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getHousePiloti?.(targetId) ?? null;
  }, pilotiId);
}

export async function openPilotiEditorByDebug(page: Page, pilotiId: string): Promise<boolean> {
  return page.evaluate((targetId) => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.openPilotiEditor?.(targetId) ?? false;
  }, pilotiId);
}

export async function closePilotiEditorByDebug(page: Page): Promise<void> {
  await page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    debug?.closePilotiEditor?.();
  });
}
