import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TopBar} from './TopBar.tsx';
import type {MenuActionMap} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {HOUSE_FAMILY_NAME_MAX_LENGTH} from '@/shared/constants.ts';

function createActions(): MenuActionMap {
  return {
    openHouseTypeSelector: vi.fn(),
    addHouseFront: vi.fn(),
    addHouseBack: vi.fn(),
    addHouseSide1: vi.fn(),
    addHouseSide2: vi.fn(),
    addWall: vi.fn(),
    addDoor: vi.fn(),
    addStairs: vi.fn(),
    addTree: vi.fn(),
    addWater: vi.fn(),
    addFossa: vi.fn(),
    addLine: vi.fn(),
    addArrow: vi.fn(),
    addDistance: vi.fn(),
    toggleDrawMode: vi.fn(),
    addText: vi.fn(),
    openImageUpload: vi.fn(),
    openConstructionSites: vi.fn(),
    activateHouse: vi.fn().mockResolvedValue(undefined),
    deleteSelection: vi.fn(),
    savePDF: vi.fn(),
    toggleHouseMenu: vi.fn(),
    toggleElementsMenu: vi.fn(),
    toggleLinesMenu: vi.fn(),
    toggleOverflowMenu: vi.fn(),
    toggleTips: vi.fn(),
    toggleZoomControls: vi.fn(),
    open3DViewer: vi.fn(),
    toggleMenu: vi.fn(),
    restartDrawing: vi.fn(),
    exit: vi.fn(),
    renameFamily: vi.fn(),
    setCanvasToolMode: vi.fn(),
    fitToView: vi.fn(),
    openSettings: vi.fn(),
  };
}

describe('TopBar.tsx', () => {
  it('trunca nome longo da família sem deslocar o menu e a edição', () => {
    const longFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH + 5);
    const visibleFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH);

    render(
      <TopBar
        actions={createActions()}
        constructionGroups={[]}
        familyName={longFamilyName}
        showTips={false}
        zoom={1}
        canvasToolMode='select'
        isMobile={false}
        documentSaveStatus='saved'
        documentTransitioning={false}
        canExportPDF
      />,
    );

    const menuButton = screen.getByRole('button', {name: 'Abrir menu principal'});
    const familyButton = screen.getByTestId('top-bar-family-button');
    const familyName = screen.getByTestId('top-bar-family-name');

    expect(menuButton).toBeVisible();
    expect(familyButton).toHaveAttribute('aria-label', `Editar nome da família (atual: ${visibleFamilyName})`);
    expect(familyButton).toHaveClass('min-w-0', 'max-w-[min(32rem,calc(100vw-7rem))]');
    expect(familyName).toHaveTextContent(visibleFamilyName);
    expect(familyName).toHaveAttribute('title', longFamilyName);
    expect(familyName).toHaveClass('block', 'min-w-0', 'max-w-full', 'truncate');
    expect(familyButton.querySelector('svg')).toHaveClass('shrink-0');
  });

  it('trata alteração pendente como spinner à esquerda do botão 3D', () => {
    render(
      <TopBar
        actions={createActions()}
        constructionGroups={[]}
        familyName='Família Teste'
        showTips={false}
        zoom={1}
        canvasToolMode='select'
        isMobile={false}
        documentSaveStatus='dirty'
        documentTransitioning={false}
        canExportPDF
      />,
    );

    const saveStatus = screen.getByRole('status', {name: 'Salvando alterações'});
    const view3dButton = screen.getByRole('button', {name: 'Visualização 3D'});
    const icons = saveStatus.querySelectorAll('svg');

    expect(saveStatus).toBeVisible();
    expect(saveStatus).toHaveClass('h-7', 'w-7');
    expect(saveStatus).not.toHaveClass('bg-white/85', 'border', 'shadow-sm');
    expect(screen.getByTestId('document-save-spinner')).toHaveClass('animate-spin');
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveClass('lucide-loader-circle');
    expect(saveStatus.compareDocumentPosition(view3dButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('exibe spinner semântico durante salvamento', () => {
    render(
      <TopBar
        actions={createActions()}
        constructionGroups={[]}
        familyName='Família Teste'
        showTips={false}
        zoom={1}
        canvasToolMode='select'
        isMobile={false}
        documentSaveStatus='saving'
        documentTransitioning={false}
        canExportPDF
      />,
    );

    const saveStatus = screen.getByRole('status', {name: 'Salvando alterações'});
    const icons = saveStatus.querySelectorAll('svg');

    expect(saveStatus).toBeVisible();
    expect(saveStatus).toHaveClass('text-slate-500');
    expect(screen.getByTestId('document-save-spinner')).toHaveClass('animate-spin');
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveClass('lucide-loader-circle');
  });

  it('exibe casa salva como check circular simples', () => {
    render(
      <TopBar
        actions={createActions()}
        constructionGroups={[]}
        familyName='FamÃ­lia Teste'
        showTips={false}
        zoom={1}
        canvasToolMode='select'
        isMobile={false}
        documentSaveStatus='saved'
        documentTransitioning={false}
        canExportPDF
      />,
    );

    const saveStatus = screen.getByRole('status', {name: 'Casa salva'});
    const icons = saveStatus.querySelectorAll('svg');

    expect(within(saveStatus).queryByTestId('document-save-cloud-check')).not.toBeInTheDocument();
    expect(screen.getByTestId('document-save-check')).toBeVisible();
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveClass('lucide-circle-check');
    expect(icons[0]).not.toHaveClass('absolute');
  });

  it('desabilita exportação quando nenhuma casa foi inserida no canvas', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    render(
      <TopBar
        actions={actions}
        constructionGroups={[]}
        familyName='Família Teste'
        showTips={false}
        zoom={1}
        canvasToolMode='select'
        isMobile={false}
        documentSaveStatus='saved'
        documentTransitioning={false}
        canExportPDF={false}
      />,
    );

    const exportButton = screen.getByRole('button', {name: 'Exportar RAC em PDF'});

    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute(
      'title',
      'Insira uma casa no canvas para exportar o RAC em PDF',
    );

    await user.click(exportButton);

    expect(actions.savePDF).not.toHaveBeenCalled();
  });
});
