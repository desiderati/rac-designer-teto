import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TopBar} from './TopBar.tsx';
import type {MenuActionMap} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {HOUSE_FAMILY_NAME_MAX_LENGTH} from '@/shared/constants.ts';
import {useRemoteSync} from '@/contexts/RemoteSyncContext.tsx';

vi.mock('@/contexts/RemoteSyncContext.tsx', () => ({
  useRemoteSync: vi.fn(),
}));

function createActions(): MenuActionMap {
  return {
    openHouseTypeSelector: vi.fn(), addHouseFront: vi.fn(), addHouseBack: vi.fn(), addHouseSide1: vi.fn(), addHouseSide2: vi.fn(),
    addWall: vi.fn(), addStreetStraight: vi.fn(), addStreetCorner: vi.fn(), addDoor: vi.fn(), addStairs: vi.fn(), addTree: vi.fn(),
    addWater: vi.fn(), addFossa: vi.fn(), addLine: vi.fn(), addArrow: vi.fn(), addDistance: vi.fn(), toggleDrawMode: vi.fn(),
    addText: vi.fn(), openImageUpload: vi.fn(), openConstructionSites: vi.fn(), activateHouse: vi.fn().mockResolvedValue(undefined),
    deleteSelection: vi.fn(), savePDF: vi.fn(), toggleHouseMenu: vi.fn(), toggleElementsMenu: vi.fn(), toggleLinesMenu: vi.fn(),
    toggleOverflowMenu: vi.fn(), toggleTips: vi.fn(), toggleZoomControls: vi.fn(), open3DViewer: vi.fn(), toggleMenu: vi.fn(),
    restartDrawing: vi.fn(), exit: vi.fn(), renameFamily: vi.fn(), setCanvasToolMode: vi.fn(), fitToView: vi.fn(), openSettings: vi.fn(),
  };
}

function configureRemoteSync(
  status: 'synced' | 'syncing' | 'pending' | 'conflict' | 'error',
  lastSyncedAt: string | null = null,
) {
  const retry = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useRemoteSync).mockReturnValue({
    status,
    revision: 0,
    lastSyncedAt,
    errorMessage: status === 'error' ? 'Falha de rede' : null,
    conflict: null,
    dismissError: vi.fn(),
    useRemoteVersion: vi.fn(),
    keepLocalVersion: vi.fn(),
    retry,
  });
  return {retry};
}

function renderTopBar(overrides: Partial<React.ComponentProps<typeof TopBar>> = {}) {
  return render(
    <TopBar
      actions={createActions()}
      constructionGroups={[]}
      familyName='Família Teste'
      showTips={false}
      zoom={1}
      canvasToolMode='select'
      isMobile={false}
      documentSaveStatus='saved'
      documentTransitioning={false}
      canExportPDF
      {...overrides}
    />,
  );
}

