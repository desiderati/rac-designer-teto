import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMinus, faPlus} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {formatNivel} from '@/shared/types/piloti.ts';

interface NivelSliderProps {
  nivel: number;
  minNivel: number;
  maxNivel: number;
  allowedMinNivel?: number;
  allowedMaxNivel?: number;
  onNivelIncrement: (delta: number) => void;
  onNivelChange: (value: number) => void;
  onNivelCommit?: (value: number) => void;
  recommendedHeightText?: string;
}

function clampToRange(value: number, min: number, max: number): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.max(low, Math.min(value, high));
}

function normalizePercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function NivelSlider({
  nivel,
  minNivel,
  maxNivel,
  allowedMinNivel,
  allowedMaxNivel,
  onNivelIncrement,
  onNivelChange,
  onNivelCommit,
  recommendedHeightText,
}: NivelSliderProps) {
  const resolvedAllowedMin =
    Number.isFinite(allowedMinNivel)
      ? Number(allowedMinNivel)
      : minNivel;

  const resolvedAllowedMax =
    Number.isFinite(allowedMaxNivel)
      ? Number(allowedMaxNivel)
      : maxNivel;

  const clampedAllowedMin = clampToRange(resolvedAllowedMin, minNivel, maxNivel);
  const clampedAllowedMax = clampToRange(resolvedAllowedMax, minNivel, maxNivel);

  const leftBlockedWidth = normalizePercent(clampedAllowedMin, minNivel, maxNivel);
  const rightBlockedStart = normalizePercent(clampedAllowedMax, minNivel, maxNivel);
  const rightBlockedWidth = Math.max(0, 100 - rightBlockedStart);

  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium text-center'>Nível do Piloti</p>

      <div className='flex items-center justify-center gap-3'>
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9 rounded-full disabled:pointer-events-auto disabled:cursor-not-allowed'
          onClick={() => onNivelIncrement(-0.01)}
          disabled={nivel <= clampedAllowedMin}>

          <FontAwesomeIcon icon={faMinus} className='h-3 w-3'/>
        </Button>

        <div className='flex items-baseline gap-1'>
          <span className='text-4xl font-bold text-primary'>{formatNivel(nivel)}</span>
          <span className='text-lg text-muted-foreground'>m</span>
        </div>

        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9 rounded-full disabled:pointer-events-auto disabled:cursor-not-allowed'
          onClick={() => onNivelIncrement(0.01)}
          disabled={nivel >= clampedAllowedMax}>

          <FontAwesomeIcon icon={faPlus} className='h-3 w-3'/>
        </Button>
      </div>

      <div className='space-y-3 px-2'>
        <div className='relative'>
          <Slider
            value={[nivel]}
            onValueChange={([v]) => onNivelChange(clampToRange(v, clampedAllowedMin, clampedAllowedMax))}
            // Só aplica alterações persistentes ao soltar o drag do slider.
            onValueCommit={([v]) => onNivelCommit?.(clampToRange(v, clampedAllowedMin, clampedAllowedMax))}
            min={minNivel}
            max={maxNivel}
            step={0.01}
            className='w-full cursor-grab active:cursor-grabbing [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing'/>

          {leftBlockedWidth > 0 &&
            <div
              className='pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-700/90'
              style={{width: `${leftBlockedWidth}%`}}/>
          }

          {rightBlockedWidth > 0 &&
            <div
              className='pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-zinc-700/90'
              style={{left: `${rightBlockedStart}%`, width: `${rightBlockedWidth}%`}}/>
          }
        </div>

        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{formatNivel(minNivel)}m</span>
          <span>{formatNivel(maxNivel)}m</span>
        </div>
      </div>

      {recommendedHeightText &&
        <p className='text-xs text-muted-foreground text-center'>
          Altura recomendada: <span className='font-semibold text-foreground'>{recommendedHeightText}</span>
        </p>
      }
    </div>
  );
}
