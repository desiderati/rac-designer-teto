import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HouseDifficultyGauge} from '@/components/rac-editor/ui/HouseDifficultyGauge.tsx';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';

describe('HouseDifficultyGauge', () => {
  it('renderiza gauge horizontal acessivel sem label e valor visiveis', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyGauge
          indicator={{score: 68, label: 'Alta', level: 'high'}}
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId('house-difficulty-gauge')).toBeVisible();
    const meter = screen.getByRole('meter', {name: 'Dificuldade da casa'});

    expect(meter).toHaveAttribute('aria-valuenow', '68');
    expect(meter)
      .toHaveAttribute('aria-valuetext', 'Dificuldade Alta, 68 de 100');
    expect(screen.queryByText('Alta')).not.toBeInTheDocument();
    expect(screen.queryByText('68')).not.toBeInTheDocument();

    await user.tab();

    expect(meter).toHaveFocus();
    expect((await screen.findAllByText('Dificuldade Alta: 68/100'))[0]).toBeVisible();
    expect(screen.getAllByText('Baixa')[0]).toBeVisible();
    expect(screen.getAllByText('Média')[0]).toBeVisible();
    expect(screen.getAllByText('Alta')[0]).toBeVisible();
    expect(screen.getAllByText('Crítica')[0]).toBeVisible();
  });

  it('renderiza gauge vertical com o mesmo contrato de leitura', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <HouseDifficultyGauge
          orientation='vertical'
          indicator={{score: 100, label: 'Crítica', level: 'critical'}}
          testId='vertical-difficulty'
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId('vertical-difficulty')).toBeVisible();
    expect(screen.getByRole('meter', {name: 'Dificuldade da casa ativa'}))
      .toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('meter', {name: 'Dificuldade da casa ativa'}))
      .toHaveAttribute('aria-valuetext', 'Dificuldade Crítica, 100 de 100');
    expect(screen.getByRole('meter', {name: 'Dificuldade da casa ativa'}))
      .toHaveClass('h-32', 'w-7', 'p-1', 'ring-slate-300');
    expect(screen.queryByText('Dificuldade')).not.toBeInTheDocument();
    expect(screen.queryByText('Crítica')).not.toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('meter', {name: 'Dificuldade da casa ativa'}));

    expect((await screen.findAllByText('Dificuldade Crítica: 100/100'))[0]).toBeVisible();
    expect(screen.getAllByText('Baixa')[0]).toBeVisible();
    expect(screen.getAllByText('Média')[0]).toBeVisible();
    expect(screen.getAllByText('Alta')[0]).toBeVisible();
    expect(screen.getAllByText('Crítica')[0]).toBeVisible();
  });
});
