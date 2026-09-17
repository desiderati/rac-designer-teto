import {ReactNode} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {NivelDefinitionEditor} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';

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