describe('TopBar.tsx', () => {
  it('ancora as três zonas na superfície mínima de 420 px do editor', () => {
    configureRemoteSync('synced');
    renderTopBar();

    expect(screen.getByTestId('top-bar-layout')).toHaveClass('min-w-[420px]');
    expect(screen.getByTestId('top-bar-layout').querySelectorAll(':scope > div')).toHaveLength(3);
    expect(screen.getByRole('button', {name: 'Abrir menu principal'}).parentElement).toHaveClass('absolute');
  });

  it('não mantém a animação de sincronização quando o estado já está sincronizado', () => {
    configureRemoteSync('synced');
    renderTopBar();

    const syncStatus = screen.getByRole('button', {name: 'Sincronizado'});
    expect(syncStatus.querySelector('svg')).not.toHaveClass('animate-spin');
  });

  it('exibe a data e a hora da última sincronização no tooltip', () => {
    const lastSyncedAt = '2026-09-24T22:04:00.000-03:00';
    const expectedTimestamp = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(lastSyncedAt));
    configureRemoteSync('synced', lastSyncedAt);
    renderTopBar();

    expect(screen.getByRole('button', {name: 'Sincronizado'})).toHaveAttribute(
      'title',
      `Sincronizado · Última sincronização: ${expectedTimestamp}`,
    );
  });

  it('abre o detalhe da última sincronização ao clicar no ícone', async () => {
    const lastSyncedAt = '2026-09-24T22:04:00.000-03:00';
    const expectedTimestamp = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(lastSyncedAt));
    configureRemoteSync('synced', lastSyncedAt);
    renderTopBar();

    fireEvent.click(screen.getByRole('button', {name: 'Sincronizado'}));

    expect(screen.getByText(`Última sincronização: ${expectedTimestamp}`)).toBeVisible();
  });

  it('trunca nome longo da família sem deslocar o menu e a edição', () => {
    configureRemoteSync('synced');
    const longFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH + 5);
    const visibleFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH);

    renderTopBar({familyName: longFamilyName});

    const menuButton = screen.getByRole('button', {name: 'Abrir menu principal'});
    const familyButton = screen.getByTestId('top-bar-family-button');
    const familyName = screen.getByTestId('top-bar-family-name');

    expect(menuButton).toBeVisible();
    expect(familyButton).toHaveAttribute('aria-label', `Editar nome da família (atual: ${visibleFamilyName})`);
    expect(familyButton).toHaveClass('min-w-0', 'max-w-[min(32rem,calc(100vw-7rem))]');
    expect(familyName).toHaveTextContent(visibleFamilyName);
    expect(familyName).toHaveAttribute('title', longFamilyName);
  });

  it('exibe o sync remoto pendente à esquerda do botão 3D, sem tooltip flutuante', () => {
    configureRemoteSync('pending');
    renderTopBar();

    const syncStatus = screen.getByRole('button', {name: 'Alteração pendente'});
    const view3dButton = screen.getByRole('button', {name: 'Visualização 3D'});

    expect(syncStatus).toBeVisible();
    expect(syncStatus).toHaveClass('h-7', 'w-7', 'text-amber-600');
    expect(syncStatus.compareDocumentPosition(view3dButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Falha de rede')).not.toBeInTheDocument();
  });

  it('permite tentar novamente diretamente pelo ícone quando ocorre uma falha', async () => {
    const user = userEvent.setup();
    const {retry} = configureRemoteSync('error');
    renderTopBar();

    await user.click(screen.getByRole('button', {name: /Falha ao sincronizar/i}));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('desabilita exportação quando nenhuma casa foi inserida no canvas', async () => {
    const user = userEvent.setup();
    configureRemoteSync('synced');
    const actions = createActions();

    renderTopBar({actions, canExportPDF: false});

    const exportButton = screen.getByRole('button', {name: 'Exportar RAC em PDF'});
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute('title', 'Insira uma casa no canvas para exportar o RAC em PDF');

    await user.click(exportButton);
    expect(actions.savePDF).not.toHaveBeenCalled();
  });

  it('coloca 3D e Exportar no menu da conta abaixo de 740 px', async () => {
    const originalWidth = window.innerWidth;
    const user = userEvent.setup();

    try {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: 739});
      configureRemoteSync('synced');
      renderTopBar({isMobile: true});

      expect(screen.getByRole('button', {name: 'Visualização 3D'})).toHaveClass('min-[740px]:flex');
      expect(screen.getByRole('button', {name: 'Exportar RAC em PDF'})).toHaveClass('min-[740px]:flex');
      await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));

      const accountMenu = screen.getByRole('menu', {name: 'Menu da conta'});
      expect(within(accountMenu).getByRole('button', {name: 'Visualização 3D'})).toBeVisible();
      expect(within(accountMenu).getByRole('button', {name: 'Exportar RAC em PDF'})).toBeVisible();
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: originalWidth});
    }
  });
});
