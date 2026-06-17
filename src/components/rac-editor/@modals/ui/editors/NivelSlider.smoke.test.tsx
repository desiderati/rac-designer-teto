import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {
  NivelSlider,
} from '@/components/rac-editor/@modals/ui/editors/NivelSlider.tsx';
import {
  formatNivelInputDigits,
  nivelInputDigitsToValue,
  nivelToInputDigits,
  sanitizeNivelInputDigits,
} from '@/components/rac-editor/@modals/ui/editors/nivel-input-format.ts';

describe('NivelSlider.tsx', () => {
  it('normaliza a máscara N,NN a partir de dígitos', () => {
    expect(sanitizeNivelInputDigits('a1,20b')).toBe('120');
    expect(formatNivelInputDigits('7')).toBe('0,07');
    expect(formatNivelInputDigits('120')).toBe('1,20');
    expect(nivelToInputDigits(0.2)).toBe('020');
    expect(nivelInputDigitsToValue('175')).toBe(1.75);
  });

  it('exibe o modo no título sem texto auxiliar de altura', () => {
    const {container} = render(
      <NivelSlider
        nivel={0.2}
        minNivel={0.2}
        maxNivel={1.75}
        onNivelIncrement={vi.fn()}
        onNivelChange={vi.fn()}
        onNivelCommit={vi.fn()}
        enableInput
        modeLabel='Manual'
      />,
    );

    expect(screen.getByText('Nível do Piloti (Manual)')).toBeInTheDocument();
    expect(screen.queryByText('Altura manual')).not.toBeInTheDocument();
    expect(screen.queryByText(/Máximo para altura atual/i)).not.toBeInTheDocument();
    expect(container.querySelector('input')).toBeNull();
    expect(screen.getByLabelText('Nível do piloti em metros'))
      .toHaveClass('outline-none', 'focus-visible:ring-0', 'focus-visible:ring-offset-0');
  });

  it('permite editar diretamente o texto do nível no desktop usando somente números', () => {
    const onNivelChange = vi.fn();
    const onNivelCommit = vi.fn();

    const {container} = render(
      <NivelSlider
        nivel={0.2}
        minNivel={0.2}
        maxNivel={1.75}
        onNivelIncrement={vi.fn()}
        onNivelChange={onNivelChange}
        onNivelCommit={onNivelCommit}
        enableInput
      />,
    );

    expect(container.querySelector('input')).toBeNull();

    const editor = screen.getByLabelText('Nível do piloti em metros');
    fireEvent.click(editor);
    editor.textContent = 'abc120';
    fireEvent.input(editor);
    expect(editor.textContent).toBe('1,20');

    fireEvent.blur(editor);
    expect(onNivelCommit).toHaveBeenLastCalledWith(1.2);
  });

  it('limita o valor digitado ao máximo recebido do editor', () => {
    const onNivelChange = vi.fn();
    const onNivelCommit = vi.fn();

    render(
      <NivelSlider
        nivel={0.2}
        minNivel={0.2}
        maxNivel={0.5}
        onNivelIncrement={vi.fn()}
        onNivelChange={onNivelChange}
        onNivelCommit={onNivelCommit}
        enableInput
      />,
    );

    const editor = screen.getByLabelText('Nível do piloti em metros');
    fireEvent.click(editor);
    editor.textContent = '099';
    fireEvent.input(editor);
    fireEvent.keyDown(editor, {key: 'Enter'});

    expect(onNivelChange).toHaveBeenLastCalledWith(0.5);
    expect(onNivelCommit).toHaveBeenLastCalledWith(0.5);
    expect(editor.textContent).toBe('0,50');
  });
});
