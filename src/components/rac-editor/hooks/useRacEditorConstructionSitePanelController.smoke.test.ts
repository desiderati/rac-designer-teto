import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import type {
  useConstructionSiteManagementController,
} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {
  useRacEditorConstructionSitePanelController,
} from '@/components/rac-editor/hooks/useRacEditorConstructionSitePanelController.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';

type ConstructionSiteManagementController = ReturnType<typeof useConstructionSiteManagementController>;

function createConstructionSiteManagementController(
  overrides: Partial<ConstructionSiteManagementController> = {},
): ConstructionSiteManagementController {
  return {
    canOpenRacEditor: true,
    prepareRacEditorOpening: vi.fn(() => null),
    hydrateActiveHouseDocument: vi.fn(),
    notifyActiveHouseDocumentChanged: vi.fn(),
    flushActiveHouseDocumentSave: vi.fn(() => Promise.resolve()),
    actions: {
      activateHouse: vi.fn(() => null),
    },
    ...overrides,
  } as unknown as ConstructionSiteManagementController;
}

function renderController(constructionSiteManagement: ConstructionSiteManagementController) {
  const setActiveSubmenu = vi.fn();
  const setIsMenuOpen = vi.fn();
  const setConstructionSiteManagementOpen = vi.fn();
  const hook = renderHook(() => useRacEditorConstructionSitePanelController({
    constructionSiteManagement,
    setActiveSubmenu,
    setIsMenuOpen,
    setConstructionSiteManagementOpen,
  }));

  return {
    ...hook,
    setActiveSubmenu,
    setIsMenuOpen,
    setConstructionSiteManagementOpen,
  };
}

describe('useRacEditorConstructionSitePanelController.ts', () => {
  it('prepara a sessão ativa antes de voltar da gestão para o Canvas', () => {
    const document = {documentType: 'house-drawing-document'} as unknown as HouseDrawingDocument;
    const prepareRacEditorOpening = vi.fn(() => document);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    act(() => {
      result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).toHaveBeenCalledTimes(1);
    expect(setConstructionSiteManagementOpen).toHaveBeenCalledWith(false);
    expect(hydrateActiveHouseDocument).toHaveBeenCalledWith(document);
  });

  it('mantém a gestão aberta quando não existe casa apta para voltar ao Canvas', () => {
    const prepareRacEditorOpening = vi.fn(() => null);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    act(() => {
      result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).toHaveBeenCalledTimes(1);
    expect(setConstructionSiteManagementOpen).not.toHaveBeenCalled();
    expect(hydrateActiveHouseDocument).not.toHaveBeenCalled();
  });

  it('não prepara abertura quando a gestão informa que o Canvas está indisponível', () => {
    const prepareRacEditorOpening = vi.fn(() => null);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      canOpenRacEditor: false,
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    act(() => {
      result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).not.toHaveBeenCalled();
    expect(setConstructionSiteManagementOpen).not.toHaveBeenCalled();
    expect(hydrateActiveHouseDocument).not.toHaveBeenCalled();
  });
});
