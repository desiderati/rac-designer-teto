import {ReactNode} from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {FloatingEditor} from '@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';

function Wrapper({children}: { children: ReactNode }) {
  const ports = {
    settingsPort: {
      getSettings: vi.fn(() => APP_SETTINGS_DEFAULTS),
    },
  } as unknown as EditorPorts;

  return (
    <EditorPortsContext.Provider value={ports}>
      {children}
    </EditorPortsContext.Provider>
  );
}

describe('FloatingEditor.tsx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mantém título e descrição acessíveis no drawer mobile', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <FloatingEditor
        isOpen
        isMobile
        header={<span>Piloti A1</span>}
        cardContent={<span>Conteúdo</span>}
        confirmLabel='Confirmar'
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
      {wrapper: Wrapper},
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('requires a `DialogTitle`'),
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('Missing `Description`'),
    );
  });
});
