import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import {CanvasToolsMenu} from './CanvasToolsMenu.tsx';

const MobileCanvasToolsMenu = CanvasToolsMenu as React.ComponentType<any>;

const actions = {
  openHouseTypeSelector: vi.fn(),
  addHouseFront: vi.fn(),
  addHouseBack: vi.fn(),
  addHouseSide1: vi.fn(),
  addHouseSide2: vi.fn(),
  addWall: vi.fn(),
  addSiteElement: vi.fn(),
  addStreetStraight: vi.fn(),
  addStreetCorner: vi.fn(),
  addDirtRoad: vi.fn(),
  addSquare: vi.fn(),
  addTriangle: vi.fn(),
  addCircle: vi.fn(),
  addDoor: vi.fn(),
  addStairs: vi.fn(),
  addTree: vi.fn(),
  addWater: vi.fn(),
  addFossa: vi.fn(),
  addLine: vi.fn(),
  addArrow: vi.fn(),
  addDistance: vi.fn(),
  toggleDrawMode: vi.fn(),
  addText: vi.fn(),
  openImageUpload: vi.fn(),
  deleteSelection: vi.fn(),
  savePDF: vi.fn(),
  toggleHouseMenu: vi.fn(),
  toggleElementsMenu: vi.fn(),
  toggleGeometryMenu: vi.fn(),
  toggleLinesMenu: vi.fn(),
  toggleOverflowMenu: vi.fn(),
  toggleTips: vi.fn(),
  toggleZoomControls: vi.fn(),
  open3DViewer: vi.fn(),
  toggleMenu: vi.fn(),
  restartDrawing: vi.fn(),
  exit: vi.fn(),
  renameFamily: vi.fn(),
  setCanvasToolMode: vi.fn(),
  fitToView: vi.fn(),
  fitContent: vi.fn(),
  openSettings: vi.fn(),
};

function renderCanvasToolsMenu({viewportWidth = 700, activeSubmenu = 'elements', houseType = 'tipo6', frontViewCount = {current: 0, max: 1}, showToolMenuLabels = false}: {
  viewportWidth?: number;
  activeSubmenu?: 'elements' | 'geometry' | null;
  houseType?: 'tipo6' | null;
  frontViewCount?: {current: number; max: number};
  showToolMenuLabels?: boolean;
} = {}) {
  setViewportWidth(viewportWidth);

  return render(
    <TooltipProvider delayDuration={0}>
      <MobileCanvasToolsMenu
        isMobile
        actions={actions}
        isDrawing={false}
        activeSubmenu={activeSubmenu}
        houseType={houseType}
        frontViewCount={frontViewCount}
        backViewCount={{current: 0, max: 1}}
        side1ViewCount={{current: 0, max: 2}}
        side2ViewCount={{current: 0, max: 0}}
        showToolMenuLabels={showToolMenuLabels}
      />
    </TooltipProvider>,
  );
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function setLandscapeViewport({reducedMotion = false}: {reducedMotion?: boolean} = {}) {
  const originalMatchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    ...originalMatchMedia(query),
    matches: query.startsWith('(max-width: 767px),') || (reducedMotion && query === '(prefers-reduced-motion: reduce)') || originalMatchMedia(query).matches,
  }));
  Object.defineProperty(window, 'innerHeight', {configurable: true, value: 420});
}

