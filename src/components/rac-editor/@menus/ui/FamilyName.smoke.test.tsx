import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FamilyName} from './FamilyName.tsx';
import {HOUSE_FAMILY_NAME_MAX_LENGTH} from '@/shared/constants.ts';

describe('FamilyName.tsx', () => {
  it('commits a changed family name with Enter', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<FamilyName familyName='Família A' onRename={onRename}/>);

    await user.click(screen.getByRole('button', {name: /Editar nome da família/}));
    const input = screen.getByRole('textbox', {name: 'Editar nome da família'});
    await user.clear(input);
    await user.type(input, 'Família B{Enter}');

    expect(onRename).toHaveBeenCalledWith('Família B');
  });

  it('limita edição ao tamanho máximo do nome da família', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const longFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH + 5);
    const limitedFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH);

    render(<FamilyName familyName='Família A' onRename={onRename}/>);

    await user.click(screen.getByRole('button', {name: /Editar nome da família/}));
    const input = screen.getByRole('textbox', {name: 'Editar nome da família'});
    expect(input).toHaveAttribute('maxlength', String(HOUSE_FAMILY_NAME_MAX_LENGTH));
    expect(input).toHaveClass(
      'w-[min(24rem,calc(100vw-7rem))]',
      'max-w-[min(24rem,calc(100vw-7rem))]',
    );
    await user.clear(input);
    await user.type(input, `${longFamilyName}{Enter}`);

    expect(onRename).toHaveBeenCalledWith(limitedFamilyName);
  });

  it('exibe valor legado acima do limite apenas até o máximo permitido', () => {
    const onRename = vi.fn();
    const longFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH + 5);
    const limitedFamilyName = 'M'.repeat(HOUSE_FAMILY_NAME_MAX_LENGTH);

    render(<FamilyName familyName={longFamilyName} onRename={onRename}/>);

    const visibleName = screen.getByTestId('top-bar-family-name');

    expect(visibleName).toHaveTextContent(limitedFamilyName);
    expect(visibleName).toHaveAttribute('title', longFamilyName);
    expect(screen.queryByText(longFamilyName)).not.toBeInTheDocument();
  });

  it('cancels editing with Escape', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(<FamilyName familyName='Família A' onRename={onRename}/>);

    await user.click(screen.getByRole('button', {name: /Editar nome da família/}));
    const input = screen.getByRole('textbox', {name: 'Editar nome da família'});
    await user.clear(input);
    await user.type(input, 'Família B{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', {name: /Família A/})).toBeVisible();
  });
});
