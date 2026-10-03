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
import React, {useEffect, useState} from 'react';
import {FloatingEditor} from '@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx';
import {NivelSlider} from '@/components/rac-editor/@modals/ui/editors/NivelSlider.tsx';
import {PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';
import {formatPilotiHeight, getPilotiName} from '@/shared/types/piloti.ts';
import type {HousePilotiReadPort, HousePilotiWritePort} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import {VisualSelect} from '@/components/construction-site/ui/lib/shared-controls.tsx';

interface PilotiEditorProps {
  presentation?: 'floating' | 'inline';
  pilotiReadPort?: HousePilotiReadPort;
  pilotiWritePort?: HousePilotiWritePort;
  getInlineContraventamentoDestinations?: (side: ContraventamentoSide) => readonly string[];
  onInlineContraventamentoChange?: (side: ContraventamentoSide, destinationPilotiId?: string) => void;
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
  pilotiReadPort,
  pilotiWritePort,
  getInlineContraventamentoDestinations,
  onInlineContraventamentoChange,
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
  const [pendingSide, setPendingSide] = useState<ContraventamentoSide | null>(null);
  const [selectedDestination, setSelectedDestination] = useState('');

  useEffect(() => {
    setPendingSide(null);
    setSelectedDestination('');
  }, [pilotiId]);

  const {
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
    handleApply,
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
  });

  if (!isOpen) return null;

  // ---- Shared content renderers (inline to avoid remount/focus-loss) ----
  const canEditNivel = !autoAdjustPilotiHeightsFromNivel;
  const inlineDestinations = pendingSide ? getInlineContraventamentoDestinations?.(pendingSide) ?? [] : [];
  const destination = inlineDestinations.includes(selectedDestination)
    ? selectedDestination : inlineDestinations[0] ?? '';
  const onBraceClick = (side: ContraventamentoSide, active: boolean) => {
    commitDraftChanges();
    if (presentation === 'inline') {
      if (active) {
        onInlineContraventamentoChange?.(side);
        setPendingSide(null);
      } else {
        setPendingSide(side);
        setSelectedDestination('');
      }
      return;
    }
    if (side === 'left' || side === 'right') onContraventamentoSelect?.(side, pilotiId ?? undefined);
    else onHorizontalContraventamentoSelect?.(side, pilotiId ?? undefined);
  };

  return (
    <FloatingEditor
      presentation={presentation}
      header={
        <div className='flex items-center gap-3'>
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
      cardContent={
        <>
          <div className='flex items-center justify-between'>
            <Label htmlFor='is-master' className='text-sm font-medium select-none'>
              Definir como Mestre?
            </Label>
            <Switch
              id='is-master'
              checked={tempIsMaster}
              disabled={!isCornerPiloti}
              onCheckedChange={(checked) => {
                // Aplica imediatamente ao alternar on/off do mestre.
                setTempIsMaster(checked);
                commitDraftChanges({isMasterOverride: checked});
              }}
            />
          </div>

          <Separator/>

          <NivelSlider
            disabled={!canEditNivel}
            autoFocusInput={isOpen && canEditNivel}
            focusKey={pilotiId}
            nivel={tempNivel}
            minNivel={0.20}
            maxNivel={maxNivel}
            onNivelIncrement={handleNivelIncrement}
            onNivelChange={handleNivelChange}
            onNivelCommit={handleNivelCommit}
            enableInput
            autoMode={autoAdjustPilotiHeightsFromNivel}
            onAutoModeToggle={handleNivelModeToggle}
            showModeTourTarget={!isMobile}
          />

          <Separator/>

          <div className='space-y-4'>
            <p className='text-sm font-medium text-center'>Tamanho dos Pilotis</p>
            <div className='grid grid-cols-4 justify-items-center gap-2 max-w-[216px] mx-auto'>
              {selectedPilotiHeights.map((h) =>
                <button
                  key={h}
                  onClick={() => handleHeightClick(h)}
                  disabled={clickedHeight !== null}
                  className={getHeightButtonClasses(h, {compact: true})}
                >
                  {formatPilotiHeight(h)}
                </button>
              )}
            </div>
          </div>

          <Separator/>

          <div className='space-y-3'>
            <p className='text-sm font-medium text-center'>Contraventamento</p>
            <div className='grid grid-cols-4 justify-items-center gap-2 max-w-[216px] mx-auto'>
              <button
                type='button'
                aria-label='Esquerdo'
                title='Esquerdo'
                disabled={contraventamentoLeftDisabled}
                onClick={() => onBraceClick('left', contraventamentoLeftActive)}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoLeftActive, contraventamentoLeftDisabled
                  )
                }>
                <span aria-hidden='true' className='flex items-center justify-center'>
                  <ContraventamentoSideIcon side='left' size={34}/>
                </span>
              </button>

              <button
                type='button'
                aria-label='Direito'
                title='Direito'
                disabled={contraventamentoRightDisabled}
                onClick={() => onBraceClick('right', contraventamentoRightActive)}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoRightActive,
                    contraventamentoRightDisabled
                  )
                }>
                <span aria-hidden='true' className='flex items-center justify-center'>
                  <ContraventamentoSideIcon side='right' size={34}/>
                </span>
              </button>

              <button
                type='button'
                aria-label='Superior'
                title='Superior'
                disabled={contraventamentoTopDisabled}
                onClick={() => onBraceClick('top', contraventamentoTopActive)}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoTopActive,
                    contraventamentoTopDisabled
                  )
                }>
                <span aria-hidden='true' className='flex items-center justify-center'>
                  <ContraventamentoHorizontalSideIcon side='top' size={34}/>
                </span>
              </button>

              <button
                type='button'
                aria-label='Inferior'
                title='Inferior'
                disabled={contraventamentoBottomDisabled}
                onClick={() => onBraceClick('bottom', contraventamentoBottomActive)}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoBottomActive,
                    contraventamentoBottomDisabled
                  )
                }>
                <span aria-hidden='true' className='flex items-center justify-center'>
                  <ContraventamentoHorizontalSideIcon side='bottom' size={34}/>
                </span>
              </button>
            </div>
            {presentation === 'inline' && pendingSide ? (
              <div className='space-y-2 rounded-xl bg-blue-50 p-3'>
                <VisualSelect
                  label='Destino'
                  ariaLabel='Piloti de destino do contraventamento'
                  value={destination}
                  options={inlineDestinations.map((id) => ({value: id, label: `Piloti ${getPilotiName(id)}`}))}
                  onChange={setSelectedDestination}
                  disabled={!inlineDestinations.length}
                  className='bg-white'
                />
                <button type='button' disabled={!destination}
                  onClick={() => {
                    if (!destination) return;
                    onInlineContraventamentoChange?.(pendingSide, destination);
                    setPendingSide(null);
                  }}
                  className='min-h-10 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'>
                  Adicionar contraventamento
                </button>
                {!inlineDestinations.length ? <p className='text-xs text-slate-600'>Nenhum piloti de destino disponível para este lado.</p> : null}
              </div>
            ) : null}
          </div>
        </>
      }
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      dataGuidedTourId='rac-piloti-editor'
      onConfirm={handleApply}
      onCancel={handleCancel}
    />
  );
}
