import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {X} from 'lucide-react';
import {FloatingEditor} from '@/components/rac-editor/ui/modals/editors/FloatingEditor.tsx';
import {TerrainPreviewIcon} from '@/components/rac-editor/ui/modals/editors/terrain/TerrainPreviewIcon.tsx';
import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {calculateTotalVolumes} from '@/components/rac-editor/lib/terrain-volume.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

interface TerrainEditorProps {
  isOpen: boolean;
  isMobile: boolean;
  currentTerrainType: number;
  pilotis: Record<string, HousePiloti>;
  anchorPosition?: { x: number; y: number };
  onApply: (terrainType: number) => void;
  onClose: () => void;
}

export function TerrainEditor({
  isOpen,
  isMobile,
  currentTerrainType,
  pilotis,
  anchorPosition,
  onApply,
  onClose,
}: TerrainEditorProps) {
  const [draftType, setDraftType] = useState(currentTerrainType);

  useEffect(() => {
    if (!isOpen) return;
    setDraftType(currentTerrainType);
  }, [currentTerrainType, isOpen]);

  const normalizedDraftType = useMemo(
    () => normalizeTerrainSolidityLevel(draftType),
    [draftType],
  );

  const selected = useMemo(
    () => TERRAIN_SOLIDITY.levels[normalizedDraftType],
    [normalizedDraftType],
  );

  const volumesCodex = useMemo(
    () => calculateTotalVolumes(normalizedDraftType, pilotis),
    [normalizedDraftType, pilotis],
  );

  const volumes = useMemo(() => {
    if (!pilotis || Object.keys(pilotis).length === 0) return null;
    return calculateTotalVolumes(draftType, pilotis);
  }, [draftType, pilotis]);

  const formatVolume = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  if (!isOpen) return null;

  return (
    <FloatingEditor
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      onConfirm={() => {
        onApply(normalizedDraftType);
        onClose();
      }}
      onCancel={onClose}
      header={
        <div className='flex items-center gap-3'>
          <TerrainPreviewIcon/>
          <span className='font-bold text-2xl flex-1 text-center'>Terreno</span>
          <Button
            variant='outline'
            size='icon'
            onClick={onClose}
            className='h-8 w-8 rounded-full bg-white flex-shrink-0'>
            <X className='h-4 w-4'/>
          </Button>
        </div>
      }
      cardContent={
        <>
          <div className='text-center space-y-1'>
            <p className='text-sm font-medium'>Tipo de Solo: {selected.label}</p>
            <p className='text-xs text-muted-foreground'>
              Cama de rachão: {selected.rachao} cm
            </p>
          </div>

          <Slider
            min={1} max={5} step={1} value={[draftType]}
            onValueChange={(values) => setDraftType(values[0] ?? 1)}
            className='my-4'

            // Aplica no modelo ao soltar o drag do slider de tipo de solo.
            onValueCommit={(values) => {
              const committed = normalizeTerrainSolidityLevel(values[0] ?? 1);
              setDraftType(committed);
              onApply(committed);
            }}
          />

          <div className='grid grid-cols-5 text-[10px] text-muted-foreground'>
            <span className='text-center'>1</span>
            <span className='text-center'>2</span>
            <span className='text-center'>3</span>
            <span className='text-center'>4</span>
            <span className='text-center'>5</span>
          </div>

          {volumes && (
            <div className='mt-3 pt-3 border-t border-border space-y-1'>
              <div className='flex justify-between text-xs text-muted-foreground px-1'>
                <span>Qtd. de Rachão Aprox.:</span>&nbsp;
                <span className='font-mono'>{volumes.rachaoM3.toFixed(2)} m³</span>
              </div>
              <div className='flex justify-between text-xs text-muted-foreground px-1'>
                <span>Qtd. de Brita Aprox.:</span>&nbsp;
                <span className='font-mono'>{volumes.britaM3.toFixed(2)} m³</span>
              </div>
              <div className='flex justify-between text-xs font-medium px-1 pt-1 border-t border-border'>
                <span>Total:</span>
                <span className='font-mono'>{(volumes.rachaoM3 + volumes.britaM3).toFixed(2)} m³</span>
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
