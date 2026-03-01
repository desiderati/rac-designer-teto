import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Tutorial} from '@/components/rac-editor/ui/tutorial/Tutorial.tsx';
import {STORAGE_KEYS} from '@/shared/config.ts';

describe('Tutorial smoke', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks tutorial as completed when closing the balloon', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();

    render(<Tutorial currentStepId='main-fab' onComplete={onComplete}/>);
    await user.click(screen.getByRole('button'));

    expect(localStorage.getItem(STORAGE_KEYS.tutorialCompleted)).toBe('true');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
