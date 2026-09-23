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
    expect(dock).toHaveClass('sticky', 'bottom-0', 'w-[calc(100%+1rem)]', 'sm:grid-cols-2');
    expect(dock.firstElementChild).toHaveClass('sm:col-start-2');
  });

  it('encaixa no Dialog sem criar um scroll externo no desktop', () => {
    render(
      <ActionDock testId='dialog-dock' surface='dialog' spacing='flush'>
        <button type='button'>Confirmar</button>
      </ActionDock>,
    );

    const dock = screen.getByTestId('dialog-dock');
    expect(dock).toHaveClass('sticky', 'bottom-0', 'border-t', 'sm:static', 'sm:mt-0');
    expect(screen.getByRole('button', {name: 'Confirmar'})).toBeVisible();
  });

  it('mantém largura correta quando é filho direto do DrawerContent', () => {
    render(
      <ActionDock testId='drawer-dock' surface='drawer' edgeToEdge spacing='flush'>
        <button type='button'>Cancelar</button>
      </ActionDock>,
    );

    expect(screen.getByTestId('drawer-dock')).toHaveClass('mx-0', 'w-full', 'px-4', 'sm:static');
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
