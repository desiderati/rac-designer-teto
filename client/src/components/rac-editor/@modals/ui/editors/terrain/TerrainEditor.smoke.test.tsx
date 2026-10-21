import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {EditorPortsContext, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {TerrainEditor} from '@/components/rac-editor/@modals/ui/editors/terrain/TerrainEditor.tsx';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import type {PropsWithChildren} from 'react';

const pilotis: Record<string, HousePiloti> = {
  p1: {height: 1, isMaster: false, nivel: 0.2},
};

function EditorTestProvider({children}: PropsWithChildren) {
  const ports = {settingsPort: {getSettings: () => APP_SETTINGS_DEFAULTS}} as unknown as EditorPorts;
  return <EditorPortsContext.Provider value={ports}>{children}</EditorPortsContext.Provider>;
}

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
  it.each(['mobile-panel', 'floating'] as const)('aplica o rascunho somente ao confirmar em %s', presentation => {
    const onApply = vi.fn(), onClose = vi.fn();
    render(<TerrainEditor isOpen isMobile presentation={presentation} currentTerrainType={3}
      pilotis={pilotis} onApply={onApply} onClose={onClose}/>, {wrapper: EditorTestProvider});
    if (presentation === 'mobile-panel') {
      expect(screen.getByRole('dialog', {name: 'Editar Terreno'})).toBeVisible();
      expect(screen.queryByText('Terreno')).not.toBeInTheDocument();
    }
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeVisible();
    expect(screen.getByText('Pedras (Rachão | Brita):')).toBeVisible();
    const slider = screen.getByRole('slider', {name: 'Tipo de terreno'});
    fireEvent.keyDown(slider, {key: 'ArrowLeft'});
    expect(slider).toHaveAttribute('aria-valuenow', '2');
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
    expect(onApply).toHaveBeenCalledWith(2);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it.each(['mobile-panel', 'floating'] as const)('descarta o rascunho ao cancelar e reabrir em %s', presentation => {
    const onApply = vi.fn(), onClose = vi.fn();
    const props = {isMobile: true, presentation, currentTerrainType: 3, pilotis, onApply, onClose};
    const {rerender} = render(<TerrainEditor {...props} isOpen/>, {wrapper: EditorTestProvider});
    fireEvent.keyDown(screen.getByRole('slider', {name: 'Tipo de terreno'}), {key: 'ArrowRight'});
    expect(screen.getByRole('slider', {name: 'Tipo de terreno'})).toHaveAttribute('aria-valuenow', '4');
    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
    rerender(<TerrainEditor {...props} isOpen={false}/>);
    rerender(<TerrainEditor {...props} isOpen/>);
    expect(screen.getByRole('slider', {name: 'Tipo de terreno'})).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeVisible();
  });
  it('exibe cama do item 3 e nomenclatura de pedras sem tipo de solo', () => {
    renderTerrainEditor();

    expect(screen.queryByText(/Tipo de Solo:/i)).not.toBeInTheDocument();
    expect(screen.getByText('Cama de rachão: 20 cm')).toBeInTheDocument();
    expect(screen.getByText('Pedras (Rachão | Brita):')).toBeInTheDocument();
    expect(screen.queryByText('Pedras (Rachão + Brita):')).not.toBeInTheDocument();
  });
});
