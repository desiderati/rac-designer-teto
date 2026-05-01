import {describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {createElement, type ReactNode} from 'react';
import {createEditorPorts, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import {useTutorialFlow} from '@/components/rac-editor/hooks/tutorial/useTutorialFlow.ts';

function createWrapper(ports: EditorPorts) {
  return function wrapper({children}: { children: ReactNode }) {
    return createElement(RacEditorStoreProvider, {ports, children});
  };
}

describe('useTutorialFlow.ts', () => {
  it('usa o tutorial progress port injetado para ler e gravar progresso', async () => {
    const markTutorialCompleted = vi.fn();
    const resetTutorialProgress = vi.fn();
    const ports: EditorPorts = {
      ...createEditorPorts(),
      tutorialProgressPort: {
        isTutorialCompleted: () => false,
        markTutorialCompleted,
        isPilotiTutorialShown: () => false,
        markPilotiTutorialShown: vi.fn(),
        isTutorialTipShown: () => false,
        markTutorialTipShown: vi.fn(),
        resetTutorialProgress,
      },
    };

    const {result} = renderHook(
      () => useTutorialFlow(),
      {wrapper: createWrapper(ports)},
    );

    await waitFor(() => expect(result.current.tutorialStep).toBe('main-fab'));

    act(() => {
      result.current.completeTutorial();
    });

    expect(markTutorialCompleted).toHaveBeenCalledTimes(1);
    expect(result.current.tutorialStep).toBeNull();

    act(() => {
      result.current.restartTutorialProgress();
    });

    expect(resetTutorialProgress).toHaveBeenCalledTimes(1);
    expect(result.current.tutorialStep).toBe('main-fab');
  });
});
