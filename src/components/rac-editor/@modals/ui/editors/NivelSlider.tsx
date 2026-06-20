import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMinus, faPlus} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button.tsx';
import {Slider} from '@/components/ui/slider.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {clampNivel, formatNivel} from '@/shared/types/piloti.ts';
import {
  formatNivelInputDigits,
  nivelInputDigitsToValue,
  nivelToInputDigits,
  sanitizeNivelInputDigits,
} from './nivel-input-format.ts';

interface NivelSliderProps {
  nivel: number;
  minNivel: number;
  maxNivel: number;
  onNivelIncrement: (delta: number) => void;
  onNivelChange: (value: number) => void;
  onNivelCommit?: (value: number) => void;
  recommendedHeightText?: string;
  enableInput?: boolean;
  autoMode?: boolean;
  onAutoModeToggle?: () => void;
  showModeTourTarget?: boolean;
}

const NIVEL_MODE_TOUR_TARGET_ID = 'rac-piloti-nivel-mode-toggle';

export function NivelSlider({
  nivel,
  minNivel,
  maxNivel,
  onNivelIncrement,
  onNivelChange,
  onNivelCommit,
  recommendedHeightText,
  enableInput = false,
  autoMode,
  onAutoModeToggle,
  showModeTourTarget = false,
}: NivelSliderProps) {
  const [inputDigits, setInputDigits] = useState(() => nivelToInputDigits(nivel));
  const editableNivelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setInputDigits(nivelToInputDigits(nivel));
  }, [nivel]);

  const moveCaretToEnd = () => {
    const element = editableNivelRef.current;
    const selection = window.getSelection?.();
    if (!element || !selection || !document.createRange) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const replaceEditableText = (text: string) => {
    const element = editableNivelRef.current;
    if (!element || element.textContent === text) return;
    element.textContent = text;
  };

  const getEditableDigits = () => {
    return sanitizeNivelInputDigits(editableNivelRef.current?.textContent ?? inputDigits);
  };

  const commitInput = () => {
    const nextNivel = clampNivel(nivelInputDigitsToValue(getEditableDigits()), minNivel, maxNivel);
    const nextDigits = nivelToInputDigits(nextNivel);
    setInputDigits(nextDigits);
    replaceEditableText(formatNivelInputDigits(nextDigits));
    onNivelChange(nextNivel);
    onNivelCommit?.(nextNivel);
  };

  const handleEditableInput = () => {
    const nextDigits = getEditableDigits();
    const nextText = formatNivelInputDigits(nextDigits);
    setInputDigits(nextDigits);
    replaceEditableText(nextText);
    moveCaretToEnd();
  };

  const handleEditableKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      commitInput();
      return;
    }

    const allowedNavigationKey = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Tab',
    ].includes(event.key);
    const isShortcut = event.ctrlKey || event.metaKey;
    const isDigit = /^\d$/.test(event.key);

    if (!allowedNavigationKey && !isShortcut && !isDigit) {
      event.preventDefault();
    }
  };

  const displayedNivel = enableInput ? formatNivelInputDigits(inputDigits) : formatNivel(nivel);
  const showModeButton = typeof autoMode === 'boolean' && Boolean(onAutoModeToggle);
  const modeLabel = autoMode ? 'automático' : 'manual';

  return (
    <div className='space-y-4'>
      <div className='text-center'>
        <div className='flex items-center justify-center gap-2'>
          {showModeButton &&
            <Button
              type='button'
              variant='outline'
              aria-pressed={autoMode}
              aria-label='Modo automático de altura dos pilotis'
              title={`Modo ${modeLabel} de altura`}
              data-guided-tour-id={showModeTourTarget ? NIVEL_MODE_TOUR_TARGET_ID : undefined}
              onClick={onAutoModeToggle}
              className={cn(
                'h-[18px] rounded-full px-1.5 py-0 text-[9px] font-bold uppercase leading-none tracking-normal transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                autoMode
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-blue-200 hover:bg-primary hover:text-primary-foreground'
                  : 'border-primary bg-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary',
              )}
            >
              auto
            </Button>
          }
          <p className='text-sm font-medium'>Nível do Piloti</p>
        </div>
      </div>

      <div className='flex items-center justify-center gap-3'>
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9 rounded-full disabled:pointer-events-auto disabled:cursor-not-allowed'
          onClick={() => onNivelIncrement(-0.01)}
          disabled={nivel <= minNivel}>

          <FontAwesomeIcon icon={faMinus} className='h-3 w-3'/>
        </Button>

        <div className='flex min-w-[7rem] items-baseline justify-center gap-1'>
          {enableInput ?
            <span
              ref={editableNivelRef}
              aria-label='Nível do piloti em metros'
              role='textbox'
              tabIndex={0}
              contentEditable
              suppressContentEditableWarning
              inputMode='numeric'
              onInput={handleEditableInput}
              onBlur={commitInput}
              onKeyDown={handleEditableKeyDown}
              onPaste={(event) => {
                event.preventDefault();
                const digits = sanitizeNivelInputDigits(event.clipboardData.getData('text'));
                const nextText = formatNivelInputDigits(digits);
                setInputDigits(digits);
                replaceEditableText(nextText);
                moveCaretToEnd();
              }}
              className='inline-block min-w-[4.6rem] rounded-sm text-center text-4xl font-bold leading-none text-primary outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
            >
              {displayedNivel}
            </span> :
            <span className='text-4xl font-bold text-primary'>{displayedNivel}</span>
          }
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
          // Só aplica alterações persistentes ao soltar o drag do slider.
          onValueCommit={([v]) => onNivelCommit?.(v)}
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
