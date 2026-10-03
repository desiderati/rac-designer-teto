import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {EditorPortsContext, EditorStoreContext, createEditorStore, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import {DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import type {AppSettings} from '@/shared/types/settings.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {configureHouseFieldAnalysis, createHouseFieldAnalysisDraft} from '@/components/construction-site/lib/house-field-analysis.ts';
import {HouseFieldAnalysisScreen} from './HouseFieldAnalysisScreen.tsx';
import {toast} from '@/components/ui/sonner.tsx';

vi.mock('@/components/rac-editor/@canvas/ui/HouseFieldAnalysisPreview.tsx', () => ({
  HouseFieldAnalysisPreview: () => <div data-testid='field-analysis-preview'>Planta</div>,
}));
vi.mock('@/components/ui/sonner.tsx', () => ({toast: {success: vi.fn()}}));

function fixture(prepared: boolean) {
  const house = {
    id: 'house_1', familyId: 'family_1', constructionSiteId: 'site_1', houseType: null, terrainType: 1,
    status: 'draft', designSettings: {selectedPilotiHeights: [...DEFAULT_HOUSE_PILOTI_HEIGHTS]},
    drawingDocument: {house: null, canvas: {objects: []}},
    ...(prepared ? {fieldAnalysis: {status: 'prepared', contraventamentos: []}} : {}),
  } as PersistedHouseRecord;
  const constructionSite = {
    constructionSite: {id: 'site_1', status: 'in_progress'},
    families: [{id: 'family_1', name: 'Família Souza'}],
    houses: [house],
  } as ConstructionSiteState;
  const initialDraft = createHouseFieldAnalysisDraft(house);
  const draft = prepared ? configureHouseFieldAnalysis(initialDraft, {
    houseType: 'tipo6', initialSide: 'top', selectedPilotiHeights: [...DEFAULT_HOUSE_PILOTI_HEIGHTS],
  }) : initialDraft;
  return {house, constructionSite, draft};
}

function renderScreen({prepared = true, onSave = vi.fn().mockResolvedValue(undefined),
  onBack = vi.fn().mockResolvedValue(undefined), settings = APP_SETTINGS_DEFAULTS}: {
  prepared?: boolean;
  onSave?: (draft: ReturnType<typeof createHouseFieldAnalysisDraft>) => Promise<void>;
  onBack?: () => Promise<void>;
  settings?: AppSettings;
} = {}) {
  const {house, constructionSite, draft} = fixture(prepared);
  const ports = {settingsPort: {getSettings: () => settings, updateSetting: vi.fn()}} as unknown as EditorPorts;
  const rendered = render(
    <EditorStoreContext.Provider value={createEditorStore()}>
      <EditorPortsContext.Provider value={ports}>
        <HouseFieldAnalysisScreen constructionSite={constructionSite} house={house}
          initialDraft={draft} onSave={onSave} onBack={onBack}/>
      </EditorPortsContext.Provider>
    </EditorStoreContext.Provider>,
  );
  return {onSave, onBack, unmount: rendered.unmount};
}

describe('HouseFieldAnalysisScreen', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  it('retoma a preparação com prévia, controles embutidos e retorno à lista', async () => {
    const {onBack, onSave} = renderScreen();
    expect(screen.getByRole('heading', {level: 1, name: 'Família Souza'})).toBeVisible();
    expect(screen.getByRole('region', {name: 'Análise de Campo da casa Família Souza'})).toBeVisible();
    expect(screen.queryByRole('heading', {name: 'Análise de Campo'})).not.toBeInTheDocument();
    expect(screen.queryByText('Casa de Família Souza')).not.toBeInTheDocument();
    expect(screen.getByTestId('field-analysis-preview')).toBeVisible();
    expect(screen.getByRole('region', {name: 'Editor do item selecionado'})).toBeVisible();
    expect(screen.getByRole('button', {name: 'Piloti anterior'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Próximo piloti'})).toBeEnabled();
    for (const copy of ['Vista superior', 'Alterações salvas', 'Prévia ilustrativa. Ajuste os pilotis nos controles abaixo.',
      'Configuração de pilotis', 'Navegue entre os pilotis e confirme os ajustes para a futura inserção no Canvas.']) {
      expect(screen.queryByText(copy)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Piloti selecionado:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Escolha o Tipo de Casa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Voltar às casas'}));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(onSave).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('mantém a edição visível quando salvar falha e permite tentar novamente', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('Falha ao salvar.')).mockResolvedValue(undefined);
    renderScreen({onSave});
    fireEvent.click(screen.getByRole('button', {name: '1,2'}));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar.');
    expect(screen.getByTestId('field-analysis-preview')).toBeVisible();
    expect(toast.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Tentar salvar novamente'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('agrupa confirmações por janela fixa de 10 segundos sem prolongá-la', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const {unmount} = renderScreen({onSave});
    vi.useFakeTimers();

    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,2'})); });
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(6_000); });
    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,5'})); });
    expect(onSave).toHaveBeenCalledTimes(2);
    await act(async () => { vi.advanceTimersByTime(3_999); });
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Análise de Campo salva.', {
      id: 'field-analysis-save-site_1-house_1',
    });

    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,8'})); });
    expect(onSave).toHaveBeenCalledTimes(3);
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(toast.success).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('cancela o aviso pendente se uma gravação posterior falhar', async () => {
    const onSave = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Falha ao salvar.'));
    const {unmount} = renderScreen({onSave});
    vi.useFakeTimers();

    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,2'})); });
    await act(async () => { vi.advanceTimersByTime(5_000); });
    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,5'})); });
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar.');
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(toast.success).not.toHaveBeenCalled();
    unmount();
  });

  it('cancela o aviso pendente ao desmontar a tela', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const {unmount} = renderScreen({onSave});
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole('button', {name: '1,2'})); });
    expect(onSave).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('conclui as escolhas iniciais antes de gravar e apresentar a planta', async () => {
    const settings = {...APP_SETTINGS_DEFAULTS, configureCornerPilotiNiveisOnHouseInsert: false};
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderScreen({prepared: false, settings, onSave});

    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Casa Tipo 6'}));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Superior'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('field-analysis-preview')).toBeVisible();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('não grava o setup interrompido após as etapas opcionais', async () => {
    const settings = {...APP_SETTINGS_DEFAULTS, allowPilotiHeightDefinitionOnHouseInsert: true};
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn().mockResolvedValue(undefined);
    renderScreen({prepared: false, settings, onSave, onBack});

    expect(screen.getByText('Pilotis')).toBeVisible();
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar'}));
    fireEvent.click(screen.getByRole('button', {name: 'Casa Tipo 3'}));
    fireEvent.click(screen.getByRole('button', {name: 'Esquerdo'}));
    expect(await screen.findByText('Piloti A1')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(onSave).not.toHaveBeenCalled();
  });
});
