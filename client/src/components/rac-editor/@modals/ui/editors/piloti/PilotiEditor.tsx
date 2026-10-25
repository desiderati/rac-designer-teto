import {useEffect, useState, type ReactNode} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {PilotiGridIcon} from './PilotiGridIcon.tsx';
import {
  ContraventamentoHorizontalSideIcon,
  ContraventamentoSideIcon,
} from '@/components/rac-editor/@modals/ui/editors/piloti/ContraventamentoSideIcon.tsx';
import {usePilotiEditor} from '../../../hooks/usePilotiEditor.ts';
import type {
  ContraventamentoSide,
  ContraventamentoHorizontalSide,
  ContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {FloatingEditor} from '@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx';
import {CanvasSideEditorPanel} from '../CanvasSideEditorPanel.tsx';
import {NivelSlider} from '@/components/rac-editor/@modals/ui/editors/NivelSlider.tsx';
import {nivelInputDigitsToValue} from '../nivel-input-format.ts';
import {PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';
import type {HousePilotiReadPort, HousePilotiWritePort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import {HouseFieldAnalysisPreview} from '@/components/rac-editor/@canvas/ui/HouseFieldAnalysisPreview.tsx';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import './PilotiEditor.css';

interface PilotiEditorProps {
  presentation?: 'floating' | 'inline' | 'mobile-panel';
  previewDraft?: HouseFieldAnalysisDraft | null;
  destinationPilotiIds?: readonly string[];
  onDestinationPilotiSelect?: (id: string) => void;
  onCancelDestination?: () => void;
  pilotiReadPort?: HousePilotiReadPort;
  pilotiWritePort?: HousePilotiWritePort;
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster?: boolean;
  currentNivel?: number;
  pilotiIds: readonly string[];
  selectedPilotiHeights: readonly number[];
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  houseView?: 'top' | 'front' | 'back' | 'side';
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
  contraventamentoLeftDisabled?: boolean;
  contraventamentoRightDisabled?: boolean;
  contraventamentoTopDisabled?: boolean;
  contraventamentoBottomDisabled?: boolean;
  contraventamentoLeftActive?: boolean;
  contraventamentoRightActive?: boolean;
  contraventamentoTopActive?: boolean;
  contraventamentoBottomActive?: boolean;
  onContraventamentoSelect?: (side: ContraventamentoVerticalSide, pilotiId?: string) => void;
  onHorizontalContraventamentoSelect?: (side: ContraventamentoHorizontalSide, pilotiId?: string) => void;
}

export function PilotiEditor({
  presentation = 'floating',
  previewDraft,
  destinationPilotiIds,
  onDestinationPilotiSelect,
  onCancelDestination,
  pilotiReadPort,
  pilotiWritePort,
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster = false,
  currentNivel = PILOTI_DEFAULT_NIVEL,
  pilotiIds,
  selectedPilotiHeights,
  isMobile,
  anchorPosition,
  onHeightChange,
  onNavigate,
  contraventamentoLeftDisabled = true,
  contraventamentoRightDisabled = true,
  contraventamentoTopDisabled = true,
  contraventamentoBottomDisabled = true,
  contraventamentoLeftActive = false,
  contraventamentoRightActive = false,
  contraventamentoTopActive = false,
  contraventamentoBottomActive = false,
  onContraventamentoSelect,
  onHorizontalContraventamentoSelect
}: PilotiEditorProps) {
  const [mobileTab, setMobileTab] = useState<MobilePilotiTab>('nivel');
  const [nivelDraftDigits, setNivelDraftDigits] = useState<string>();
  useEffect(() => {setNivelDraftDigits(undefined);}, [pilotiId, currentNivel, isOpen]);
  const {
    tempHeight,
    tempIsMaster,
    setTempIsMaster,
    tempNivel,
    clickedHeight,
    hasPrev,
    hasNext,
    pilotiName,
    isCornerPiloti,
    masterPilotiName,
    maxNivel,
    autoAdjustPilotiHeightsFromNivel,
    handleNivelModeToggle,
    handleNavigate,
    handleSelectPiloti,
    handleCancel,
    handleNivelChange,
    handleNivelCommit,
    handleNivelIncrement,
    handleHeightClick,
    commitDraftChanges,
    getHeightButtonClasses,
    getContraventamentoButtonClasses,
  } = usePilotiEditor({
    isOpen,
    onClose,
    pilotiId,
    currentHeight,
    currentIsMaster,
    currentNivel,
    pilotiIds,
    onHeightChange,
    onNavigate,
    pilotiReadPort,
    pilotiWritePort,
    autoNavigateOnHeightClick: presentation !== 'mobile-panel',
  });

  if (!isOpen) return null;

  const confirmDraft = () => {
    commitDraftChanges({nivelOverride: nivelDraftDigits === undefined ? undefined : nivelInputDigitsToValue(nivelDraftDigits)});
    onClose();
  };
  const changeDraftDigits = (digits: string) => {
    setNivelDraftDigits(digits);
    const value = nivelInputDigitsToValue(digits);
    if (value >= 0.2 && value <= maxNivel) handleNivelChange(value);
  };

  // ---- Shared content renderers (inline to avoid remount/focus-loss) ----
  const canEditNivel = isCornerPiloti || !autoAdjustPilotiHeightsFromNivel;
  const isInline = presentation === 'inline';
  const isMobilePanel = presentation === 'mobile-panel';
  const choiceGridClasses = 'grid w-full grid-cols-4 gap-2';
  const choiceSizeClasses = isMobilePanel ? ' !h-auto !w-full aspect-square' : ' !h-[60px] !w-[60px]';
  const onBraceClick = (side: ContraventamentoSide) => {
    commitDraftChanges();
    if (side === 'left' || side === 'right') onContraventamentoSelect?.(side, pilotiId ?? undefined);
    else onHorizontalContraventamentoSelect?.(side, pilotiId ?? undefined);
  };

  const editorContent = (
    <>
      <div className='piloti-master-control flex items-center justify-between'>
        <Label htmlFor='is-master' className='text-sm font-medium select-none'>Definir como Mestre?</Label>
        <Switch id='is-master' checked={tempIsMaster} disabled={!isCornerPiloti}
          onCheckedChange={(checked) => {
            setTempIsMaster(checked);
            commitDraftChanges({isMasterOverride: checked});
          }}/>
      </div>
      <Separator className='piloti-master-separator'/>
      <div className={isMobilePanel ? 'piloti-mobile-sections' : 'piloti-inline-layout'}>
        <section id={isMobilePanel ? 'piloti-mobile-tab-nivel' : undefined} role={isMobilePanel ? 'tabpanel' : undefined}
          aria-labelledby={isMobilePanel ? 'piloti-mobile-trigger-nivel' : undefined}
          className={!isMobilePanel ? 'piloti-inline-level' : undefined}>
          <NivelSlider
            disabled={!canEditNivel}
            autoFocusInput={isOpen && canEditNivel && !autoAdjustPilotiHeightsFromNivel && !isMobilePanel}
            focusKey={pilotiId}
            nivel={tempNivel}
            minNivel={0.20}
            maxNivel={maxNivel}
            onNivelIncrement={handleNivelIncrement}
            onNivelChange={handleNivelChange}
            onNivelCommit={handleNivelCommit}
            enableInput autoMode={autoAdjustPilotiHeightsFromNivel}
            draftDigits={nivelDraftDigits} onDraftDigitsChange={changeDraftDigits}
            onAutoModeToggle={handleNivelModeToggle}
            showModeTourTarget={!isMobile && !isMobilePanel}
            compactStepper compactLayout={isMobilePanel}/>
        </section>
        <section id={isMobilePanel ? 'piloti-mobile-tab-tamanho' : undefined} role={isMobilePanel ? 'tabpanel' : undefined}
          aria-labelledby={isMobilePanel ? 'piloti-mobile-trigger-tamanho' : undefined}
          className={!isMobilePanel ? 'piloti-inline-sizes' : undefined}>

          <div className='space-y-4'>
            <p className='piloti-inline-heading text-sm font-medium text-center'>Tamanho dos Pilotis</p>
            <div className={!isMobilePanel ? 'piloti-inline-size-choices' : choiceGridClasses}>
              {selectedPilotiHeights.map((h) => <button key={h} type='button'
                aria-label={isMobilePanel ? `Piloti de ${formatPilotiHeight(h)} metros` : undefined}
                aria-pressed={tempHeight === h}
                onClick={() => handleHeightClick(h)} disabled={clickedHeight !== null}
                className={`${getHeightButtonClasses(h, {compact: true})}${choiceSizeClasses}`}>
                {formatPilotiHeight(h)}
              </button>)}
            </div>
          </div>
        </section>
        <section id={isMobilePanel ? 'piloti-mobile-tab-contraventamento' : undefined}
          role={isMobilePanel ? 'tabpanel' : undefined}
          aria-labelledby={isMobilePanel ? 'piloti-mobile-trigger-contraventamento' : undefined}
          className={!isMobilePanel ? 'piloti-inline-braces' : undefined}>

          <div className={isInline ? 'space-y-4' : 'space-y-3'}>
            <p className='piloti-inline-heading text-sm font-medium text-center'>{isMobilePanel ? 'Inserir Contraventamento' : 'Contraventamento'}</p>
            <div className={!isMobilePanel ? 'piloti-inline-brace-choices' : choiceGridClasses}>
              {([
                ['left', 'Esquerdo', contraventamentoLeftDisabled, contraventamentoLeftActive],
                ['right', 'Direito', contraventamentoRightDisabled, contraventamentoRightActive],
                ['top', 'Superior', contraventamentoTopDisabled, contraventamentoTopActive],
                ['bottom', 'Inferior', contraventamentoBottomDisabled, contraventamentoBottomActive],
              ] as const).map(([side, label, disabled, active]) => <button key={side} type='button'
                aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={() => onBraceClick(side)}
                className={getContraventamentoButtonClasses(active, disabled) + choiceSizeClasses}>
                <span aria-hidden='true' className='flex items-center justify-center'>
                  {side === 'left' || side === 'right'
                    ? <ContraventamentoSideIcon side={side} size={34}/>
                    : <ContraventamentoHorizontalSideIcon side={side} size={34}/>}
                </span>
              </button>)}
            </div>
          </div>
        </section>
      </div>
    </>
  );

  if (isMobilePanel) {
    return <PilotiMobilePanel tab={mobileTab} onTabChange={setMobileTab}
      selectedPilotiId={pilotiId} previewDraft={previewDraft}
      destinationPilotiIds={destinationPilotiIds} onCancelDestination={onCancelDestination}
      onSelectPiloti={(id) => destinationPilotiIds !== undefined
        ? onDestinationPilotiSelect?.(id) : handleSelectPiloti(id)}
      onClose={() => {if (destinationPilotiIds !== undefined) onCancelDestination?.(); confirmDraft();}}
      content={editorContent}/>;
  }

  return (
    <FloatingEditor
      presentation={presentation}
      headerTone='section'
      className='rac-piloti-floating-editor'
      header={presentation === 'inline' ? undefined :
        <div className='piloti-editor-header flex items-center gap-3'>
          <PilotiGridIcon
            selectedPiloti={pilotiName}
            masterPiloti={masterPilotiName}
            className='w-16 h-12 flex-shrink-0'/>

          <span className='font-bold text-2xl flex-1 text-center'>Piloti {pilotiName}</span>

          <div className='flex items-center gap-1 select-none'>
            <Button
              variant='outline'
              size='icon'
              aria-label='Piloti anterior'
              onClick={() => handleNavigate('prev')}
              disabled={!hasPrev}
              className='h-8 w-8 rounded-full bg-white disabled:pointer-events-auto disabled:cursor-not-allowed'>
              <FontAwesomeIcon icon={faChevronLeft} className='h-3 w-3'/>
            </Button>

            <Button
              variant='outline'
              size='icon'
              aria-label='Próximo piloti'
              onClick={() => handleNavigate('next')}
              disabled={!hasNext}
              className='h-8 w-8 rounded-full bg-white disabled:pointer-events-auto disabled:cursor-not-allowed'>
              <FontAwesomeIcon icon={faChevronRight} className='h-3 w-3'/>
            </Button>
          </div>
        </div>
      }
      cardContent={presentation === 'inline' ? editorContent : <div className='piloti-floating-card'>{editorContent}</div>}
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      dataGuidedTourId='rac-piloti-editor'
      onConfirm={confirmDraft}
      onCancel={handleCancel}
    />
  );
}

type MobilePilotiTab = 'nivel' | 'tamanho' | 'contraventamento';

function PilotiMobilePanel({
  tab, onTabChange, selectedPilotiId, previewDraft, destinationPilotiIds,
  onSelectPiloti, onCancelDestination, onClose, content,
}: {
  tab: MobilePilotiTab;
  onTabChange: (tab: MobilePilotiTab) => void;
  selectedPilotiId: string | null;
  previewDraft?: HouseFieldAnalysisDraft | null;
  destinationPilotiIds?: readonly string[];
  onSelectPiloti: (id: string) => void;
  onCancelDestination?: () => void;
  onClose: () => void;
  content: ReactNode;
}) {
  const selectingDestination = destinationPilotiIds !== undefined;
  return <CanvasSideEditorPanel ariaLabel='Editar pilotis da planta' fixedHeight
    data-tab={tab} className='piloti-mobile-panel' onClose={onClose}
    onEscape={selectingDestination ? () => onCancelDestination?.() : onClose}>
    <div className='piloti-mobile-preview'>
      {previewDraft ? <HouseFieldAnalysisPreview compact draft={previewDraft} selectedPilotiId={selectedPilotiId ?? undefined}
        onSelectPiloti={onSelectPiloti} destinationPilotiIds={destinationPilotiIds}/> : null}
    </div>
    <div role='tablist' aria-label='Configuração do piloti' className='piloti-mobile-tabs'>
      {([
        ['nivel', 'Nível'], ['tamanho', 'Tamanho'], ['contraventamento', 'Contraventar'],
      ] as const).map(([id, label]) => <button key={id} id={`piloti-mobile-trigger-${id}`} type='button'
        role='tab' aria-selected={tab === id} aria-controls={`piloti-mobile-tab-${id}`}
        onClick={() => onTabChange(id)}>{label}</button>)}
    </div>
    <div className='piloti-mobile-scroll'>
      <div className='piloti-mobile-controls'>{content}</div>
      {selectingDestination && tab === 'contraventamento' ? <div className='piloti-mobile-destination'>
        <p role='status'>Selecione o piloti onde o contraventamento termina.</p>
        <button type='button' onClick={onCancelDestination}
          className='group min-h-10 justify-self-center rounded-lg py-1.5 text-xs font-semibold text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'>
          <span className='flex min-h-7 items-center justify-center rounded-lg bg-blue-100 px-4 group-hover:bg-blue-200'>
            Cancelar seleção
          </span>
        </button>
      </div> : null}
    </div>
  </CanvasSideEditorPanel>;
}
