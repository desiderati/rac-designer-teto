import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {getPhotoOrientation} from '@/components/construction-site/lib/photo-orientation.ts';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import type {ConstructionSiteState, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';

const VALID_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';
const VALID_JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/';
const VALID_PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TEST_CURRENT_DATE = new Date(2026, 4, 1, 12);
const SLOW_UI_TEST_TIMEOUT_MS = 20_000;
const RealDate = Date;

describe('ConstructionSiteManagementPanel.tsx', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('Date', class extends RealDate {
      constructor(...args: unknown[]) {
        switch (args.length) {
          case 0:
            super(TEST_CURRENT_DATE);
            break;
          case 1:
            super(args[0] as string | number | Date);
            break;
          case 2:
            super(Number(args[0]), Number(args[1]));
            break;
          case 3:
            super(Number(args[0]), Number(args[1]), Number(args[2]));
            break;
          case 4:
            super(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]));
            break;
          case 5:
            super(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]));
            break;
          case 6:
            super(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]), Number(args[5]));
            break;
          default:
            super(
              Number(args[0]),
              Number(args[1]),
              Number(args[2]),
              Number(args[3]),
              Number(args[4]),
              Number(args[5]),
              Number(args[6]),
            );
            break;
        }
      }

      static now() {
        return TEST_CURRENT_DATE.getTime();
      }

      static parse(value: string) {
        return RealDate.parse(value);
      }

      static UTC(...args: Parameters<typeof RealDate.UTC>) {
        return RealDate.UTC(...args);
      }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockNavigatorGeolocation(undefined);
  });

  it('detecta orientação de foto por dimensões naturais', () => {
    expect(getPhotoOrientation(1600, 900)).toBe('landscape');
    expect(getPhotoOrientation(900, 1600)).toBe('portrait');
    expect(getPhotoOrientation(1200, 1200)).toBe('square');
  });

  it('abre o módulo na listagem de Construções TETO com controles em português', async () => {
    const user = userEvent.setup();

    renderPanel();

    expect(screen.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    expect(screen.getByText('Criar, arquivar, listar e trocar construções.')).toBeVisible();
    expect(screen.getByRole('button', {name: '+ Adicionar Construção'})).toBeVisible();
    expect(screen.getAllByRole('button', {name: '+ Adicionar Construção'})).toHaveLength(1);
    expect(screen.queryByRole('button', {name: 'Construções'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Casas'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Voltar ao canvas'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Voltar'})).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-bottom-navigation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-floating-action-button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Início'})).not.toBeInTheDocument();
    expect(screen.getByTestId('construction-management-shell')).toHaveStyle({
      backgroundColor: '#f1f5f9',
      backgroundSize: '40px 40px',
    });
    expect(screen.getByTestId('construction-management-shell').className).toContain('h-full');
    expect(screen.getByTestId('construction-management-shell').className).toContain('overflow-y-auto');
    expect(screen.getByTestId('construction-management-shell').className).toContain('py-10');
    expect(screen.getByTestId('construction-management-shell').className).not.toContain('min-h-full');
    expect(screen.getByTestId('construction-management-shell').className).not.toContain('pt-24');
    expect(screen.getByTestId('construction-management-card').className).toContain('max-w-4xl');
    expect(screen.getByTestId('construction-management-card').className).toContain('bg-white');
    expect(screen.getByTestId('construction-management-card').className).toContain('min-h-[calc(100dvh-5rem)]');
    expect(screen.getByTestId('construction-management-header-row').className).toContain('sm:flex-row');
    expect(screen.getByTestId('construction-management-header-row').className).not.toContain('lg:flex-row');
    expect(screen.getByRole('button', {name: '+ Adicionar Construção'}).className).toContain('sm:shrink-0');

    expect(screen.getByTestId('construction-desktop-table').className).toContain('hidden');
    expect(screen.getByTestId('construction-desktop-table').className).toContain('sm:block');
    const constructionDesktopTable = within(screen.getByTestId('construction-desktop-table')).getByRole('table');
    expect(constructionDesktopTable).toHaveClass('table-fixed');
    expect(constructionDesktopTable.querySelectorAll('col')[0]).toHaveClass('w-[48%]');
    expect(constructionDesktopTable.querySelectorAll('col')[1]).toHaveClass('w-[17%]');
    expect(constructionDesktopTable.querySelectorAll('col')[2]).toHaveClass('w-[18%]');
    expect(constructionDesktopTable.querySelectorAll('col')[3]).toHaveClass('w-[17%]');
    const constructionMobileList = screen.getByTestId('construction-mobile-list');
    const constructionMobilePagination = screen.getByTestId('construction-mobile-pagination');

    expect(screen.getByTestId('construction-desktop-pagination').className).toContain('hidden');
    expect(screen.getByTestId('construction-desktop-pagination').className).toContain('sm:flex');
    expect(constructionMobilePagination.className).toContain('sm:hidden');
    expect(constructionMobileList.compareDocumentPosition(constructionMobilePagination) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(constructionMobileList.className).toContain('sm:hidden');
    expect(screen.getAllByTestId('construction-mobile-card')).toHaveLength(3);
    expect(within(constructionMobileList).getByText('CC2603')).toBeVisible();
    expect(within(constructionMobileList).getByText('Tiradentes')).toBeVisible();
    expect(within(constructionMobileList).getAllByText('Data da Construção')[0]).toBeVisible();
    expect(within(constructionMobileList).queryByText('Sem data')).not.toBeInTheDocument();

    expect(screen.getByRole('columnheader', {name: 'Construções'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Status'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Data da Construção'})).toBeVisible();
    expect(screen.queryByRole('columnheader', {name: 'Última Modificação'})).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Status'})).toHaveClass('text-center');
    expect(screen.getByRole('columnheader', {name: 'Data da Construção'})).toHaveClass('text-center');
    expect(screen.getByLabelText('Filtrar por status')).toBeVisible();
    expect(screen.getByLabelText('Ordenar por')).toBeVisible();
    expect(screen.getByTestId('construction-list-controls').className).toContain('grid-cols-2');
    expect(screen.getByTestId('construction-list-controls').className).toContain('sm:flex');
    expect(screen.getByTestId('construction-list-controls').className).toContain('sm:flex-wrap');
    expect(screen.getByLabelText('Filtrar por status').parentElement?.className).toContain('w-full');
    expect(screen.getByLabelText('Filtrar por status').parentElement?.className).toContain('sm:w-[11.25rem]');
    expect(screen.getByLabelText('Ordenar por').parentElement?.className).toContain('w-full');
    expect(screen.getByLabelText('Ordenar por').parentElement?.className).toContain('sm:w-[11.25rem]');
    expect(screen.queryByRole('combobox', {name: 'Filtrar por status'})).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', {name: 'Ordenar por'})).not.toBeInTheDocument();
    expect(within(constructionMobilePagination).getByText('Mostrando 1-3 de 3 construções')).toBeVisible();
    expect(within(constructionMobilePagination).queryAllByRole('button')).toHaveLength(0);
    expect(constructionMobilePagination).toHaveClass('justify-center', 'text-center');
    expect(screen.getAllByRole('button', {name: 'Concluir construção CC2603'})).toHaveLength(2);
    expect(screen.getAllByRole('button', {name: 'Arquivar construção CC2603'})).toHaveLength(2);
    expect(screen.getAllByRole('button', {name: 'Desarquivar construção CC2605'})).toHaveLength(2);
    expect(screen.queryByRole('button', {name: 'Gerenciar monitores da construção CC2605'}))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Gerenciar casas da construção CC2605'}))
      .not.toBeInTheDocument();
    screen.getAllByRole('button', {name: 'Gerenciar monitores da construção CC2603'}).forEach((button) => {
      expect(button).toHaveClass('hover:bg-blue-100', 'hover:text-blue-600');
    });
    screen.getAllByRole('button', {name: 'Gerenciar casas da construção CC2603'}).forEach((button) => {
      expect(button).toHaveClass('hover:bg-blue-100', 'hover:text-blue-600');
    });
    screen.getAllByRole('button', {name: 'Concluir construção CC2603'}).forEach((button) => {
      expect(button).toHaveClass('hover:bg-emerald-50', 'hover:text-emerald-700');
    });
    screen.getAllByRole('button', {name: 'Arquivar construção CC2603'}).forEach((button) => {
      expect(button).toHaveClass('hover:bg-red-50', 'hover:text-red-600');
    });
    expect(screen.getByRole('button', {name: '+ Adicionar Construção'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-construction-add');
    screen.getAllByRole('button', {name: 'Gerenciar monitores da construção CC2603'}).forEach((button) => {
      expect(button).toHaveAttribute('data-guided-tour-id', 'rac-construction-monitors');
    });
    screen.getAllByRole('button', {name: 'Gerenciar casas da construção CC2603'}).forEach((button) => {
      expect(button).toHaveAttribute('data-guided-tour-id', 'rac-construction-houses');
    });
    screen.getAllByRole('button', {name: 'Concluir construção CC2603'}).forEach((button) => {
      expect(button).toHaveAttribute('data-guided-tour-id', 'rac-construction-completed');
    });
    screen.getAllByRole('button', {name: 'Arquivar construção CC2603'}).forEach((button) => {
      expect(button).toHaveAttribute('data-guided-tour-id', 'rac-construction-archive');
    });
    screen.getAllByRole('button', {name: 'Gerenciar monitores da construção CC2604'}).forEach((button) => {
      expect(button).not.toHaveAttribute('data-guided-tour-id');
    });

    const row = screen.getByRole('row', {name: /CC2603/i});
    expect(within(row).getByRole('img', {name: 'Foto da construção CC2603'})).toHaveAttribute('src', VALID_PNG_DATA_URL);
    expect(within(row).getByText('CC2603')).toBeVisible();
    expect(within(row).getByText('Tiradentes')).toBeVisible();
    expect(within(row).getByText('Em andamento')).toBeVisible();
    expect(within(row).getByText('Em andamento').closest('td')).toHaveClass('text-center');
    expect(within(row).getByText('11/05/2026').closest('td')).toHaveClass('text-center');
    expect(within(row).getByRole('button', {name: 'Arquivar construção CC2603'}).parentElement)
      .toHaveClass('justify-end');

    await user.click(screen.getByLabelText('Filtrar por status'));
    const constructionStatusMenu = await screen.findByTestId('Filtrar por status-menu');
    expect(within(constructionStatusMenu).getByRole('menuitemradio', {name: 'Arquivada'})).toBeVisible();
    expect(within(constructionStatusMenu).getByRole('menuitemradio', {name: 'Em andamento'})).toBeVisible();
    expect(within(constructionStatusMenu).getByRole('menuitemradio', {name: 'Concluída'})).toBeVisible();
    expect(within(constructionStatusMenu).queryByRole('menuitemradio', {name: 'Rascunho'})).not.toBeInTheDocument();
    await user.click(within(constructionStatusMenu).getByRole('menuitemradio', {name: 'Arquivada'}));

    expect(screen.queryByTestId('Filtrar por status-menu')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('construction-mobile-pagination'))
      .getByText('Mostrando 1-1 de 1 construções')).toBeVisible();
    expect(screen.getByTestId('construction-mobile-pagination')).toHaveClass('justify-center', 'text-center');
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('dispara apenas o tour de adicionar construção quando a listagem está vazia', async () => {
    const constructionAddTour = listenGuidedTourEvent('rac:construction-add-tour-ready');
    const constructionActionsTour = listenGuidedTourEvent('rac:construction-actions-tour-ready');

    renderPanel({constructionSite: null, summaries: []});
    stubGuidedTourTargetRects();

    await waitFor(() => expect(constructionAddTour.listener).toHaveBeenCalledTimes(1));
    expect(getGuidedTourEventTargetIds(constructionAddTour.listener)).toEqual(['rac-construction-add']);
    expect(constructionActionsTour.listener).not.toHaveBeenCalled();

    constructionAddTour.cleanup();
    constructionActionsTour.cleanup();
  });

  it('dispara ações da construção sem depender do retorno ao canvas', async () => {
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-add:completed', 'construction-add-v1');
    const constructionActionsTour = listenGuidedTourEvent('rac:construction-actions-tour-ready');
    const backToCanvasTour = listenGuidedTourEvent('rac:construction-back-to-canvas-tour-ready');

    renderPanel({canOpenRacEditor: false});
    stubGuidedTourTargetRects();

    await waitFor(() => expect(constructionActionsTour.listener).toHaveBeenCalledTimes(1));
    expect(getGuidedTourEventTargetIds(constructionActionsTour.listener)).toEqual([
      'rac-construction-monitors',
      'rac-construction-houses',
      'rac-construction-completed',
      'rac-construction-archive',
    ]);
    expect(backToCanvasTour.listener).not.toHaveBeenCalled();

    constructionActionsTour.cleanup();
    backToCanvasTour.cleanup();
  });

  it('dispara retorno ao canvas apenas quando a casa ativa pode abrir o editor', async () => {
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-add:completed', 'construction-add-v1');
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-actions:completed', 'construction-actions-v1');
    const backToCanvasTour = listenGuidedTourEvent('rac:construction-back-to-canvas-tour-ready');

    renderPanel({canOpenRacEditor: true, onBackToCanvas: vi.fn()});
    stubGuidedTourTargetRects();

    await waitFor(() => expect(backToCanvasTour.listener).toHaveBeenCalledTimes(1));
    expect(getGuidedTourEventTargetIds(backToCanvasTour.listener)).toEqual(['rac-construction-back-to-canvas']);

    backToCanvasTour.cleanup();
  });

  it('trunca comunidade longa na listagem desktop de construções sem deslocar colunas', () => {
    const summaries = createSummaries();
    const longCommunityName = 'M'.repeat(30);
    summaries[0] = {
      ...summaries[0],
      label: `CC2603 · ${longCommunityName}`,
      communityName: longCommunityName,
    };

    renderPanel({summaries});

    const table = screen.getByTestId('construction-desktop-table');
    const desktopTable = within(table).getByRole('table');
    const row = within(table).getByRole('row', {name: /CC2603/i});
    const identity = within(row).getByTestId('construction-table-identity');
    const community = within(row).getByTestId('construction-table-community');
    const date = within(row).getByText('11/05/2026');

    expect(desktopTable).toHaveClass('table-fixed');
    expect(desktopTable.querySelectorAll('col')[0]).toHaveClass('w-[48%]');
    expect(identity.closest('td')).toHaveClass('max-w-0');
    expect(identity).toHaveClass('min-w-0', 'flex-1');
    expect(community).toHaveTextContent(longCommunityName);
    expect(community).toHaveAttribute('title', longCommunityName);
    expect(community).toHaveClass('block', 'truncate');
    expect(date.closest('td')).toHaveClass('text-center');
  });

  it('usa paginação mobile numérica compacta na listagem de construções', async () => {
    const user = userEvent.setup();

    renderPanel({summaries: createPaginatedSummaries(61)});

    const pagination = screen.getByTestId('construction-mobile-pagination');
    expect(pagination).toHaveClass('justify-between');
    expect(pagination).not.toHaveClass('justify-center');
    expect(within(pagination).getByText('Mostrando 1-10 de 61 construções')).toBeVisible();
    expect(within(pagination).getByRole('navigation', {name: 'Paginação de construções'})).toBeVisible();
    expect(within(pagination).getByRole('button', {name: 'Página anterior de construções'})).toBeDisabled();
    expect(within(pagination).getByRole('button', {name: 'Próxima página de construções'})).toBeEnabled();
    expect(within(pagination).getByRole('button', {name: 'Ir para página 1 de construções'}))
      .toHaveAttribute('aria-current', 'page');
    expect(within(pagination).getByRole('button', {name: 'Ir para página 7 de construções'})).toBeVisible();
    expect(within(pagination).getAllByText('...')).toHaveLength(1);

    await user.click(within(pagination).getByRole('button', {name: 'Ir para página 4 de construções'}));

    const updatedPagination = screen.getByTestId('construction-mobile-pagination');
    expect(within(updatedPagination).getByText('Mostrando 31-40 de 61 construções')).toBeVisible();
    expect(within(updatedPagination).getByRole('button', {name: 'Ir para página 4 de construções'}))
      .toHaveAttribute('aria-current', 'page');
    expect(within(updatedPagination).getAllByText('...')).toHaveLength(2);
  });

  it('usa paginação mobile numérica completa na listagem de casas', async () => {
    const user = userEvent.setup();

    renderPanel({constructionSite: createConstructionSiteWithManyRecords({houseCount: 50})});

    await openConstructionHouses(user);

    const pagination = screen.getByTestId('house-mobile-pagination');
    expect(within(pagination).getByText('Mostrando 1-10 de 50 casas')).toBeVisible();
    expect(within(pagination).getByRole('navigation', {name: 'Paginação de casas'})).toBeVisible();
    expect(within(pagination).getByRole('button', {name: 'Página anterior de casas'})).toBeDisabled();
    expect(within(pagination).getByRole('button', {name: 'Próxima página de casas'})).toBeEnabled();
    expect(within(pagination).queryByText('...')).not.toBeInTheDocument();

    for (const pageNumber of [1, 2, 3, 4, 5]) {
      expect(within(pagination).getByRole('button', {name: `Ir para página ${pageNumber} de casas`})).toBeVisible();
    }

    await user.click(within(pagination).getByRole('button', {name: 'Ir para página 5 de casas'}));

    const updatedPagination = screen.getByTestId('house-mobile-pagination');
    expect(within(updatedPagination).getByText('Mostrando 41-50 de 50 casas')).toBeVisible();
    expect(within(updatedPagination).getByRole('button', {name: 'Ir para página 5 de casas'}))
      .toHaveAttribute('aria-current', 'page');
    expect(within(updatedPagination).getByRole('button', {name: 'Próxima página de casas'})).toBeDisabled();
  });

  it('navega por setas na paginação mobile de monitores', async () => {
    const user = userEvent.setup();

    renderPanel({constructionSite: createConstructionSiteWithManyRecords({activeMonitorCount: 12})});

    await openConstructionMonitors(user);

    const pagination = screen.getByTestId('monitor-mobile-pagination');
    expect(within(pagination).getByText('Mostrando 1-10 de 12 monitores')).toBeVisible();
    expect(within(pagination).getByRole('navigation', {name: 'Paginação de monitores'})).toBeVisible();
    expect(within(pagination).getByRole('button', {name: 'Página anterior de monitores'})).toBeDisabled();
    expect(within(pagination).getByRole('button', {name: 'Próxima página de monitores'})).toBeEnabled();
    expect(within(pagination).getByRole('button', {name: 'Ir para página 1 de monitores'}))
      .toHaveAttribute('aria-current', 'page');

    await user.click(within(pagination).getByRole('button', {name: 'Próxima página de monitores'}));

    const updatedPagination = screen.getByTestId('monitor-mobile-pagination');
    expect(within(updatedPagination).getByText('Mostrando 11-12 de 12 monitores')).toBeVisible();
    expect(within(updatedPagination).getByRole('button', {name: 'Página anterior de monitores'})).toBeEnabled();
    expect(within(updatedPagination).getByRole('button', {name: 'Próxima página de monitores'})).toBeDisabled();
    expect(within(updatedPagination).getByRole('button', {name: 'Ir para página 2 de monitores'}))
      .toHaveAttribute('aria-current', 'page');
  });

  it('abre edição pelos cards mobile de construções sem adicionar navegação mobile', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    const mobileList = screen.getByTestId('construction-mobile-list');
    await user.click(within(mobileList).getByRole('button', {name: /Abrir construção CC2604/i}));

    expect(actions.activateConstructionSite).toHaveBeenCalledWith('construction_site_2');
    expect(await screen.findByRole('heading', {name: 'Editar Construção TETO'})).toBeVisible();
    expect(screen.queryByTestId('mobile-bottom-navigation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-floating-action-button')).not.toBeInTheDocument();
  });

  it('usa seta contextual na criação de construção e não exibe Voltar à lista', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('button', {name: '+ Adicionar Construção'}));

    expect(screen.getByRole('heading', {name: 'Adicionar Construção TETO'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Voltar'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Voltar'})).not.toHaveAttribute('data-guided-tour-id');
    expect(screen.queryByRole('button', {name: 'Voltar à lista'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Gerenciar Casas'})).not.toBeInTheDocument();
    expect(screen.getByTestId('construction-photo-field')).toBeVisible();
    expect(screen.getByTestId('construction-form-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByLabelText('Data da Construção')).toBeVisible();

    fireEvent.change(screen.getByLabelText('Código da CC'), {target: {value: 'CC2606'}});
    fireEvent.change(screen.getByLabelText('Comunidade'), {target: {value: 'Tiradentes'}});
    await user.click(screen.getByRole('button', {name: 'Criar Construção'}));

    expect(actions.createConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByText('Informe a data da construção.')).toBeVisible();

    fireEvent.click(screen.getByLabelText('Data da Construção'));
    const calendar = await screen.findByTestId('construction-date-picker-calendar');
    const day15 = within(calendar).queryByRole('button', {name: /15/})
      ?? within(calendar).queryByRole('gridcell', {name: /15/});
    expect(day15).toBeDefined();
    fireEvent.click(day15 as HTMLElement);
    await user.click(screen.getByRole('button', {name: 'Criar Construção'}));

    expect(actions.createConstructionSite).toHaveBeenCalledWith({
      externalCode: 'CC2606',
      photoDataUrl: undefined,
      constructionDate: '2026-05-15',
      communityName: 'Tiradentes',
    });
  });

  it('valida obrigatoriedade e limite dos campos da construção', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('button', {name: '+ Adicionar Construção'}));

    expect(screen.getByLabelText('Comunidade')).toHaveAttribute('maxlength', '30');

    fireEvent.change(screen.getByLabelText('Código da CC'), {target: {value: 'CC26'}});
    fireEvent.change(screen.getByLabelText('Comunidade'), {target: {value: 'A'.repeat(31)}});
    await user.click(screen.getByRole('button', {name: 'Criar Construção'}));

    expect(actions.createConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o código no formato CC0000.')).toBeVisible();
    expect(screen.getByText('Informe a data da construção.')).toBeVisible();
    expect(screen.getByText('Máximo de 30 caracteres.')).toBeVisible();
  });

  it('bloqueia criação de construção com código já cadastrado', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('button', {name: '+ Adicionar Construção'}));

    fireEvent.change(screen.getByLabelText('Código da CC'), {target: {value: 'cc2603'}});
    fireEvent.change(screen.getByLabelText('Comunidade'), {target: {value: 'Nova Comunidade'}});
    fireEvent.click(screen.getByLabelText('Data da Construção'));
    const calendar = await screen.findByTestId('construction-date-picker-calendar');
    const day15 = within(calendar).queryByRole('button', {name: /15/})
      ?? within(calendar).queryByRole('gridcell', {name: /15/});
    expect(day15).toBeDefined();
    fireEvent.click(day15 as HTMLElement);

    await user.click(screen.getByRole('button', {name: 'Criar Construção'}));

    expect(actions.createConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByText('Já existe uma Construção TETO com este código.')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Adicionar Construção TETO'})).toBeVisible();
  });

  it('avisa antes de sair do formulário de construção com alterações não salvas', async () => {
    const user = userEvent.setup();

    renderPanel();

    await user.click(screen.getByRole('button', {name: '+ Adicionar Construção'}));
    await user.type(screen.getByLabelText('Comunidade'), 'Comunidade sem salvar');

    await user.click(screen.getByRole('button', {name: 'Voltar'}));

    await expectUnsavedChangesDialog(user);
    expect(screen.getByRole('heading', {name: 'Adicionar Construção TETO'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await confirmUnsavedChangesExit(user);

    expect(screen.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('seleciona Data da Construção pelo Date Picker e salva a edição', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    expect(await screen.findByRole('heading', {name: 'Editar Construção TETO'})).toBeVisible();

    fireEvent.click(screen.getByRole('button', {name: 'Remover Foto da Construção'}));
    expect(screen.queryByAltText('Foto da Construção')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Data da Construção'));
    const calendar = await screen.findByTestId('construction-date-picker-calendar');
    const day15 = within(calendar).queryByRole('button', {name: /15/})
      ?? within(calendar).queryByRole('gridcell', {name: /15/});
    expect(day15).toBeDefined();
    fireEvent.click(day15 as HTMLElement);

    expect(screen.getByLabelText('Data da Construção')).toHaveTextContent('15/05/2026');
    expect(screen.getByRole('button', {name: 'Limpar Data da Construção'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Salvar Construção'}));

    await waitFor(() => expect(actions.updateActiveConstructionSite).toHaveBeenCalledWith({
      externalCode: 'CC2603',
      constructionDate: '2026-05-15',
      communityName: 'Tiradentes',
      photoDataUrl: undefined,
    }));
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('exporta RACs em ZIP pelo formulário de construção', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    expect(await screen.findByRole('heading', {name: 'Editar Construção TETO'})).toBeVisible();

    const exportButton = screen.getByRole('button', {name: 'Exportar RACs ZIP'});
    expect(exportButton).toBeEnabled();

    await user.click(exportButton);

    await waitFor(() => expect(actions.exportConstructionRacsZip).toHaveBeenCalledWith('construction_site_1'));
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('abre edição pela linha inteira e acessa a listagem de casas sem ações redundantes', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    const constructionRow = screen.getByRole('row', {name: /CC2603.*Em andamento/i});
    expect(within(constructionRow).getByRole('button', {name: 'Gerenciar monitores da construção CC2603'})).toBeVisible();
    expect(within(constructionRow).getByRole('button', {name: 'Gerenciar casas da construção CC2603'})).toBeVisible();
    expect(within(constructionRow).getByRole('button', {name: 'Arquivar construção CC2603'})).toBeVisible();

    await user.click(constructionRow);

    expect(actions.activateConstructionSite).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', {name: 'Editar Construção TETO'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Voltar'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Voltar à lista'})).not.toBeInTheDocument();
    expect(screen.getByLabelText('Código da CC')).toHaveValue('CC2603');
    expect(screen.getByTestId('construction-photo-field')).toBeVisible();
    expect(screen.getByLabelText('Data da Construção')).toHaveTextContent('11/05/2026');
    const constructionPhotoDropZone = within(screen.getByTestId('construction-photo-field'))
      .getByRole('button', {name: 'Foto da Construção'});
    const constructionPhoto = screen.getByAltText('Foto da Construção');

    expect(constructionPhotoDropZone).toHaveClass('h-56');
    expect(constructionPhoto).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full', 'object-cover', 'object-center');
    expect(constructionPhoto.className).not.toContain('min-h');
    Object.defineProperty(constructionPhoto, 'naturalWidth', {configurable: true, value: 900});
    Object.defineProperty(constructionPhoto, 'naturalHeight', {configurable: true, value: 1600});
    fireEvent.load(constructionPhoto);
    expect(constructionPhotoDropZone).toHaveAttribute('data-photo-orientation', 'portrait');
    expect(screen.getByRole('button', {name: 'Remover Foto da Construção'})).toBeVisible();
    expect(within(screen.getByTestId('construction-photo-field'))
      .getByText('Clique para fazer upload ou arraste uma foto')).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Ativar construção'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Arquivar construção'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Gerenciar Casas'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Gerenciar Monitores'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await user.click(within(screen.getByRole('row', {name: /CC2603.*Em andamento/i}))
      .getByRole('button', {name: 'Gerenciar casas da construção CC2603'}));

    expect(screen.getByRole('heading', {name: 'Casas - CC2603 · Tiradentes', hidden: true}))
      .toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Voltar'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-back');
    expect(screen.getByRole('button', {name: '+ Adicionar Casa'})).toBeVisible();
    expect(screen.getAllByRole('button', {name: '+ Adicionar Casa'})).toHaveLength(1);
    expect(screen.getByRole('button', {name: '+ Adicionar Casa'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-add');
    const totalMetric = screen.getByText('No. Casas').closest('article');
    const type6Metric = screen.getByText('No. Tipo 6').closest('article');
    const type3Metric = screen.getByText('No. Tipo 3').closest('article');

    expect(totalMetric).toHaveClass('text-center');
    expect(type6Metric).toHaveClass('text-center');
    expect(type3Metric).toHaveClass('text-center');
    expect(within(totalMetric as HTMLElement).getByText('3')).toBeVisible();
    expect(within(type6Metric as HTMLElement).getByText('2')).toBeVisible();
    expect(within(type3Metric as HTMLElement).getByText('1')).toBeVisible();
    expect(screen.getByTestId('house-list-controls').className).toContain('grid-cols-2');
    expect(screen.getByTestId('house-list-controls').className).toContain('sm:flex');
    expect(screen.getByTestId('house-list-controls').className).toContain('sm:flex-wrap');
    expect(screen.getByLabelText('Filtrar casas por status').parentElement?.className).toContain('w-full');
    expect(screen.getByLabelText('Filtrar casas por status').parentElement?.className).toContain('sm:w-[11.25rem]');
    expect(screen.getByLabelText('Ordenar casas por').parentElement?.className).toContain('w-full');
    expect(screen.getByLabelText('Ordenar casas por').parentElement?.className).toContain('sm:w-[11.25rem]');
    expect(screen.getByRole('columnheader', {name: 'Casas'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Status'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Dificuldade'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Última Modificação'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Status'})).toHaveClass('text-center');
    expect(screen.getByRole('columnheader', {name: 'Dificuldade'})).toHaveClass('text-center');
    expect(screen.getByTestId('house-updated-header-grid'))
      .toHaveClass('grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem]', 'text-center');
    expect(screen.getByTestId('house-desktop-table').className).toContain('hidden');
    expect(screen.getByTestId('house-desktop-table').className).toContain('sm:block');
    const houseDesktopTable = within(screen.getByTestId('house-desktop-table')).getByRole('table');
    expect(houseDesktopTable).toHaveClass('table-fixed');
    expect(houseDesktopTable.querySelectorAll('col')[0]).toHaveClass('w-[34%]');
    expect(houseDesktopTable.querySelectorAll('col')[1]).toHaveClass('w-[14%]');
    expect(houseDesktopTable.querySelectorAll('col')[2]).toHaveClass('w-[20%]');
    expect(houseDesktopTable.querySelectorAll('col')[3]).toHaveClass('w-[32%]');
    const houseMobileList = screen.getByTestId('house-mobile-list');
    const houseMobilePagination = screen.getByTestId('house-mobile-pagination');

    expect(screen.getByTestId('house-desktop-pagination').className).toContain('hidden');
    expect(screen.getByTestId('house-desktop-pagination').className).toContain('sm:flex');
    expect(houseMobilePagination.className).toContain('sm:hidden');
    expect(houseMobileList.compareDocumentPosition(houseMobilePagination) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(houseMobileList.className).toContain('sm:hidden');
    expect(screen.getAllByTestId('house-mobile-card')).toHaveLength(3);
    expect(within(houseMobileList).getByText('Família Souza')).toBeVisible();
    expect(within(houseMobileList).getAllByText('Tipo 6')[0]).toBeVisible();
    expect(within(houseMobileList).getAllByRole('meter', {name: 'Dificuldade da casa'})).toHaveLength(3);
    expect(within(houseMobilePagination).getByText('Mostrando 1-3 de 3 casas')).toBeVisible();
    expect(within(houseMobilePagination).queryAllByRole('button')).toHaveLength(0);
    expect(houseMobilePagination).toHaveClass('justify-center', 'text-center');
    expect(screen.getAllByText('Família Arquivada')[0]).toBeVisible();
    const guidedTourHouseRow = screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Rascunho/i});
    expect(within(guidedTourHouseRow).getByText('Rascunho'))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-status');
    expect(within(guidedTourHouseRow).getByTestId('house-table-difficulty-gauge').parentElement)
      .toHaveAttribute('data-guided-tour-id', 'rac-house-difficulty');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Abrir materiais extras da casa Família Souza'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-extra-materials');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Abrir materiais extras da casa Família Souza'}))
      .toHaveClass('hover:bg-blue-100', 'hover:text-blue-600');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Marcar casa Família Souza como construída'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-built');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Marcar casa Família Souza como construída'}))
      .toHaveClass('text-slate-400', 'hover:bg-emerald-50', 'hover:text-emerald-700');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Marcar casa Família Souza como construída'}))
      .not.toHaveClass('bg-emerald-50', 'text-emerald-700');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Arquivar casa Família Souza'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-archive');
    expect(within(guidedTourHouseRow).getByRole('button', {name: 'Arquivar casa Família Souza'}))
      .toHaveClass('hover:bg-red-50', 'hover:text-red-600');
    const houseRow = screen.getByRole('row', {name: /Família Santos.*Tipo 3.*RAC Impressa/i});
    expect(within(houseRow).getByText('RAC Impressa')).not.toHaveAttribute('data-guided-tour-id');
    expect(within(houseRow).getByRole('button', {name: 'Abrir materiais extras da casa Família Santos'}))
      .not.toHaveAttribute('data-guided-tour-id');
    expect(within(houseRow).getByText('RAC Impressa').closest('td')).toHaveClass('text-center');
    expect(within(houseRow).getByRole('meter', {name: 'Dificuldade da casa'}))
      .toHaveAttribute('aria-valuetext', 'Dificuldade Baixa, 4 de 100');
    expect(within(houseRow).getByText('09/05/2026').closest('td')).toHaveClass('text-center');
    expect(within(houseRow).getByTestId('house-table-updated-at').parentElement)
      .toHaveClass('grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem]');
    expect(within(houseRow).getByRole('button', {name: 'Arquivar casa Família Santos'}).parentElement)
      .toHaveClass('min-h-14', 'grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem]', 'items-center');
    expect(screen.queryByRole('combobox', {name: 'Filtrar casas por status'})).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-bottom-navigation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-floating-action-button')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Filtrar casas por status'));
    const houseStatusMenu = await screen.findByTestId('Filtrar casas por status-menu');
    expect(within(houseStatusMenu).getByRole('menuitemradio', {name: 'Arquivada'})).toBeVisible();
    expect(within(houseStatusMenu).getByRole('menuitemradio', {name: 'Rascunho'})).toBeVisible();
    expect(within(houseStatusMenu).getByRole('menuitemradio', {name: 'RAC Impressa'})).toBeVisible();
    expect(within(houseStatusMenu).getByRole('menuitemradio', {name: 'Construída'})).toBeVisible();
    expect(within(houseStatusMenu).queryByRole('menuitemradio', {name: 'Avaliada'})).not.toBeInTheDocument();
    expect(within(houseStatusMenu).queryByRole('menuitemradio', {name: 'Desenhada'})).not.toBeInTheDocument();
    expect(within(houseStatusMenu).queryByRole('menuitemradio', {name: 'Aprovada'})).not.toBeInTheDocument();
    await user.click(within(houseStatusMenu).getByRole('menuitemradio', {name: 'Arquivada'}));

    expect(screen.queryByTestId('Filtrar casas por status-menu')).not.toBeInTheDocument();
    expect(within(houseMobilePagination).getByText('Mostrando 1-1 de 1 casas')).toBeVisible();
    expect(houseMobilePagination).toHaveClass('justify-center', 'text-center');
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('dispara apenas o tour de adicionar casa quando a construção ainda não tem casas', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    constructionSite.houses = [];
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-add:completed', 'construction-add-v1');
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-actions:completed', 'construction-actions-v1');
    const houseAddTour = listenGuidedTourEvent('rac:house-add-tour-ready');
    const houseActionsTour = listenGuidedTourEvent('rac:house-actions-tour-ready');

    renderPanel({constructionSite});
    await openConstructionHouses(user);
    stubGuidedTourTargetRects();

    await waitFor(() => expect(houseAddTour.listener).toHaveBeenCalledTimes(1));
    expect(getGuidedTourEventTargetIds(houseAddTour.listener)).toEqual(['rac-house-add']);
    expect(houseActionsTour.listener).not.toHaveBeenCalled();

    houseAddTour.cleanup();
    houseActionsTour.cleanup();
  });

  it('dispara ações da casa depois que existe casa cadastrada', async () => {
    const user = userEvent.setup();
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-add:completed', 'construction-add-v1');
    markGuidedTourSegmentCompleted('guided-tour:rac-construction-actions:completed', 'construction-actions-v1');
    markGuidedTourSegmentCompleted('guided-tour:rac-house-add:completed', 'house-add-v1');
    const houseActionsTour = listenGuidedTourEvent('rac:house-actions-tour-ready');

    renderPanel();
    await openConstructionHouses(user);
    stubGuidedTourTargetRects();

    await waitFor(() => expect(houseActionsTour.listener).toHaveBeenCalledTimes(1));
    expect(getGuidedTourEventTargetIds(houseActionsTour.listener)).toEqual([
      'rac-house-status',
      'rac-house-difficulty',
      'rac-house-extra-materials',
      'rac-house-built',
      'rac-house-archive',
      'rac-house-back',
    ]);

    houseActionsTour.cleanup();
  });

  it('trunca nome longo na listagem desktop de casas sem deslocar status e data', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    const longFamilyName = 'M'.repeat(30);
    constructionSite.families[0].name = longFamilyName;

    renderPanel({constructionSite});

    await openConstructionHouses(user);

    const houseTable = screen.getByTestId('house-desktop-table');
    const row = within(houseTable).getByRole('row', {
      name: new RegExp(`${longFamilyName}.*Tipo 6.*Rascunho`),
    });
    const identity = within(row).getByTestId('house-table-identity');
    const familyName = within(row).getByTestId('house-table-family-name');
    const houseType = within(row).getByTestId('house-table-type');

    expect(identity.closest('td')).toHaveClass('max-w-0');
    expect(identity).toHaveClass('min-w-0', 'flex-1');
    expect(familyName).toHaveTextContent(longFamilyName);
    expect(familyName).toHaveAttribute('title', longFamilyName);
    expect(familyName).toHaveClass('block', 'truncate');
    expect(houseType).toHaveTextContent('Tipo 6');
    expect(houseType).toHaveAttribute('title', 'Tipo 6');
    expect(houseType).toHaveClass('block', 'truncate');
    expect(within(row).getByText('Rascunho').closest('td')).toHaveClass('text-center');
    expect(within(row).getByText('09/05/2026').closest('td')).toHaveClass('text-center');
  });

  it('lista monitores ativos por padrão e reativa inativos pelo filtro de status', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionMonitors(user);

    expect(screen.getByRole('heading', {name: 'Monitores - CC2603 · Tiradentes'})).toBeVisible();
    expect(screen.getByRole('button', {name: '+ Adicionar Monitor'})).toBeVisible();
    expect(screen.queryByText('No. Monitores')).not.toBeInTheDocument();
    const monitorMobilePagination = screen.getByTestId('monitor-mobile-pagination');
    expect(within(monitorMobilePagination).queryAllByRole('button')).toHaveLength(0);
    expect(monitorMobilePagination).toHaveClass('justify-center', 'text-center');
    expect(screen.getByRole('row', {name: /Ana Monitoria.*Ativo.*\(11\) 99999-0000/i})).toBeVisible();
    expect(screen.queryByText('Bruno Inativo')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', {name: 'Filtrar monitores por status'})).not.toBeInTheDocument();

    await chooseVisualOption(user, 'Filtrar monitores por status', 'Inativos');

    const inactiveMonitorRow = screen.getByRole('row', {name: /Bruno Inativo.*Inativo.*\(11\) 98888-0000/i});
    const inactiveMonitorMobileCard = within(screen.getByTestId('monitor-mobile-list'))
      .getByText('Bruno Inativo')
      .closest('[data-testid="monitor-mobile-card"]');

    expect(inactiveMonitorRow).toBeVisible();
    expect(inactiveMonitorRow).toHaveClass('cursor-default', 'opacity-55');
    expect(inactiveMonitorMobileCard).not.toHaveAttribute('role', 'button');
    expect(inactiveMonitorMobileCard).toHaveClass('cursor-default', 'opacity-55');
    expect(screen.queryByRole('row', {name: /Ana Monitoria.*Ativo/i})).not.toBeInTheDocument();

    await user.click(inactiveMonitorRow);

    expect(actions.updateMonitor).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', {name: 'Monitores - CC2603 · Tiradentes'})).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Editar Monitor'})).not.toBeInTheDocument();

    await user.click(within(screen.getByTestId('monitor-mobile-list'))
      .getByRole('button', {name: 'Reativar monitor Bruno Inativo'}));

    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Reativar monitor?'})).toBeVisible();
    expect(screen.getByText(/Bruno Inativo voltará a aparecer/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Reativar monitor'}));

    expect(actions.reactivateMonitor).toHaveBeenCalledWith('monitor_2');
    expect(actions.inactivateMonitor).not.toHaveBeenCalled();
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('trunca título longo da tela de monitores sem invadir a ação principal', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    const longCommunityName = 'M'.repeat(30);
    constructionSite.communities[0].name = longCommunityName;

    renderPanel({constructionSite});

    await openConstructionMonitors(user);

    const title = screen.getByTestId('construction-management-title');
    const expectedTitle = `Monitores - CC2603 · ${longCommunityName}`;

    expect(title).toHaveTextContent(expectedTitle);
    expect(title).toHaveAttribute('title', expectedTitle);
    expect(title).toHaveClass('truncate');
    expect(title.parentElement).toHaveClass('min-w-0', 'flex-1');
    expect(screen.getByRole('button', {name: '+ Adicionar Monitor'})).toHaveClass('sm:shrink-0');
  });

  it('trunca nome e e-mail longos na listagem desktop de monitores sem deslocar status', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    const longMonitorName = 'M'.repeat(30);
    const longMonitorEmail = `${'M'.repeat(43)}@MMM.MM`;
    constructionSite.monitors[0].name = longMonitorName;
    constructionSite.monitors[0].email = longMonitorEmail;
    constructionSite.monitors[1].name = 'Segundo Monitor';
    constructionSite.monitors[1].status = 'active';

    renderPanel({constructionSite});

    await openConstructionMonitors(user);

    const monitorTable = screen.getByTestId('monitor-desktop-table');
    const desktopTable = within(monitorTable).getByRole('table');
    const statusHeader = within(monitorTable).getByRole('columnheader', {name: 'Status'});
    const contactHeader = within(monitorTable).getByRole('columnheader', {name: 'Contato'});
    const actionsHeader = within(monitorTable).getByRole('columnheader', {name: 'Ações'});
    const actionButton = within(monitorTable).getByRole('button', {name: `Inativar monitor ${longMonitorName}`});
    const monitorRow = actionButton.closest('tr');
    const monitorRowQueries = within(monitorRow as HTMLElement);
    const identity = monitorRowQueries.getByTestId('monitor-table-identity');
    const monitorName = monitorRowQueries.getByTestId('monitor-table-name');
    const monitorEmail = monitorRowQueries.getByTestId('monitor-table-email');
    const phone = monitorRowQueries.getByText('(11) 99999-0000');
    const actions = monitorRowQueries.getByTestId('monitor-table-actions');
    const monitorRows = within(monitorTable).getAllByRole('row');

    expect(desktopTable).toHaveClass('table-fixed');
    expect(desktopTable.querySelectorAll('col')[0]).toHaveClass('w-[48%]');
    expect(desktopTable.querySelectorAll('col')[1]).toHaveClass('w-[16%]');
    expect(desktopTable.querySelectorAll('col')[2]).toHaveClass('w-[24%]');
    expect(desktopTable.querySelectorAll('col')[3]).toHaveClass('w-[12%]');
    expect(statusHeader).toHaveClass('text-center');
    expect(contactHeader).toHaveClass('text-center');
    expect(actionsHeader).toHaveClass('text-center');
    expect(identity.closest('td')).toHaveClass('max-w-0');
    expect(identity).toHaveClass('min-w-0', 'flex-1');
    expect(monitorName).toHaveTextContent(longMonitorName);
    expect(monitorName).toHaveAttribute('title', longMonitorName);
    expect(monitorName).toHaveClass('block', 'truncate');
    expect(monitorEmail).toHaveTextContent(longMonitorEmail);
    expect(monitorEmail).toHaveAttribute('title', longMonitorEmail);
    expect(monitorEmail).toHaveClass('block', 'truncate');
    expect(phone).toHaveClass('block', 'whitespace-nowrap', 'text-center');
    expect(phone.closest('td')).toHaveClass('text-center', 'align-middle');
    expect(actions).toHaveClass('min-h-14', 'items-center', 'justify-center');
    expect(actionButton.closest('td')).toHaveClass('text-center', 'align-middle');
    expect(monitorRow).toHaveClass('bg-transparent', 'hover:bg-slate-50');
    expect(monitorRows[2]).toHaveClass('bg-transparent', 'hover:bg-slate-50');
    expect(monitorRow).not.toHaveClass('bg-blue-50/90');
    expect(monitorRows[2]).not.toHaveClass('bg-blue-50/90');
  });

  it('cadastra monitor com nome e telefone válidos e bloqueia campos inválidos', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionMonitors(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Monitor'}));

    expect(screen.getByRole('heading', {name: 'Cadastrar Monitor'})).toBeVisible();
    expect(screen.getByLabelText('Nome do Monitor')).toHaveAttribute('maxlength', '25');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('maxlength', '50');
    expect(screen.getByTestId('monitor-photo-field')).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('Código da CC')).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('CC2603')).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('Comunidade')).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('Tiradentes')).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Dados do Monitor'})).not.toBeInTheDocument();
    expect(screen.getByTestId('monitor-form')).toHaveClass('items-stretch');
    expect(screen.getByTestId('monitor-form-layout')).toHaveClass('h-full', 'items-stretch');
    expect(screen.getByTestId('monitor-fields-column'))
      .toHaveClass('h-full', 'flex', 'flex-col');
    expect(screen.getByTestId('monitor-fields-stack')).toHaveClass('flex', 'flex-col', 'gap-5');
    expect(screen.getByLabelText('Telefone').parentElement).toHaveClass('relative', 'block', 'h-10', 'w-full');
    expect(within(screen.getByTestId('monitor-fields-column')).getByRole('button', {name: 'Cadastrar Monitor'}))
      .toHaveClass('mt-4', 'w-full', 'md:mt-auto');
    expect(within(screen.getByTestId('monitor-photo-field')).getByRole('button', {name: 'Foto do Monitor'}))
      .toHaveClass('flex-1', 'min-h-[16rem]');

    await user.click(screen.getByRole('button', {name: 'Cadastrar Monitor'}));

    expect(actions.createMonitor).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o nome do monitor.')).toBeVisible();
    expect(screen.getByText('Informe 11 dígitos com DDD.')).toBeVisible();

    fireEvent.change(screen.getByLabelText('Nome do Monitor'), {target: {value: 'Carla Monitor'}});
    fireEvent.change(screen.getByLabelText('Telefone'), {target: {value: 'abc41999998888xyz'}});
    fireEvent.change(screen.getByLabelText('E-mail'), {target: {value: 'email inválido'}});

    expect(screen.getByLabelText('Telefone')).toHaveValue('(41) 99999-8888');

    await user.click(screen.getByRole('button', {name: 'Cadastrar Monitor'}));

    expect(actions.createMonitor).not.toHaveBeenCalled();
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible();

    fireEvent.change(screen.getByLabelText('E-mail'), {target: {value: 'carla@example.com'}});
    await user.click(screen.getByRole('button', {name: 'Cadastrar Monitor'}));

    expect(actions.createMonitor).toHaveBeenCalledWith({
      name: 'Carla Monitor',
      phone: '(41) 99999-8888',
      email: 'carla@example.com',
      photoDataUrl: undefined,
    });
  });

  it('avisa antes de sair do formulário de monitor com alterações não salvas', async () => {
    const user = userEvent.setup();

    renderPanel();

    await openConstructionMonitors(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Monitor'}));
    await user.type(screen.getByLabelText('Nome do Monitor'), 'Monitor sem salvar');

    await user.click(screen.getByRole('button', {name: 'Voltar'}));

    await expectUnsavedChangesDialog(user);
    expect(screen.getByRole('heading', {name: 'Cadastrar Monitor'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await confirmUnsavedChangesExit(user);

    expect(screen.getByRole('heading', {name: /Monitores - CC2603/i, hidden: true})).toBeInTheDocument();
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('trunca comunidade longa no resumo lateral do formulário de monitor', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    const longCommunityName = 'M'.repeat(30);
    constructionSite.communities[0].name = longCommunityName;

    renderPanel({constructionSite});

    await openConstructionMonitors(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Monitor'}));

    const sidebarCommunity = within(screen.getByTestId('monitor-form'))
      .getByTestId('construction-sidebar-community');

    expect(sidebarCommunity).toHaveTextContent(longCommunityName);
    expect(sidebarCommunity).toHaveAttribute('title', longCommunityName);
    expect(sidebarCommunity).toHaveClass('block', 'max-w-full', 'truncate');
  });

  it('edita monitor existente sem criar duplicidade', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionMonitors(user);
    await user.click(screen.getByRole('row', {name: /Ana Monitoria.*Ativo/i}));

    expect(screen.getByRole('heading', {name: 'Editar Monitor'})).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('CC2603')).toBeVisible();
    expect(within(screen.getByTestId('monitor-form')).getByText('Tiradentes')).toBeVisible();
    expect(screen.getByAltText('Foto do Monitor')).toHaveAttribute('src', VALID_PNG_DATA_URL);

    fireEvent.change(screen.getByLabelText('Nome do Monitor'), {target: {value: 'Ana Monitoria Atualizada'}});
    await user.click(screen.getByRole('button', {name: 'Salvar Monitor'}));

    expect(actions.createMonitor).not.toHaveBeenCalled();
    expect(actions.updateMonitor).toHaveBeenCalledWith('monitor_1', {
      name: 'Ana Monitoria Atualizada',
      phone: '(11) 99999-0000',
      email: 'ana@example.com',
      photoDataUrl: VALID_PNG_DATA_URL,
    });
  });

  it('cria casa sem campo de tipo e sem ações de duplicar ou arquivar', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', '');
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    expect(screen.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    expect(screen.getByText('CC2603')).toBeVisible();
    expect(screen.getByText('Tiradentes')).toBeVisible();
    expect(screen.getByText('11/05/2026')).toBeVisible();
    expect(screen.getByTestId('construction-management-shell').className).toContain('overflow-x-hidden');
    expect(screen.getByRole('img', {name: 'Foto da construção CC2603'})).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Detalhes da Família'})).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Sobre a Casa'})).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Restrições Locais'})).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Características do Local'})).toBeVisible();
    expect(screen.getByTestId('house-configuration-form').className).toContain('sm:grid-cols-[220px_minmax(0,1fr)]');
    expect(screen.getByTestId('house-configuration-form').className).not.toContain('lg:grid-cols-[220px_minmax(0,1fr)]');
    expect(screen.queryByLabelText('Tipo da casa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Voltar às casas'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Duplicar'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Arquivar'})).not.toBeInTheDocument();
    expect(screen.getByTestId('family-photo-field').className).toContain('w-full');
    expect(within(screen.getByTestId('family-photo-field'))
      .getByRole('button', {name: 'Foto da Família'})).toHaveClass('h-36');
    expect(screen.getByText('Clique para fazer upload ou arraste uma foto')).toBeVisible();
    expect(screen.getByTestId('family-identity-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByPlaceholderText('ex: Tadeu e Odete')).toBeVisible();
    expect(screen.getByPlaceholderText('Nome completo')).toBeVisible();
    expect(screen.getByPlaceholderText('(41) 00000-0000')).toBeVisible();
    expect(screen.getByPlaceholderText('contato@dominio.com')).toBeVisible();
    const familySection = screen.getByRole('heading', {name: 'Detalhes da Família'}).closest('section') as HTMLElement;
    const aboutHouseSection = screen.getByRole('heading', {name: 'Sobre a Casa'}).closest('section') as HTMLElement;
    const localRestrictionsSection = screen.getByRole('heading', {name: 'Restrições Locais'}).closest('section') as HTMLElement;
    expect(familySection.compareDocumentPosition(aboutHouseSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(aboutHouseSection.compareDocumentPosition(localRestrictionsSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(familySection).queryByLabelText('Notas')).not.toBeInTheDocument();
    expect(screen.getByTestId('about-house-grid').className).toContain('md:grid-cols-2');
    expect(within(aboutHouseSection).getByLabelText('Tamanho da Casa').textContent?.trim()).toBe('');
    expect(within(aboutHouseSection).getByLabelText('Líderes')).toBeVisible();
    expect(within(aboutHouseSection).getByLabelText('Notas')).toBeVisible();
    expect(screen.getByPlaceholderText('Nomes dos líderes da casa')).toBeVisible();
    expect(screen.getByPlaceholderText('Observações da casa, implantação, acessibilidade ou decisões combinadas com a família...')).toBeVisible();
    expect(screen.getByTestId('local-restrictions-grid').className)
      .toContain('md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]');
    expect(screen.getByText('Perfil do Solo')).toBeVisible();
    expect(screen.getByText('Obstáculos no Local')).toBeVisible();
    expect(screen.getByText('Canos ou fossas')).toBeVisible();
    expect(screen.getByText('Raízes ou caliças (entulhos ou concreto)')).toBeVisible();
    expect(screen.getByText('Árvores, galhos ou fios de tensão')).toBeVisible();
    expect(screen.getByText('Recuo rígido de limite (esquadro apertado)')).toBeVisible();
    expect(screen.getByTestId('site-characteristics-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByTestId('location-geography-row'))
      .toHaveClass('gap-4', 'md:grid-cols-2', 'md:items-start');
    expect(screen.getByPlaceholderText('Carregar a partir de coordenadas')).toBeVisible();
    expect(screen.getByRole('button', {name: 'Usar localização atual'})).toHaveClass('w-full');
    expect(screen.getByRole('button', {name: 'Usar localização atual'})).toHaveClass('md:mt-[1.45rem]');
    expect(screen.getByRole('button', {name: 'Usar localização atual'})).not.toHaveClass('sm:w-auto');
    expect(screen.getByTestId('static-map-wrapper').className).toContain('md:col-span-2');
    expect(screen.getByTestId('static-map-preview')).toBeVisible();
    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByTestId('site-actions-grid')).toHaveClass('grid', 'gap-4', 'md:col-span-2', 'md:grid-cols-2');
    expect(screen.queryByLabelText('Complexidade do Terreno')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('site-actions-grid')).getByRole('button', {name: 'Salvar Configurações'}))
      .toHaveClass('w-full', 'md:col-start-2');

    const section = screen.getByRole('heading', {name: 'Detalhes da Família'}).closest('section');
    expect(section?.className).not.toContain('border');
    expect(section?.className).not.toContain('shadow');

    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Nova'}});
    fireEvent.change(screen.getByLabelText('Contato Principal'), {target: {value: 'Maria'}});
    fireEvent.change(screen.getByLabelText('Telefone'), {target: {value: '(11) 99999-0000'}});
    fireEvent.change(screen.getByLabelText('E-mail'), {target: {value: 'maria@example.com'}});
    await chooseVisualOption(user, 'Tamanho da Casa', 'Grande');
    fireEvent.change(screen.getByLabelText('Líderes'), {target: {value: 'Ana e Bruno'}});
    fireEvent.change(screen.getByLabelText('Notas'), {target: {value: 'Casa precisa ficar próxima ao acesso lateral.'}});
    const stableSoilOption = screen.getByRole('radio', {name: /Terreno Estável \/ Argiloso/i});
    const alluvialSoilOption = screen.getByRole('radio', {name: /Solo Molhado/i});
    const elevatedObstaclesOption = screen.getByLabelText('Obstáculos Elevados');
    expect(stableSoilOption.closest('label')?.querySelector('svg')).toHaveClass('lucide-layers');
    expect(alluvialSoilOption.closest('label')?.className).toContain('focus-within:ring-inset');
    expect(alluvialSoilOption.closest('label')?.className).toContain('relative');
    expect(alluvialSoilOption).toHaveClass('absolute', 'inset-0', 'opacity-0');
    expect(alluvialSoilOption).not.toHaveClass('sr-only');
    expect(elevatedObstaclesOption.closest('label')?.className).toContain('focus-within:ring-inset');
    expect(elevatedObstaclesOption.closest('label')?.className).toContain('relative');
    expect(elevatedObstaclesOption).toHaveClass('absolute', 'inset-0', 'opacity-0');
    expect(elevatedObstaclesOption).not.toHaveClass('sr-only');
    fireEvent.click(alluvialSoilOption);
    fireEvent.click(elevatedObstaclesOption);
    fireEvent.change(screen.getByLabelText('Localização Geográfica'), {target: {value: '-25.4284, -49.2733'}});
    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByText('Configure a chave do Google Maps')).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.createHouse).toHaveBeenCalledWith(expect.not.objectContaining({houseType: expect.anything()}));
    expect(actions.createHouse).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'Família Nova',
      primaryContactName: 'Maria',
      primaryContactPhone: '(11) 99999-0000',
      primaryContactEmail: 'maria@example.com',
      houseSize: 'large',
      leaders: 'Ana e Bruno',
      notes: 'Casa precisa ficar próxima ao acesso lateral.',
      siteAssessment: expect.objectContaining({
        soilProfile: 'alluvial',
        hasElevatedObstacles: true,
        locationQuery: '-25.4284, -49.2733',
      }),
    }));
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('valida campos obrigatórios, máscara e formatos da configuração de casa', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    expect(screen.getByLabelText('Nome da Família')).toHaveAttribute('maxlength', '25');
    expect(screen.getByLabelText('Contato Principal')).toHaveAttribute('maxlength', '25');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('maxlength', '50');
    expect(screen.getByLabelText('Líderes')).toHaveAttribute('maxlength', '50');
    expect(screen.getByLabelText('Notas')).toHaveAttribute('maxlength', '300');

    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.createHouse).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o nome da família.')).toBeVisible();
    expect(screen.getByText('Informe o contato principal.')).toBeVisible();

    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Validação'}});
    fireEvent.change(screen.getByLabelText('Contato Principal'), {target: {value: 'Joana'}});
    fireEvent.change(screen.getByLabelText('Telefone'), {target: {value: 'abc41999998888xyz'}});
    fireEvent.change(screen.getByLabelText('E-mail'), {target: {value: 'email inválido'}});
    fireEvent.change(screen.getByLabelText('Localização Geográfica'), {target: {value: '1000, 2000'}});
    fireEvent.change(screen.getByLabelText('Líderes'), {target: {value: 'L'.repeat(51)}});
    fireEvent.change(screen.getByLabelText('Notas'), {target: {value: 'N'.repeat(301)}});

    expect(screen.getByLabelText('Telefone')).toHaveValue('(41) 99999-8888');

    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.createHouse).not.toHaveBeenCalled();
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible();
    expect(screen.getByText('Use latitude e longitude, por exemplo: -25.4284, -49.2733.')).toBeVisible();
    expect(screen.getByText('Máximo de 50 caracteres.')).toBeVisible();
    expect(screen.getByText('Máximo de 300 caracteres.')).toBeVisible();
  });

  it('avisa antes de sair do formulário de casa com alterações não salvas', async () => {
    const user = userEvent.setup();

    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));
    await user.type(screen.getByLabelText('Nome da Família'), 'Família sem salvar');

    await user.click(screen.getByRole('button', {name: 'Voltar'}));

    await expectUnsavedChangesDialog(user);
    expect(screen.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await confirmUnsavedChangesExit(user);

    expect(screen.getByRole('heading', {name: /Casas - CC2603/i, hidden: true})).toBeInTheDocument();
  }, SLOW_UI_TEST_TIMEOUT_MS);

  it('carrega Google Maps por coordenadas quando a chave está configurada', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', 'test-key');
    const user = userEvent.setup();

    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    fireEvent.change(screen.getByLabelText('Localização Geográfica'), {target: {value: '-25.4284, -49.2733'}});

    const iframe = screen.getByTestId('google-maps-embed');
    expect(iframe).toHaveAttribute('title', 'Mapa do local informado');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveAttribute('allowfullscreen', '');
    expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.google.com/maps/embed/v1/place?key=test-key&q=-25.4284%2C-49.2733&zoom=17',
    );

    fireEvent.change(screen.getByLabelText('Localização Geográfica'), {target: {value: 'Rua A, 123'}});

    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByText('Coordenadas inválidas')).toBeVisible();
  });

  it('carrega o mapa com Enter no campo de coordenadas sem salvar configurações', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', 'test-key');
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Enter'}});
    fireEvent.change(screen.getByLabelText('Contato Principal'), {target: {value: 'Maria'}});

    await user.type(screen.getByLabelText('Localização Geográfica'), '-25.4284, -49.2733{Enter}');

    expect(screen.getByTestId('google-maps-embed')).toHaveAttribute(
      'src',
      'https://www.google.com/maps/embed/v1/place?key=test-key&q=-25.4284%2C-49.2733&zoom=17',
    );
    expect(actions.createHouse).not.toHaveBeenCalled();
  });

  it('usa a localização atual do navegador para preencher coordenadas e atualizar o Google Maps', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', 'test-key');
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((
      success: PositionCallback,
      _error?: PositionErrorCallback | null,
      _options?: PositionOptions,
    ) => {
      success(createGeolocationPosition(-25.4284123, -49.2733123));
    });
    mockNavigatorGeolocation({getCurrentPosition});

    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));
    await user.click(screen.getByRole('button', {name: 'Usar localização atual'}));

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
    expect(screen.getByLabelText('Localização Geográfica')).toHaveValue('-25.428412, -49.273312');
    expect(screen.getByRole('status')).toHaveTextContent('Localização atual aplicada ao mapa.');
    expect(screen.getByTestId('google-maps-embed')).toHaveAttribute(
      'src',
      'https://www.google.com/maps/embed/v1/place?key=test-key&q=-25.428412%2C-49.273312&zoom=17',
    );
  });

  it('mantém fallback do mapa quando a localização atual é aplicada sem chave do Google Maps', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', '');
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success(createGeolocationPosition(-25.4284, -49.2733));
    });
    mockNavigatorGeolocation({getCurrentPosition});

    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));
    await user.click(screen.getByRole('button', {name: 'Usar localização atual'}));

    expect(screen.getByLabelText('Localização Geográfica')).toHaveValue('-25.428400, -49.273300');
    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByText('Configure a chave do Google Maps')).toBeVisible();
  });

  it('exibe feedback quando a localização atual não está disponível ou é negada', async () => {
    const user = userEvent.setup();

    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));
    await user.click(screen.getByRole('button', {name: 'Usar localização atual'}));

    expect(screen.getByRole('alert'))
      .toHaveTextContent('Localização do navegador indisponível neste dispositivo.');
    expect(screen.getByLabelText('Localização Geográfica')).toHaveValue('');

    const getCurrentPosition = vi.fn((
      _success: PositionCallback,
      error?: PositionErrorCallback | null,
    ) => {
      error?.(createGeolocationError(1, 'User denied Geolocation'));
    });
    mockNavigatorGeolocation({getCurrentPosition});

    await user.click(screen.getByRole('button', {name: 'Usar localização atual'}));

    expect(screen.getByRole('alert'))
      .toHaveTextContent('Permita o acesso à localização do navegador para usar a posição atual.');
    expect(screen.getByLabelText('Localização Geográfica')).toHaveValue('');
  });

  it('mantém foto existente ao clicar no overlay e só remove pelo X', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Rascunho/i}));

    const photoField = screen.getByTestId('family-photo-field');
    const photoDropZone = within(photoField).getByRole('button', {name: 'Foto da Família'});
    const originalPhoto = screen.getByAltText('Foto da Família');

    expect(photoDropZone).toHaveClass('h-72');
    expect(originalPhoto).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full', 'object-cover', 'object-center');
    expect(originalPhoto.className).not.toContain('min-h');
    Object.defineProperty(originalPhoto, 'naturalWidth', {configurable: true, value: 1600});
    Object.defineProperty(originalPhoto, 'naturalHeight', {configurable: true, value: 900});
    fireEvent.load(originalPhoto);
    expect(photoDropZone).toHaveAttribute('data-photo-orientation', 'landscape');
    expect(originalPhoto).toHaveAttribute('src', VALID_JPEG_DATA_URL);

    const fileInput = within(photoField).getByLabelText('Foto da Família arquivo') as HTMLInputElement;
    const clickFileInput = vi.spyOn(fileInput, 'click');

    await user.click(within(photoField).getByText('Clique para fazer upload ou arraste uma foto'));

    expect(clickFileInput).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', VALID_JPEG_DATA_URL);

    fireEvent.change(fileInput, {target: {files: []}});

    expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', VALID_JPEG_DATA_URL);

    await user.upload(fileInput, new File([VALID_PNG_BYTES], 'familia.png', {type: 'image/png'}));

    await waitFor(() => {
      expect(screen.getByAltText('Foto da Família')).not.toHaveAttribute('src', VALID_JPEG_DATA_URL);
    });
    expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/));

    fireEvent.click(screen.getByRole('button', {name: 'Remover Foto da Família'}));

    await waitFor(() => {
      expect(screen.queryByAltText('Foto da Família')).not.toBeInTheDocument();
    });
  });

  it('edita casa pela linha inteira sem sobrescrever o tipo existente', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Rascunho/i}));

    expect(actions.activateHouse).toHaveBeenCalledWith('construction_site_1', 'house_1');
    expect(await screen.findByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    expect(screen.getByLabelText('Nome da Família')).toHaveValue('Família Souza');
    expect(screen.getByLabelText('Tamanho da Casa')).toHaveTextContent('Pequena');
    expect(screen.getByLabelText('Líderes')).toHaveValue('Ana e Bruno');
    expect(screen.getByLabelText('Notas')).toHaveValue('Nota persistida da casa');
    expect(screen.getByAltText('Foto da Família')).toHaveClass('absolute', 'object-cover', 'object-center');
    expect(screen.getByAltText('Foto da Família').className).not.toContain('min-h');
    expect(screen.getByRole('button', {name: 'Remover Foto da Família'})).toBeVisible();
    expect(within(screen.getByTestId('family-photo-field'))
      .getByText('Clique para fazer upload ou arraste uma foto')).toBeVisible();
    expect(screen.queryByLabelText('Tipo da casa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Remover Foto da Família'}));
    expect(screen.queryByAltText('Foto da Família')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Souza Atualizada'}});
    await chooseVisualOption(user, 'Tamanho da Casa', 'Grande');
    fireEvent.change(screen.getByLabelText('Líderes'), {target: {value: 'Carla e João'}});
    fireEvent.change(screen.getByLabelText('Notas'), {target: {value: 'Atualizar implantação nos fundos.'}});
    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.updateActiveHouseConfiguration).toHaveBeenCalledWith(expect.not.objectContaining({houseType: expect.anything()}));
    expect(actions.updateActiveHouseConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'Família Souza Atualizada',
      familyPhotoDataUrl: undefined,
      houseSize: 'large',
      leaders: 'Carla e João',
      notes: 'Atualizar implantação nos fundos.',
      siteAssessment: expect.not.objectContaining({terrainComplexity: expect.anything()}),
    }));
  });

  it('não renderiza seletor manual de complexidade do terreno', async () => {
    const user = userEvent.setup();
    renderPanel();

    await openConstructionHouses(user);
    await user.click(screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Rascunho/i}));

    expect(screen.queryByLabelText('Complexidade do Terreno')).not.toBeInTheDocument();
  });

  it('abre e salva materiais extras a partir da listagem de casas', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    const housesTable = screen.getByTestId('house-desktop-table');
    await user.click(within(housesTable).getByRole('button', {name: 'Abrir materiais extras da casa Família Souza'}));

    expect(actions.activateHouse).toHaveBeenCalledWith('construction_site_1', 'house_1');
    expect(await screen.findByRole('heading', {name: 'Materiais Extras', level: 1})).toBeVisible();
    expect(screen.getAllByRole('heading', {name: 'Materiais Extras'})).toHaveLength(1);
    expect(screen.getByTestId('house-extra-materials-form')).toBeVisible();
    expect(within(screen.getByTestId('house-extra-materials-form')).queryByText('01')).not.toBeInTheDocument();
    expect(screen.getByRole('img', {name: 'Foto da família Família Souza'})).toBeVisible();
    expect(screen.getByText('Família Souza')).toBeVisible();
    expect(screen.getByText('Ana e Bruno')).toBeVisible();
    expect(screen.getByLabelText('Vigas de Piso')).toHaveValue('12');
    expect(screen.getByLabelText('Caibros')).toHaveValue('24');
    expect(screen.getByLabelText('Vigas Secundárias')).toHaveValue('8');
    expect(screen.getByLabelText('Mata-juntas')).toHaveValue('4');

    fireEvent.change(screen.getByLabelText('Vigas de Piso'), {target: {value: '15a'}});
    fireEvent.change(screen.getByLabelText('Mata-juntas'), {target: {value: '2.5'}});
    expect(screen.getByLabelText('Vigas de Piso')).toHaveValue('15');
    expect(screen.getByLabelText('Mata-juntas')).toHaveValue('4');
    fireEvent.change(screen.getByLabelText('Outros / Justificativa'), {
      target: {value: 'Reforço revisado com a monitoria.'},
    });
    await user.click(screen.getByRole('button', {name: 'Salvar Materiais Extras'}));

    expect(actions.updateActiveHouseExtraMaterials).toHaveBeenCalledWith({
      floorBeams: 15,
      rafters: 24,
      secondaryBeams: 8,
      gutters: 4,
      justification: 'Reforço revisado com a monitoria.',
    });
  });

  it('avisa antes de sair do formulário de materiais extras com alterações não salvas', async () => {
    const user = userEvent.setup();

    renderPanel();

    await openConstructionHouses(user);
    await user.click(within(screen.getByTestId('house-desktop-table'))
      .getByRole('button', {name: 'Abrir materiais extras da casa Família Souza'}));
    await user.clear(screen.getByLabelText('Vigas de Piso'));
    await user.type(screen.getByLabelText('Vigas de Piso'), '20');

    await user.click(screen.getByRole('button', {name: 'Voltar'}));

    await expectUnsavedChangesDialog(user);
    expect(screen.getByRole('heading', {name: 'Materiais Extras', level: 1})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await confirmUnsavedChangesExit(user);

    expect(screen.getByRole('heading', {name: /Casas - CC2603/i, hidden: true})).toBeInTheDocument();
  });

  it('trunca família e líderes longos no resumo lateral de materiais extras', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    const longFamilyName = 'M'.repeat(25);
    const longLeaders = 'L'.repeat(50);
    constructionSite.families[0].name = longFamilyName;
    constructionSite.houses[0].leaders = longLeaders;

    renderPanel({constructionSite});

    await openConstructionHouses(user);
    await user.click(within(screen.getByTestId('house-desktop-table'))
      .getByRole('button', {name: `Abrir materiais extras da casa ${longFamilyName}`}));

    expect(await screen.findByRole('heading', {name: 'Materiais Extras', level: 1})).toBeVisible();
    const form = screen.getByTestId('house-extra-materials-form');
    const family = within(form).getByTestId('house-extra-materials-sidebar-family');
    const leaders = within(form).getByTestId('house-extra-materials-sidebar-leaders');

    expect(family).toHaveTextContent(longFamilyName);
    expect(family).toHaveAttribute('title', longFamilyName);
    expect(family).toHaveClass('block', 'max-w-full', 'truncate');
    expect(family.closest('dd')).toHaveClass('min-w-0');
    expect(leaders).toHaveTextContent(longLeaders);
    expect(leaders).toHaveAttribute('title', longLeaders);
    expect(leaders).toHaveClass('block', 'max-w-full', 'truncate');
    expect(leaders.closest('dd')).toHaveClass('min-w-0');
  });

  it('não abre edição ao clicar em casa arquivada na listagem', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('row', {name: /Família Arquivada.*Tipo 6.*Arquivada/i}));

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(actions.updateActiveHouseConfiguration).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', {name: 'Casas - CC2603 · Tiradentes', hidden: true}))
      .toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Configuração da Casa'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Abrir materiais extras da casa Família Arquivada'}))
      .not.toBeInTheDocument();
  });

  it('arquiva casa diretamente da listagem com confirmação sem abrir a edição', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    const archiveHouseButton = within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Arquivar casa Família Souza'});

    expect(archiveHouseButton.querySelector('.lucide-archive')).toBeTruthy();
    expect(archiveHouseButton.querySelector('.lucide-trash-2')).toBeNull();

    await user.click(archiveHouseButton);

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(screen.getByText('Casas - CC2603 · Tiradentes')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Arquivar casa?'})).toBeVisible();
    expect(screen.getByText(/A casa de Família Souza será arquivada/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Arquivar casa'}));

    expect(actions.archiveHouse).toHaveBeenCalledWith('house_1');
  });

  it('marca casa como construída pela listagem com confirmação', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Marcar casa Família Souza como construída'}));

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Marcar casa como construída?'})).toBeVisible();
    expect(screen.getByText(/ficará bloqueada para edição no Canvas/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Marcar como construída'}));

    expect(actions.markHouseBuilt).toHaveBeenCalledWith('house_1');
  });

  it('retorna casa construída para rascunho pela listagem com confirmação', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    const constructionSite = createConstructionSite();
    constructionSite.houses[0].status = 'built';

    renderPanel({actions, constructionSite});

    await openConstructionHouses(user);
    await user.click(within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Voltar casa Família Souza para rascunho'}));

    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Voltar casa para rascunho?'})).toBeVisible();
    expect(screen.getByText(/voltará a permitir edição no Canvas/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Voltar para rascunho'}));

    expect(actions.markHouseDraft).toHaveBeenCalledWith('house_1');
  });

  it('arquiva e desarquiva construções pela listagem sem abrir a edição', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(within(screen.getByTestId('construction-mobile-list'))
      .getByRole('button', {name: 'Arquivar construção CC2603'}));

    expect(actions.activateConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByText(/A construção CC2603 será arquivada/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Arquivar construção'}));

    expect(actions.archiveConstructionSite).toHaveBeenCalledWith('construction_site_1');

    await user.click(within(screen.getByTestId('construction-mobile-list'))
      .getByRole('button', {name: 'Desarquivar construção CC2605'}));
    await user.click(screen.getByRole('button', {name: 'Desarquivar construção'}));

    expect(actions.unarchiveConstructionSite).toHaveBeenCalledWith('construction_site_3');
  });

  it('desarquiva casa diretamente da listagem com confirmação', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await openConstructionHouses(user);
    await user.click(within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Desarquivar casa Família Arquivada'}));

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByText(/A casa de Família Arquivada voltará/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Desarquivar casa'}));

    expect(actions.unarchiveHouse).toHaveBeenCalledWith('house_3');
  });

  it('bloqueia configuração e materiais extras quando a casa está construída', async () => {
    const user = userEvent.setup();
    const constructionSite = createConstructionSite();
    constructionSite.houses[0].status = 'built';

    renderPanel({constructionSite});

    await openConstructionHouses(user);
    await user.click(screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Construída/i}));

    expect(await screen.findByLabelText('Nome da Família')).toBeDisabled();
    expect(screen.getByLabelText('Telefone')).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Salvar Configurações'})).toBeDisabled();

    await user.click(screen.getByRole('button', {name: 'Voltar'}));
    await user.click(within(screen.getByTestId('house-desktop-table'))
      .getByRole('button', {name: 'Abrir materiais extras da casa Família Souza'}));

    expect(await screen.findByLabelText('Vigas de Piso')).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Salvar Materiais Extras'})).toBeDisabled();
  });

  it('não abre formulário de construção arquivada pela listagem', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    const constructionSite = createConstructionSite();
    const summaries = createSummaries();
    constructionSite.constructionSite.status = 'archived';
    summaries[0] = {...summaries[0], status: 'archived'};

    renderPanel({actions, constructionSite, summaries});

    await user.click(screen.getByRole('row', {name: /CC2603.*Arquivada/i}));

    expect(actions.activateConstructionSite).not.toHaveBeenCalled();
    expect(actions.updateActiveConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Editar Construção TETO'})).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Código da CC')).not.toBeInTheDocument();
  });

  it('mostra apenas a ação de desarquivar para construção arquivada', async () => {
    const user = userEvent.setup();
    const actions = createActions();
    const constructionSite = createConstructionSite();
    const summaries = createSummaries();
    constructionSite.constructionSite.status = 'archived';
    summaries[0] = {...summaries[0], status: 'archived'};

    renderPanel({actions, constructionSite, summaries});

    const archivedRow = screen.getByRole('row', {name: /CC2603.*Arquivada/i});
    const archivedMobileCard = within(screen.getByTestId('construction-mobile-list'))
      .getByText('CC2603')
      .closest('[data-testid="construction-mobile-card"]');

    expect(within(archivedRow).getByRole('button', {name: 'Desarquivar construção CC2603'})).toBeVisible();
    expect(within(archivedRow).queryByRole('button', {name: 'Gerenciar casas da construção CC2603'}))
      .not.toBeInTheDocument();
    expect(within(archivedRow).queryByRole('button', {name: 'Gerenciar monitores da construção CC2603'}))
      .not.toBeInTheDocument();
    expect(archivedMobileCard).not.toHaveAttribute('role', 'button');
    expect(within(archivedMobileCard as HTMLElement).getByRole('button', {name: 'Desarquivar construção CC2603'}))
      .toBeVisible();
    expect(within(archivedMobileCard as HTMLElement).queryByRole('button', {name: 'Gerenciar casas da construção CC2603'}))
      .not.toBeInTheDocument();
    expect(within(archivedMobileCard as HTMLElement).queryByRole('button', {name: 'Gerenciar monitores da construção CC2603'}))
      .not.toBeInTheDocument();

    await user.click(archivedRow);

    expect(actions.activateConstructionSite).not.toHaveBeenCalled();
    expect(actions.archiveHouse).not.toHaveBeenCalled();
    expect(actions.unarchiveHouse).not.toHaveBeenCalled();
    expect(actions.markHouseBuilt).not.toHaveBeenCalled();
    expect(actions.inactivateMonitor).not.toHaveBeenCalled();
  });

  it('não mostra retorno ao Canvas quando todas as casas estão arquivadas', () => {
    const onBackToCanvas = vi.fn();
    const constructionSite = createConstructionSite();
    constructionSite.constructionSite.activeHouseId = 'house_1';
    constructionSite.houses = constructionSite.houses.map((house) => ({
      ...house,
      status: 'archived',
    }));

    renderPanel({constructionSite, canOpenRacEditor: false, onBackToCanvas});

    expect(screen.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Voltar'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Família Souza'})).not.toBeInTheDocument();
    expect(onBackToCanvas).not.toHaveBeenCalled();
  });

  it('não mostra retorno ao Canvas quando todas as construções estão arquivadas', () => {
    const onBackToCanvas = vi.fn();
    const summaries = createSummaries().map((summary) => ({
      ...summary,
      status: 'archived' as const,
    }));

    renderPanel({constructionSite: null, summaries, canOpenRacEditor: false, onBackToCanvas});

    expect(screen.getByRole('heading', {name: 'Construções TETO'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Voltar'})).not.toBeInTheDocument();
    expect(screen.getAllByText('Arquivada')).toHaveLength(6);
    expect(onBackToCanvas).not.toHaveBeenCalled();
  });

  it('a seta da tela raiz volta ao Canvas apenas quando há casa válida', async () => {
    const user = userEvent.setup();
    const onBackToCanvas = vi.fn();

    renderPanel({canOpenRacEditor: true, onBackToCanvas});

    expect(screen.getByRole('button', {name: 'Voltar'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-construction-back-to-canvas');

    await user.click(screen.getByRole('button', {name: 'Voltar'}));

    expect(onBackToCanvas).toHaveBeenCalledTimes(1);
  });
});

async function chooseVisualOption(
  user: ReturnType<typeof userEvent.setup>,
  ariaLabel: string,
  optionName: string,
) {
  await user.click(screen.getByLabelText(ariaLabel));

  const menu = await screen.findByTestId(`${ariaLabel}-menu`);
  await user.click(within(menu).getByRole('menuitemradio', {name: optionName}));
}

async function expectUnsavedChangesDialog(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await screen.findByRole('alertdialog');

  expect(dialog).toHaveClass('w-[calc(100vw-2rem)]', 'max-w-md');
  expect(within(dialog).getByTestId('unsaved-changes-icon-badge'))
    .toHaveClass('inline-flex', 'items-center', 'justify-center', 'leading-none');
  expect(within(dialog).getByTestId('unsaved-changes-icon'))
    .toHaveClass('block', '-translate-y-px');
  expect(within(dialog).getByRole('heading', {name: 'Sair sem salvar?'})).toBeVisible();
  expect(within(dialog).getByText(/sem salvar as alterações atuais/i)).toBeVisible();
  expect(within(dialog).getByRole('button', {name: 'Sair sem salvar'})).toBeVisible();

  await user.click(within(dialog).getByRole('button', {name: 'Continuar editando'}));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
}

async function confirmUnsavedChangesExit(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await screen.findByRole('alertdialog');

  await user.click(within(dialog).getByRole('button', {name: 'Sair sem salvar'}));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
}

async function openConstructionHouses(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(screen.getByRole('row', {name: /CC2603.*Em andamento/i}))
    .getByRole('button', {name: 'Gerenciar casas da construção CC2603'}));
}

async function openConstructionMonitors(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(screen.getByRole('row', {name: /CC2603.*Em andamento/i}))
    .getByRole('button', {name: 'Gerenciar monitores da construção CC2603'}));
}

function renderPanel(input: {
  constructionSite?: ConstructionSiteState | null;
  summaries?: ConstructionSiteSummary[];
  actions?: ReturnType<typeof createActions>;
  canOpenRacEditor?: boolean;
  onBackToCanvas?: () => void;
} = {}) {
  render(
    <TooltipProvider delayDuration={0}>
      <ConstructionSiteManagementPanel
        constructionSite={'constructionSite' in input ? input.constructionSite ?? null : createConstructionSite()}
        summaries={input.summaries ?? createSummaries()}
        canOpenRacEditor={input.canOpenRacEditor}
        onBackToCanvas={input.onBackToCanvas}
        actions={(input.actions ?? createActions()) as never}
      />
    </TooltipProvider>,
  );
}

function listenGuidedTourEvent(eventName: string) {
  const listener = vi.fn();
  const eventListener = (event: Event) => listener(event);

  document.addEventListener(eventName, eventListener);

  return {
    listener,
    cleanup: () => document.removeEventListener(eventName, eventListener),
  };
}

function getGuidedTourEventTargetIds(listener: ReturnType<typeof vi.fn>): string[] {
  const event = listener.mock.calls.at(-1)?.[0] as CustomEvent<{targets?: Record<string, unknown>}> | undefined;
  return Object.keys(event?.detail.targets ?? {});
}

function markGuidedTourSegmentCompleted(persistKey: string, storageRevision: string): void {
  localStorage.setItem(persistKey, 'true');
  localStorage.setItem(`${persistKey}:revision`, storageRevision);
}

function stubGuidedTourTargetRects(): void {
  Array.from(document.querySelectorAll<HTMLElement>('[data-guided-tour-id]')).forEach((element, index) => {
    Object.defineProperty(element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 80 + (index * 44),
        top: 64 + (index * 8),
        width: 36,
        height: 36,
        right: 116 + (index * 44),
        bottom: 100 + (index * 8),
        x: 80 + (index * 44),
        y: 64 + (index * 8),
        toJSON: () => ({}),
      } as DOMRect),
    });
  });
}

