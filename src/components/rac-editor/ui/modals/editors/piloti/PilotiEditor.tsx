import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {PilotiGridIcon} from './PilotiGridIcon.tsx';
import {ContraventamentoSideIcon} from '@/components/rac-editor/ui/modals/editors/piloti/ContraventamentoSideIcon.tsx';
import {usePilotiEditor} from '../../../../hooks/usePilotiEditor.ts';
import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {CanvasGroup} from '@/components/rac-editor/lib/canvas';
import React from 'react';
import {FloatingEditor} from '@/components/rac-editor/ui/modals/editors/FloatingEditor.tsx';
import {NivelSlider} from '@/components/rac-editor/ui/modals/editors/NivelSlider.tsx';
import {PILOTI_DEFAULT_NIVEL} from "@/shared/constants.ts";
import {formatPilotiHeight} from "@/shared/types/piloti.ts";

interface PilotiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster?: boolean;
  currentNivel?: number;
  group: CanvasGroup | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  houseView?: 'top' | 'front' | 'back' | 'side';
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
  contraventamentoLeftDisabled?: boolean;
  contraventamentoRightDisabled?: boolean;
  contraventamentoLeftActive?: boolean;
  contraventamentoRightActive?: boolean;
  onContraventamentoSelect?: (side: ContraventamentoSide) => void;
}

export function PilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster = false,
  currentNivel = PILOTI_DEFAULT_NIVEL,
  group,
  isMobile,
  anchorPosition,
  onHeightChange,
  onNavigate,
  contraventamentoLeftDisabled = true,
  contraventamentoRightDisabled = true,
  contraventamentoLeftActive = false,
  contraventamentoRightActive = false,
  onContraventamentoSelect
}: PilotiEditorProps) {

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
    handleNavigate,
    handleApply,
    handleCancel,
    handleNivelChange,
    handleNivelIncrement,
    handleHeightClick,
    getHeightButtonClasses,
    getContraventamentoButtonClasses,
  } = usePilotiEditor({
    isOpen,
    onClose,
    pilotiId,
    currentHeight,
    currentIsMaster,
    currentNivel,
    group,
    onHeightChange,
    onNavigate,
  });

  if (!isOpen) return null;

  // ---- Shared content renderers (inline to avoid remount/focus-loss) ----

  return (
    <FloatingEditor
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
              onClick={() => handleNavigate('prev')}
              disabled={!hasPrev}
              className='h-8 w-8 rounded-full bg-white disabled:pointer-events-auto disabled:cursor-not-allowed'>
              <FontAwesomeIcon icon={faChevronLeft} className='h-3 w-3'/>
            </Button>

            <Button
              variant='outline'
              size='icon'
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
          {isCornerPiloti &&
            <>
              <div className='flex items-center justify-between'>
                <Label htmlFor='is-master' className='text-sm font-medium select-none'>
                  Definir como Mestre?
                </Label>
                <Switch id='is-master' checked={tempIsMaster} onCheckedChange={setTempIsMaster}/>
              </div>

              <Separator/>
            </>
          }

          {isCornerPiloti &&
            <>
              <NivelSlider
                nivel={tempNivel}
                minNivel={0.20}
                maxNivel={maxNivel}
                onNivelIncrement={handleNivelIncrement}
                onNivelChange={handleNivelChange}
              />

              <Separator/>
            </>
          }

          <div className='space-y-4'>
            <p className='text-sm font-medium text-center'>Tamanho dos Pilotis</p>
            <div className='grid grid-cols-3 gap-2'>
              {DEFAULT_HOUSE_PILOTI_HEIGHTS.map((h) =>
                <button
                  key={h}
                  onClick={() => handleHeightClick(h)}
                  disabled={clickedHeight !== null}
                  className={getHeightButtonClasses(h)}
                >
                  {formatPilotiHeight(h)}
                </button>
              )}
            </div>
          </div>

          <Separator/>

          <div className='space-y-3'>
            <p className='text-sm font-medium text-center'>Contraventamento</p>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                disabled={contraventamentoLeftDisabled}
                onClick={() => onContraventamentoSelect?.('left')}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoLeftActive, contraventamentoLeftDisabled
                  )
                }>
                <span className='flex flex-col items-center gap-1.5'>
                  <ContraventamentoSideIcon side='left' size={40}/>
                  <span className='text-xs font-semibold'>Esquerdo</span>
                </span>
              </button>

              <button
                type='button'
                disabled={contraventamentoRightDisabled}
                onClick={() => onContraventamentoSelect?.('right')}
                className={
                  getContraventamentoButtonClasses(
                    contraventamentoRightActive,
                    contraventamentoRightDisabled
                  )
                }>
                <span className='flex flex-col items-center gap-1.5'>
                  <ContraventamentoSideIcon side='right' size={40}/>
                  <span className='text-xs font-semibold'>Direito</span>
                </span>
              </button>
            </div>
          </div>
        </>
      }
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      onConfirm={handleApply}
      onCancel={handleCancel}
    />
  );
}
