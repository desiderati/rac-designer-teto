import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {HouseCardActions, HouseCardActionLabel} from './HouseCardActions.tsx';
import {HouseMobileCard, HousesScreen, HouseTableRow} from './HousesScreen.tsx';
import {CANVAS_MOBILE_QUERY} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import {createConstructionSiteSession} from '@/components/rac-editor/lib/construction-site-session.ts';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {definedPilotis} from '@/test/defined-pilotis.ts';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

function fixture() {
  const session = createConstructionSiteSession({read: () => ({version: 1, constructionSites: []}), write: vi.fn()});
  session.createConstructionSite({externalCode: 'CC2610', constructionDate: '2026-10-16', communityName: 'Comunidade'});
  const house = session.createHouse({familyName: 'Aline', houseType: 'tipo3'});
  house.lastRacExportedAt = '2026-10-12T17:38:00.000Z';
  house.drawingDocument.house = {
    ...HouseAggregate.createInitialHouseState({id: house.id, pilotiIds: getAllPilotiIds(), defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: house.terrainType}),
    houseType: 'tipo3', pilotis: definedPilotis(),
  };
  return {
    house, constructionSite: session.getConstructionSite()!, active: false,
    onOpenHouse: vi.fn().mockResolvedValue(undefined),
    onOpenHouseFieldAnalysis: vi.fn().mockResolvedValue(undefined),
    onResetHouse: vi.fn().mockResolvedValue(undefined),
    onExportHouseRacPdf: vi.fn().mockResolvedValue(undefined),
    onRequestHouseStatusChange: vi.fn(), onRequestHousePermanentDelete: vi.fn(),
  };
}

function showCard(props = fixture()) {
  render(<TooltipProvider><HouseMobileCard {...props}/></TooltipProvider>);
  return props;
}

function showTableRow(props = fixture()) {
  render(<TooltipProvider><table><tbody><HouseTableRow {...props} showPreparationActions/></tbody></table></TooltipProvider>);
  return props;
}

describe('Ações na tabela de casas em mobile horizontal', () => {
  it('abre análise e exige confirmação da redefinição sem abrir a configuração da casa', async () => {
    const props = showTableRow();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', {name: 'Pilotis da casa Aline'}));
    expect(props.onOpenHouseFieldAnalysis).toHaveBeenCalledWith(props.house.id);
    await user.click(screen.getByRole('button', {name: 'Redefinir casa Aline'}));
    expect(props.onResetHouse).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', {name: 'Cancelar'}));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(props.onResetHouse).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', {name: 'Redefinir casa Aline'}));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', {name: 'Redefinir Casa'}));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(props.onResetHouse).toHaveBeenCalledWith(props.house.id);
    expect(props.onOpenHouse).not.toHaveBeenCalled();
  });

  it.each(['built', 'archived', 'readOnly'] as const)('preserva os bloqueios de %s', condition => {
    const props = fixture();
    if (condition !== 'readOnly') props.house.status = condition;
    render(<TooltipProvider><table><tbody><HouseTableRow {...props} showPreparationActions readOnly={condition === 'readOnly'}/></tbody></table></TooltipProvider>);
    expect(screen.getByRole('button', {name: 'Pilotis da casa Aline'})).toBeDisabled();
    if (condition === 'archived') expect(screen.queryByRole('button', {name: 'Redefinir casa Aline'})).not.toBeInTheDocument();
    else expect(screen.getByRole('button', {name: 'Redefinir casa Aline'})).toBeDisabled();
  });

  it.each([
    {width: 852, height: 393, coarse: true, visible: true},
    {width: 915, height: 320, coarse: true, visible: true},
    {width: 1024, height: 600, coarse: true, visible: true},
    {width: 1024, height: 601, coarse: true, visible: false},
    {width: 915, height: 393, coarse: false, visible: false},
    {width: 1280, height: 900, coarse: false, visible: false},
  ])('usa a política nativa em $width × $height, toque=$coarse', ({width, height, coarse, visible}) => {
    vi.stubGlobal('innerWidth', width);
    vi.stubGlobal('innerHeight', height);
    vi.stubGlobal('matchMedia', (query: string) => ({media: query,
      get matches() {return query === CANVAS_MOBILE_QUERY && (window.innerWidth <= 767 || (coarse && window.innerHeight <= 600));},
      addEventListener: vi.fn(), removeEventListener: vi.fn()}));
    const props = fixture();
    render(<TooltipProvider><HousesScreen constructionSite={props.constructionSite} activeHouse={null}
      onEditHouse={props.onOpenHouse} onOpenHouseFieldAnalysis={props.onOpenHouseFieldAnalysis}
      onResetHouse={props.onResetHouse} onExportHouseRacPdf={props.onExportHouseRacPdf}
      onRequestHouseStatusChange={props.onRequestHouseStatusChange}
      onRequestHousePermanentDelete={props.onRequestHousePermanentDelete}/></TooltipProvider>);
    const table = within(screen.getByTestId('house-desktop-table'));
    for (const name of ['Pilotis da casa Aline', 'Redefinir casa Aline']) {
      if (visible) expect(table.getByRole('button', {name})).toBeEnabled();
      else expect(table.queryByRole('button', {name})).not.toBeInTheDocument();
    }
  });
});

