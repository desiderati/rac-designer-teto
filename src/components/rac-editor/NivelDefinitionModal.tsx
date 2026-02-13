import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { PilotiGridIcon } from './PilotiGridIcon';

const CORNER_ORDER = ['A1', 'A4', 'C1', 'C4'] as const;
type CornerName = typeof CORNER_ORDER[number];

export interface NivelEntry {
  nivel: number;
  isMaster: boolean;
}

interface NivelDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (niveis: Record<string, NivelEntry>) => void;
  pilotiData: Record<string, { height: number; isMaster: boolean; nivel: number }>;
}

function formatNivel(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function clampNivel(nivel: number): number {
  return Math.round(Math.max(0.2, Math.min(nivel, 1.50)) * 100) / 100;
}

const STANDARD_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0];

function getRecommendedHeight(nivel: number): number {
  const minHeight = nivel * 3;
  return STANDARD_HEIGHTS.find(h => h >= minHeight) ?? 3.0;
}

function cornerToId(name: string): string {
  const row = name.charCodeAt(0) - 65;
  const col = parseInt(name[1]) - 1;
  return `piloti_${col}_${row}`;
}

export function NivelDefinitionModal({ isOpen, onClose, onApply, pilotiData }: NivelDefinitionModalProps) {
  const isMobile = useIsMobile();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [entries, setEntries] = useState<Record<CornerName, NivelEntry & { visited: boolean }>>(() => ({
    A1: { nivel: 0.20, isMaster: false, visited: false },
    A4: { nivel: 0.20, isMaster: false, visited: false },
    C1: { nivel: 0.20, isMaster: false, visited: false },
    C4: { nivel: 0.20, isMaster: false, visited: false },
  }));
  const appliedRef = useRef(false);

  const currentCorner = CORNER_ORDER[currentIdx];
  const entry = entries[currentCorner];
  const hasMaster = CORNER_ORDER.some((c) => entries[c].isMaster);

  const masterCorner = CORNER_ORDER.find((c) => entries[c].isMaster);
  const masterNivel = masterCorner ? entries[masterCorner].nivel : Infinity;
  const hasInvalidNivel = hasMaster && CORNER_ORDER.some(
    (c) => !entries[c].isMaster && entries[c].nivel < masterNivel
  );
  const canApply = hasMaster && !hasInvalidNivel;

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= CORNER_ORDER.length) return;
    setCurrentIdx(newIdx);
  };

  const handleMasterChange = (checked: boolean) => {
    if (checked) {
      const updated = { ...entries };
      for (const c of CORNER_ORDER) {
        updated[c] = { ...updated[c], isMaster: c === currentCorner };
      }
      setEntries(updated);
    } else {
      setEntries((prev) => ({
        ...prev,
        [currentCorner]: { ...prev[currentCorner], isMaster: false },
      }));
    }
  };

  const handleNivelChange = (value: number) => {
    const clamped = clampNivel(value);
    setEntries((prev) => {
      const updated = { ...prev };
      updated[currentCorner] = { ...updated[currentCorner], nivel: clamped, visited: true };

      // If this is the master piloti and its nivel increased, raise other corners that are lower
      if (updated[currentCorner].isMaster) {
        for (const c of CORNER_ORDER) {
          if (c !== currentCorner && updated[c].nivel < clamped) {
            updated[c] = { ...updated[c], nivel: clamped };
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
    const result: Record<string, NivelEntry> = {};
    for (const name of CORNER_ORDER) {
      const id = cornerToId(name);
      const e = entries[name];
      result[id] = { nivel: e.nivel, isMaster: e.isMaster };
    }
    appliedRef.current = true;
    onApply(result);
    resetState();
  };

  const resetState = () => {
    setCurrentIdx(0);
    setEntries({
      A1: { nivel: 0.20, isMaster: false, visited: false },
      A4: { nivel: 0.20, isMaster: false, visited: false },
      C1: { nivel: 0.20, isMaster: false, visited: false },
      C4: { nivel: 0.20, isMaster: false, visited: false },
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

  const content = (
    <div className="flex flex-col gap-4">
      {/* Header: grid icon + title + arrows */}
      <div className="flex items-center gap-3">
        <PilotiGridIcon
          selectedPiloti={currentCorner}
          masterPiloti={masterCorner}
          className="w-16 h-12 flex-shrink-0"
        />
        <span className="font-bold text-2xl flex-1">Piloti {currentCorner}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
            disabled={!hasPrev}
            className="h-8 w-8 rounded-full"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
            disabled={!hasNext}
            className="h-8 w-8 rounded-full"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Central card */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="nivel-master" className="text-sm font-medium">
            Definir piloti como mestre?
          </Label>
          <Switch id="nivel-master" checked={entry.isMaster} onCheckedChange={handleMasterChange} />
        </div>

        <Separator />

        {/* Nivel section */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-center">Nível do Piloti</p>

          {/* Value display with +/- buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => handleNivelIncrement(-0.01)}
              disabled={entry.nivel <= 0.20}
            >
              <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
            </Button>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{formatNivel(entry.nivel)}</span>
              <span className="text-lg text-muted-foreground">m</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => handleNivelIncrement(0.01)}
              disabled={entry.nivel >= maxNivel}
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            </Button>
          </div>

          {/* Slider */}
          <div className="space-y-2 px-1">
            <Slider
              value={[entry.nivel]}
              onValueChange={([v]) => handleNivelChange(v)}
              min={0.20}
              max={maxNivel}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0,20m</span>
              <span>{formatNivel(maxNivel)}m</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Altura recomendada: <span className="font-semibold text-foreground">{getRecommendedHeight(entry.nivel).toFixed(1).replace('.', ',')} m</span>
          </p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2">
        {CORNER_ORDER.map((c, i) => (
          <div
            key={c}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIdx
                ? 'bg-primary'
                : entries[c].visited
                  ? 'bg-primary/40'
                  : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* Validation warning */}
      {hasInvalidNivel && (
        <p className="text-xs text-destructive text-center">
          O piloti mestre deve ter o menor nível (terreno mais alto). Ajuste os valores.
        </p>
      )}

      {/* Footer buttons */}
      <div className="flex gap-2 w-full">
        <Button variant="outline" className="flex-1" onClick={handleClose}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={!canApply}>
          Inserir
        </Button>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-sm" hideCloseButton>
          <div className="mx-auto w-full max-w-sm">
            <DialogDescription className="sr-only">Defina os níveis dos pilotis de canto</DialogDescription>
            <div className="py-4">{content}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <div className="mx-auto w-full max-w-sm">
          <div className="py-4">{content}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
