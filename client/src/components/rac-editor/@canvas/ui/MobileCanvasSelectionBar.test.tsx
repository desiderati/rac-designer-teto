import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {MobileCanvasSelectionBar} from './MobileCanvasSelectionBar.tsx';

describe('ação de excluir na barra de seleção mobile', () => {
  it('alterna Transformar/Mover e mostra o ângulo apenas durante o gesto', () => {
    const onToggleTransform = vi.fn();
    const props = {count: 1, transforming: false, canTransform: true, canEdit: true, onEdit: vi.fn(), onToggleTransform};
    const {rerender} = render(<MobileCanvasSelectionBar {...props}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Transformar'}));
    expect(onToggleTransform).toHaveBeenCalledOnce();
    rerender(<MobileCanvasSelectionBar {...props} transforming rotationAngle={45}/>);
    expect(screen.getByRole('button', {name: 'Mover'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Ângulo de rotação')).toHaveTextContent('45°');
    rerender(<MobileCanvasSelectionBar {...props} transforming/>);
    expect(screen.queryByLabelText('Ângulo de rotação')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('alça ↻ para girar');
    rerender(<MobileCanvasSelectionBar {...props} canTransform={false}/>);
    expect(screen.getByRole('button', {name: 'Transformar'})).toBeDisabled();
    rerender(<MobileCanvasSelectionBar {...props} transforming canTransform={false}/>);
    expect(screen.getByRole('button', {name: 'Mover'})).toBeEnabled();
  });
  it.each([1, 2])('aciona a exclusão de %s item(ns) apenas pelo ícone com nome acessível', count => {
    const onDelete = vi.fn();
    render(<MobileCanvasSelectionBar count={count} transforming={false} canTransform canEdit
      onEdit={vi.fn()} onToggleTransform={vi.fn()} onDelete={onDelete}/>);
    const button = screen.getByRole('button', {name: 'Excluir seleção'});
    expect(button).toHaveTextContent('');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveClass('size-11');
    fireEvent.click(button);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('orienta somente redimensionar e não mostra ângulo na seleção múltipla', () => {
    render(<MobileCanvasSelectionBar count={2} transforming canTransform rotationAngle={45} canEdit={false}
      onEdit={vi.fn()} onToggleTransform={vi.fn()}/>);
    expect(screen.getByText('Arraste os pontos para redimensionar.', {exact: true})).toBeInTheDocument();
    expect(screen.queryByText(/alça ↻ para girar/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ângulo de rotação')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Mover'})).toBeEnabled();
  });

  it('fica inerte sem comando e não apresenta ações sem seleção', () => {
    const props = {count: 1, transforming: false, canTransform: true, canEdit: true, onEdit: vi.fn(), onToggleTransform: vi.fn()};
    const {rerender} = render(<MobileCanvasSelectionBar {...props}/>);
    expect(screen.getByRole('button', {name: 'Excluir seleção'})).toBeDisabled();
    rerender(<MobileCanvasSelectionBar {...props} count={0}/>);
    expect(screen.queryByRole('button', {name: 'Excluir seleção'})).not.toBeInTheDocument();
  });
});
