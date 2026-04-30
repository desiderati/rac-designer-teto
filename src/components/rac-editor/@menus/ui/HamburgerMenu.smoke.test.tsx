import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HamburgerMenu} from './HamburgerMenu.tsx';

const Menu = HamburgerMenu as React.ComponentType<any>;

function renderMenu() {
  const user = userEvent.setup();
  const actions = {
    importJSON: vi.fn(),
    exportJSON: vi.fn(),
    savePDF: vi.fn(),
  };

  render(<Menu actions={actions}/>);

  return {user, actions};
}

describe('HamburgerMenu.tsx', () => {
  it('keeps PDF export out of the hamburger menu because the top bar owns that action', async () => {
    const {user} = renderMenu();

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));

    expect(screen.getByRole('button', {name: 'Abrir Projeto (JSON)'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Exportar Projeto (JSON)'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Salvar PDF'})).not.toBeInTheDocument();
  });
});
