import {useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight, faMinus, faPlus} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Switch} from '@/components/ui/switch.tsx';
import {Label} from '@/components/ui/label.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {Dialog, DialogContent, DialogDescription} from '@/components/ui/dialog.tsx';
import {Sheet, SheetContent} from '@/components/ui/sheet.tsx';
import {useIsMobile} from '@/components/lib/use-mobile.tsx';
import {PilotiGridIcon} from '@/components/rac-editor/modals/editors/piloti/PilotiGridIcon.tsx';
import {clampNivel, formatNivel, getRecommendedHeight} from "@/components/lib/canvas";

const CORNER_ORDER = ['A1', 'A4', 'C1', 'C4'] as const;
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

export function NivelDefinitionEditor({isOpen, onClose, onApply}: NivelDefinitionProps) {
  const isMobile = useIsMobile();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [entries, setEntries] =
    useState<Record<CornerName, NivelDefinition & { visited: boolean; }>>(() => ({
      A1: {nivel: 0.20, isMaster: false, visited: false},
      A4: {nivel: 0.20, isMaster: false, visited: false},
      C1: {nivel: 0.20, isMaster: false, visited: false},
      C4: {nivel: 0.20, isMaster: false, visited: false}
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
    const clamped = clampNivel(value, entry.isMaster ? 0.2 : masterCorner ? entries[masterCorner].nivel : 0.2);
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
      A1: {nivel: 0.20, isMaster: false, visited: false},
      A4: {nivel: 0.20, isMaster: false, visited: false},
      C1: {nivel: 0.20, isMaster: false, visited: false},
      C4: {nivel: 0.20, isMaster: false, visited: false}
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
  const maxNivel = 1.50;
  const minNivel = !entry.isMaster && masterCorner ? Math.max(entries[masterCorner].nivel, 0.20) : 0.20;

  const content =
    <div className="flex flex-col gap-4">
      {/* Header: grid icon + title + arrows */}
      <div className="flex items-center gap-3">
        <PilotiGridIcon
          selectedPiloti={currentCorner}
          masterPiloti={masterCorner}
          className="w-16 h-12 flex-shrink-0"/>

        <span className="font-bold text-2xl flex-1 text-center">Piloti {currentCorner}</span>

        <div className="flex items-center gap-1 select-none">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
            disabled={!hasPrev}
            className="h-8 w-8 rounded-full bg-white">

            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3"/>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
            disabled={!hasNext}
            className="h-8 w-8 rounded-full bg-white">

            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3"/>
          </Button>
        </div>
      </div>

      {/* Central card */}
      <div className="bg-white rounded-xl p-4 space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="nivel-master" className="text-sm font-medium select-none">
            Definir como Mestre?
          </Label>
          <Switch id="nivel-master" checked={entry.isMaster} onCheckedChange={handleMasterChange}/>
        </div>

        <Separator/>

        {/* Nivel section */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-center">Nível do Piloti</p>

          {/* Value display with +/- buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => handleNivelIncrement(-0.01)}
              disabled={entry.nivel <= minNivel}>

              <FontAwesomeIcon icon={faMinus} className="h-3 w-3"/>
            </Button>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-primary">{formatNivel(entry.nivel)}</span>
              <span className="text-lg text-muted-foreground">m</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => handleNivelIncrement(0.01)}
              disabled={entry.nivel >= maxNivel}>

              <FontAwesomeIcon icon={faPlus} className="h-3 w-3"/>
            </Button>
          </div>

          {/* Slider */}
          <div className="space-y-3 px-2">
            <Slider
              value={[entry.nivel]}
              onValueChange={([v]) => handleNivelChange(v)}
              min={minNivel}
              max={maxNivel}
              step={0.01}
              className="w-full"/>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatNivel(minNivel)}m</span>
              <span>{formatNivel(maxNivel)}m</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Altura recomendada: <span className="font-semibold text-foreground">
              {getRecommendedHeight(entry.nivel).toFixed(1).replace('.', ',')} m
            </span>
          </p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2">
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

      {/* Footer buttons */}
      <div className="flex w-full gap-[16px]">
        <Button variant="outline" className="flex-1 bg-white" onClick={handleClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={!canApply}>
          Inserir
        </Button>
      </div>
    </div>;

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <div className="mx-auto w-full max-w-sm">
            <DialogDescription className="sr-only">Defina os níveis dos pilotis de canto</DialogDescription>
            {content}
          </div>
        </DialogContent>
      </Dialog>);
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <div className="mx-auto w-full max-w-sm">
          <div className="py-4">{content}</div>
        </div>
      </SheetContent>
    </Sheet>);
}