function createActions() {
  return {
    createConstructionSite: vi.fn().mockResolvedValue(undefined),
    updateActiveConstructionSite: vi.fn(),
    archiveActiveConstructionSite: vi.fn(),
    archiveConstructionSite: vi.fn().mockResolvedValue(undefined),
    unarchiveConstructionSite: vi.fn().mockResolvedValue(undefined),
    activateConstructionSite: vi.fn().mockResolvedValue(null),
    createMonitor: vi.fn(),
    updateMonitor: vi.fn(),
    inactivateMonitor: vi.fn(),
    reactivateMonitor: vi.fn(),
    createHouse: vi.fn().mockResolvedValue(undefined),
    duplicateActiveHouse: vi.fn().mockResolvedValue(undefined),
    archiveActiveHouse: vi.fn().mockResolvedValue(undefined),
    archiveHouse: vi.fn().mockResolvedValue(undefined),
    unarchiveHouse: vi.fn().mockResolvedValue(undefined),
    exportConstructionRacsZip: vi.fn().mockResolvedValue(undefined),
    markHouseBuilt: vi.fn().mockResolvedValue(undefined),
    markHouseDraft: vi.fn().mockResolvedValue(undefined),
    activateHouse: vi.fn().mockResolvedValue(null),
    updateActiveFamily: vi.fn(),
    updateActiveHouseSiteAssessment: vi.fn(),
    updateActiveHouseConfiguration: vi.fn(),
    updateActiveHouseExtraMaterials: vi.fn(),
  };
}

