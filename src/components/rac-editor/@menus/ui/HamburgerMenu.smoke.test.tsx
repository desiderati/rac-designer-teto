import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HamburgerMenu} from './HamburgerMenu.tsx';

function renderMenu(options: { documentTransitioning?: boolean } = {}) {
  const user = userEvent.setup();
  const actions = {
    activateHouse: vi.fn().mockResolvedValue(undefined),
    openConstructionSites: vi.fn(),
  };
  const constructionGroups = [
    {
      id: 'construction-2603',
      code: 'CC2603',
      communityName: 'Tiradentes',
      active: true,
      houses: [
        {id: 'house-1', label: 'Família Souza', active: true},
      ],
    },
    {
      id: 'construction-2604',
      code: 'CC2604',
      communityName: 'Heliópolis',
      active: false,
      houses: [
        {id: 'house-2', label: 'Família Lima', active: false},
      ],
    },
  ];

  render(
    <HamburgerMenu
      actions={actions}
      constructionGroups={constructionGroups}
      documentTransitioning={options.documentTransitioning ?? false}
    />,
  );

  return {user, actions};
}

describe('HamburgerMenu.tsx', () => {
  it('lista Construções TETO primeiro e organiza casas por código e comunidade da construção', async () => {
    const {user, actions} = renderMenu();

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));

    expect(screen.getByRole('dialog').className).toContain('w-[min(14.5rem,calc(100vw-1rem))]');
    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons.indexOf('Construções TETO')).toBeLessThan(
      buttons.indexOf('CC2603 - Tiradentes'),
    );
    expect(screen.getByRole('separator')).toBeVisible();
    const constructionSitesButton = screen.getByRole('button', {name: 'Construções TETO'});
    expect(constructionSitesButton).toBeVisible();
    expect(within(constructionSitesButton).getByTestId('construction-sites-menu-icon'))
      .toHaveAttribute('data-icon', 'trowel-bricks');

    const activeConstructionButton = screen.getByRole('button', {name: 'CC2603 - Tiradentes'});
    const collapsedConstructionButton = screen.getByRole('button', {name: 'CC2604 - Heliópolis'});
    expect(activeConstructionButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(activeConstructionButton).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder-open');
    expect(collapsedConstructionButton).toHaveAttribute('aria-expanded', 'false');
    expect(within(collapsedConstructionButton).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder');
    expect(screen.getByRole('button', {name: 'Família Souza'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Abrir Desenho da Casa (JSON)'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Exportar Desenho da Casa (JSON)'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Salvar PDF'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'CC2604 - Heliópolis'}));
    expect(within(screen.getByRole('button', {name: 'CC2604 - Heliópolis'})).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder-open');
    await user.click(screen.getByRole('button', {name: 'Família Lima'}));

    expect(actions.activateHouse).toHaveBeenCalledWith('construction-2604', 'house-2');
    expect(screen.queryByRole('button', {name: 'Família Souza'})).not.toBeInTheDocument();
  });

  it('fecha o menu ao abrir Construções TETO', async () => {
    const {user, actions} = renderMenu();

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    await user.click(screen.getByRole('button', {name: 'Construções TETO'}));

    expect(actions.openConstructionSites).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', {name: 'Construções TETO'})).not.toBeInTheDocument();
  });

  it('bloqueia troca de casa enquanto há transição documental em andamento', async () => {
    const {user, actions} = renderMenu({documentTransitioning: true});

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    await user.click(screen.getByRole('button', {name: 'CC2604 - Heliópolis'}));

    const targetHouse = screen.getByRole('button', {name: 'Família Lima'});

    expect(targetHouse).toBeDisabled();
    await user.click(targetHouse);
    expect(actions.activateHouse).not.toHaveBeenCalled();
  });
});
