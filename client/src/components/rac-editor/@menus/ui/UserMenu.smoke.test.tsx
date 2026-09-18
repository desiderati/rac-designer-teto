import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {UserMenu} from './UserMenu.tsx';

const Menu = UserMenu as React.ComponentType<any>;

function renderMenu({isMobile = false, canExportPDF = true} = {}) {
  const props = {
    isMobile,
    showTips: false,
    onRestartDrawing: vi.fn(),
    onToggleTips: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpen3DViewer: vi.fn(),
    onSavePDF: vi.fn(),
    canExportPDF,
    onExit: vi.fn(),
  };

  render(<Menu {...props}/>);

  return {props};
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));
}

describe('UserMenu.tsx', () => {
  it('keeps 3D and PDF actions out of the avatar menu on desktop', () => {
    renderMenu({isMobile: false});
    openAccountMenu();

    expect(screen.queryByRole('button', {name: 'Visualização 3D'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Exportar RAC em PDF'})).not.toBeInTheDocument();
  });

  it('shows 3D and PDF actions in the avatar menu on mobile', () => {
    const {props} = renderMenu({isMobile: true});
    openAccountMenu();
    fireEvent.click(screen.getByRole('button', {name: 'Visualização 3D'}));
    fireEvent.click(screen.getByRole('button', {name: 'Exportar RAC em PDF'}));

    expect(props.onOpen3DViewer).toHaveBeenCalledTimes(1);
    expect(props.onSavePDF).toHaveBeenCalledTimes(1);
  });

  it('desabilita exportação mobile quando nenhuma casa foi inserida no canvas', () => {
    const {props} = renderMenu({isMobile: true, canExportPDF: false});
    openAccountMenu();

    const exportItem = screen.getByRole('button', {name: 'Exportar RAC em PDF'});
    expect(exportItem).toBeDisabled();

    fireEvent.click(exportItem);

    expect(props.onSavePDF).not.toHaveBeenCalled();
  });

  it('starts the tutorial through a passive guided-tour attribute', () => {
    renderMenu({isMobile: false});
    openAccountMenu();

    expect(screen.getByRole('button', {name: 'Abrir Tutorial'}))
      .toHaveAttribute('data-guided-tour-start', 'rac-editor-intro');
  });

  it('não exibe Construções TETO no menu do avatar', () => {
    renderMenu({isMobile: false});
    openAccountMenu();

    expect(screen.queryByRole('button', {name: 'Construções TETO'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Reiniciar Desenho'})).toBeVisible();
  });

  it('confirma antes de executar o logout e permite cancelar', () => {
    const {props} = renderMenu();
    openAccountMenu();
    fireEvent.click(screen.getByRole('button', {name: 'Sair'}));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Sair do RAC Designer?'})).toBeVisible();
    expect(screen.getByRole('dialog').parentElement).toHaveClass('z-[1000]');

    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('executa o logout somente após a confirmação', async () => {
    const {props} = renderMenu();
    openAccountMenu();
    fireEvent.click(screen.getByRole('button', {name: 'Sair'}));
    fireEvent.click(screen.getByRole('dialog').querySelector('button:last-child') as HTMLButtonElement);

    await waitFor(() => expect(props.onExit).toHaveBeenCalledTimes(1));
  });
});
