import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {ReactNode} from 'react';
import {GenericObjectEditor} from './GenericObjectEditor.tsx';

vi.mock('@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx', () => ({
  FloatingEditor: ({cardContent, header, onConfirm, onCancel}: {cardContent: ReactNode; header?: ReactNode; onConfirm: () => void; onCancel: () => void}) => (
    <div>{header}{cardContent}<button onClick={onConfirm}>Confirmar</button><button onClick={onCancel}>Cancelar</button></div>
  ),
}));

describe('limite dos rótulos de elementos', () => {
  const longText = 'A'.repeat(65);

  it('usa o painel compacto com texto centralizado, rascunho e confirmação sem labels redundantes', () => {
    const onApply = vi.fn(), onClose = vi.fn();
    const {rerender} = render(<GenericObjectEditor presentation='mobile-panel' editorType='fence' currentValue='Vizinho' currentColor='#333333'
      isOpen isMobile={false} onApply={onApply} onClose={onClose}/>);
    expect(screen.getByRole('dialog', {name: 'Editar Cerca'})).toBeInTheDocument();
    const input = screen.getByRole('textbox', {name: 'Cerca'});
    expect(input).toHaveClass('text-center');
    expect(input).not.toHaveFocus();
    expect(screen.queryByText('Cerca')).not.toBeInTheDocument();
    expect(screen.queryByText('Nome do objeto')).not.toBeInTheDocument();
    fireEvent.change(input, {target: {value: 'Descartar'}});
    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(onApply).not.toHaveBeenCalled();
    rerender(<GenericObjectEditor presentation='mobile-panel' editorType='fence' currentValue='Vizinho' currentColor='#333333'
      isOpen={false} isMobile onApply={onApply} onClose={onClose}/>);
    rerender(<GenericObjectEditor presentation='mobile-panel' editorType='fence' currentValue='Vizinho' currentColor='#333333'
      isOpen isMobile onApply={onApply} onClose={onClose}/>);
    expect(screen.getByRole('textbox')).toHaveValue('Vizinho');
    fireEvent.change(screen.getByRole('textbox'), {target: {value: 'Confirmado'}});
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
    expect(onApply).toHaveBeenCalledWith('Confirmado', '#333333');
  });

  it.each(['wall', 'siteHouse', 'siteBuilding', 'fence', 'terrainEntry'] as const)(
    'preserva nome e cor de %s ao trocar entre floating e painel compacto', editorType => {
      const onApply = vi.fn(), onClose = vi.fn();
      const props = {editorType, currentValue: 'Original', currentColor: '#000000', isOpen: true,
        isMobile: false, onApply, onClose};
      const {rerender} = render(<GenericObjectEditor {...props}/>);
      fireEvent.change(screen.getByRole('textbox'), {target: {value: 'Rascunho'}});
      fireEvent.click(screen.getByRole('button', {name: 'Azul'}));
      rerender(<GenericObjectEditor {...props} presentation='mobile-panel'/>);
      expect(screen.getByRole('textbox')).toHaveValue('Rascunho');
      expect(screen.getByRole('button', {name: 'Azul'})).toHaveAttribute('aria-pressed', 'true');
      rerender(<GenericObjectEditor {...props} presentation='floating'/>);
      expect(screen.getByRole('textbox')).toHaveValue('Rascunho');
      expect(onApply).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
      expect(onApply).toHaveBeenCalledExactlyOnceWith('Rascunho', '#3498db');
    });

  it('abre a edição mobile sem focar o texto opcional e disparar o teclado', () => {
    render(<GenericObjectEditor editorType='fence' currentValue='' currentColor='#333333'
      isOpen isMobile onApply={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByPlaceholderText('Texto opcional')).not.toHaveFocus();
  });

  it('preserva o foco inicial do texto no desktop', () => {
    render(<GenericObjectEditor editorType='fence' currentValue='' currentColor='#333333'
      isOpen isMobile={false} onApply={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByPlaceholderText('Texto opcional')).toHaveFocus();
  });

  it('mantém apenas paleta e ações no desenho livre, sem cabeçalho ou separador', () => {
    const onClose = vi.fn();
    const {container} = render(<GenericObjectEditor editorType='freehand' currentValue='' currentColor='#333333'
      isOpen isMobile={false} onApply={vi.fn()} onClose={onClose}/>);
    expect(screen.queryByText('Desenho Livre')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('[data-orientation]')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('limita o nome de Muro a 50 caracteres também ao confirmar', () => {
    const onApply = vi.fn();
    render(<GenericObjectEditor editorType='wall' currentValue='' currentColor='#333333'
      isOpen isMobile={false} onApply={onApply} onClose={vi.fn()}/>);
    const input = screen.getByPlaceholderText('Ex.: Muro, Vizinho, etc.');
    expect(input).toHaveAttribute('maxLength', '50');
    fireEvent.change(input, {target: {value: longText}});
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
    expect(onApply).toHaveBeenCalledWith('A'.repeat(50), '#333333');
  });

  it('preserva o conteúdo acima de 50 caracteres no elemento Texto', () => {
    const onApply = vi.fn();
    render(<GenericObjectEditor editorType='text' currentValue='' currentColor='#333333'
      isOpen isMobile={false} onApply={onApply} onClose={vi.fn()}/>);
    const input = screen.getByPlaceholderText('Texto');
    expect(input).not.toHaveAttribute('maxLength');
    fireEvent.change(input, {target: {value: longText}});
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
    expect(onApply).toHaveBeenCalledWith(longText, '#333333');
  });
});
