import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {X} from 'lucide-react';
import {FloatingEditor} from '@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx';
import {CanvasSideEditorPanel} from '../CanvasSideEditorPanel.tsx';
import {TerrainPreviewIcon} from '@/components/rac-editor/@modals/ui/editors/terrain/TerrainPreviewIcon.tsx';
import {normalizeTerrainSolidityLevel, TERRAIN_SOLIDITY} from '@/shared/config.ts';
import {calculateTotalVolumes} from '@/components/rac-editor/lib/terrain-volume.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

interface TerrainEditorProps {
  presentation?: 'floating' | 'mobile-panel';
  isOpen: boolean;
  isMobile: boolean;
  currentTerrainType: number;
  pilotis: Record<string, HousePiloti>;
  anchorPosition?: { x: number; y: number };
  onApply: (terrainType: number) => void;
  onClose: () => void;
}

export function TerrainEditor({
  presentation = 'floating',
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

  const volumes = useMemo(() => {
    if (!pilotis || Object.keys(pilotis).length === 0) return null;
    return calculateTotalVolumes(normalizedDraftType, pilotis);
  }, [normalizedDraftType, pilotis]);

  const formatVolume = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  if (!isOpen) return null;

  const content = <>
    <div className='text-center'>
      <p className='text-xs text-muted-foreground'>Cama de rachão: {selected.rachao} cm</p>
    </div>
    <Slider min={1} max={5} step={1} value={[draftType]}
      aria-label='Tipo de terreno'
      onValueChange={values => setDraftType(values[0] ?? 1)} className='my-4'/>
    <div className='grid grid-cols-5 text-[10px] text-muted-foreground'>
      {[1, 2, 3, 4, 5].map(level => <span key={level} className='text-center'>{level}</span>)}
    </div>
    {volumes && <div className='mt-3 pt-3 border-t border-border space-y-1'>
      <div className='flex justify-between text-xs text-muted-foreground px-1'><span>Qtd. de Rachão Aprox.:</span><span className='font-mono'>{formatVolume.format(volumes.rachaoM3)} m³</span></div>
      <div className='flex justify-between text-xs text-muted-foreground px-1'><span>Qtd. de Brita Aprox.:</span><span className='font-mono'>{formatVolume.format(volumes.britaM3)} m³</span></div>
      <div className='flex justify-between text-xs font-medium px-1 pt-1 border-t border-border'><span>Pedras (Rachão | Brita):</span><span className='font-mono'>{formatVolume.format(volumes.pedrasM3)} m³</span></div>
    </div>}
  </>;

  if (presentation === 'mobile-panel') return <CanvasSideEditorPanel ariaLabel='Editar Terreno' onClose={onClose}
    onConfirm={() => {onApply(normalizedDraftType); onClose();}}>
    <div className='canvas-side-editor-content'>{content}</div>
  </CanvasSideEditorPanel>;

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
      cardContent={content}
    />
  );
}