function createSummaries(): ConstructionSiteSummary[] {
  return [
    {
      id: 'construction_site_1',
      label: 'CC2603 · Tiradentes',
      externalCode: 'CC2603',
      photoDataUrl: VALID_PNG_DATA_URL,
      constructionDate: '2026-05-11',
      communityName: 'Tiradentes',
      status: 'in_progress',
      activeHouseId: 'house_1',
      houseCount: 1,
      familyCount: 1,
      updatedAt: '2026-05-09T12:00:00.000Z',
    },
    {
      id: 'construction_site_2',
      label: 'CC2604 · Guarujá',
      externalCode: 'CC2604',
      constructionDate: '2026-05-10',
      communityName: 'Guarujá',
      status: 'in_progress',
      activeHouseId: 'house_2',
      houseCount: 1,
      familyCount: 1,
      updatedAt: '2026-05-08T18:30:00.000Z',
    },
    {
      id: 'construction_site_3',
      label: 'CC2605 · Paraisópolis',
      externalCode: 'CC2605',
      constructionDate: '2026-05-09',
      communityName: 'Paraisópolis',
      status: 'archived',
      activeHouseId: 'house_3',
      houseCount: 1,
      familyCount: 1,
      updatedAt: '2026-05-07T18:30:00.000Z',
    },
  ];
}

