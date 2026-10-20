import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {MobileCanvasSelectionBar} from './MobileCanvasSelectionBar.tsx';

describe('ação de excluir na barra de seleção mobile', () => {
  it.each([1, 2])('aciona a exclusão de %s item(ns) apenas pelo ícone com nome acessível', count => {
    const onDelete = vi.fn();
    render(<MobileCanvasSelectionBar count={count} resizing={false} canResize canEdit
      onEdit={vi.fn()} onToggleResize={vi.fn()} onDelete={onDelete}/>);
    const button = screen.getByRole('button', {name: 'Excluir seleção'});
    expect(button).toHaveTextContent('');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveClass('size-11');
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('fica inerte sem comando e não apresenta ações sem seleção', () => {
    const props = {count: 1, resizing: false, canResize: true, canEdit: true, onEdit: vi.fn(), onToggleResize: vi.fn()};
    const {rerender} = render(<MobileCanvasSelectionBar {...props}/>);
    expect(screen.getByRole('button', {name: 'Excluir seleção'})).toBeDisabled();
    rerender(<MobileCanvasSelectionBar {...props} count={0}/>);
    expect(screen.queryByRole('button', {name: 'Excluir seleção'})).not.toBeInTheDocument();
  });
});
