import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HouseDifficultyControls} from '@/components/rac-editor/ui/HouseDifficultyControls.tsx';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';

const indicator = {score: 36, label: 'Média', level: 'medium'} as const;

describe('HouseDifficultyControls', () => {
  it('renderiza os fatores de dificuldade ao redor do gauge vertical', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{
            soilProfile: 'stable',
            hasUndergroundObstacles: true,
            hasElevatedObstacles: false,
            hasNeighborSetbacks: true,
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
    const soilButton = screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Firme'});
    expect(soilButton).toBeVisible();
    expect(screen.queryByText('Subterr.')).not.toBeInTheDocument();
    expect(screen.queryByText('Elevados')).not.toBeInTheDocument();
    expect(screen.queryByText('Recuos')).not.toBeInTheDocument();

    const undergroundButton = screen.getByRole('button', {name: 'Obstáculos subterrâneos'});
    const elevatedButton = screen.getByRole('button', {name: 'Obstáculos elevados'});
    const setbacksButton = screen.getByRole('button', {name: 'Recuos vizinhos'});
    expect(soilButton).not.toHaveAttribute('title');
    expect(undergroundButton).toHaveAttribute('aria-pressed', 'true');
    expect(elevatedButton).toHaveAttribute('aria-pressed', 'false');
    expect(setbacksButton).toHaveAttribute('aria-pressed', 'true');
    expect(undergroundButton).not.toHaveAttribute('title');
    expect(elevatedButton).not.toHaveAttribute('title');
    expect(setbacksButton).not.toHaveAttribute('title');
    expect(soilButton.querySelectorAll('svg')).toHaveLength(1);
    expect(soilButton.querySelector('svg')).toHaveClass('lucide-layers');
    expect(undergroundButton.querySelectorAll('svg')).toHaveLength(1);
    expect(elevatedButton.querySelectorAll('svg')).toHaveLength(1);
    expect(setbacksButton.querySelectorAll('svg')).toHaveLength(1);

    await user.hover(undergroundButton);
    expect(await screen.findByText('Obstáculos subterrâneos', {selector: 'div'})).toBeVisible();
  });

  it('altera o perfil do solo pelo menu compacto', async () => {
    const user = userEvent.setup();
    const onSiteAssessmentChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable'}}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Firme'}));
    await user.click(await screen.findByRole('menuitem', {name: 'Selecionar solo Água no fundo'}));

    expect(onSiteAssessmentChange).toHaveBeenCalledWith({soilProfile: 'water_table'});
  });

  it('permite limpar o perfil do solo informado', async () => {
    const user = userEvent.setup();
    const onSiteAssessmentChange = vi.fn();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'loose_clay'}}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Editar perfil do solo. Atual: Argila / solto'}));
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
            hasUndergroundObstacles: false,
            hasElevatedObstacles: true,
            hasNeighborSetbacks: false,
          }}
          onSiteAssessmentChange={onSiteAssessmentChange}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'Obstáculos subterrâneos'}));
    await user.click(screen.getByRole('button', {name: 'Obstáculos elevados'}));
    await user.click(screen.getByRole('button', {name: 'Recuos vizinhos'}));

    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(1, {hasUndergroundObstacles: true});
    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(2, {hasElevatedObstacles: false});
    expect(onSiteAssessmentChange).toHaveBeenNthCalledWith(3, {hasNeighborSetbacks: true});
  });

  it('permite recolher e reabrir o painel de dificuldade no modo mobile', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyControls
          indicator={indicator}
          siteAssessment={{soilProfile: 'stable'}}
          onSiteAssessmentChange={vi.fn()}
          enableMobileCollapse
        />
      </TooltipProvider>,
    );

    const controls = screen.getByRole('group', {name: 'Fatores da dificuldade da casa'});
    expect(controls).not.toHaveClass('hidden');

    await user.click(screen.getByRole('button', {name: 'Recolher painel de dificuldade'}));
    expect(controls).toHaveClass('hidden', 'sm:flex');

    await user.click(screen.getByRole('button', {name: 'Abrir painel de dificuldade'}));
    expect(controls).not.toHaveClass('hidden');
  });
});