function createPaginatedSummaries(count: number): ConstructionSiteSummary[] {
  return Array.from({length: count}, (_, index) => {
    const pageNumber = index + 1;
    const date = new Date(Date.UTC(2026, 0, count - index, 12)).toISOString().slice(0, 10);
    const code = `CC${String(3000 + pageNumber).padStart(4, '0')}`;

    return {
      id: `construction_site_page_${pageNumber}`,
      label: `${code} · Comunidade ${pageNumber}`,
      externalCode: code,
      constructionDate: date,
      communityName: `Comunidade ${pageNumber}`,
      status: 'in_progress',
      activeHouseId: `house_page_${pageNumber}`,
      houseCount: 1,
      familyCount: 1,
      updatedAt: `${date}T12:00:00.000Z`,
    };
  });
}

function createConstructionSiteWithManyRecords({
  houseCount = 3,
  activeMonitorCount = 1,
}: {
  houseCount?: number;
  activeMonitorCount?: number;
}): ConstructionSiteState {
  const state = createConstructionSite();
  const now = '2026-05-09T12:00:00.000Z';

  state.families = Array.from({length: houseCount}, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      ...state.families[index % state.families.length],
      id: `family_page_${number}`,
      constructionSiteId: state.constructionSite.id,
      communityId: 'community_1',
      name: `Família ${number}`,
      primaryContactName: `Contato ${number}`,
      photoDataUrl: undefined,
    };
  });
  state.houses = Array.from({length: houseCount}, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      ...state.houses[index % state.houses.length],
      id: `house_page_${number}`,
      constructionSiteId: state.constructionSite.id,
      familyId: `family_page_${number}`,
      communityId: 'community_1',
      houseType: index % 2 === 0 ? 'tipo6' : 'tipo3',
      status: 'draft',
      createdAt: now,
      updatedAt: new Date(Date.UTC(2026, 0, houseCount - index, 12)).toISOString(),
    };
  });
  state.constructionSite.activeHouseId = 'house_page_01';
  state.monitors = Array.from({length: activeMonitorCount}, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      ...state.monitors[0],
      id: `monitor_page_${number}`,
      constructionSiteId: state.constructionSite.id,
      name: `Monitor ${number}`,
      phone: `(11) 99999-${String(index).padStart(4, '0')}`,
      email: index % 2 === 0 ? `monitor${number}@example.com` : undefined,
      photoDataUrl: undefined,
      status: 'active',
      createdAt: now,
      updatedAt: new Date(Date.UTC(2026, 0, activeMonitorCount - index, 12)).toISOString(),
    };
  });

  return state;
}

