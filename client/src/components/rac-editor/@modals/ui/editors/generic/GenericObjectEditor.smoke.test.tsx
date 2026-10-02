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
