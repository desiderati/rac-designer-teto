import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import {CanvasToolsMenu} from './CanvasToolsMenu.tsx';

const MobileCanvasToolsMenu = CanvasToolsMenu as React.ComponentType<any>;

const actions = {
  openHouseTypeSelector: vi.fn(),
  addHouseFront: vi.fn(),
  addHouseBack: vi.fn(),
  addHouseSide1: vi.fn(),
  addHouseSide2: vi.fn(),
  addWall: vi.fn(),
  addStreetStraight: vi.fn(),
  addStreetCorner: vi.fn(),
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

function renderCanvasToolsMenu() {
  return render(
    <TooltipProvider>
      <MobileCanvasToolsMenu
        isMobile
        actions={actions}
        isDrawing={false}
        activeSubmenu='elements'
        houseType='tipo6'
        frontViewCount={{current: 0, max: 1}}
        backViewCount={{current: 0, max: 1}}
        side1ViewCount={{current: 0, max: 2}}
        side2ViewCount={{current: 0, max: 0}}
      />
    </TooltipProvider>,
  );
}

describe('CanvasToolsMenu.tsx', () => {
  it('allows the mobile side rail to collapse and reopen from a thin handle', async () => {
    const user = userEvent.setup();
    renderCanvasToolsMenu();

    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Recolher menu lateral'}));
    expect(screen.queryByRole('toolbar', {name: 'Barra de ferramentas principal'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Abrir menu lateral'}));
    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
  });

  it('keeps mobile submenus with the same height as the main rail width', () => {
    renderCanvasToolsMenu();

    expect(screen.getByTestId('rac-side-rail-submenu')).toHaveClass('h-12');
  });

  it('uses custom tooltips without native title hover and keeps compact hover targets', () => {
    renderCanvasToolsMenu();

    const houseButton = screen.getByRole('button', {name: 'Casa TETO (Opções)'});
    const elementsButton = screen.getByRole('button', {name: 'Elementos'});
    const wallButton = screen.getByRole('button', {name: 'Objeto / Muro'});
    const streetButton = screen.getByRole('button', {name: 'Rua Reta'});
    const uploadButton = screen.getByRole('button', {name: 'Upload de Imagem'});

    expect(houseButton).not.toHaveAttribute('title');
    expect(elementsButton).not.toHaveAttribute('title');
    expect(wallButton).not.toHaveAttribute('title');
    expect(streetButton).not.toHaveAttribute('title');
    expect(uploadButton).not.toHaveAttribute('title');
    expect(houseButton).toHaveClass('w-10', 'h-10');
    expect(elementsButton).toHaveClass('w-10', 'h-10');
    expect(wallButton).toHaveClass('w-10', 'h-10');
    expect(streetButton).toHaveClass('w-10', 'h-10');
    expect(uploadButton).toHaveClass('w-10', 'h-10');
    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toHaveClass('p-1');
    expect(screen.getByTestId('rac-side-rail-submenu')).toHaveClass('px-1');
  });

  it('exposes the passive guided-tour anchor on the toolbar without menu tip targets', () => {
    renderCanvasToolsMenu();

    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-toolbar');
    expect(screen.getByRole('button', {name: 'Objeto / Muro'}))
      .not.toHaveAttribute('data-guided-tour-tip');
  });
});
