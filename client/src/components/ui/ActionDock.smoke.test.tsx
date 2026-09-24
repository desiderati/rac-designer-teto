import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

describe('ActionDock', () => {
  it('mantém o padrão de formulário e a coluna direita desktop', () => {
    render(
      <ActionDock testId='form-dock' surface='form' placement='content-column'>
        <button type='button'>Salvar</button>
      </ActionDock>,
    );

    const dock = screen.getByTestId('form-dock');
    expect(dock).toHaveClass('fixed', 'inset-x-0', 'bottom-0', 'sm:static', 'sm:w-full', 'md:grid-cols-2');
    expect(dock.firstElementChild).toHaveClass('md:col-start-2');
  });

  it('encaixa no Dialog sem criar um scroll externo no desktop', () => {
    render(
      <ActionDock testId='dialog-dock' surface='dialog' spacing='flush'>
        <button type='button'>Confirmar</button>
      </ActionDock>,
    );

    const dock = screen.getByTestId('dialog-dock');
    expect(dock).toHaveClass('sticky', 'bottom-0', 'border-t', 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]', 'min-[768px]:static', 'min-[768px]:mt-0');
    expect(dock).not.toHaveClass('sm:static', 'sm:px-0');
    expect(screen.getByRole('button', {name: 'Confirmar'})).toBeVisible();
  });

  it('mantém largura correta quando é filho direto do DrawerContent', () => {
    render(
      <ActionDock testId='drawer-dock' surface='drawer' edgeToEdge spacing='flush'>
        <button type='button'>Cancelar</button>
      </ActionDock>,
    );

    expect(screen.getByTestId('drawer-dock')).toHaveClass('mx-0', 'w-full', 'px-4', 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]', 'min-[768px]:static');
    expect(screen.getByTestId('drawer-dock')).not.toHaveClass('sm:static', 'sm:px-0');
  });

  it('permite rodapé estático para ações curtas', () => {
    render(
      <ActionDock testId='static-dock' mobileDocked={false}>
        <button type='button'>Fechar</button>
      </ActionDock>,
    );

    expect(screen.getByTestId('static-dock')).toHaveClass('grid', 'w-full', 'gap-3');
    expect(screen.getByTestId('static-dock')).not.toHaveClass('sticky');
  });
});
