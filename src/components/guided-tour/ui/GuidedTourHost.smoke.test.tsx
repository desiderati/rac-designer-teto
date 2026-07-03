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
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(7);
    expect(screen.getByRole('button', {name: 'OK'})).toHaveClass('bg-amber-400', 'text-amber-950');
    expect(screen.getByTestId('guided-tour-click-blocker')).toHaveClass('pointer-events-auto');
    expect(screen.queryByRole('button', {name: /pr[oó]ximo/i})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    appendTarget('rac-user-menu', rect(500, 20, 48, 48));

    expect(await screen.findByRole('dialog', {name: 'Perfil e Ajuda'})).toBeVisible();
    expect(screen.getByText(/configurações, dicas/i)).toBeVisible();
  });

  it('includes the house difficulty controls in the initial RAC tutorial', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Target guidedTourId='rac-hamburger' label='hamburger' targetRect={rect(20, 20, 48, 48)}/>
        <Target guidedTourId='rac-user-menu' label='user menu' targetRect={rect(500, 20, 48, 48)}/>
        <Target guidedTourId='rac-export-pdf' label='export pdf' targetRect={rect(820, 20, 48, 48)}/>
        <Target guidedTourId='rac-view-3d' label='view 3d' targetRect={rect(880, 20, 48, 48)}/>
        <Target guidedTourId='rac-zoom-menu' label='zoom' targetRect={rect(520, 70, 80, 36)}/>
        <Target
          guidedTourId='rac-house-difficulty-controls'
          label='difficulty controls'
          targetRect={rect(920, 180, 72, 190)}
        />
        <Target guidedTourId='rac-toolbar' label='toolbar' targetRect={rect(20, 120, 72, 400)}/>
        <TestGuidedTourHost/>
      </>,
    );

    for (const title of ['Menu Principal', 'Perfil e Ajuda', 'Exportar PDF', 'Visualização 3D', 'Zoom']) {
      expect(await screen.findByRole('dialog', {name: title})).toBeVisible();
      await user.click(screen.getByRole('button', {name: 'OK'}));
    }

    const difficultyDialog = await screen.findByRole('dialog', {name: 'Dificuldade da Casa'});
    expect(difficultyDialog).toBeVisible();
    expect(difficultyDialog).toHaveAccessibleDescription(/solo, hidráulicos, subterrâneos, elevados e esquadro/i);
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(7);

    await user.click(screen.getByRole('button', {name: 'OK'}));

    expect(await screen.findByRole('dialog', {name: 'Barra de Ferramentas'})).toBeVisible();
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

  it('does not replay the piloti guidance as a standalone selection tip', async () => {
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

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts the construction add tour from the ready event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:construction-add-tour-ready', {
        detail: {
          kind: 'construction-add',
          targets: {
            'rac-construction-add': {left: 720, top: 64, width: 172, height: 40},
          },
        },
      }));
    });

    const addDialog = await screen.findByRole('dialog', {name: 'Adicionar Construção'});
    expect(addDialog).toBeVisible();
    expect(addDialog).toHaveAccessibleDescription(/nova Construção TETO/i);
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-construction-add:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-construction-add:completed:revision'))
      .toBe('construction-add-v1');
  });

  it('starts the construction actions tour from the ready event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:construction-actions-tour-ready', {
        detail: {
          kind: 'construction-actions',
          targets: {
            'rac-construction-monitors': {left: 760, top: 180, width: 36, height: 36},
            'rac-construction-houses': {left: 804, top: 180, width: 36, height: 36},
            'rac-construction-export-racs': {left: 848, top: 180, width: 36, height: 36},
            'rac-construction-completed': {left: 892, top: 180, width: 36, height: 36},
            'rac-construction-archive': {left: 936, top: 180, width: 36, height: 36},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog', {name: 'Monitores'})).toBeVisible();
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(5);

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Casas e Famílias'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    const exportDialog = await screen.findByRole('dialog', {name: 'Exportar RACs'});
    expect(exportDialog).toBeVisible();
    expect(exportDialog).toHaveAccessibleDescription(/ZIP com as RACs das casas não arquivadas/i);

    await user.click(screen.getByRole('button', {name: 'OK'}));
    const completedDialog = await screen.findByRole('dialog', {name: 'Construção Concluída'});
    expect(completedDialog).toBeVisible();
    expect(completedDialog).toHaveAccessibleDescription(/casas e monitores ficam somente para visualização/i);

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Arquivar Construção'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-construction-actions:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-construction-actions:completed:revision'))
      .toBe('construction-actions-v2');
  });

  it('starts the construction back to canvas tour from the ready event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:construction-back-to-canvas-tour-ready', {
        detail: {
          kind: 'construction-back-to-canvas',
          targets: {
            'rac-construction-back-to-canvas': {left: 32, top: 56, width: 40, height: 40},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog', {name: 'Voltar ao Canvas'})).toBeVisible();
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-construction-back-to-canvas:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-construction-back-to-canvas:completed:revision'))
      .toBe('construction-back-to-canvas-v1');
  });

  it('replays the construction actions tour when the stored completion predates the current revision', async () => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-actions:completed', 'true');
    localStorage.setItem('guided-tour:rac-construction-actions:completed:revision', 'construction-actions-v0');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:construction-actions-tour-ready', {
        detail: {
          kind: 'construction-actions',
          targets: {
            'rac-construction-monitors': {left: 760, top: 180, width: 36, height: 36},
            'rac-construction-houses': {left: 804, top: 180, width: 36, height: 36},
            'rac-construction-export-racs': {left: 848, top: 180, width: 36, height: 36},
            'rac-construction-completed': {left: 892, top: 180, width: 36, height: 36},
            'rac-construction-archive': {left: 936, top: 180, width: 36, height: 36},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog', {name: 'Monitores'})).toBeVisible();
  });

  it('starts the house add tour from the ready event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-add-tour-ready', {
        detail: {
          kind: 'house-add',
          targets: {
            'rac-house-add': {left: 720, top: 64, width: 148, height: 40},
          },
        },
      }));
    });

    const addDialog = await screen.findByRole('dialog', {name: 'Adicionar Casa'});
    expect(addDialog).toBeVisible();
    expect(addDialog).toHaveAccessibleDescription(/configurar família, terreno, pilotis/i);
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-house-add:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-house-add:completed:revision')).toBe('house-add-v1');
  });

  it('starts the house actions tour from the ready event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-actions-tour-ready', {
        detail: {
          kind: 'house-actions',
          targets: {
            'rac-house-status': {left: 760, top: 180, width: 72, height: 24},
            'rac-house-difficulty': {left: 840, top: 188, width: 152, height: 18},
            'rac-house-extra-materials': {left: 1040, top: 180, width: 36, height: 36},
            'rac-house-built': {left: 1084, top: 180, width: 36, height: 36},
            'rac-house-archive': {left: 1128, top: 180, width: 36, height: 36},
            'rac-house-back': {left: 32, top: 56, width: 40, height: 40},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog', {name: 'Status da Casa'})).toBeVisible();
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(6);

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Dificuldade'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Materiais Extras'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    const builtDialog = await screen.findByRole('dialog', {name: 'Casa Construída'});
    expect(builtDialog).toBeVisible();
    expect(builtDialog).toHaveAccessibleDescription(/edição da casa e do canvas fica bloqueada/i);

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Arquivar Casa'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await screen.findByRole('dialog', {name: 'Voltar para Construções'})).toBeVisible();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-house-actions:completed')).toBe('true');
    expect(localStorage.getItem('guided-tour:rac-house-actions:completed:revision'))
      .toBe('house-actions-v1');
  });

  it('replays the house actions tour when the stored completion predates the current revision', async () => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-actions:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-actions:completed:revision', 'house-actions-v0');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-actions-tour-ready', {
        detail: {
          kind: 'house-actions',
          targets: {
            'rac-house-status': {left: 760, top: 180, width: 72, height: 24},
            'rac-house-difficulty': {left: 840, top: 188, width: 152, height: 18},
            'rac-house-extra-materials': {left: 1040, top: 180, width: 36, height: 36},
            'rac-house-built': {left: 1084, top: 180, width: 36, height: 36},
            'rac-house-archive': {left: 1128, top: 180, width: 36, height: 36},
            'rac-house-back': {left: 32, top: 56, width: 40, height: 40},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog', {name: 'Status da Casa'})).toBeVisible();
  });

  it('shows the piloti nivel mode tip when the desktop toggle first appears', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    appendTarget('rac-piloti-nivel-mode-toggle', rect(120, 120, 36, 36));

    const dialog = await screen.findByRole('dialog', {name: 'Dica do editor RAC'});
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleDescription(/alternar entre modo automático e manual/i);
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-tip:piloti-nivel-mode')).toBe('true');
  });

  it('starts a short house tour from the initial house insertion event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-top-view-inserted', {
        detail: {
          kind: 'house-top-view-inserted',
          targets: {
            'house-top-view': {left: 80, top: 40, width: 340, height: 120},
            'house-top-view-piloti': {left: 112, top: 112, width: 24, height: 24},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Vista Planta')).toBeVisible();
    expect(screen.getAllByTestId('guided-tour-progress-dot')).toHaveLength(2);

    await user.click(screen.getByRole('button', {name: 'OK'}));

    const pilotiDialog = await screen.findByRole('dialog', {name: 'Dica do editor RAC'});
    expect(pilotiDialog).toBeVisible();
    expect(pilotiDialog).toHaveAccessibleDescription(/na planta superior, selecione um piloti/i);
    expect(screen.queryByText('Editar Piloti')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('guided-tour:rac-house-top-view:completed')).toBe('true');
  });

  it('does not replay the top-view house tour once it is already completed', async () => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-top-view:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-top-view:completed:revision', 'piloti-target');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-top-view-inserted', {
        detail: {
          kind: 'house-top-view-inserted',
          targets: {
            'house-top-view': {left: 80, top: 40, width: 340, height: 120},
          },
        },
      }));
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('replays the top-view house tour when the stored completion predates the piloti target step', async () => {
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');
    localStorage.setItem('guided-tour:rac-house-top-view:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-top-view-inserted', {
        detail: {
          kind: 'house-top-view-inserted',
          targets: {
            'house-top-view': {left: 80, top: 40, width: 340, height: 120},
            'house-top-view-piloti': {left: 112, top: 112, width: 24, height: 24},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Vista Planta')).toBeVisible();
  });

  it('starts the elevation tour from the first elevation view insertion event', async () => {
    const user = userEvent.setup();
    localStorage.setItem('guided-tour:rac-editor-intro:completed', 'true');

    render(<TestGuidedTourHost/>);

    act(() => {
      document.dispatchEvent(new CustomEvent('rac:house-elevation-view-inserted', {
        detail: {
          kind: 'house-elevation-view-inserted',
          targets: {
            'house-elevation-view': {left: 240, top: 140, width: 360, height: 280},
          },
        },
      }));
    });

    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByText('Vista Elevada')).toBeVisible();
    expect(screen.queryByTestId('guided-tour-progress-dot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'OK'}));
    expect(await waitFor(() => screen.queryByRole('dialog'))).not.toBeInTheDocument();
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
