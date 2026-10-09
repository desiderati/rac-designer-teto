import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createConstructionSiteSession} from '@/components/rac-editor/lib/construction-site-session.ts';
import {HouseConfigurationScreen} from './HouseConfigurationScreen.tsx';
import {HouseExtraMaterialsScreen} from './HouseExtraMaterialsScreen.tsx';
import {HouseMaterialsSummary} from './HouseMaterialsSummary.tsx';
import {HousesScreen} from './HousesScreen.tsx';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import userEvent from '@testing-library/user-event';

function makeSite() {
  const session = createConstructionSiteSession({read: () => ({version: 1, constructionSites: []}), write: vi.fn()});
  session.createConstructionSite({externalCode: 'CC2609', constructionDate: '2026-09-30', communityName: 'Comunidade teste'});
  const house = session.createHouse({familyName: 'Família teste', houseType: 'tipo6', extraMaterials: {floorBeams: 4, stairBeams: 3, gutterCaps: 2, asphaltBlanket: true, stairType: 'access_ramp'}});
  return {session, house, site: session.getConstructionSite()!};
}

afterEach(() => vi.restoreAllMocks());

describe('Revisão UI/UX dos formulários e listagens', () => {
  it('inicia somente a primeira seção aberta no celular e permite expandir as demais', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()} as unknown as MediaQueryList));
    const {house, site} = makeSite();
    render(<HouseConfigurationScreen mode='edit' constructionSite={site} house={house} onSave={vi.fn()}/>);
    const triggers = screen.getAllByRole('button').filter((button) => button.getAttribute('aria-label')?.startsWith('Alternar seção'));
    expect(triggers).toHaveLength(7);
    expect(triggers.map((button) => button.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'false', 'false', 'false', 'false', 'false']);
    fireEvent.click(triggers[1]);
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('salva novos materiais, rampa e preserva o campo legado sem reinterpretá-lo', async () => {
    const {house, site} = makeSite();
    const onSave = vi.fn();
    render(<HouseExtraMaterialsScreen constructionSite={site} house={house} onSave={onSave}/>);
    const user = userEvent.setup();
    expect(screen.getByRole('tab', {name: 'Casa'})).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Benfeitorias Casa')).not.toBeInTheDocument();
    expect(screen.queryByText('Benfeitorias Telhado')).not.toBeInTheDocument();
    expect(screen.queryByText('Reparos Casa')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', {name: 'Telhado'}));
    fireEvent.change(screen.getByLabelText('Joelhos'), {target: {value: '5'}});
    await user.click(screen.getByRole('tab', {name: 'Reparos'}));
    fireEvent.change(screen.getByLabelText('Contraventamento'), {target: {value: '7'}});
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Materiais Extras'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({floorBeams: 4, stairBeams: 3, gutterCaps: 2, gutterElbows: 5, asphaltBlanket: true, bracing: 7, stairType: 'access_ramp'})));
  });

  it('inicia a Manta Asfáltica em Não e oferece Sim e Não na configuração da casa', async () => {
    const {site} = makeSite();
    render(<HouseConfigurationScreen mode='create' constructionSite={site} house={null} onSave={vi.fn()}/>);
    await userEvent.click(screen.getByRole('tab', {name: 'Telhado'}));
    const manta = screen.getByRole('button', {name: 'Manta Asfáltica'});
    expect(manta).toHaveTextContent('Não');
    fireEvent.click(manta);
    expect(await screen.findByRole('menuitemradio', {name: 'Sim'})).toBeVisible();
    expect(screen.getByRole('menuitemradio', {name: 'Não'})).toHaveAttribute('aria-checked', 'true');
  });

  it('mostra resumo da casa correspondente ao foco e ao toque', async () => {
    render(<HouseMaterialsSummary familyName='Família teste' materials={{gutterCount: 4, asphaltBlanket: true, stairType: 'access_ramp'}}/>);
    const trigger = screen.getByRole('button', {name: 'Resumo dos materiais extras da casa Família teste'});
    fireEvent.click(trigger);
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Calhas')).toBeInTheDocument();
    expect(within(tooltip).getByText('Manta Asfáltica')).toBeInTheDocument();
    expect(within(tooltip).getByText('Rampa de Acesso')).toBeInTheDocument();
    expect(within(tooltip).queryByText('Família teste')).not.toBeInTheDocument();
    expect(within(tooltip).queryByText('Materiais Extras')).not.toBeInTheDocument();
    expect(within(tooltip).queryByRole('heading')).not.toBeInTheDocument();
    expect(within(tooltip).getAllByTestId('materials-summary-divider')).toHaveLength(2);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.focus(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
  });

  it('recolhe Materiais Extras e preserva valores ao alternar abas e reabrir', async () => {
    const {house, site} = makeSite();
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<HouseConfigurationScreen mode='edit' constructionSite={site} house={house} onSave={onSave}/>);
    expect(screen.getAllByTestId('house-section-divider')).toHaveLength(6);
    const trigger = screen.getByRole('button', {name: 'Alternar seção Materiais Extras'});
    expect(trigger).toHaveTextContent('06');
    const location = screen.getByRole('button', {name: 'Alternar seção Características do Local'});
    expect(location).toHaveTextContent('07');
    expect(trigger.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(screen.getByRole('tab', {name: 'Telhado'}));
    fireEvent.change(screen.getByLabelText('Joelhos'), {target: {value: '12'}});
    await user.click(screen.getByRole('tab', {name: 'Casa'}));
    expect(screen.getByLabelText('Joelhos')).not.toBeVisible();
    await user.click(trigger);
    expect(screen.queryByRole('tab', {name: 'Casa'})).not.toBeInTheDocument();
    await user.click(trigger);
    await user.click(screen.getByRole('tab', {name: /Telhado/}));
    expect(screen.getByLabelText('Joelhos')).toHaveValue('12');
    expect(screen.queryByRole('heading', {name: 'Benfeitorias Telhado'})).not.toBeInTheDocument();
  });

  it.each([['straight', 'Reta'], ['landing', 'Com Patamar']] as const)('abrevia %s no resumo sem alterar o valor salvo', async (stairType, label) => {
    render(<HouseMaterialsSummary familyName='Família teste' materials={{stairType}}/>);
    const trigger = screen.getByRole('button', {name: /Resumo dos materiais extras/});
    await userEvent.click(trigger);
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText(label)).toBeVisible();
    expect(within(tooltip).getAllByTestId('materials-summary-divider')).toHaveLength(2);
  });

  it('abre a aba com erro ao salvar e permite navegar entre abas pelo teclado', async () => {
    const {house, site} = makeSite();
    house.extraMaterials = {...house.extraMaterials, justification: 'x'.repeat(301)};
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<HouseExtraMaterialsScreen constructionSite={site} house={house} onSave={onSave}/>);
    screen.getByRole('tab', {name: 'Casa'}).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', {name: 'Telhado'})).toHaveFocus();
    await user.click(screen.getByRole('button', {name: 'Salvar Materiais Extras'}));
    await waitFor(() => expect(screen.getByRole('tab', {name: /Reparos/})).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByLabelText('Outros / Justificativas')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('mantém histórico junto ao tipo e a última exportação em coluna própria', () => {
    const {house, site} = makeSite();
    house.updatedAt = '2026-09-30T19:25:00.000Z';
    house.lastRacExportedAt = '2026-09-30T20:00:00.000Z';
    const openHouse = vi.fn();
    render(<TooltipProvider><HousesScreen constructionSite={site} activeHouse={house} onEditHouse={openHouse} onExportHouseRacPdf={vi.fn()} onRequestHouseStatusChange={vi.fn()} onRequestHousePermanentDelete={vi.fn()}/></TooltipProvider>);
    const table = screen.getByTestId('house-desktop-table');
    expect(within(table).queryByRole('columnheader', {name: 'Histórico'})).not.toBeInTheDocument();
    expect(within(table).getByRole('columnheader', {name: 'Última RAC Exportada'})).toBeInTheDocument();
    expect(within(table).getByTestId('house-table-type')).toHaveTextContent('Tipo 6 •');
    expect(within(table).getByTestId('house-table-type')).toContainElement(within(table).getByTestId('house-table-updated-at'));
    const summary = within(table).getByRole('button', {name: 'Resumo dos materiais extras da casa Família teste'});
    fireEvent.keyDown(summary, {key: 'Enter'});
    expect(openHouse).not.toHaveBeenCalled();
  });

  it('expõe Editar casa separadamente do clique do card e da prévia, em mobile e desktop', () => {
    const {house, site} = makeSite();
    const openHouse = vi.fn().mockResolvedValue(undefined);
    render(<TooltipProvider><HousesScreen
      constructionSite={site}
      activeHouse={house}
      onEditHouse={openHouse}
      onExportHouseRacPdf={vi.fn()}
      onRequestHouseStatusChange={vi.fn()}
      onRequestHousePermanentDelete={vi.fn()}
    /></TooltipProvider>);

    const mobileEdit = within(screen.getByTestId('house-mobile-list')).getByRole('button', {name: 'Editar casa Família teste'});
    const desktopEdit = within(screen.getByTestId('house-desktop-table')).getByRole('button', {name: 'Editar casa Família teste'});
    fireEvent.click(mobileEdit);
    fireEvent.click(desktopEdit);
    expect(openHouse).toHaveBeenNthCalledWith(1, house.id);
    expect(openHouse).toHaveBeenNthCalledWith(2, house.id);
  });
});
