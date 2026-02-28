import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {X} from 'lucide-react';
import {FloatingEditor} from '@/components/rac-editor/modals/editors/FloatingEditor.tsx';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';

interface TerrainEditorProps {
  isOpen: boolean;
  isMobile: boolean;
  currentTerrainType: number;
  anchorPosition?: { x: number; y: number };
  onApply: (terrainType: number) => void;
  onClose: () => void;
}

export function TerrainEditor({
  isOpen,
  isMobile,
  currentTerrainType,
  anchorPosition,
  onApply,
  onClose,
}: TerrainEditorProps) {
  const [draftType, setDraftType] = useState(currentTerrainType);

  useEffect(() => {
    if (!isOpen) return;
    setDraftType(currentTerrainType);
  }, [currentTerrainType, isOpen]);

  const selected = useMemo(() => {
    const normalized = Math.max(1, Math.min(5, Math.round(draftType))) as 1 | 2 | 3 | 4 | 5;
    return TERRAIN_SOLIDITY.levels[normalized];
  }, [draftType]);

  if (!isOpen) return null;

  return (
    <FloatingEditor
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      onConfirm={() => {
        onApply(Math.max(1, Math.min(5, Math.round(draftType))));
        onClose();
      }}
      onCancel={onClose}
      header={
        <div className='flex items-center gap-3'>
          <div className='w-16 h-12 flex-shrink-0 rounded-lg bg-amber-100 border border-amber-300'/>
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
          />

          <div className='grid grid-cols-5 text-[10px] text-muted-foreground'>
            <span className='text-center'>1</span>
            <span className='text-center'>2</span>
            <span className='text-center'>3</span>
            <span className='text-center'>4</span>
            <span className='text-center'>5</span>
          </div>
        </>
      }
    />
  );
}