describe('CanvasToolsMenu.tsx', () => {
  afterEach(() => {
    setViewportWidth(1024);
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 768});
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('allows the mobile side rail to collapse and reopen from a thin handle', async () => {
    const user = userEvent.setup();
    renderCanvasToolsMenu();

    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'Recolher menu lateral'}));
    expect(screen.queryByRole('toolbar', {name: 'Barra de ferramentas principal'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Abrir menu lateral'}));
    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
  });

  it('mantém a cápsula e os botões circulares existentes quando a opção está desmarcada', () => {
    renderCanvasToolsMenu({viewportWidth: 1280});
    const rail = screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'});
    const house = screen.getByRole('button', {name: 'Casa TETO (Opções)'});
    expect(rail).toHaveClass('w-12', 'rounded-full');
    expect(house).toHaveClass('w-10', 'h-10', 'rounded-full');
    expect(house.textContent).toBe('');
  });

  it('aplica rótulos curtos e nova geometria somente ao menu desktop', async () => {
    const user = userEvent.setup();
    renderCanvasToolsMenu({viewportWidth: 1280, showToolMenuLabels: true});
    const rail = screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'});
    const house = screen.getByRole('button', {name: 'Casa TETO (Opções)'});
    expect(rail).toHaveClass('w-[88px]', 'rounded-[24px]');
    expect(house).toHaveClass('w-[76px]', 'min-h-[60px]', 'rounded-[14px]');
    expect(within(house).getByText('Casa TETO')).toHaveAttribute('aria-hidden', 'true');
    const category = screen.getByRole('button', {name: 'Edificações'});
    expect(category).toHaveClass('w-[92px]', 'min-h-[64px]', 'rounded-[14px]');
    expect(screen.getByTestId('rac-side-rail-submenu')).toHaveClass('rounded-[24px]');
    await user.click(category);
    await user.click(screen.getByRole('button', {name: 'Construção'}));
    const variant = screen.getByRole('button', {name: 'Construção com porta à esquerda'});
    expect(within(variant).getByText('Porta à esquerda')).toBeVisible();
    expect(variant).toHaveClass('w-[92px]');
  });

  it('ignora a opção de rótulos no mobile portrait e no radial landscape', async () => {
    const user = userEvent.setup();
    setLandscapeViewport();
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 900});
    renderCanvasToolsMenu({viewportWidth: 740, showToolMenuLabels: true});
    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toHaveClass('w-12');
    expect(screen.getByRole('button', {name: 'Casa TETO (Opções)'}).textContent).toBe('');
    cleanup();
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 420});
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null, showToolMenuLabels: true});
    await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
    expect(screen.getByRole('button', {name: 'Casa TETO (Opções)'})).toHaveClass('h-11', 'w-11');
    expect(screen.getByRole('button', {name: 'Casa TETO (Opções)'})).toHaveTextContent('Casa TETO');
  });

  it('starts expanded on tablet mobile widths and collapsed on phone widths', () => {
    renderCanvasToolsMenu();

    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Recolher menu lateral'})).toBeVisible();

    cleanup();
    renderCanvasToolsMenu({viewportWidth: 500});

    expect(screen.queryByRole('toolbar', {name: 'Barra de ferramentas principal'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Abrir menu lateral'})).toBeVisible();
  });

  it('treats 767px as the desktop rail threshold', () => {
    renderCanvasToolsMenu({viewportWidth: 767});

    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'})).toBeVisible();
    expect(screen.queryByRole('button', {name: 'Recolher menu lateral'})).not.toBeInTheDocument();
  });

  it('keeps mobile submenus with the same height as the main rail width', () => {
    renderCanvasToolsMenu();

    expect(screen.getByTestId('rac-side-rail-submenu')).toHaveClass('h-12');
  });

  it('mostra somente ícones com nome acessível e tooltip, sem abrir pelo hover', async () => {
    const user = userEvent.setup(); renderCanvasToolsMenu();
    const menu = screen.getByTestId('rac-elements-submenu');
    for (const button of within(menu).getAllByRole('button')) {
      expect(button.textContent).toBe('');
      expect(button).toHaveAccessibleName();
      expect(button).not.toHaveAttribute('title');
    }
    await user.hover(screen.getByRole('button', {name: 'Edificações'}));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Edificações');
    expect(screen.queryByRole('group', {name: 'Elementos de Edificações'})).not.toBeInTheDocument();
  });

  it('inicia sem seleção e abre ou recolhe cada nível somente por clique', async () => {
    const user = userEvent.setup(); renderCanvasToolsMenu();
    const category = screen.getByRole('button', {name: 'Edificações'});
    expect(category).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', {name: /^Casa$/})).not.toBeInTheDocument();
    await user.click(category);
    expect(category).toHaveAttribute('aria-expanded', 'true');
    const building = screen.getByRole('button', {name: 'Construção'});
    expect(screen.queryByRole('group', {name: 'Posição da porta'})).not.toBeInTheDocument();
    await user.click(building);
    expect(screen.getByRole('group', {name: 'Posição da porta'})).toBeVisible();
    await user.click(building);
    expect(screen.queryByRole('group', {name: 'Posição da porta'})).not.toBeInTheDocument();
    await user.click(category);
    expect(category).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', {name: 'Construção'})).not.toBeInTheDocument();
  });

  it('preserva a barra e não duplica tooltip nativo nos novos grupos', async () => {
    const user = userEvent.setup();
    renderCanvasToolsMenu();
    for (const name of ['Casa TETO (Opções)', 'Elementos', 'Upload de Imagem']) {
      expect(screen.getByRole('button', {name})).not.toHaveAttribute('title');
      expect(screen.getByRole('button', {name})).toHaveClass('w-10', 'h-10');
    }
    await user.click(screen.getByRole('button', {name: 'Limites e acessos'}));
    expect(screen.getByRole('button', {name: 'Muro'})).not.toHaveAttribute('title');
    expect(screen.getByRole('button', {name: 'Muro'})).toHaveAttribute('data-guided-tour-id', 'rac-tool-wall');
    expect(screen.getByRole('button', {name: 'Muro'})).not.toHaveAttribute('data-guided-tour-tip');
    expect(screen.getByRole('toolbar', {name: 'Barra de ferramentas principal'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-toolbar');
    await user.click(screen.getByRole('button', {name: 'Vias'}));
    expect(screen.getByRole('button', {name: 'Rua Reta'})).not.toHaveAttribute('title');
    expect(screen.getByRole('button', {name: 'Estrada de Chão'})).not.toHaveAttribute('title');
  });

  it('insere a variante de Construção escolhida e mantém as vistas TETO separadas', async () => {
    const user = userEvent.setup(); renderCanvasToolsMenu();
    await user.click(screen.getByRole('button', {name: 'Edificações'}));
    await user.click(screen.getByRole('button', {name: 'Construção'}));
    expect(screen.getByRole('group', {name: 'Posição da porta'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Construção com porta à esquerda'}));
    expect(actions.addSiteElement).toHaveBeenCalledWith('buildingLeft');
    expect(actions.addHouseFront).not.toHaveBeenCalled();
  });

  it('insere o portão de abrir diretamente, sem inversão ou correr, e mantém direções de entrada', async () => {
    const user = userEvent.setup(); renderCanvasToolsMenu();
    await user.click(screen.getByRole('button', {name: 'Limites e acessos'}));
    await user.click(screen.getByRole('button', {name: 'Portão'}));
    expect(actions.addSiteElement).toHaveBeenLastCalledWith('gateSwing');
    expect(screen.queryByRole('checkbox', {name: 'Inverter sentido'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Portão de correr'})).not.toBeInTheDocument();
    expect(screen.queryByRole('group', {name: 'Tipo de portão'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Entrada no Terreno'}));
    await user.click(screen.getByRole('button', {name: 'Entrada para a direita'}));
    expect(actions.addSiteElement).toHaveBeenLastCalledWith('entryRight');
  });

  it('fecha por Escape e devolve foco ao botão Elementos', async () => {
    const user = userEvent.setup(); renderCanvasToolsMenu();
    await user.click(screen.getByRole('button', {name: 'Edificações'}));
    await user.keyboard('{Escape}');
    expect(actions.toggleElementsMenu).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', {name: 'Elementos'})).toHaveFocus();
  });

  it('navega por um nível radial por vez e insere a variante escolhida no celular horizontal', async () => {
    const user = userEvent.setup();
    setLandscapeViewport();
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null});
    const center = screen.getByRole('button', {name: 'Ferramentas do Canvas'});
    await user.click(center);
    expect(screen.getByText('Casa TETO')).toBeVisible();
    expect(center.textContent).toBe('');
    await user.click(screen.getByRole('button', {name: 'Elementos'}));
    expect(screen.queryByRole('button', {name: 'Objetos Geométricos'})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Voltar para Ferramentas do Canvas'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Voltar para Ferramentas do Canvas'})).toHaveFocus();
    await user.click(screen.getByRole('button', {name: 'Edificações'}));
    expect(screen.queryByRole('button', {name: 'Limites e acessos'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Construção'}));
    expect(screen.getByText('Construção com porta à esquerda')).toBeVisible();
    expect(screen.getByRole('button', {name: 'Voltar para Edificações'}).textContent).toBe('');
    expect(screen.getByRole('toolbar', {name: 'Opções de Construção'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Construção com porta embaixo'}));
    expect(actions.addSiteElement).toHaveBeenCalledWith('buildingBottom');
    expect(screen.getByRole('button', {name: 'Ferramentas do Canvas'})).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', {name: 'Ferramentas do Canvas'})).toHaveFocus();
    await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
    await user.click(screen.getByRole('button', {name: 'Elementos'}));
    await user.click(screen.getByRole('button', {name: 'Limites e acessos'}));
    await user.click(screen.getByRole('button', {name: 'Portão'}));
    expect(actions.addSiteElement).toHaveBeenLastCalledWith('gateSwing');
    expect(actions.toggleElementsMenu).not.toHaveBeenCalled();
  });

  it('volta por centro e Escape, fecha ao tocar fora e preserva Geometria e Linhas', async () => {
    const user = userEvent.setup();
    setLandscapeViewport();
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null});
    await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
    await user.click(screen.getByRole('button', {name: 'Objetos Geométricos'}));
    expect(screen.getByRole('button', {name: 'Quadrado'})).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', {name: 'Objetos Geométricos'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Linhas'}));
    expect(screen.getByRole('button', {name: 'Linha Reta'})).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Voltar para Ferramentas do Canvas'}));
    expect(screen.getByRole('button', {name: 'Elementos'})).toBeVisible();
    await user.click(document.body);
    expect(screen.getByRole('button', {name: 'Ferramentas do Canvas'})).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém a escolha de tipo de casa e o indicador de limite no radial', async () => {
    const user = userEvent.setup();
    setLandscapeViewport();
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null, frontViewCount: {current: 1, max: 1}});
    await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
    await user.click(screen.getByRole('button', {name: 'Casa TETO (Opções)'}));
    expect(screen.getByRole('button', {name: 'Frontal'})).toHaveClass('opacity-60');
    await user.click(screen.getByRole('button', {name: 'Frontal'}));
    expect(actions.addHouseFront).toHaveBeenCalledOnce();
    cleanup();
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null, houseType: null});
    await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
    await user.click(screen.getByRole('button', {name: 'Casa TETO (Opções)'}));
    expect(actions.openHouseTypeSelector).toHaveBeenCalledOnce();
  });

  it('cancela o ícone em trânsito quando Escape volta rapidamente de nível', async () => {
    const user = userEvent.setup();
    setLandscapeViewport();
    const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
    const cancel = vi.fn();
    const animate = vi.fn().mockImplementation(() => ({cancel, onfinish: null}));
    Object.defineProperty(Element.prototype, 'animate', {configurable: true, value: animate});
    try {
      renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null});
      await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
      await user.click(screen.getByRole('button', {name: 'Elementos'}));
      expect(screen.getByTestId('rac-radial-flight')).toBeInTheDocument();
      const flightFrames = animate.mock.calls.find(([frames]) => frames[0]?.transform === 'translate(0, 0) scale(1)')?.[0];
      expect(flightFrames?.[1]?.transform).toContain('translate(');
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('rac-radial-flight')).not.toBeInTheDocument();
      expect(cancel).toHaveBeenCalled();
      expect(screen.getByRole('button', {name: 'Ferramentas do Canvas'})).toHaveFocus();
    } finally {
      if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate);
      else delete (Element.prototype as Element & {animate?: Element['animate']}).animate;
    }
  });

  it('fecha o submenu de cápsulas quando o layout entra no landscape mobile', () => {
    setLandscapeViewport();
    renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: 'elements'});
    expect(actions.toggleElementsMenu).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('rac-elements-submenu')).not.toBeInTheDocument();
  });

  it('troca de nível sem deslocamento quando o usuário reduz movimento', async () => {
    const user = userEvent.setup();
    setLandscapeViewport({reducedMotion: true});
    const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
    const animate = vi.fn().mockImplementation(() => ({cancel: vi.fn(), onfinish: null}));
    Object.defineProperty(Element.prototype, 'animate', {configurable: true, value: animate});
    try {
      renderCanvasToolsMenu({viewportWidth: 740, activeSubmenu: null});
      await user.click(screen.getByRole('button', {name: 'Ferramentas do Canvas'}));
      await user.click(screen.getByRole('button', {name: 'Elementos'}));
      expect(screen.queryByTestId('rac-radial-flight')).not.toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Voltar para Ferramentas do Canvas'})).toBeVisible();
      expect(animate.mock.calls.every(([frames]) => !frames.some((frame: {transform?: string}) => frame.transform))).toBe(true);
    } finally {
      if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate);
      else delete (Element.prototype as Element & {animate?: Element['animate']}).animate;
    }
  });

  it('oferece formas geométricas e retira ferramentas obsoletas', () => {
    renderCanvasToolsMenu();
    const elementsButton = screen.getByRole('button', {name: 'Elementos'});
    const geometryButton = screen.getByRole('button', {name: 'Objetos Geométricos'});
    expect(elementsButton.compareDocumentPosition(geometryButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Porta - Out Of Service'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Escada - Out Of Service'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Rua em Quina'})).not.toBeInTheDocument();
    cleanup();
    renderCanvasToolsMenu({activeSubmenu: 'geometry'});
    expect(screen.getByRole('button', {name: 'Quadrado'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Triângulo'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Círculo'})).toBeInTheDocument();
  });
});
