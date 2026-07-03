import {expect, Page} from '@playwright/test';
import {HousePiloti, HouseSide, HouseType, HouseViewType} from '../../src/shared/types/house';
import {CanvasGroup, CanvasObjectSummary, CanvasPosition} from '../../src/components/rac-editor/@canvas/lib';
import type {HouseRuntimeSnapshot} from '../../src/components/rac-editor/lib/house-runtime-snapshot';
import {RacEditorUiState} from '../../src/components/rac-editor/lib/rac-editor';
import {seedConstructionSiteDocument} from './construction-site-storage.helpers';

interface ActiveCanvasObjectSummary {
  type: string | null;
  myType: string | null;
  labelText: string | null;
  color: string | null;
}

interface RacEditorDebugApi {
  getHouse?: () => HouseRuntimeSnapshot<CanvasGroup> | null;
  getHousePiloti?: (pilotiId: string) => HousePiloti | null;
  getPilotiScreenPosition?: (pilotiId: string) => { x: number; y: number } | null;
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
  'Failed to load resource: net::ERR_NETWORK_CHANGED',
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

export async function applyRacEditorInitScript(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-top-view:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-top-view:completed:revision', 'piloti-target');
    localStorage.setItem('guided-tour:rac-house-elevation-view:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-management:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-management:completed:revision', 'construction-actions-v2');
    localStorage.setItem('guided-tour:rac-construction-add:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-add:completed:revision', 'construction-add-v1');
    localStorage.setItem('guided-tour:rac-construction-actions:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-actions:completed:revision', 'construction-actions-v2');
    localStorage.setItem('guided-tour:rac-construction-back-to-canvas:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-back-to-canvas:completed:revision', 'construction-back-to-canvas-v1');
    localStorage.setItem('guided-tour:rac-house-management:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-management:completed:revision', 'house-actions-v3');
    localStorage.setItem('guided-tour:rac-house-add:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-add:completed:revision', 'house-add-v1');
    localStorage.setItem('guided-tour:rac-house-actions:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-actions:completed:revision', 'house-actions-v1');
    localStorage.setItem('guided-tour:rac-tip:wall', 'true');
    localStorage.setItem('guided-tour:rac-tip:line', 'true');
    localStorage.setItem('guided-tour:rac-tip:arrow', 'true');
    localStorage.setItem('guided-tour:rac-tip:distance', 'true');
    localStorage.setItem('guided-tour:rac-tip:piloti-nivel-mode', 'true');
    localStorage.setItem('rac-settings', JSON.stringify({
      autoNavigatePiloti: false,
      zoomEnabledByDefault: true,
      openEditorsAtFixedPosition: false,
      disableDrawModeAfterFreehand: false,
      showStairsOnTopView: false,
    }));
    localStorage.removeItem('rac-projects');
  });
}

export async function setupRacEditorPage(page: Page) {
  await applyRacEditorInitScript(page);

  const houseButton = page.getByRole('button', {name: 'Casa TETO (Opções)'});
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await seedConstructionSiteDocument(page, {houseType: null, primaryContactName: 'Maria E2E'});
    await page.reload({waitUntil: 'domcontentloaded'});
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
  const pilotiDialog = page.getByRole('dialog').filter({hasText: 'Na planta superior'});
  await expect(pilotiDialog).toBeVisible({timeout: 3000});
  await pilotiDialog.getByRole('button', {name: 'OK'}).click({force: true});
  await expect(pilotiDialog).toBeHidden({timeout: 3000});
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
  await waitForInitialHouseViews(page, houseType);
}

async function waitForInitialHouseViews(page: Page, houseType: HouseType) {
  await expect
    .poll(async () => {
      const snapshot = await getHouseSnapshot(page);
      if (!snapshot || snapshot.houseType !== houseType || snapshot.views.top.length !== 1) return false;
      if (houseType === 'tipo6') {
        return snapshot.views.front.length === 0 && snapshot.preAssignedSides?.front === 'top';
      }
      if (houseType === 'tipo3') {
        return snapshot.views.side2.length === 0 && snapshot.preAssignedSides?.side2 === 'left';
      }
      return false;
    })
    .toBe(true);
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

export async function getHouseSnapshot(page: Page): Promise<HouseRuntimeSnapshot<CanvasGroup> | null> {
  return page.evaluate(() => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getHouse?.() ?? null;
  });
}

export async function getPilotiScreenPositionByDebug(
  page: Page,
  pilotiId: string,
): Promise<{ x: number; y: number } | null> {
  return page.evaluate((targetId) => {
    const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
    return debug?.getPilotiScreenPosition?.(targetId) ?? null;
  }, pilotiId);
}

type ContraventamentoProjectionSignature = {
  id: string | null;
  sourcePilotiId: string | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
};

export async function getContraventamentoProjectionSignatures(
  page: Page,
  viewType: HouseViewType,
  side?: HouseSide,
): Promise<ContraventamentoProjectionSignature[]> {
  return page.evaluate(
    ({targetViewType, targetSide}) => {
      const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
      const house = debug?.getHouse?.();
      const instance = house?.views[targetViewType]?.find((view) => (
        targetSide ? view.side === targetSide : true
      ));
      const group = instance?.group;
      if (!group) return [];

      const round = (value: unknown) => {
        const numericValue = Number(value ?? 0);
        return Number.isFinite(numericValue) ? Math.round(numericValue * 1000) / 1000 : 0;
      };

      return group.getObjects()
        .filter((object) => Boolean((object as Record<string, unknown>).isContraventamentoElevation))
        .map((object) => {
          const canvasObject = object as Record<string, unknown>;
          return {
            id: typeof canvasObject.contraventamentoId === 'string'
              ? canvasObject.contraventamentoId
              : null,
            sourcePilotiId: typeof canvasObject.contraventamentoSourcePilotiId === 'string'
              ? canvasObject.contraventamentoSourcePilotiId
              : null,
            x1: round(canvasObject.x1),
            y1: round(canvasObject.y1),
            x2: round(canvasObject.x2),
            y2: round(canvasObject.y2),
            strokeWidth: round(canvasObject.strokeWidth),
          };
        })
        .sort((a, b) => (
          `${a.id ?? ''}:${a.sourcePilotiId ?? ''}:${a.x1}:${a.y1}:${a.x2}:${a.y2}:${a.strokeWidth}`
            .localeCompare(`${b.id ?? ''}:${b.sourcePilotiId ?? ''}:${b.x1}:${b.y1}:${b.x2}:${b.y2}:${b.strokeWidth}`)
        ));
    },
    {targetViewType: viewType, targetSide: side}
  );
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

export async function updatePilotiByDebug(
  page: Page,
  pilotiId: string,
  payload: { isMaster?: boolean; height?: number; nivel?: number },
): Promise<void> {
  await page.evaluate(
    ({targetId, patch}) => {
      const debug = (window as unknown as { __racDebug?: RacEditorDebugApi }).__racDebug;
      debug?.updatePiloti?.(targetId, patch);
    },
    {targetId: pilotiId, patch: payload}
  );
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
