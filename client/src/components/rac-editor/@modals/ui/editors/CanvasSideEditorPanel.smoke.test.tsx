import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {CanvasSideEditorPanel} from './CanvasSideEditorPanel.tsx';

afterEach(() => vi.unstubAllGlobals());

describe('painel lateral compartilhado', () => {
  it('fecha por fora e Escape sem confirmar; permite cancelar somente a escolha de destino', () => {
    const onClose = vi.fn(), onEscape = vi.fn(), onConfirm = vi.fn();
    const {container, rerender} = render(<CanvasSideEditorPanel ariaLabel='Objeto' onClose={onClose} onConfirm={onConfirm}>Conteúdo</CanvasSideEditorPanel>);
    fireEvent.keyDown(window, {key: 'Escape'});
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.pointerDown(container.querySelector('.canvas-side-editor-dismiss')!);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
    rerender(<CanvasSideEditorPanel ariaLabel='Objeto' onClose={onClose} onEscape={onEscape}>Conteúdo</CanvasSideEditorPanel>);
    fireEvent.keyDown(window, {key: 'Escape'});
    expect(onEscape).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('segue a viewport visual e mantém ações fora do conteúdo rolável em altura extrema', () => {
    const visual = Object.assign(new EventTarget(), {height: 320, offsetTop: 0});
    vi.stubGlobal('innerHeight', 320);
    vi.stubGlobal('visualViewport', visual);
    render(<CanvasSideEditorPanel ariaLabel='Objeto' onClose={vi.fn()} onConfirm={vi.fn()}><input aria-label='Nome'/></CanvasSideEditorPanel>);
    const dialog = screen.getByRole('dialog');
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveFocus();
    expect(dialog).toHaveStyle({maxHeight: '304px', top: 'calc(100% - 160px)'});
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    input.focus();
    act(() => {visual.height = 100; visual.offsetTop = 20; visual.dispatchEvent(new Event('resize'));});
    expect(dialog).toHaveStyle({maxHeight: '84px', top: 'calc(100% - 250px)'});
    expect(scrollIntoView).toHaveBeenCalledWith({block: 'nearest'});
    expect(input.closest('[data-rac-modal-region]')).toHaveAttribute('data-rac-modal-region', 'content');
    expect(screen.getByTestId('canvas-side-editor-actions').closest('[data-rac-modal-region]')).toHaveAttribute('data-rac-modal-region', 'actions');
    act(() => {visual.height = 320; visual.offsetTop = 0; visual.dispatchEvent(new Event('scroll'));});
    expect(screen.getByTestId('canvas-side-editor-actions')).not.toHaveClass('canvas-side-editor-actions-scroll');
  });
});
