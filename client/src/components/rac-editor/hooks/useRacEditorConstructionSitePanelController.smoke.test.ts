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
  it('prepara a sessão ativa antes de voltar da gestão para o Canvas', async () => {
    const document = {documentType: 'house-drawing-document'} as unknown as HouseDrawingDocument;
    const prepareRacEditorOpening = vi.fn(() => document);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    await act(async () => {
      await result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).toHaveBeenCalledTimes(1);
    expect(setConstructionSiteManagementOpen).toHaveBeenCalledWith(false);
    expect(hydrateActiveHouseDocument).toHaveBeenCalledWith(document);
  });

  it('mantém a gestão aberta quando não existe casa apta para voltar ao Canvas', async () => {
    const prepareRacEditorOpening = vi.fn(() => null);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    await act(async () => {
      await result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).toHaveBeenCalledTimes(1);
    expect(setConstructionSiteManagementOpen).not.toHaveBeenCalled();
    expect(hydrateActiveHouseDocument).not.toHaveBeenCalled();
  });

  it('não prepara abertura quando a gestão informa que o Canvas está indisponível', async () => {
    const prepareRacEditorOpening = vi.fn(() => null);
    const hydrateActiveHouseDocument = vi.fn();
    const constructionSiteManagement = createConstructionSiteManagementController({
      canOpenRacEditor: false,
      prepareRacEditorOpening,
      hydrateActiveHouseDocument,
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    await act(async () => {
      await result.current.closeConstructionSiteManagement();
    });

    expect(prepareRacEditorOpening).not.toHaveBeenCalled();
    expect(setConstructionSiteManagementOpen).not.toHaveBeenCalled();
    expect(hydrateActiveHouseDocument).not.toHaveBeenCalled();
  });

  it('restaura a casa que estava no Canvas antes de Adicionar casa', async () => {
    const document = {documentType: 'house-drawing-document'} as unknown as HouseDrawingDocument;
    const activateHouse = vi.fn().mockResolvedValue(null);
    const activateConstructionSite = vi.fn().mockResolvedValue(null);
    const flushActiveHouseDocumentSave = vi.fn().mockResolvedValue(undefined);
    const constructionSiteManagement = createConstructionSiteManagementController({
      constructionSite: {constructionSite: {id: 'origem', activeHouseId: 'casa-anterior'}, houses: [{id: 'casa-anterior', status: 'draft'}]} as ConstructionSiteManagementController['constructionSite'],
      summaries: [{id: 'destino', status: 'in_progress'}] as ConstructionSiteManagementController['summaries'],
      actions: {activateHouse, activateConstructionSite} as unknown as ConstructionSiteManagementController['actions'],
      flushActiveHouseDocumentSave,
      prepareRacEditorOpening: vi.fn(() => document),
    });
    const {result, setConstructionSiteManagementOpen} = renderController(constructionSiteManagement);

    await act(async () => {await result.current.handleAddHouse('destino');});
    expect(flushActiveHouseDocumentSave.mock.invocationCallOrder[0]).toBeLessThan(activateConstructionSite.mock.invocationCallOrder[0]);
    expect(activateConstructionSite).toHaveBeenCalledWith('destino');
    expect(result.current.constructionSiteManagementInitialScreen).toBe('house-create');

    await act(async () => {await result.current.closeConstructionSiteManagement();});
    expect(activateHouse).toHaveBeenCalledWith('origem', 'casa-anterior');
    expect(setConstructionSiteManagementOpen).toHaveBeenCalledWith(false);
    expect(constructionSiteManagement.hydrateActiveHouseDocument).toHaveBeenCalledWith(document);
  });
});
