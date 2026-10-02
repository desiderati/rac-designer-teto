import {ReactNode} from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {NivelDefinitionEditor} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';

vi.mock('@/components/rac-editor/lib/use-mobile.tsx', () => ({
  useIsMobile: vi.fn(() => true),
}));

function Wrapper({children}: { children: ReactNode }) {
  const ports = {
    houseReadPort: {
      getSelectedPilotiHeights: vi.fn(() => [1, 1.5, 2, 2.5, 3]),
    },
  } as unknown as EditorPorts;

  return (
    <EditorPortsContext.Provider value={ports}>
      {children}
    </EditorPortsContext.Provider>
  );
}

describe('NivelDefinitionEditor.tsx', () => {
  it.each([false, true])('foca nível ao inserir e navegar pelos cantos (mobile=%s)', async (isMobile) => {
    vi.mocked(useIsMobile).mockReturnValue(isMobile);
    render(<NivelDefinitionEditor isOpen onClose={vi.fn()} onApply={vi.fn()}/>, {wrapper: Wrapper});
    await waitFor(() => expect(screen.getByLabelText('Nível do piloti em metros')).toHaveFocus());
    for (const corner of ['A4', 'C1', 'C4']) {
      const next = screen.getByRole('button', {name: 'Próximo piloti'});
      act(() => next.focus());
      fireEvent.click(next);
      expect(screen.getByText(`Piloti ${corner}`)).toBeVisible();
      expect(screen.getByLabelText('Nível do piloti em metros')).toHaveFocus();
    }
    const previous = screen.getByRole('button', {name: 'Piloti anterior'});
    act(() => previous.focus());
    fireEvent.click(previous);
    expect(screen.getByLabelText('Nível do piloti em metros')).toHaveFocus();
  });

  it('permite editar o nível digitando no modo mobile durante a inserção inicial', () => {
    render(
      <NivelDefinitionEditor
        isOpen
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
      {wrapper: Wrapper},
    );

    const nivelEditor = screen.getByLabelText('Nível do piloti em metros');
    nivelEditor.textContent = '146';
    fireEvent.input(nivelEditor);
    fireEvent.blur(nivelEditor);

    expect(nivelEditor).toHaveTextContent('1,46');
  });
});