describe('Card aprovado da listagem de casas', () => {
  it('renderiza o resumo da casa arquivada fora do card esmaecido', async () => {
    const props = fixture();
    props.house.status = 'archived';
    showCard(props);
    fireEvent.click(screen.getByRole('button', {name: 'Resumo da Casa de Aline'}));
    const summary = await screen.findByRole('dialog', {name: 'Resumo da Casa'});
    expect(screen.getByTestId('house-mobile-card').contains(summary)).toBe(false);
    expect(summary).toHaveTextContent('Resumo da Casa');
    expect(props.onOpenHouse).not.toHaveBeenCalled();
  });
  it('preserva a grade A1–C4, a ordem das ações e data/hora juntas', () => {
    const props = showCard();
    const band = screen.getByRole('group', {name: 'Ações da casa'});
    expect(within(band).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Pilotis da casa Aline', 'Resumo da Casa de Aline', 'Exportar RAC PDF da casa Aline',
      'Marcar casa Aline como construída', 'Arquivar casa Aline', 'Redefinir casa Aline',
    ]);
    const dots = [...within(band).getByRole('button', {name: 'Pilotis da casa Aline'}).querySelectorAll('circle')];
    expect(dots.map((dot) => dot.getAttribute('data-piloti-id'))).toEqual(getAllPilotiIds());
    expect(new Set(dots.map((dot) => dot.getAttribute('cx'))).size).toBe(4);
    expect(new Set(dots.map((dot) => dot.getAttribute('cy'))).size).toBe(3);
    const timestamp = screen.getByTestId('house-mobile-last-rac-exported-at').querySelector('time')!;
    expect(timestamp).toHaveAttribute('datetime', props.house.lastRacExportedAt);
    expect(timestamp).toHaveTextContent(/12\/10\/2026 \d{2}:38/);
    expect(timestamp).toHaveClass('whitespace-nowrap');
    expect(screen.queryByText('Dificuldade')).not.toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', expect.stringContaining('Dificuldade'));
  });

  it('mantém callbacks, resumo, teclado e confirmação sem abrir a edição do card', async () => {
    const props = showCard();
    const user = userEvent.setup();
    screen.getByRole('button', {name: 'Pilotis da casa Aline'}).focus();
    await user.keyboard('{Enter}');
    expect(props.onOpenHouseFieldAnalysis).toHaveBeenCalledWith(props.house.id);
    await user.click(screen.getByRole('button', {name: 'Resumo da Casa de Aline'}));
    expect(await screen.findByRole('dialog', {name: 'Resumo da Casa'})).toHaveTextContent('Resumo da Casa');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', {name: 'Exportar RAC PDF da casa Aline'}));
    expect(props.onExportHouseRacPdf).toHaveBeenCalledWith(props.house.id);
    await user.click(screen.getByRole('button', {name: 'Marcar casa Aline como construída'}));
    await user.click(screen.getByRole('button', {name: 'Arquivar casa Aline'}));
    expect(props.onRequestHouseStatusChange.mock.calls).toEqual([[props.house.id, 'markBuilt'], [props.house.id, 'archive']]);
    await user.click(screen.getByRole('button', {name: 'Redefinir casa Aline'}));
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(props.onResetHouse).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(props.onResetHouse).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', {name: 'Redefinir casa Aline'}));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', {name: 'Redefinir Casa'}));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(props.onResetHouse).toHaveBeenCalledWith(props.house.id);
    expect(props.onOpenHouse).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByTestId('house-mobile-card'), {key: 'Enter'});
    expect(props.onOpenHouse).toHaveBeenCalledWith(props.house.id);
  });

  it('preserva bloqueios em modo somente leitura e exportação em andamento', () => {
    const props = fixture();
    const {rerender} = render(<TooltipProvider><HouseMobileCard {...props} readOnly/></TooltipProvider>);
    for (const button of within(screen.getByRole('group')).getAllByRole('button')) {
      if (button.getAttribute('aria-label') !== 'Resumo da Casa de Aline') expect(button).toBeDisabled();
    }
    rerender(<TooltipProvider><HouseMobileCard {...props} exportingRacPdfHouseId={props.house.id}/></TooltipProvider>);
    expect(screen.getByRole('button', {name: 'Gerando PDF da RAC da casa Aline'})).toBeDisabled();
    props.house.drawingDocument.house = null;
    rerender(<TooltipProvider><HouseMobileCard {...props}/></TooltipProvider>);
    expect(screen.getByRole('button', {name: 'Exportar RAC PDF da casa Aline'})).toBeDisabled();
  });

  it('mantém as ações de casa construída e arquivada', () => {
    const props = fixture();
    props.house.status = 'built';
    const {rerender} = render(<TooltipProvider><HouseMobileCard {...props}/></TooltipProvider>);
    expect(screen.getByRole('button', {name: 'Pilotis da casa Aline'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Redefinir casa Aline'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: 'Liberar edição da casa Aline'}));
    expect(props.onRequestHouseStatusChange).toHaveBeenCalledWith(props.house.id, 'markDraft');
    props.house.status = 'archived';
    rerender(<TooltipProvider><HouseMobileCard {...props}/></TooltipProvider>);
    expect(screen.queryByRole('button', {name: /Exportar RAC|Redefinir casa/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Desarquivar casa Aline'}));
    fireEvent.click(screen.getByRole('button', {name: 'Excluir definitivamente casa Aline'}));
    expect(props.onRequestHouseStatusChange).toHaveBeenCalledWith(props.house.id, 'unarchive');
    expect(props.onRequestHousePermanentDelete).toHaveBeenCalledWith(props.house.id);
    expect(props.onOpenHouse).not.toHaveBeenCalled();
  });
});

it('mede espaço: texto completo → RAC → ícones, restaura rótulos e libera o observer', () => {
  // JSDOM não calcula layout: dimensões simuladas validam a decisão, não pixels renderizados.
  let width = 600;
  let resize = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) {resize = callback;}
    observe() {}
    disconnect = disconnect;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
    return this.hasAttribute('data-label-mode') ? width : (width - 18) / 6 - 4;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
    if (this.hasAttribute('data-label-mode')) return width;
    if (this.hasAttribute('data-house-action-short-label')) return this.clientWidth;
    return Math.max(this.clientWidth, (this.textContent?.length ?? 0) * 7);
  });
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
    return this.hasAttribute('data-house-action-short-label')
      && this.closest('[data-label-mode]')?.getAttribute('data-label-mode') === 'full'
      && this.clientWidth < 84 ? 32 : 16;
  });
  const originalStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = originalStyle(element);
    if (element.hasAttribute('data-house-action-label')) style.lineHeight = '16px';
    return style;
  });
  const {unmount} = render(<HouseCardActions>
    {['Pilotis', 'Materiais', 'Exportar RAC', 'Construída', 'Arquivar', 'Redefinir'].map((label) =>
      <button key={label} aria-label={label}><HouseCardActionLabel shortLabel={label === 'Exportar RAC' ? 'RAC' : undefined}>{label}</HouseCardActionLabel></button>)}
  </HouseCardActions>);
  const band = screen.getByRole('group');
  expect(band).toHaveAttribute('data-label-mode', 'full');
  width = 470; act(() => resize());
  expect(band).toHaveAttribute('data-label-mode', 'short');
  width = 300; act(() => resize());
  expect(band).toHaveAttribute('data-label-mode', 'icons');
  expect(screen.getByRole('button', {name: 'Exportar RAC'})).toBeInTheDocument();
  width = 600; act(() => resize());
  expect(band).toHaveAttribute('data-label-mode', 'full');
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
