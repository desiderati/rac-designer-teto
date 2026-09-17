import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserMenu} from './UserMenu.tsx';

const Menu = UserMenu as React.ComponentType<any>;

function renderMenu({isMobile = false, canExportPDF = true} = {}) {
  const user = userEvent.setup();
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

  return {user, props};
}

describe('UserMenu.tsx', () => {
  it('keeps 3D and PDF actions out of the avatar menu on desktop', async () => {
    const {user} = renderMenu({isMobile: false});

    await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));

    expect(screen.queryByRole('button', {name: 'Visualização 3D'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Exportar RAC em PDF'})).not.toBeInTheDocument();
  });

  it('shows 3D and PDF actions in the avatar menu on mobile', async () => {
    const {user, props} = renderMenu({isMobile: true});

    await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));
    await user.click(screen.getByRole('button', {name: 'Visualização 3D'}));
    await user.click(screen.getByRole('button', {name: 'Exportar RAC em PDF'}));

    expect(props.onOpen3DViewer).toHaveBeenCalledTimes(1);
    expect(props.onSavePDF).toHaveBeenCalledTimes(1);
  });

  it('desabilita exportação mobile quando nenhuma casa foi inserida no canvas', async () => {
    const {user, props} = renderMenu({isMobile: true, canExportPDF: false});

    await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));

    const exportItem = screen.getByRole('button', {name: 'Exportar RAC em PDF'});
    expect(exportItem).toBeDisabled();

    await user.click(exportItem);

    expect(props.onSavePDF).not.toHaveBeenCalled();
  });

  it('starts the tutorial through a passive guided-tour attribute', async () => {
    const {user} = renderMenu({isMobile: false});

    await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));

    expect(screen.getByRole('button', {name: 'Abrir Tutorial'}))
      .toHaveAttribute('data-guided-tour-start', 'rac-editor-intro');
  });

  it('não exibe Construções TETO no menu do avatar', async () => {
    const {user} = renderMenu({isMobile: false});

    await user.click(screen.getByRole('button', {name: 'Abrir menu da conta'}));

    expect(screen.queryByRole('button', {name: 'Construções TETO'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Reiniciar Desenho'})).toBeVisible();
  });
});
