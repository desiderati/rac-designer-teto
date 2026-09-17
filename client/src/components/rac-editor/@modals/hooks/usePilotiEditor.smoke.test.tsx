import {ReactNode} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  EditorPortsContext,
  type EditorPorts,
} from '@/bootstrap/editor-bootstrap.ts';
import {usePilotiEditor} from '@/components/rac-editor/@modals/hooks/usePilotiEditor.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import type {AppSettings} from '@/shared/types/settings.ts';

const defaultSettings: AppSettings = {
  autoNavigatePiloti: false,
  autoAdjustPilotiHeightsFromNivel: true,
  zoomEnabledByDefault: true,
  openEditorsAtFixedPosition: true,
  disableDrawModeAfterFreehand: false,
  configureCornerPilotiNiveisOnHouseInsert: true,
  allowPilotiHeightDefinitionOnHouseInsert: false,
  showStairsOnTopView: true,
  showPilotiLabelsOnTopView: true,
};

const pilotis: Record<string, HousePiloti> = {
  piloti_0_0: {height: 1, isMaster: true, nivel: 0.2},
};

function createEditorPorts(updatePiloti: ReturnType<typeof vi.fn>): EditorPorts {
  const settings = {...defaultSettings};

  return {
    houseReadPort: {
      getPilotis: vi.fn(() => pilotis),
      getSelectedPilotiHeights: vi.fn(() => [1, 1.5, 2]),
      getPilotiData: vi.fn((pilotiId: string) => pilotis[pilotiId] ?? pilotis.piloti_0_0),
    },
    houseWritePort: {
      updatePiloti,
      applyInitialPilotiNiveis: vi.fn(),
      calculateAndApplyRecommendedHeights: vi.fn(),
      refreshElevationNivelLabelsForCurrentSettings: vi.fn(),
    },
    settingsPort: {
      getSettings: vi.fn(() => settings),
      updateSetting: vi.fn((key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
        Object.assign(settings, {[key]: value});
      }),
    },
  } as unknown as EditorPorts;
}

function Wrapper({
  children,
  updatePiloti,
}: {
  children: ReactNode;
  updatePiloti: ReturnType<typeof vi.fn>;
}) {
  return (
    <EditorPortsContext.Provider value={createEditorPorts(updatePiloti)}>
      {children}
    </EditorPortsContext.Provider>
  );
}

function Harness() {
  const editor = usePilotiEditor({
    isOpen: true,
    onClose: vi.fn(),
    pilotiId: 'piloti_0_0',
    currentHeight: 1,
    currentIsMaster: true,
    currentNivel: 0.2,
    pilotiIds: ['piloti_0_0'],
    onHeightChange: vi.fn(),
  });

  return (
    <>
      <button type='button' onClick={() => editor.handleNivelChange(0.6)}>alterar draft</button>
      <button type='button' onClick={() => editor.commitDraftChanges()}>confirmar draft</button>
      <button type='button' onClick={() => editor.handleNivelModeToggle()}>alternar modo</button>
      <button type='button' onClick={() => editor.handleNivelCommit(0.5)}>confirmar slider</button>
    </>
  );
}

describe('usePilotiEditor', () => {
  it('recalcula altura recomendada ao confirmar draft de nivel no modo automatico', () => {
    const updatePiloti = vi.fn((pilotiId: string, patch: Partial<HousePiloti>) => ({
      ...pilotis[pilotiId],
      ...patch,
    }));

    render(
      <Wrapper updatePiloti={updatePiloti}>
        <Harness/>
      </Wrapper>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'alterar draft'}));
    fireEvent.click(screen.getByRole('button', {name: 'confirmar draft'}));

    expect(updatePiloti).toHaveBeenCalledWith('piloti_0_0', expect.objectContaining({
      height: 2,
      isMaster: true,
      nivel: 0.6,
    }));
  });

  it('usa o modo manual vigente ao confirmar slider logo apos sair do automatico', () => {
    const updatePiloti = vi.fn((pilotiId: string, patch: Partial<HousePiloti>) => ({
      ...pilotis[pilotiId],
      ...patch,
    }));

    render(
      <Wrapper updatePiloti={updatePiloti}>
        <Harness/>
      </Wrapper>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'alternar modo'}));
    fireEvent.click(screen.getByRole('button', {name: 'confirmar slider'}));

    expect(updatePiloti).toHaveBeenCalledWith('piloti_0_0', expect.objectContaining({
      height: 1,
      isMaster: true,
      nivel: 0.5,
    }));
  });
});
