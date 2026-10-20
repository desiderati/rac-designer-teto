import {fireEvent, render, screen} from '@testing-library/react';
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
  it('mantém o tipo e os volumes no painel compacto sem título e aplica o slider ao mudar', () => {
    const onApply = vi.fn(), onClose = vi.fn();
    render(<TerrainEditor isOpen isMobile presentation='mobile-panel' currentTerrainType={3}
      pilotis={pilotis} onApply={onApply} onClose={onClose}/>);
    expect(screen.getByRole('dialog', {name: 'Editar Terreno'})).toBeVisible();
    expect(screen.queryByText('Terreno')).not.toBeInTheDocument();
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeVisible();
    expect(screen.getByText('Pedras (Rachão | Brita):')).toBeVisible();
    const slider = screen.getByRole('slider', {name: 'Tipo de terreno'});
    fireEvent.keyDown(slider, {key: 'ArrowLeft'});
    expect(onApply).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledTimes(1);
  });
  it('exibe cama do item 3 e nomenclatura de pedras sem tipo de solo', () => {
    renderTerrainEditor();

    expect(screen.queryByText(/Tipo de Solo:/i)).not.toBeInTheDocument();
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeInTheDocument();
    expect(screen.getByText('Pedras (Rachão | Brita):')).toBeInTheDocument();
    expect(screen.queryByText('Pedras (Rachão + Brita):')).not.toBeInTheDocument();
  });
});
