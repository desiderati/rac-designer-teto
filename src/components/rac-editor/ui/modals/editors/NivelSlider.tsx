import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMinus, faPlus} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {formatNivel} from '@/shared/types/piloti.ts';

interface NivelSliderProps {
  nivel: number;
  minNivel: number;
  maxNivel: number;
  onNivelIncrement: (delta: number) => void;
  onNivelChange: (value: number) => void;
  recommendedHeightText?: string;
}

export function NivelSlider({
  nivel,
  minNivel,
  maxNivel,
  onNivelIncrement,
  onNivelChange,
  recommendedHeightText,
}: NivelSliderProps) {
  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium text-center'>Nível do Piloti</p>

      <div className='flex items-center justify-center gap-3'>
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9 rounded-full disabled:pointer-events-auto disabled:cursor-not-allowed'
          onClick={() => onNivelIncrement(-0.01)}
          disabled={nivel <= minNivel}>

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
          disabled={nivel >= maxNivel}>

          <FontAwesomeIcon icon={faPlus} className='h-3 w-3'/>
        </Button>
      </div>

      <div className='space-y-3 px-2'>
        <Slider
          value={[nivel]}
          onValueChange={([v]) => onNivelChange(v)}
          min={minNivel}
          max={maxNivel}
          step={0.01}
          className='w-full cursor-grab active:cursor-grabbing [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing'/>

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
