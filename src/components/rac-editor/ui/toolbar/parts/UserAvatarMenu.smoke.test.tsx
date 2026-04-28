import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserAvatarMenu} from './UserAvatarMenu.tsx';

const Menu = UserAvatarMenu as React.ComponentType<any>;

function renderMenu({isMobile = false} = {}) {
  const user = userEvent.setup();
  const props = {
    isMobile,
    showTips: false,
    onRestartDrawing: vi.fn(),
    onToggleTips: vi.fn(),
    onOpenTutorial: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpen3DViewer: vi.fn(),
    onSavePDF: vi.fn(),
    onExit: vi.fn(),
  };

  render(<Menu {...props}/>);

  return {user, props};
}

describe('UserAvatarMenu.tsx', () => {
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
});