function mockNavigatorGeolocation(geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined) {
  Object.defineProperty(window.navigator, 'geolocation', {
    configurable: true,
    value: geolocation,
  });
}

function createGeolocationPosition(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: TEST_CURRENT_DATE.getTime(),
  } as GeolocationPosition;
}

function createGeolocationError(code: number, message: string): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

function createConstructionSite(): ConstructionSiteState {
  const now = '2026-05-09T12:00:00.000Z';

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC2603',
      photoDataUrl: VALID_PNG_DATA_URL,
      constructionDate: '2026-05-11',
      communityId: 'community_1',
      status: 'in_progress',
      activeHouseId: 'house_1',
      createdAt: now,
      updatedAt: now,
    },
    communities: [
      {
        id: 'community_1',
        name: 'Tiradentes',
      },
      {
        id: 'community_2',
        name: 'Heliópolis',
      },
    ],
    families: [
      {
        id: 'family_1',
        constructionSiteId: 'construction_site_1',
        communityId: 'community_1',
        name: 'Família Souza',
        primaryContactName: 'Maria',
        photoDataUrl: VALID_JPEG_DATA_URL,
      },
      {
        id: 'family_2',
        constructionSiteId: 'construction_site_1',
        communityId: 'community_2',
        name: 'Família Santos',
      },
      {
        id: 'family_3',
        constructionSiteId: 'construction_site_1',
        communityId: 'community_1',
        name: 'Família Arquivada',
      },
    ],
    monitors: [
      {
        id: 'monitor_1',
        constructionSiteId: 'construction_site_1',
        name: 'Ana Monitoria',
        phone: '(11) 99999-0000',
        email: 'ana@example.com',
        photoDataUrl: VALID_PNG_DATA_URL,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'monitor_2',
        constructionSiteId: 'construction_site_1',
        name: 'Bruno Inativo',
        phone: '(11) 98888-0000',
        status: 'inactive',
        createdAt: now,
        updatedAt: '2026-05-09T10:00:00.000Z',
      },
    ],
    houses: [
      {
        id: 'house_1',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_1',
        communityId: 'community_1',
        houseType: 'tipo6',
        terrainType: 1,
        status: 'draft',
        houseSize: 'small',
        leaders: 'Ana e Bruno',
        extraMaterials: {
          floorBeams: 12,
          rafters: 24,
          secondaryBeams: 8,
          gutters: 4,
          justification: 'Reforço inicial.',
        },
        designSettings: {
          selectedPilotiHeights: [1, 1.5, 2],
        },
        siteAssessment: {},
        pilotiLayout: {
          points: [],
        },
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {
            schemaVersion: 1,
            objects: [],
          },
        },
        notes: 'Nota persistida da casa',
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'house_2',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_2',
        communityId: 'community_2',
        houseType: 'tipo3',
        terrainType: 1,
        status: 'rac_printed',
        designSettings: {
          selectedPilotiHeights: [1, 1.5, 2],
        },
        siteAssessment: {},
        pilotiLayout: {
          points: [],
        },
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {
            schemaVersion: 1,
            objects: [],
          },
        },
        version: 1,
        createdAt: now,
        updatedAt: '2026-05-09T11:00:00.000Z',
      },
      {
        id: 'house_3',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_3',
        communityId: 'community_1',
        houseType: 'tipo6',
        terrainType: 1,
        status: 'archived',
        designSettings: {
          selectedPilotiHeights: [1, 1.5, 2],
        },
        siteAssessment: {},
        pilotiLayout: {
          points: [],
        },
        drawingDocument: {
          schemaVersion: 1,
          house: null,
          canvas: {
            schemaVersion: 1,
            objects: [],
          },
        },
        version: 1,
        createdAt: now,
        updatedAt: '2026-05-09T10:00:00.000Z',
      },
    ],
  } as ConstructionSiteState;
}
