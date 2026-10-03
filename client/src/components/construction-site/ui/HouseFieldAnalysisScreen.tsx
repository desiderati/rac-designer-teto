import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, RotateCw} from 'lucide-react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {HouseFieldAnalysisPreview} from '@/components/rac-editor/@canvas/ui/HouseFieldAnalysisPreview.tsx';
import {PilotiEditor} from '@/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.tsx';
import {NivelDefinitionEditor, type NivelDefinition} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';
import {PilotisSetupModal} from '@/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx';
import {HouseSideSelector} from '@/components/rac-editor/@modals/ui/selectors/HouseSideSelector.tsx';
import {HouseTypeSelector} from '@/components/rac-editor/@modals/ui/selectors/HouseTypeSelector.tsx';
import {
  addFieldAnalysisContraventamento,
  configureHouseFieldAnalysis,
  getFieldAnalysisContraventamentoState,
  getFieldAnalysisDestinations,
  removeFieldAnalysisContraventamento,
  updateFieldAnalysisPiloti,
} from '@/components/construction-site/lib/house-field-analysis.ts';
import {getHouseFamilyName} from '@/components/construction-site/ui/lib/view-model.ts';
import type {HousePilotiReadPort, HousePilotiWritePort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import type {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import {DEFAULT_HOUSE_PILOTI, DEFAULT_HOUSE_PILOTI_HEIGHTS, type HouseSide, type HouseType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {toast} from '@/components/ui/sonner.tsx';

type SetupStage = 'pilotis' | 'type' | 'side' | 'nivel' | 'saving-setup' | 'ready';
const SAVE_TOAST_WINDOW_MS = 10_000;

interface HouseFieldAnalysisScreenProps {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  initialDraft: HouseFieldAnalysisDraft;
  onSave(draft: HouseFieldAnalysisDraft): Promise<void>;
  onBack(): Promise<void>;
}

export function HouseFieldAnalysisScreen({
  constructionSite, house, initialDraft, onSave, onBack,
}: HouseFieldAnalysisScreenProps) {
  const {settingsPort} = useEditorPorts();
  const settings = settingsPort.getSettings();
  const [stage, setStage] = useState<SetupStage>(() => house.fieldAnalysis?.status === 'prepared'
    ? 'ready'
    : settings.allowPilotiHeightDefinitionOnHouseInsert ? 'pilotis' : 'type');
  const [draft, setDraft] = useState(initialDraft);
  const draftRef = useRef(initialDraft);
  const [selectedHeights, setSelectedHeights] = useState<number[]>(() =>
    settings.allowPilotiHeightDefinitionOnHouseInsert
      ? initialDraft.selectedPilotiHeights
      : [...DEFAULT_HOUSE_PILOTI_HEIGHTS]);
  const [houseType, setHouseType] = useState<Exclude<HouseType, null> | null>(null);
  const [selectedSide, setSelectedSide] = useState<HouseSide | null>(null);
  const [selectedPilotiId, setSelectedPilotiId] = useState(() => getAllPilotiIds()[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorRef = useRef<string | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveRevisionRef = useRef(0);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const transitionRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const familyName = getHouseFamilyName(constructionSite, house);
  const constructionSiteId = constructionSite.constructionSite.id;
  const pilotiIds = useMemo(() => getAllPilotiIds().filter((id) => Boolean(draft.house.pilotis[id])), [draft.house.pilotis]);
  const selectedPiloti = draft.house.pilotis[selectedPilotiId] ?? DEFAULT_HOUSE_PILOTI;
  const braceState = stage === 'ready' ? getFieldAnalysisContraventamentoState(draft, selectedPilotiId) : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (saveToastTimerRef.current !== null) clearTimeout(saveToastTimerRef.current);
      saveToastTimerRef.current = null;
    };
  }, []);

  const scheduleSaveToast = useCallback(() => {
    if (!mountedRef.current || saveToastTimerRef.current !== null) return;
    saveToastTimerRef.current = setTimeout(() => {
      saveToastTimerRef.current = null;
      if (!mountedRef.current || saveErrorRef.current) return;
      toast.success('Análise de Campo salva.', {
        id: `field-analysis-save-${constructionSiteId}-${house.id}`,
      });
    }, SAVE_TOAST_WINDOW_MS);
  }, [constructionSiteId, house.id]);

  const queueSave = useCallback((next: HouseFieldAnalysisDraft): Promise<void> => {
    const revision = ++saveRevisionRef.current;
    saveErrorRef.current = null;
    setSaveError(null);
    setIsSaving(true);
    const pending = saveQueueRef.current.catch(() => undefined).then(() => onSave(next));
    saveQueueRef.current = pending.then(() => {
      scheduleSaveToast();
      if (revision === saveRevisionRef.current) {
        saveErrorRef.current = null;
        setSaveError(null);
        setIsSaving(false);
      }
    }, (error: unknown) => {
      if (saveToastTimerRef.current !== null) clearTimeout(saveToastTimerRef.current);
      saveToastTimerRef.current = null;
      if (revision === saveRevisionRef.current) {
        const message = error instanceof Error && error.message.trim()
          ? error.message : 'Não foi possível salvar a preparação. Tente novamente.';
        saveErrorRef.current = message;
        setSaveError(message);
        setIsSaving(false);
      }
      throw error;
    });
    return saveQueueRef.current;
  }, [onSave, scheduleSaveToast]);

  const applyDraft = useCallback((next: HouseFieldAnalysisDraft) => {
    draftRef.current = next;
    setDraft(next);
    void queueSave(next).catch(() => undefined);
  }, [queueSave]);

  const finishSetup = useCallback(async (type: Exclude<HouseType, null>, side: HouseSide,
    cornerNiveis?: Record<string, NivelDefinition>) => {
    try {
      const configured = configureHouseFieldAnalysis(draftRef.current, {
        houseType: type,
        initialSide: side,
        selectedPilotiHeights: selectedHeights,
        cornerNiveis,
      });
      draftRef.current = configured;
      setDraft(configured);
      setStage('saving-setup');
      await queueSave(configured);
      setStage('ready');
    } catch (error) {
      if (!saveErrorRef.current) {
        const message = error instanceof Error ? error.message : 'Não foi possível configurar esta casa.';
        saveErrorRef.current = message;
        setSaveError(message);
      }
    }
  }, [queueSave, selectedHeights]);

  const retrySave = useCallback(async () => {
    try {
      await queueSave(draftRef.current);
      if (stage === 'saving-setup') setStage('ready');
    } catch {
      // O erro continua visível e a configuração local permanece disponível.
    }
  }, [queueSave, stage]);

  const leave = useCallback(async () => {
    if (isLeaving) return;
    if (stage === 'ready') {
      try { await saveQueueRef.current; } catch { return; }
      if (saveErrorRef.current) return;
    }
    setIsLeaving(true);
    try { await onBack(); }
    catch (error) {
      setIsLeaving(false);
      setSaveError(error instanceof Error ? error.message : 'Não foi possível voltar à lista de casas.');
    }
  }, [isLeaving, onBack, stage]);

  const pilotiReadPort = useMemo<HousePilotiReadPort>(() => ({
    getPilotis: () => draftRef.current.house.pilotis,
    getSelectedPilotiHeights: () => draftRef.current.selectedPilotiHeights,
    getPilotiData: (id) => draftRef.current.house.pilotis[id] ?? DEFAULT_HOUSE_PILOTI,
  }), []);
  const pilotiWritePort = useMemo<HousePilotiWritePort>(() => ({
    updatePiloti: (id, patch) => {
      const next = updateFieldAnalysisPiloti(draftRef.current, id, patch);
      applyDraft(next);
      return next.house.pilotis[id];
    },
    applyInitialPilotiNiveis: () => undefined,
    calculateAndApplyRecommendedHeights: () => undefined,
  }), [applyDraft]);

  const changeContraventamento = (side: ContraventamentoSide, destinationPilotiId?: string) => {
    try {
      const next = destinationPilotiId
        ? addFieldAnalysisContraventamento(draftRef.current, selectedPilotiId, destinationPilotiId, side)
        : removeFieldAnalysisContraventamento(draftRef.current, selectedPilotiId, side);
      applyDraft(next);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível atualizar o contraventamento.');
    }
  };

  return (
    <section aria-label={`Análise de Campo da casa ${familyName}`} aria-busy={isSaving}
      className='min-w-0 space-y-4 pb-8'>
      <div className='flex min-w-0 items-start gap-3'>
        <button type='button' aria-label='Voltar às casas' onClick={() => void leave()} disabled={isLeaving || isSaving || stage === 'saving-setup'}
          className='grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50'>
          <ArrowLeft className='h-5 w-5' aria-hidden='true'/>
        </button>
        <div className='min-w-0 flex-1'>
          <h1 className='break-words text-2xl font-semibold text-slate-950'>{familyName}</h1>
        </div>
      </div>

      {saveError ? (
        <div role='alert' className='rounded-xl bg-red-50 p-3 text-sm text-red-800'>
          <p>{saveError}</p>
          <button type='button' onClick={() => void retrySave()} disabled={isSaving}
            className='mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 py-2 font-semibold text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50'>
            <RotateCw className='h-4 w-4' aria-hidden='true'/> Tentar salvar novamente
          </button>
        </div>
      ) : null}

      {isSaving ? <span role='status' className='sr-only'>Salvando Análise de Campo…</span> : null}

      {stage === 'ready' ? (
        <>
          <div>
            <div className='min-w-0 overflow-hidden rounded-2xl bg-white p-2 shadow-sm' aria-label='Prévia ilustrativa da casa'>
              <HouseFieldAnalysisPreview draft={draft}/>
            </div>
          </div>
          <div>
            <PilotiEditor
              presentation='inline'
              isOpen
              isMobile
              onClose={() => undefined}
              pilotiId={selectedPilotiId}
              currentHeight={selectedPiloti.height}
              currentIsMaster={selectedPiloti.isMaster}
              currentNivel={selectedPiloti.nivel}
              pilotiIds={pilotiIds}
              selectedPilotiHeights={draft.selectedPilotiHeights}
              houseView='top'
              pilotiReadPort={pilotiReadPort}
              pilotiWritePort={pilotiWritePort}
              onHeightChange={() => undefined}
              onNavigate={(id) => setSelectedPilotiId(id)}
              contraventamentoLeftActive={braceState?.left.active}
              contraventamentoRightActive={braceState?.right.active}
              contraventamentoTopActive={braceState?.top.active}
              contraventamentoBottomActive={braceState?.bottom.active}
              contraventamentoLeftDisabled={braceState?.left.disabled}
              contraventamentoRightDisabled={braceState?.right.disabled}
              contraventamentoTopDisabled={braceState?.top.disabled}
              contraventamentoBottomDisabled={braceState?.bottom.disabled}
              getInlineContraventamentoDestinations={(side) => getFieldAnalysisDestinations(draftRef.current, selectedPilotiId, side)}
              onInlineContraventamentoChange={changeContraventamento}
            />
          </div>
        </>
      ) : null}

      {stage === 'pilotis' ? <PilotisSetupModal isOpen initialSelectedHeights={initialDraft.selectedPilotiHeights} onClose={() => void leave()}
        onConfirm={({selectedHeights: heights}) => { setSelectedHeights(heights); setStage('type'); }}/>
        : null}
      {stage === 'type' ? <HouseTypeSelector isOpen onClose={() => {
        if (transitionRef.current) { transitionRef.current = false; return; }
        void leave();
      }} onSelectType={(type) => {
        if (!type) return;
        transitionRef.current = true;
        setHouseType(type);
        setStage('side');
      }}/>
        : null}
      {stage === 'side' ? <HouseSideSelector isOpen houseViewType={houseType === 'tipo3' ? 'side2' : 'front'}
        onClose={() => {
          if (transitionRef.current) { transitionRef.current = false; return; }
          void leave();
        }}
        onSelectSide={(side) => {
          if (!houseType) return;
          transitionRef.current = true;
          setSelectedSide(side);
          if (settings.configureCornerPilotiNiveisOnHouseInsert) setStage('nivel');
          else void finishSetup(houseType, side);
        }}/>
        : null}
      {stage === 'nivel' ? <NivelDefinitionEditor isOpen selectedPilotiHeights={selectedHeights}
        onClose={() => void leave()}
        onApply={(niveis) => {
          if (houseType && selectedSide) void finishSetup(houseType, selectedSide, niveis);
        }}/>
        : null}
    </section>
  );
}
