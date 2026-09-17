import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {EditorPortsContext, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {TerrainEditor} from '@/components/rac-editor/@modals/ui/editors/terrain/TerrainEditor.tsx';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

const pilotis: Record<string, HousePiloti> = {
  p1: {height: 1, isMaster: false, nivel: 0.2},
};

function renderTerrainEditor() {
  const ports = {
    settingsPort: {
      getSettings: () => APP_SETTINGS_DEFAULTS,
    },
  } as unknown as EditorPorts;

  return render(
    <EditorPortsContext.Provider value={ports}>
      <TerrainEditor
        isOpen
        isMobile={false}
        currentTerrainType={3}
        pilotis={pilotis}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    </EditorPortsContext.Provider>,
  );
}

describe('TerrainEditor.tsx', () => {
  it('exibe cama do item 3 e nomenclatura de pedras sem tipo de solo', () => {
    renderTerrainEditor();

    expect(screen.queryByText(/Tipo de Solo:/i)).not.toBeInTheDocument();
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeInTheDocument();
    expect(screen.getByText('Pedras (Rachão | Brita):')).toBeInTheDocument();
    expect(screen.queryByText('Pedras (Rachão + Brita):')).not.toBeInTheDocument();
  });
});
