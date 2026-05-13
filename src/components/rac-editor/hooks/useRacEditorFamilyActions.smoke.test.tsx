import {ReactNode} from 'react';
import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {
  createEditorPorts,
  EditorPorts,
  EditorPortsContext,
} from '@/bootstrap/editor-bootstrap.ts';
import type {StoredConstructionSitesDocument} from '@/components/rac-editor/lib/construction-site-session.ts';
import {useRacEditorFamilyActions} from '@/components/rac-editor/hooks/useRacEditorFamilyActions.ts';

function createStorage() {
  let constructionSites: StoredConstructionSitesDocument['constructionSites'] = [];

  return {
    read: vi.fn(() => ({version: 1, constructionSites})),
    write: vi.fn((nextConstructionSites: StoredConstructionSitesDocument['constructionSites']) => {
      constructionSites = nextConstructionSites;
    }),
  };
}

function createWrapper(houseWritePort: Partial<EditorPorts['houseWritePort']>) {
  const defaultPorts = createEditorPorts({
    constructionSiteSessionStorage: createStorage(),
  });
  const ports: EditorPorts = {
    ...defaultPorts,
    houseWritePort: {
      ...defaultPorts.houseWritePort,
      ...houseWritePort,
    },
  };

  return function Wrapper({children}: { children: ReactNode }) {
    return (
      <EditorPortsContext.Provider value={ports}>
        {children}
      </EditorPortsContext.Provider>
    );
  };
}

describe('useRacEditorFamilyActions', () => {
  it('aplica pilotis e abre a seleção de tipo de casa depois da confirmação', () => {
    const applyPilotisSetup = vi.fn();
    const setPilotisSetupOpen = vi.fn();
    const setHouseTypeSelectorOpen = vi.fn();
    const {result} = renderHook(() => useRacEditorFamilyActions({
      setPilotisSetupOpen,
      setHouseTypeSelectorOpen,
    }), {
      wrapper: createWrapper({applyPilotisSetup}),
    });

    act(() => {
      result.current.handlePilotisSetupConfirm({
        selectedHeights: [1, 1.2, 1.5, 2, 2.5, 3],
      });
    });

    expect(applyPilotisSetup).toHaveBeenCalledWith({
      selectedPilotiHeights: [1, 1.2, 1.5, 2, 2.5, 3],
    });
    expect(setPilotisSetupOpen).toHaveBeenCalledWith(false);
    expect(setHouseTypeSelectorOpen).toHaveBeenCalledWith(true);
  });
});
