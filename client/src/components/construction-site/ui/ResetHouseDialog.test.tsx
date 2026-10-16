import {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {expect, it, vi} from 'vitest';
import {ResetHouseDialog} from './ResetHouseDialog.tsx';
it('A-013 cancelar não redefine nem aciona o cartão abaixo do portal', () => {
  const onConfirm = vi.fn(); const openCard = vi.fn();
  function Fixture() {
    const [open, setOpen] = useState(true);
    return <div onClick={openCard}><ResetHouseDialog open={open} onOpenChange={setOpen} onConfirm={onConfirm}/></div>;
  }
  render(<Fixture/>);
  fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(onConfirm).not.toHaveBeenCalled(); expect(openCard).not.toHaveBeenCalled();
});
