import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GenericEditor} from '@/components/rac-editor/modals/editors/GenericEditor';

describe('GenericEditor regression', () => {
  it('keeps draft changes and applies value/color on confirm', async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <GenericEditor
        isOpen
        onClose={onClose}
        editorType="wall"
        object={null}
        canvas={null}
        currentValue=""
        currentColor="#333333"
        isMobile={false}
        onApply={onApply}
      />
    );

    const input = screen.getByPlaceholderText('Ex.: Vizinho, Muro, etc.');
    await user.type(input, 'Muro Teste');
    expect(input).toHaveValue('Muro Teste');

    await user.click(screen.getByTitle('Verde'));
    await user.click(screen.getByRole('button', {name: 'Confirmar'}));

    expect(onApply).toHaveBeenCalledWith('Muro Teste', '#27ae60');
    expect(onClose).toHaveBeenCalled();
  });
});
