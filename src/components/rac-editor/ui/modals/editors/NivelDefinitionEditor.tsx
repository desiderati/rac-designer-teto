import {useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {PilotiGridIcon} from '@/components/rac-editor/ui/modals/editors/piloti/PilotiGridIcon.tsx';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {NivelSlider} from '@/components/rac-editor/ui/modals/editors/NivelSlider.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';
import {clampNivel, formatNivel, getRecommendedHeight, MAX_AVAILABLE_PILOTI_NIVEL} from '@/shared/types/piloti.ts';

const CORNER_ORDER = ['A1', 'A4', 'C1', 'C4'] as const;
const DEFAULT_NIVEL = DEFAULT_HOUSE_PILOTI.nivel;
type CornerName = typeof CORNER_ORDER[number];

export interface NivelDefinition {
  nivel: number;
  isMaster: boolean;
}

interface NivelDefinitionProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (niveis: Record<string, NivelDefinition>) => void;
}

function cornerToId(name: string): string {
  const row = name.charCodeAt(0) - 65;
  const col = parseInt(name[1]) - 1;
  return `piloti_${col}_${row}`;
}

export function NivelDefinitionEditor(
  {isOpen, onClose, onApply}: NivelDefinitionProps
) {
  const isMobile = useIsMobile();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [entries, setEntries] =
    useState<Record<CornerName, NivelDefinition & { visited: boolean; }>>(() => ({
      A1: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      A4: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      C1: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      C4: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false}
    }));
  const appliedRef = useRef(false);

  const currentCorner = CORNER_ORDER[currentIdx];
  const entry = entries[currentCorner];
  const hasMaster = CORNER_ORDER.some((c) => entries[c].isMaster);
  const hasNavigatedAllCorners =
    CORNER_ORDER.every(
      (corner, idx) => entries[corner].visited || idx === currentIdx
    );

  const masterCorner = CORNER_ORDER.find((c) => entries[c].isMaster);
  const canApply = hasMaster && hasNavigatedAllCorners;

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= CORNER_ORDER.length) return;

    const fromCorner = CORNER_ORDER[currentIdx];
    setEntries((prev) => ({
      ...prev,
      [fromCorner]: {...prev[fromCorner], visited: true},
    }));
    setCurrentIdx(newIdx);
  };

  const handleMasterChange = (checked: boolean) => {
    if (checked) {
      const updated = {...entries};
      const masterNivel = updated[currentCorner].nivel;
      for (const c of CORNER_ORDER) {
        if (c === currentCorner) {
          updated[c] = {...updated[c], isMaster: true};
        } else {
          updated[c] = {
            ...updated[c],
            isMaster: false,
            nivel: Math.max(updated[c].nivel, masterNivel)
          };
        }
      }
      setEntries(updated);
    } else {
      setEntries((prev) => ({
        ...prev,
        [currentCorner]: {...prev[currentCorner], isMaster: false}
      }));
    }
  };

  const handleNivelChange = (value: number) => {
    const clamped = clampNivel(
      value,
      entry.isMaster ? DEFAULT_NIVEL : masterCorner ? entries[masterCorner].nivel : DEFAULT_NIVEL,
      maxNivel,
    );
    setEntries((prev) => {
      const updated = {...prev};
      updated[currentCorner] = {...updated[currentCorner], nivel: clamped, visited: true};

      // If this is the master piloti and its nivel increased, raise other corners that are lower
      if (updated[currentCorner].isMaster) {
        for (const c of CORNER_ORDER) {
          if (c !== currentCorner && updated[c].nivel < clamped) {
            updated[c] = {...updated[c], nivel: clamped};
          }
        }
      }

      return updated;
    });
  };

  const handleNivelIncrement = (delta: number) => {
    const newVal = Math.round((entry.nivel + delta) * 100) / 100;
    handleNivelChange(newVal);
  };

  const handleApply = () => {
    if (!canApply) return;

    const result: Record<string, NivelDefinition> = {};
    for (const name of CORNER_ORDER) {
      const id = cornerToId(name);
      const e = entries[name];
      result[id] = {nivel: e.nivel, isMaster: e.isMaster};
    }
    appliedRef.current = true;
    onApply(result);
    resetState();
  };

  const resetState = () => {
    setCurrentIdx(0);
    setEntries({
      A1: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      A4: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      C1: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false},
      C4: {nivel: DEFAULT_NIVEL, isMaster: false, visited: false}
    });
  };

  const handleClose = () => {
    if (appliedRef.current) {
      appliedRef.current = false;
      return;
    }
    resetState();
    onClose();
  };

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < CORNER_ORDER.length - 1;
  const maxNivel = MAX_AVAILABLE_PILOTI_NIVEL;
  const minNivel =
    !entry.isMaster && masterCorner ? Math.max(entries[masterCorner].nivel, DEFAULT_NIVEL) : DEFAULT_NIVEL;

  const content =
    <div className='flex flex-col gap-4'>
      {/* Header: grid icon + title + arrows */}
      <div className='flex items-center gap-3'>
        <PilotiGridIcon
          selectedPiloti={currentCorner}
          masterPiloti={masterCorner}
          className='w-16 h-12 flex-shrink-0'/>

        <span className='font-bold text-2xl flex-1 text-center'>Piloti {currentCorner}</span>

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

      {/* Central card */}
      <div className='bg-white rounded-xl p-4 space-y-4'>
        {/* Master toggle */}
        <div className='flex items-center justify-between'>
          <Label htmlFor='nivel-master' className='text-sm font-medium select-none'>
            Definir como Mestre?
          </Label>
          <Switch id='nivel-master' checked={entry.isMaster} onCheckedChange={handleMasterChange}/>
        </div>

        <Separator/>

        {/* Nivel section */}
        <NivelSlider
          nivel={entry.nivel}
          minNivel={DEFAULT_NIVEL}
          maxNivel={maxNivel}
          allowedMinNivel={minNivel}
          allowedMaxNivel={maxNivel}
          onNivelIncrement={handleNivelIncrement}
          onNivelChange={handleNivelChange}
          recommendedHeightText={formatNivel(getRecommendedHeight(entry.nivel))}
        />
      </div>

      {/* Progress indicators */}
      <div className='flex justify-center gap-2'>
        {CORNER_ORDER.map((c, i) =>
          <div
            key={c}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIdx ?
                'bg-primary' :
                entries[c].visited ?
                  'bg-primary/40' :
                  'bg-muted-foreground/30'}`
            }/>
        )}
      </div>
    </div>;

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      content={content}
      confirmLabel='Inserir'
      isConfirmDisabled={!canApply}
      handleConfirm={handleApply}
      handleCancel={handleClose}
    />
  );
}

