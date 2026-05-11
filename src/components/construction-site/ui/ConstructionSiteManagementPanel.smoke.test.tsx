import {afterEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ConstructionSiteManagementPanel} from '@/components/construction-site/ui/ConstructionSiteManagementPanel.tsx';
import {getPhotoOrientation} from '@/components/construction-site/lib/photo-orientation.ts';
import type {ConstructionSiteState, ConstructionSiteSummary} from '@/shared/types/construction-site.ts';

describe('ConstructionSiteManagementPanel.tsx', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
    expect(screen.getAllByRole('button', {name: 'Arquivar construção CC2603'})).toHaveLength(2);
    expect(screen.getAllByRole('button', {name: 'Desarquivar construção CC2605'})).toHaveLength(2);

    const row = screen.getByRole('row', {name: /CC2603/i});
    expect(within(row).getByRole('img', {name: 'Foto da construção CC2603'})).toHaveAttribute('src', 'data:image/png;base64,site');
    expect(within(row).getByText('CC2603')).toBeVisible();
    expect(within(row).getByText('Tiradentes')).toBeVisible();
    expect(within(row).getByText('Em andamento')).toBeVisible();
    expect(within(row).getByText('Em andamento').closest('td')).toHaveClass('text-center');
    expect(within(row).getByText('11/05/2026').closest('td')).toHaveClass('text-center');
    expect(within(row).getByRole('button', {name: 'Arquivar construção CC2603'}).parentElement)
      .toHaveClass('grid-cols-[2.25rem_minmax(0,1fr)_2.25rem]');

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
    expect(screen.queryByRole('button', {name: 'Voltar à lista'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Gerenciar Casas'})).not.toBeInTheDocument();
    expect(screen.getByTestId('construction-photo-field')).toBeVisible();
    expect(screen.getByTestId('construction-form-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByLabelText('Data da Construção')).toBeVisible();

    fireEvent.change(screen.getByLabelText('Código da CC'), {target: {value: 'CC2605'}});
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
      externalCode: 'CC2605',
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

    expect(screen.getByLabelText('Comunidade')).toHaveAttribute('maxlength', '50');

    fireEvent.change(screen.getByLabelText('Código da CC'), {target: {value: 'CC26'}});
    fireEvent.change(screen.getByLabelText('Comunidade'), {target: {value: 'A'.repeat(51)}});
    await user.click(screen.getByRole('button', {name: 'Criar Construção'}));

    expect(actions.createConstructionSite).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o código no formato CC0000.')).toBeVisible();
    expect(screen.getByText('Informe a data da construção.')).toBeVisible();
    expect(screen.getByText('Máximo de 50 caracteres.')).toBeVisible();
  });

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
  });

  it('abre edição pela linha inteira e acessa a listagem de casas sem ações redundantes', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));

    expect(actions.activateConstructionSite).toHaveBeenCalledWith('construction_site_1');
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
    expect(screen.getByRole('button', {name: 'Gerenciar Casas'})).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Gerenciar Casas'}).className).toContain('sm:w-48');
    expect(screen.getByRole('button', {name: 'Gerenciar Casas'}).className).toContain('sm:shrink-0');

    await user.click(screen.getByRole('button', {name: 'Gerenciar Casas'}));

    expect(screen.getByRole('heading', {name: 'Casas da Construção', hidden: true})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '+ Adicionar Casa'})).toBeVisible();
    expect(screen.getAllByRole('button', {name: '+ Adicionar Casa'})).toHaveLength(1);
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
    expect(screen.getByRole('columnheader', {name: 'Última Modificação'})).toBeVisible();
    expect(screen.getByRole('columnheader', {name: 'Status'})).toHaveClass('text-center');
    expect(screen.getByRole('columnheader', {name: 'Última Modificação'})).toHaveClass('text-center');
    expect(screen.getByTestId('house-desktop-table').className).toContain('hidden');
    expect(screen.getByTestId('house-desktop-table').className).toContain('sm:block');
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
    expect(within(houseMobilePagination).getByText('Mostrando 1-3 de 3 casas')).toBeVisible();
    expect(screen.getAllByText('Família Arquivada')[0]).toBeVisible();
    const houseRow = screen.getByRole('row', {name: /Família Santos.*Tipo 3.*RAC Impressa/i});
    expect(within(houseRow).getByText('RAC Impressa').closest('td')).toHaveClass('text-center');
    expect(within(houseRow).getByText('09/05/2026').closest('td')).toHaveClass('text-center');
    expect(within(houseRow).getByRole('button', {name: 'Arquivar casa Família Santos'}).parentElement)
      .toHaveClass('grid-cols-[2.25rem_minmax(0,1fr)_2.25rem]');
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
  });

  it('cria casa sem campo de tipo e sem ações de duplicar ou arquivar', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', '');
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    expect(screen.getByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    expect(screen.getByText('CC2603')).toBeVisible();
    expect(screen.getByText('Tiradentes')).toBeVisible();
    expect(screen.getByText('11/05/2026')).toBeVisible();
    expect(screen.getByRole('img', {name: 'Foto da construção CC2603'})).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Detalhes da Família'})).toBeVisible();
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
    expect(screen.getByPlaceholderText('Requisitos específicos de estilo de vida, necessidades de acessibilidade ou mudanças estruturais no projeto...')).toBeVisible();
    expect(screen.getByTestId('local-restrictions-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByText('Perfil do Solo')).toBeVisible();
    expect(screen.getByText('Obstáculos no Local')).toBeVisible();
    expect(screen.getByText('Canos, raízes ou caliças (entulhos e concretos)')).toBeVisible();
    expect(screen.getByText('Árvores ou fios de tensão')).toBeVisible();
    expect(screen.getByText('Recuos rígidos de limites')).toBeVisible();
    expect(screen.getByTestId('site-characteristics-grid').className).toContain('md:grid-cols-2');
    expect(screen.getByPlaceholderText('Carregar a partir de coordenadas')).toBeVisible();
    expect(screen.getByTestId('static-map-wrapper').className).toContain('md:col-span-2');
    expect(screen.getByTestId('static-map-preview')).toBeVisible();
    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Salvar Configurações'}).className).toContain('w-full');
    expect(screen.getByRole('button', {name: 'Salvar Configurações'}).className).toContain('md:col-start-2');

    const section = screen.getByRole('heading', {name: 'Detalhes da Família'}).closest('section');
    expect(section?.className).not.toContain('border');
    expect(section?.className).not.toContain('shadow');

    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Nova'}});
    fireEvent.change(screen.getByLabelText('Contato Principal'), {target: {value: 'Maria'}});
    fireEvent.change(screen.getByLabelText('Telefone'), {target: {value: '(11) 99999-0000'}});
    fireEvent.change(screen.getByLabelText('E-mail'), {target: {value: 'maria@example.com'}});
    fireEvent.click(screen.getByRole('radio', {name: /Solo Aluvial Solto/i}));
    fireEvent.click(screen.getByLabelText('Obstáculos Elevados'));
    fireEvent.change(screen.getByLabelText('Localização Geográfica'), {target: {value: '-25.4284, -49.2733'}});
    expect(screen.queryByTestId('google-maps-embed')).not.toBeInTheDocument();
    expect(screen.getByText('Configure a chave do Google Maps')).toBeVisible();
    await chooseVisualOption(user, 'Complexidade do Terreno', 'Muito íngreme');
    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.createHouse).toHaveBeenCalledWith(expect.not.objectContaining({houseType: expect.anything()}));
    expect(actions.createHouse).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'Família Nova',
      primaryContactName: 'Maria',
      primaryContactPhone: '(11) 99999-0000',
      primaryContactEmail: 'maria@example.com',
      siteAssessment: expect.objectContaining({
        soilProfile: 'loose_clay',
        hasElevatedObstacles: true,
        locationQuery: '-25.4284, -49.2733',
        terrainComplexity: 'very_steep',
      }),
    }));
  });

  it('valida campos obrigatórios, máscara e formatos da configuração de casa', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
    await user.click(screen.getByRole('button', {name: '+ Adicionar Casa'}));

    expect(screen.getByLabelText('Nome da Família')).toHaveAttribute('maxlength', '50');
    expect(screen.getByLabelText('Contato Principal')).toHaveAttribute('maxlength', '50');
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
    fireEvent.change(screen.getByLabelText('Notas'), {target: {value: 'N'.repeat(301)}});

    expect(screen.getByLabelText('Telefone')).toHaveValue('(41) 99999-8888');

    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.createHouse).not.toHaveBeenCalled();
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible();
    expect(screen.getByText('Use latitude e longitude, por exemplo: -25.4284, -49.2733.')).toBeVisible();
    expect(screen.getByText('Máximo de 300 caracteres.')).toBeVisible();
  });

  it('carrega Google Maps por coordenadas quando a chave está configurada', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', 'test-key');
    const user = userEvent.setup();

    renderPanel();

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
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

  it('mantém foto existente ao clicar no overlay e só remove pelo X', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
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
    expect(originalPhoto).toHaveAttribute('src', 'data:image/png;base64,family');

    const fileInput = within(photoField).getByLabelText('Foto da Família arquivo') as HTMLInputElement;
    const clickFileInput = vi.spyOn(fileInput, 'click');

    await user.click(within(photoField).getByText('Clique para fazer upload ou arraste uma foto'));

    expect(clickFileInput).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', 'data:image/png;base64,family');

    fireEvent.change(fileInput, {target: {files: []}});

    expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', 'data:image/png;base64,family');

    await user.upload(fileInput, new File(['nova-foto'], 'familia.png', {type: 'image/png'}));

    await waitFor(() => {
      expect(screen.getByAltText('Foto da Família')).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/));
    });
    expect(screen.getByAltText('Foto da Família')).not.toHaveAttribute('src', 'data:image/png;base64,family');

    fireEvent.click(screen.getByRole('button', {name: 'Remover Foto da Família'}));

    expect(screen.queryByAltText('Foto da Família')).not.toBeInTheDocument();
  });

  it('edita casa pela linha inteira sem sobrescrever o tipo existente', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
    await user.click(screen.getByRole('row', {name: /Família Souza.*Tipo 6.*Rascunho/i}));

    expect(actions.activateHouse).toHaveBeenCalledWith('construction_site_1', 'house_1');
    expect(await screen.findByRole('heading', {name: 'Configuração da Casa'})).toBeVisible();
    expect(screen.getByLabelText('Nome da Família')).toHaveValue('Família Souza');
    expect(screen.getByAltText('Foto da Família')).toHaveClass('absolute', 'object-cover', 'object-center');
    expect(screen.getByAltText('Foto da Família').className).not.toContain('min-h');
    expect(screen.getByRole('button', {name: 'Remover Foto da Família'})).toBeVisible();
    expect(within(screen.getByTestId('family-photo-field'))
      .getByText('Clique para fazer upload ou arraste uma foto')).toBeVisible();
    expect(screen.queryByLabelText('Tipo da casa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Remover Foto da Família'}));
    expect(screen.queryByAltText('Foto da Família')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família Souza Atualizada'}});
    await chooseVisualOption(user, 'Complexidade do Terreno', 'Extremo');
    await user.click(screen.getByRole('button', {name: 'Salvar Configurações'}));

    expect(actions.updateActiveHouseConfiguration).toHaveBeenCalledWith(expect.not.objectContaining({houseType: expect.anything()}));
    expect(actions.updateActiveHouseConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'Família Souza Atualizada',
      familyPhotoDataUrl: undefined,
      siteAssessment: expect.objectContaining({
        terrainComplexity: 'extreme',
      }),
    }));
  });

  it('arquiva casa diretamente da listagem com confirmação sem abrir a edição', async () => {
    const user = userEvent.setup();
    const actions = createActions();

    renderPanel({actions});

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
    const archiveHouseButton = within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Arquivar casa Família Souza'});

    expect(archiveHouseButton.querySelector('.lucide-archive')).toBeTruthy();
    expect(archiveHouseButton.querySelector('.lucide-trash-2')).toBeNull();

    await user.click(archiveHouseButton);

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(screen.getByText('Casas da Construção')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('heading', {name: 'Arquivar casa?'})).toBeVisible();
    expect(screen.getByText(/A casa de Família Souza será arquivada/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Arquivar casa'}));

    expect(actions.archiveHouse).toHaveBeenCalledWith('house_1');
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

    await user.click(screen.getByRole('row', {name: /CC2603.*Em andamento/i}));
    await user.click(await screen.findByRole('button', {name: 'Gerenciar Casas'}));
    await user.click(within(screen.getByTestId('house-mobile-list'))
      .getByRole('button', {name: 'Desarquivar casa Família Arquivada'}));

    expect(actions.activateHouse).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByText(/A casa de Família Arquivada voltará/i)).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Desarquivar casa'}));

    expect(actions.unarchiveHouse).toHaveBeenCalledWith('house_3');
  });

  it('a seta da tela raiz volta ao Canvas apenas quando há casa válida', async () => {
    const user = userEvent.setup();
    const onBackToCanvas = vi.fn();

    renderPanel({canOpenRacEditor: true, onBackToCanvas});

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

function renderPanel(input: {
  constructionSite?: ConstructionSiteState;
  summaries?: ConstructionSiteSummary[];
  actions?: ReturnType<typeof createActions>;
  canOpenRacEditor?: boolean;
  onBackToCanvas?: () => void;
} = {}) {
  render(
    <ConstructionSiteManagementPanel
      constructionSite={input.constructionSite ?? createConstructionSite()}
      summaries={input.summaries ?? createSummaries()}
      canOpenRacEditor={input.canOpenRacEditor}
      onBackToCanvas={input.onBackToCanvas}
      actions={(input.actions ?? createActions()) as never}
    />,
  );
}

function createActions() {
  return {
    createConstructionSite: vi.fn().mockResolvedValue(undefined),
    updateActiveConstructionSite: vi.fn(),
    archiveActiveConstructionSite: vi.fn(),
    archiveConstructionSite: vi.fn().mockResolvedValue(undefined),
    unarchiveConstructionSite: vi.fn().mockResolvedValue(undefined),
    activateConstructionSite: vi.fn().mockResolvedValue(null),
    createHouse: vi.fn().mockResolvedValue(undefined),
    duplicateActiveHouse: vi.fn().mockResolvedValue(undefined),
    archiveActiveHouse: vi.fn().mockResolvedValue(undefined),
    archiveHouse: vi.fn().mockResolvedValue(undefined),
    unarchiveHouse: vi.fn().mockResolvedValue(undefined),
    activateHouse: vi.fn().mockResolvedValue(null),
    updateActiveFamily: vi.fn(),
    updateActiveHouseSiteAssessment: vi.fn(),
    updateActiveHouseConfiguration: vi.fn(),
  };
}

function createSummaries(): ConstructionSiteSummary[] {
  return [
    {
      id: 'construction_site_1',
      label: 'CC2603 · Tiradentes',
      externalCode: 'CC2603',
      photoDataUrl: 'data:image/png;base64,site',
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

function createConstructionSite(): ConstructionSiteState {
  const now = '2026-05-09T12:00:00.000Z';

  return {
    constructionSite: {
      id: 'construction_site_1',
      externalCode: 'CC2603',
      photoDataUrl: 'data:image/png;base64,site',
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
        photoDataUrl: 'data:image/png;base64,family',
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
    houses: [
      {
        id: 'house_1',
        constructionSiteId: 'construction_site_1',
        familyId: 'family_1',
        communityId: 'community_1',
        houseType: 'tipo6',
        terrainType: 1,
        status: 'draft',
        designSettings: {
          selectedPilotiHeights: [1, 1.5, 2],
        },
        siteAssessment: {
          terrainComplexity: 'flat',
        },
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
        siteAssessment: {
          terrainComplexity: 'moderate',
        },
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
        siteAssessment: {
          terrainComplexity: 'steep',
        },
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
