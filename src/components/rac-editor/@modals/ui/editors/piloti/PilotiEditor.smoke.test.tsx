import {ReactNode} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {PilotiEditor} from './PilotiEditor.tsx';
import type {HousePiloti} from '@/shared/types/house.ts';
import type {AppSettings} from '@/shared/types/settings.ts';

const defaultSettings: AppSettings = {
  autoNavigatePiloti: false,
  autoAdjustPilotiHeightsFromNivel: true,
  zoomEnabledByDefault: true,
  openEditorsAtFixedPosition: true,
  disableDrawModeAfterFreehand: false,
  showStairsOnTopView: true,
  showPilotiLabelsOnTopView: true,
};

const pilotis: Record<string, HousePiloti> = {
  piloti_0_0: {height: 1, isMaster: true, nivel: 0.2},
  piloti_1_0: {height: 1, isMaster: false, nivel: 0.2},
};

function createEditorPorts(input: {
  settings?: Partial<AppSettings>;
  updatePiloti?: ReturnType<typeof vi.fn>;
} = {}): EditorPorts {
  const settings = {
    ...defaultSettings,
    ...input.settings,
  };
  const updatePiloti = input.updatePiloti ?? vi.fn((pilotiId: string, patch: Partial<HousePiloti>) => ({
    ...pilotis[pilotiId],
    ...patch,
  }));

  return {
    houseReadPort: {
      getPilotis: vi.fn(() => pilotis),
      getSelectedPilotiHeights: vi.fn(() => [1, 1.5, 2]),
      getPilotiData: vi.fn((pilotiId: string) => pilotis[pilotiId] ?? pilotis.piloti_0_0),
    },
    houseWritePort: {
      updatePiloti,
      calculateAndApplyRecommendedHeights: vi.fn(),
    },
    settingsPort: {
      getSettings: vi.fn(() => settings),
      updateSetting: vi.fn(),
    },
  } as unknown as EditorPorts;
}

function createWrapper(input: Parameters<typeof createEditorPorts>[0] = {}) {
  return function Wrapper({children}: { children: ReactNode }) {
    return (
      <EditorPortsContext.Provider value={createEditorPorts(input)}>
        {children}
      </EditorPortsContext.Provider>
    );
  };
}

function Wrapper({children}: { children: ReactNode }) {
  return (
    <EditorPortsContext.Provider value={createEditorPorts()}>
      {children}
    </EditorPortsContext.Provider>
  );
}

describe('PilotiEditor.tsx', () => {
  it('permite editar o nível de piloti não extremo no modo manual', () => {
    const updatePiloti = vi.fn((pilotiId: string, patch: Partial<HousePiloti>) => ({
      ...pilotis[pilotiId],
      ...patch,
    }));

    render(
      <PilotiEditor
        isOpen
        onClose={vi.fn()}
        pilotiId='piloti_1_0'
        currentHeight={1}
        currentIsMaster={false}
        currentNivel={0.2}
        pilotiIds={['piloti_0_0', 'piloti_1_0']}
        selectedPilotiHeights={[1, 1.5, 2]}
        isMobile={false}
        onHeightChange={vi.fn()}
      />,
      {
        wrapper: createWrapper({
          settings: {autoAdjustPilotiHeightsFromNivel: false},
          updatePiloti,
        }),
      },
    );

    expect(screen.getByText('Nível do Piloti (Manual)')).toBeVisible();

    const nivelEditor = screen.getByLabelText('Nível do piloti em metros');
    nivelEditor.textContent = '040';
    fireEvent.input(nivelEditor);
    fireEvent.blur(nivelEditor);

    expect(updatePiloti).toHaveBeenCalledWith('piloti_1_0', expect.objectContaining({
      height: 1,
      isMaster: false,
      nivel: 0.4,
    }));
  });

  it('mantém o nível de piloti não extremo oculto no modo automático', () => {
    render(
      <PilotiEditor
        isOpen
        onClose={vi.fn()}
        pilotiId='piloti_1_0'
        currentHeight={1}
        currentIsMaster={false}
        currentNivel={0.2}
        pilotiIds={['piloti_0_0', 'piloti_1_0']}
        selectedPilotiHeights={[1, 1.5, 2]}
        isMobile={false}
        onHeightChange={vi.fn()}
      />,
      {wrapper: Wrapper},
    );

    expect(screen.queryByText('Nível do Piloti (Auto)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nível do piloti em metros')).not.toBeInTheDocument();
  });

  it('mantém o botão horizontal superior visível e desabilitado quando a linha só permite inferior', () => {
    render(
      <PilotiEditor
        isOpen
        onClose={vi.fn()}
        pilotiId='piloti_0_0'
        currentHeight={1}
        currentIsMaster
        currentNivel={0.2}
        pilotiIds={['piloti_0_0', 'piloti_1_0']}
        selectedPilotiHeights={[1, 1.5, 2]}
        isMobile={false}
        onHeightChange={vi.fn()}
        contraventamentoLeftDisabled={false}
        contraventamentoRightDisabled={false}
        contraventamentoTopDisabled
        contraventamentoBottomDisabled={false}
      />,
      {wrapper: Wrapper},
    );

    expect(screen.getByRole('button', {name: 'Superior'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Inferior'})).toBeEnabled();
    expect(screen.queryByText('Superior')).not.toBeInTheDocument();
    expect(screen.queryByText('Inferior')).not.toBeInTheDocument();
  });
});
