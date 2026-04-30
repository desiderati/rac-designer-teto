import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FamilyName} from './FamilyName.tsx';

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
