import {describe, expect, it, beforeEach} from 'vitest';
import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GuidedTourHost} from '@/components/guided-tour/ui/GuidedTourHost.tsx';
import {racEditorGuidedTourRegistry} from '@/components/rac-editor/lib/rac-editor-guided-tour.ts';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

interface TargetProps {
  guidedTourId: string;
  label: string;
  targetRect: DOMRect;
}

function Target({guidedTourId, label, targetRect}: TargetProps) {
  return (
    <button
      type='button'
      data-guided-tour-id={guidedTourId}
      ref={(node) => {
        if (!node) return;
        Object.defineProperty(node, 'getBoundingClientRect', {
          configurable: true,
          value: () => targetRect,
        });
      }}
    >
      {label}
    </button>
  );
}

function appendTarget(guidedTourId: string, targetRect: DOMRect): HTMLElement {
  const target = document.createElement('button');
  target.type = 'button';
  target.dataset.guidedTourId = guidedTourId;
  target.textContent = guidedTourId;
  Object.defineProperty(target, 'getBoundingClientRect', {
    configurable: true,
    value: () => targetRect,
  });
  document.body.appendChild(target);
  return target;
}

function TestGuidedTourHost() {
  return <GuidedTourHost registry={racEditorGuidedTourRegistry}/>;
}

describe('GuidedTourHost', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('blocks the screen with a single OK action and waits for the next invisible target', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Target guidedTourId='rac-hamburger' label='hamburger' targetRect={rect(20, 20, 48, 48)}/>
        <TestGuidedTourHost/>
      </>,
    );

    const dialog = await screen.findByRole('dialog', {name: 'Menu Principal'});
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleDescription(/use o menu principal/i);
    expect(dialog).toHaveClass('bg-amber-100', 'border-amber-200');
    expect(screen.getByText('Menu Principal')).toBeVisible();
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(6);
    expect(screen.getByRole('button', {name: 'OK'})).toHaveClass('bg-amber-400', 'text-amber-950');
    expect(screen.getByTestId('guided-tour-click-blocker')).toHaveClass('pointer-events-auto');
    expect(screen.queryByRole('button', {name: /pr[oó]ximo/i})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    appendTarget('rac-user-menu', rect(500, 20, 48, 48));

    expect(await screen.findByRole('dialog', {name: 'Perfil e Ajuda'})).toBeVisible();
    expect(screen.getByText(/configurações, dicas/i)).toBeVisible();
  });

  it('starts contextual tips from canvas object events and persists them after close', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(
      <>
        <TestGuidedTourHost/>
      </>,
    );

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:canvas-object-inserted', {
        detail: {
          kind: 'wall',
          rect: {left: 420, top: 120, width: 80, height: 40},
        },
      }));
    });

    const tipDialog = await screen.findByRole('dialog', {name: 'Dica do editor RAC'});
    expect(tipDialog).toBeVisible();
    expect(tipDialog).toHaveAccessibleDescription(/objeto ou muro/i);
    expect(screen.getByText(/objeto ou muro/i)).toBeVisible();
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-tip:wall')).toBe('true');
  });

  it('anchors linear tips to the canvas object rect instead of menu targets', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(
      <>
        <TestGuidedTourHost/>
      </>,
    );

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:canvas-object-inserted', {
        detail: {
          kind: 'line',
          rect: {left: 760, top: 110, width: 180, height: 28},
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText(/Linhas podem receber texto/i)).toBeVisible();
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'OK'}));

    expect(localStorage.getItem('guided-tour:rac-tip:line')).toBe('true');
  });

  it('shows the piloti tip only for the master-piloti canvas event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(
      <>
        <TestGuidedTourHost/>
      </>,
    );

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:canvas-object-selected', {
        detail: {
          kind: 'piloti',
          rect: {left: 120, top: 80, width: 36, height: 36},
        },
      }));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:canvas-object-selected', {
        detail: {
          kind: 'piloti-master',
          rect: {left: 120, top: 80, width: 36, height: 36},
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText(/piloti/i)).toBeVisible();
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'OK'}));

    expect(localStorage.getItem('guided-tour:rac-tip:piloti')).toBe('true');
  });

  it('starts a short house tour from the initial house insertion event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-initial-views:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-initial-views-inserted', {
        detail: {
          kind: 'house-initial-views',
          targets: {
            'house-top-view': {left: 80, top: 40, width: 340, height: 120},
            'house-elevation-view': {left: 240, top: 140, width: 360, height: 280},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Vista Planta')).toBeVisible();
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(2);

    await user.click(screen.getByRole('button', {name: 'OK'}));

    expect(await screen.findByText('Vista Elevada')).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-house-initial-views:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-house-initial-views:completed:revision')).toBe('top-view');
  });

  it('replays the initial house tour from the canvas event even when a previous completion has the current revision', async () => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-initial-views:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-initial-views:completed:revision', 'top-view');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-initial-views-inserted', {
        detail: {
          kind: 'house-initial-views',
          targets: {
            'house-top-view': {left: 80, top: 40, width: 340, height: 120},
            'house-elevation-view': {left: 240, top: 140, width: 360, height: 280},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Vista Planta')).toBeVisible();
  });

  it('keeps keyboard focus inside the balloon and restores previous focus after close', async () => {
    const user = userEvent.setup();
    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.textContent = 'Antes do tour';
    document.body.appendChild(previousButton);
    previousButton.focus();

    render(
      <>
        <Target guidedTourId='rac-hamburger' label='hamburger' targetRect={rect(20, 20, 48, 48)}/>
        <TestGuidedTourHost/>
      </>,
    );

    const okButton = await screen.findByRole('button', {name: 'OK'});
    expect(okButton).toHaveFocus();

    await user.tab();
    expect(okButton).toHaveFocus();

    await user.tab({shift: true});
    expect(okButton).toHaveFocus();

    await user.click(okButton);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(previousButton).toHaveFocus());
  });

  it('migrates the old completed-tour key and suppresses autostart', async () => {
    localStorage.setItem('rac-tutorial-completed', 'true');

    render(
      <>
        <Target guidedTourId='rac-hamburger' label='hamburger' targetRect={rect(20, 20, 48, 48)}/>
        <TestGuidedTourHost/>
      </>,
    );

    await waitFor(() => {
      expect(localStorage.getItem('guided-tour:rac-editor-intro:completed')).toBe('true');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears persisted contextual tips when the RAC tutorial is manually restarted', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-tip:wall', 'true');
    localStorage.setItem('rac-wall-tip-shown', 'true');

    render(
      <>
        <button type='button' data-guided-tour-start='rac-editor-intro'>
          Abrir Tutorial
        </button>
        <Target guidedTourId='rac-hamburger' label='hamburger' targetRect={rect(20, 20, 48, 48)}/>
        <TestGuidedTourHost/>
      </>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /abrir tutorial/i}));

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(localStorage.getItem('guided-tour:rac-tip:wall')).toBeNull();
    expect(localStorage.getItem('rac-wall-tip-shown')).toBeNull();
  });
});
