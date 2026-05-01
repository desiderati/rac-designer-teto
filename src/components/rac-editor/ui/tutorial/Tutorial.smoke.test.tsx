import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Tutorial} from '@/components/rac-editor/ui/tutorial/Tutorial.tsx';

describe('Tutorial.tsx', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('notifica conclusão ao fechar o balão', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();

    render(<Tutorial currentStepId='main-fab' onComplete={onComplete}/>);
    await user.click(screen.getByRole('button'));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

