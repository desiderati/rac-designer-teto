import {useState} from 'react';
import type {SiteAssessment} from '@/shared/types/construction-site.ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HouseDifficultyControls} from '@/components/rac-editor/ui/HouseDifficultyControls.tsx';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';

const indicator = {score: 36, label: 'Média', level: 'medium'} as const;

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe('HouseDifficultyControls', () => {
  it('não abre menus em consulta nem mantém o menu aberto ao bloquear a casa', async () => {
    const user = userEvent.setup();
    const view = (editable: boolean) => <TooltipProvider><HouseDifficultyControls indicator={indicator}
      onSiteAssessmentChange={editable ? vi.fn() : undefined}/></TooltipProvider>;
    const rendered = render(view(true));
    await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
    expect(screen.getByRole('menu')).toBeVisible();
    rendered.rerender(view(false));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    for (const button of [screen.getByRole('button', {name: 'Obstáculos'}), screen.getByRole('button', {name: /Editar perfil do solo/})]) {
      expect(button).toBeDisabled();
      fireEvent.pointerDown(button, {button: 0, ctrlKey: false});
      fireEvent.keyDown(button, {key: 'Enter'});
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }
  });
  afterEach(() => {
    setViewportWidth(1024);
    vi.clearAllMocks();
  });

  it('renderiza obstáculos como lista e preserva o ícone do grupo', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{
            soilProfile: 'stable_clay',
            hasHydraulicObstacles: false,
            hasUndergroundObstacles: true,
            hasElevatedObstacles: false,
            hasNeighborSetbackConstraints: true,
          }}
          onSiteAssessmentChange={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole('group', {name: 'Fatores da dificuldade da casa'}))
      .toHaveAttribute('data-guided-tour-id', 'rac-house-difficulty-controls');
    const meter = screen.getByRole('meter', {name: 'Dificuldade da casa ativa'});
    expect(meter).toHaveAttribute('aria-valuenow', '36');
    expect(meter).toHaveClass('pointer-events-auto');
    const soilButton = screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Terreno Estável / Argiloso'});
    expect(soilButton).toBeVisible();
    expect(screen.queryByText('Subterr.')).not.toBeInTheDocument();
    expect(screen.queryByText('Elevados')).not.toBeInTheDocument();
    expect(screen.queryByText('Recuos')).not.toBeInTheDocument();

    const obstacleGroup = screen.getByRole('button', {name: 'Obstáculos'});
    expect(obstacleGroup).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('menuitemcheckbox', {name: 'Obstáculos hidráulicos'})).not.toBeInTheDocument();
    expect(obstacleGroup.querySelector('svg')).toHaveClass('lucide-traffic-cone');
    await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
    const hydraulicButton = screen.getByRole('menuitemcheckbox', {name: 'Obstáculos hidráulicos'});
    const undergroundButton = screen.getByRole('menuitemcheckbox', {name: 'Obstáculos subterrâneos'});
    const elevatedButton = screen.getByRole('menuitemcheckbox', {name: 'Obstáculos elevados'});
    const setbacksButton = screen.getByRole('menuitemcheckbox', {name: 'Servidões vizinhas'});
    expect(soilButton).not.toHaveAttribute('title');
    expect(hydraulicButton).toHaveAttribute('aria-checked', 'false');
    expect(undergroundButton).toHaveAttribute('aria-checked', 'true');
    expect(elevatedButton).toHaveAttribute('aria-checked', 'false');
    expect(setbacksButton).toHaveAttribute('aria-checked', 'true');
    expect(hydraulicButton).not.toHaveAttribute('title');
    expect(undergroundButton).not.toHaveAttribute('title');
    expect(elevatedButton).not.toHaveAttribute('title');
    expect(setbacksButton).not.toHaveAttribute('title');
    expect(soilButton.querySelectorAll('svg')).toHaveLength(1);
    expect(soilButton.querySelector('svg')).toHaveClass('lucide-layers');
    expect(hydraulicButton.querySelectorAll('svg')).toHaveLength(2);
    expect(hydraulicButton.querySelector('svg')).toHaveAttribute('data-icon', 'hydraulic-pipe');
    expect(hydraulicButton.querySelector('svg')).toHaveClass('h-3.5', 'w-3.5');
    expect(undergroundButton.querySelectorAll('svg')).toHaveLength(2);
    expect(elevatedButton.querySelectorAll('svg')).toHaveLength(2);
    expect(setbacksButton.querySelectorAll('svg')).toHaveLength(2);

    expect(screen.getByText('Obstáculos subterrâneos', {selector: 'span'})).toBeVisible();
    expect(obstacleGroup.querySelector('svg')).toHaveClass('lucide-traffic-cone');
  });

  it('preserva os controles circulares quando rótulos estão desmarcados', () => {
    render(<TooltipProvider>
      <HouseDifficultyControls indicator={indicator} siteAssessment={{soilProfile: 'stable_clay'}}
        onSiteAssessmentChange={vi.fn()}/>
    </TooltipProvider>);
    expect(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Terreno Estável / Argiloso'}))
      .toHaveClass('h-8', 'w-8', 'rounded-full');
    expect(screen.getByRole('button', {name: 'Obstáculos'})).toHaveClass('h-8', 'w-8', 'rounded-full');
    expect(screen.queryByText('Dificuldade')).not.toBeInTheDocument();
  });

  it('exibe rótulos sob os controles desktop sem alterar os dropdowns internos', async () => {
    const user = userEvent.setup();
    render(<TooltipProvider delayDuration={0}>
      <HouseDifficultyControls indicator={indicator} siteAssessment={{soilProfile: 'stable_clay'}}
        onSiteAssessmentChange={vi.fn()} showToolMenuLabels/>
    </TooltipProvider>);
    const soil = screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Terreno Estável / Argiloso'});
    const obstacles = screen.getByRole('button', {name: 'Obstáculos'});
    expect(soil).toHaveClass('h-[64px]', 'w-[88px]', 'rounded-[18px]');
    expect(obstacles).toHaveClass('h-[64px]', 'w-[88px]', 'rounded-[18px]');
    expect(screen.getByText('Dificuldade', {selector: 'span'})).toBeVisible();
    expect(screen.getByRole('meter', {name: 'Dificuldade da casa ativa'})).toBeVisible();
    await user.click(obstacles);
    expect(screen.getByRole('menuitemcheckbox', {name: 'Obstáculos subterrâneos'})).toHaveTextContent('Obstáculos subterrâneos');
  });

  it('ignora rótulos no mobile portrait', () => {
    const previousHeight = window.innerHeight;
    const originalMatchMedia = window.matchMedia;
    setViewportWidth(740);
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 900});
    vi.stubGlobal('matchMedia', (query: string) => ({
      ...originalMatchMedia(query), matches: query.includes('(max-width: 767px)'),
    }));
    try {
      render(<TooltipProvider>
        <HouseDifficultyControls indicator={indicator} siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={vi.fn()} enableMobileCollapse showToolMenuLabels/>
      </TooltipProvider>);
      expect(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Terreno Estável / Argiloso'}))
        .toHaveClass('h-8', 'w-8', 'rounded-full');
      expect(screen.queryByText('Dificuldade')).not.toBeInTheDocument();
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      Object.defineProperty(window, 'innerHeight', {configurable: true, value: previousHeight});
    }
  });

  it('altera o perfil do solo pelo menu compacto', async () => {
    const user = userEvent.setup();
    const onSiteAssessmentChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Terreno Estável / Argiloso'}));
    await user.click(await screen.findByRole('menuitem', {name: 'Selecionar solo Lençol Freático / Água no Fundo'}));

    expect(onSiteAssessmentChange).toHaveBeenCalledWith({soilProfile: 'water_table'});
  });

  it('permite limpar o perfil do solo informado', async () => {
    const user = userEvent.setup();
    const onSiteAssessmentChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'alluvial'}}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Solo Molhado / Lama'}));
    await user.click(await screen.findByRole('menuitem', {name: 'Selecionar solo Não informado'}));

    expect(onSiteAssessmentChange).toHaveBeenCalledWith({soilProfile: undefined});
  });

  it('mantém Mountain como ícone do perfil de solo não informado', () => {
    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{}}
          onSiteAssessmentChange={vi.fn()}
        />
      </TooltipProvider>,
    );

    const soilButton = screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Não informado'});
    expect(soilButton.querySelector('svg')).toHaveClass('lucide-mountain');
  });

  it('alterna cada obstáculo de forma independente', async () => {
    const user = userEvent.setup();
    const onSiteAssessmentChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{
            hasHydraulicObstacles: false,
            hasUndergroundObstacles: false,
            hasElevatedObstacles: true,
            hasNeighborSetbackConstraints: false,
          }}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
    await user.click(screen.getByRole('menuitemcheckbox', {name: 'Obstáculos hidráulicos'}));
    await user.click(screen.getByRole('menuitemcheckbox', {name: 'Obstáculos subterrâneos'}));
    await user.click(screen.getByRole('menuitemcheckbox', {name: 'Obstáculos elevados'}));
    await user.click(screen.getByRole('menuitemcheckbox', {name: 'Servidões vizinhas'}));

    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(1, {hasHydraulicObstacles: true});
    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(2, {hasUndergroundObstacles: true});
    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(3, {hasElevatedObstacles: false});
    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(4, {hasNeighborSetbackConstraints: true});
  });

  it('permite recolher e reabrir o painel de dificuldade no modo mobile', async () => {
    const user = userEvent.setup();
    setViewportWidth(700);

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={vi.fn()}
          enableMobileCollapse
        />
      </TooltipProvider>,
    );

    const controls = screen.getByRole('group', {name: 'Fatores da dificuldade da casa'});
    expect(controls).not.toHaveClass('hidden');

    await user.click(screen.getByRole('button', {name: 'Recolher painel de dificuldade'}));
    expect(controls).toHaveClass('hidden');

    await user.click(screen.getByRole('button', {name: 'Abrir painel de dificuldade'}));
    expect(controls).not.toHaveClass('hidden');
  });

  it('inicia aberto em largura de tablet e recolhido em largura de phone', () => {
    setViewportWidth(700);
    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={vi.fn()}
          enableMobileCollapse
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole('group', {name: 'Fatores da dificuldade da casa'})).not.toHaveClass('hidden');
    expect(screen.getByRole('button', {name: 'Recolher painel de dificuldade'})).toBeVisible();

    cleanup();
    setViewportWidth(500);
    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={vi.fn()}
          enableMobileCollapse
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole('group', {name: 'Fatores da dificuldade da casa'})).toHaveClass('hidden');
    expect(screen.getByRole('button', {name: 'Abrir painel de dificuldade'})).toBeVisible();
  });

  it('trata 767px como limite desktop do painel de dificuldade', () => {
    setViewportWidth(767);
    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={vi.fn()}
          enableMobileCollapse
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole('group', {name: 'Fatores da dificuldade da casa'})).not.toHaveClass('hidden');
    expect(screen.queryByRole('button', {name: 'Recolher painel de dificuldade'})).not.toBeInTheDocument();
  });

  it('oculta o indicador no radial mobile e mantém os controles de solo e obstáculos', async () => {
    const user = userEvent.setup();
    const previousHeight = window.innerHeight;
    const matchMedia = window.matchMedia;
    setViewportWidth(740);
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 420});
    vi.stubGlobal('matchMedia', (query: string) => ({
      ...matchMedia(query), matches: query.includes('(max-width: 767px)'),
    }));
    const onSiteAssessmentChange = vi.fn();
    try {
      render(<TooltipProvider delayDuration={0}>
        <HouseDifficultyControls indicator={indicator} siteAssessment={{soilProfile: 'stable_clay'}}
          onSiteAssessmentChange={onSiteAssessmentChange} enableMobileCollapse/>
      </TooltipProvider>);
      await user.click(screen.getByRole('button', {name: 'Dificuldade da casa'}));
      expect(screen.queryByRole('meter')).not.toBeInTheDocument();
      expect(screen.getByText('Tipo de solo')).toBeVisible();
      expect(screen.queryByRole('button', {name: 'Obstáculos elevados'})).not.toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Obstáculos'})).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', {name: 'Dificuldade da casa'}).textContent).toBe('');
      expect(screen.getByRole('button', {name: 'Tipo de solo'})).toHaveAttribute('aria-expanded', 'false');
      await user.click(screen.getByRole('button', {name: 'Tipo de solo'}));
      expect(screen.getByRole('toolbar', {name: 'Opções de Tipo de solo'})).toBeVisible();
      await user.click(screen.getByRole('button', {name: 'Solo Molhado / Lama'}));
      expect(onSiteAssessmentChange).toHaveBeenCalledWith({soilProfile: 'alluvial'});
      await user.click(screen.getByRole('button', {name: 'Voltar para Dificuldade da casa'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
      expect(screen.getByRole('toolbar', {name: 'Opções de Obstáculos'})).toBeVisible();
      expect(screen.getByRole('button', {name: 'Obstáculos subterrâneos'})).toBeVisible();
      expect(screen.getByRole('button', {name: 'Obstáculos elevados'})).toBeVisible();
      expect(screen.getByRole('button', {name: 'Servidões vizinhas'})).toBeVisible();
      await user.click(screen.getByRole('button', {name: 'Obstáculos hidráulicos'}));
      expect(onSiteAssessmentChange).toHaveBeenCalledWith({hasHydraulicObstacles: true});
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      Object.defineProperty(window, 'innerHeight', {configurable: true, value: previousHeight});
    }
  });

  it.each([
    ['hasHydraulicObstacles', 'Obstáculos hidráulicos'],
    ['hasUndergroundObstacles', 'Obstáculos subterrâneos'],
    ['hasElevatedObstacles', 'Obstáculos elevados'],
    ['hasNeighborSetbackConstraints', 'Servidões vizinhas'],
  ] as const)('reflete %s no grupo e limpa a marcação ao desativar o último', async (key, label) => {
    const user = userEvent.setup();
    function StatefulControls() {
      const [assessment, setAssessment] = useState<SiteAssessment>({[key]: true});
      return <HouseDifficultyControls indicator={indicator} siteAssessment={assessment}
        onSiteAssessmentChange={change => setAssessment(current => ({...current, ...change}))}/>;
    }
    render(<TooltipProvider><StatefulControls/></TooltipProvider>);
    const group = screen.getByRole('button', {name: 'Obstáculos'});
    expect(group).toHaveAttribute('aria-pressed', 'true');
    await user.click(group);
    await user.click(screen.getByRole('menuitemcheckbox', {name: label}));
    expect(group).toHaveAttribute('aria-pressed', 'false');
    expect(group.querySelector('svg')).toHaveClass('lucide-traffic-cone');
    expect(screen.getByRole('menu', {name: 'Obstáculos'})).toBeVisible();
    expect(screen.getByRole('menuitemcheckbox', {name: label})).toHaveAttribute('aria-checked', 'false');
  });

  it('mantém o submenu mobile aberto e resume múltiplas seleções ao voltar e recolher', async () => {
    const user = userEvent.setup();
    const previousHeight = window.innerHeight;
    const matchMedia = window.matchMedia;
    setViewportWidth(740);
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 420});
    vi.stubGlobal('matchMedia', (query: string) => ({
      ...matchMedia(query), matches: query.includes('(max-width: 767px)'),
    }));
    function StatefulControls() {
      const [assessment, setAssessment] = useState<SiteAssessment>({});
      return <HouseDifficultyControls indicator={indicator} siteAssessment={assessment} enableMobileCollapse
        onSiteAssessmentChange={change => setAssessment(current => ({...current, ...change}))}/>;
    }
    try {
      render(<TooltipProvider><StatefulControls/></TooltipProvider>);
      await user.click(screen.getByRole('button', {name: 'Dificuldade da casa'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos hidráulicos'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos elevados'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos hidráulicos'}));
      expect(screen.getByRole('button', {name: 'Voltar para Dificuldade da casa'})).toHaveAttribute('aria-pressed', 'true');
      await user.click(screen.getByRole('button', {name: 'Voltar para Dificuldade da casa'}));
      expect(screen.getByRole('button', {name: 'Obstáculos'})).toHaveAttribute('aria-pressed', 'true');
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', {name: 'Dificuldade da casa'})).toHaveAttribute('aria-pressed', 'true');
      await user.click(screen.getByRole('button', {name: 'Dificuldade da casa'}));
      await user.click(screen.getByRole('button', {name: 'Obstáculos'}));
      expect(screen.getByRole('button', {name: 'Obstáculos elevados'})).toHaveAttribute('aria-pressed', 'true');
      await user.click(screen.getByRole('button', {name: 'Obstáculos elevados'}));
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', {name: 'Obstáculos'})).toHaveAttribute('aria-pressed', 'false');
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', {name: 'Dificuldade da casa'})).toHaveAttribute('aria-pressed', 'false');
    } finally {
      cleanup(); vi.unstubAllGlobals();
      Object.defineProperty(window, 'innerHeight', {configurable: true, value: previousHeight});
    }
  });

  it('seleciona um único solo no radial, permite limpar e conserva a seleção ao reabrir', async () => {
    const user = userEvent.setup();
    const previousHeight = window.innerHeight;
    const matchMedia = window.matchMedia;
    setViewportWidth(740);
    Object.defineProperty(window, 'innerHeight', {configurable: true, value: 420});
    vi.stubGlobal('matchMedia', (query: string) => ({
      ...matchMedia(query), matches: query.includes('(max-width: 767px)'),
    }));
    function StatefulControls() {
      const [assessment, setAssessment] = useState<SiteAssessment>({});
      return <HouseDifficultyControls indicator={indicator} siteAssessment={assessment} enableMobileCollapse
        onSiteAssessmentChange={change => setAssessment(current => ({...current, ...change}))}/>;
    }
    try {
      render(<TooltipProvider><StatefulControls/></TooltipProvider>);
      await user.click(screen.getByRole('button', {name: 'Dificuldade da casa'}));
      await user.click(screen.getByRole('button', {name: 'Tipo de solo'}));
      for (const label of ['Terreno Estável / Argiloso', 'Terreno Firme / Duro', 'Solo Molhado / Lama',
        'Lençol Freático / Água no Fundo', 'Não informado']) {
        await user.click(screen.getByRole('button', {name: label}));
        expect(screen.getByRole('button', {name: label})).toHaveAttribute('aria-pressed', 'true');
        const selected = screen.getAllByRole('button').filter(button => button.getAttribute('aria-pressed') === 'true');
        expect(selected).toHaveLength(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      }
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', {name: 'Tipo de solo'}).querySelector('svg')).toHaveClass('lucide-mountain');
      await user.click(screen.getByRole('button', {name: 'Tipo de solo'}));
      expect(screen.getByRole('button', {name: 'Não informado'})).toHaveAttribute('aria-pressed', 'true');
    } finally {
      cleanup(); vi.unstubAllGlobals();
      Object.defineProperty(window, 'innerHeight', {configurable: true, value: previousHeight});
    }
  });

});
