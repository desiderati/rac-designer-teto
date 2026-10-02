import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HamburgerMenu} from './HamburgerMenu.tsx';

const SLOW_UI_TEST_TIMEOUT_MS = 20_000;

function renderMenu(options: { documentTransitioning?: boolean; canAddHouse?: boolean; houseLabel?: string } = {}) {
  const user = userEvent.setup();
  const actions = {
    activateHouse: vi.fn().mockResolvedValue(undefined),
    openConstructionSites: vi.fn(),
    openHouseEdit: vi.fn().mockResolvedValue(undefined),
    addHouse: vi.fn().mockResolvedValue(undefined),
  };
  const constructionGroups = [
    {
      id: 'construction-2603',
      code: 'CC2603',
      communityName: 'Tiradentes',
      active: true,
      canAddHouse: options.canAddHouse,
      houses: [
        {id: 'house-1', label: options.houseLabel ?? 'Família Souza', active: true},
        {id: 'house-3', label: 'Aline', active: false},
        {id: 'house-4', label: 'Adriana', active: false},
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
  it('preserva seleção e edição da mesma casa com nome longo sem espaços', async () => {
    const houseLabel = 'CasaComNomeMuitoLongoSemEspacos'.repeat(4);
    const {user, actions} = renderMenu({houseLabel});
    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    await user.click(screen.getByRole('button', {name: houseLabel}));
    expect(actions.activateHouse).toHaveBeenCalledWith('construction-2603', 'house-1');

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    const editButton = screen.getByRole('button', {name: `Editar casa ${houseLabel}`});
    expect(editButton).toHaveAttribute('title', `Editar casa ${houseLabel}`);
    await user.click(editButton);
    expect(actions.openHouseEdit).toHaveBeenCalledWith('construction-2603', 'house-1');
    expect(actions.activateHouse).toHaveBeenCalledTimes(1);
  });
  it('desabilita cadastro em construção concluída', async () => {
    const {user, actions} = renderMenu({canAddHouse: false});
    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    const button = screen.getByRole('button', {name: 'Adicionar casa em CC2603 - Tiradentes'});
    expect(button).toBeDisabled();
    await user.click(button);
    expect(actions.addHouse).not.toHaveBeenCalled();
  });
  it('abre edição direta e cadastro vinculados inequivocamente à construção', async () => {
    const {user, actions} = renderMenu();
    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    await user.click(screen.getByRole('button', {name: 'Editar casa Aline'}));
    expect(actions.openHouseEdit).toHaveBeenCalledWith('construction-2603', 'house-3');
    expect(actions.activateHouse).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));
    await user.click(screen.getByRole('button', {name: 'CC2604 - Heliópolis'}));
    await user.click(screen.getByRole('button', {name: 'Adicionar casa em CC2604 - Heliópolis'}));
    expect(actions.addHouse).toHaveBeenCalledWith('construction-2604');
  });
  it('lista Construções TETO primeiro e organiza casas por código e comunidade da construção', async () => {
    const {user, actions} = renderMenu();

    await user.click(screen.getByRole('button', {name: 'Abrir menu principal'}));

    expect(screen.getByRole('dialog')).toHaveClass('w-[14.5rem]', 'min-w-[14.5rem]');
    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons.indexOf('Construções TETO')).toBeLessThan(
      buttons.indexOf('CC2603 - Tiradentes'),
    );
    expect(screen.getByRole('separator')).toBeVisible();
    const constructionSitesButton = screen.getByRole('button', {name: 'Construções TETO'});
    expect(constructionSitesButton).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Monitores'})).not.toBeInTheDocument();
    expect(within(constructionSitesButton).getByTestId('construction-sites-menu-icon'))
      .toHaveAttribute('data-icon', 'people-roof');

    const activeConstructionButton = screen.getByRole('button', {name: 'CC2603 - Tiradentes'});
    const collapsedConstructionButton = screen.getByRole('button', {name: 'CC2604 - Heliópolis'});
    expect(activeConstructionButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(activeConstructionButton).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder-open');
    expect(collapsedConstructionButton).toHaveAttribute('aria-expanded', 'false');
    expect(within(collapsedConstructionButton).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder');
    expect(screen.getByRole('button', {name: 'Família Souza'})).toBeVisible();
    const houseButtons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(houseButtons.indexOf('Adriana')).toBeLessThan(houseButtons.indexOf('Aline'));
    expect(houseButtons.indexOf('Aline')).toBeLessThan(houseButtons.indexOf('Família Souza'));
    expect(screen.queryByRole('button', {name: 'Abrir Desenho da Casa (JSON)'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Exportar Desenho da Casa (JSON)'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Salvar PDF'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'CC2604 - Heliópolis'}));
    expect(within(screen.getByRole('button', {name: 'CC2604 - Heliópolis'})).getByTestId('construction-folder-icon'))
      .toHaveAttribute('data-icon', 'folder-open');
    await user.click(screen.getByRole('button', {name: 'Família Lima'}));

    expect(actions.activateHouse).toHaveBeenCalledWith('construction-2604', 'house-2');
    expect(screen.queryByRole('button', {name: 'Família Souza'})).not.toBeInTheDocument();
  }, SLOW_UI_TEST_TIMEOUT_MS);

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
