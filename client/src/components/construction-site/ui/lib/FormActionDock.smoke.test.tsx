import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FormActionDock} from '@/components/construction-site/ui/lib/FormActionDock.tsx';

describe('FormActionDock', () => {
  it('fixa a ação no mobile e a posiciona na coluna direita no desktop', () => {
    render(
      <FormActionDock testId='shared-actions' desktopPlacement='content-column'>
        <button type='submit'>Salvar</button>
      </FormActionDock>,
    );

    const dock = screen.getByTestId('shared-actions');
    expect(dock).toHaveClass(
      'fixed',
      'bottom-0',
      'mt-12',
      'sm:static',
      'md:grid-cols-2',
    );
    expect(dock.firstElementChild).toHaveClass('md:col-start-2');
    expect(screen.getByRole('button', {name: 'Salvar'})).toBeVisible();
  });

  it('permite o rodapé estático para formulários que não usam dock', () => {
    render(
      <FormActionDock testId='static-actions' mobileDocked={false}>
        <button type='submit'>Criar</button>
      </FormActionDock>,
    );

    const dock = screen.getByTestId('static-actions');
    expect(dock).toHaveClass('grid', 'w-full', 'gap-3');
    expect(dock).not.toHaveClass('sticky');
  });

  it('mantém a variante flush da configuração da casa', () => {
    render(
      <FormActionDock testId='house-actions' desktopPlacement='form-column' desktopSpacing='flush'>
        <button type='submit'>Salvar Configurações</button>
      </FormActionDock>,
    );

    expect(screen.getByTestId('house-actions')).toHaveClass('sm:col-start-2', 'sm:mt-0');
    expect(screen.getByTestId('house-actions').firstElementChild).toHaveClass('md:col-start-2');
  });
});
