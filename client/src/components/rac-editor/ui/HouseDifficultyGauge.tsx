import type {HouseDifficultyIndicator, HouseDifficultyLevel} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';

type HouseDifficultyGaugeOrientation = 'horizontal' | 'vertical';

interface HouseDifficultyGaugeProps {
  indicator: HouseDifficultyIndicator;
  orientation?: HouseDifficultyGaugeOrientation;
  className?: string;
  meterClassName?: string;
  testId?: string;
}

const SEGMENTS: Array<{
  level: HouseDifficultyLevel;
  label: string;
  range: string;
  className: string;
}> = [
  {
    level: 'low',
    label: 'Baixa',
    range: '0-24',
    className: 'bg-emerald-500',
  },
  {
    level: 'medium',
    label: 'Média',
    range: '25-49',
    className: 'bg-lime-400',
  },
  {
    level: 'high',
    label: 'Alta',
    range: '50-74',
    className: 'bg-amber-400',
  },
  {
    level: 'critical',
    label: 'Crítica',
    range: '75-100',
    className: 'bg-red-500',
  },
];

export function HouseDifficultyGauge({
  indicator,
  orientation = 'horizontal',
  className,
  meterClassName,
  testId = 'house-difficulty-gauge',
}: HouseDifficultyGaugeProps) {
  const score = Math.min(100, Math.max(0, indicator.score));
  const ariaText = `Dificuldade ${indicator.label}, ${score} de 100`;

  if (orientation === 'vertical') {
    return (
      <div
        data-testid={testId}
        className={cn(
          'flex items-center justify-center',
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role='meter'
              aria-label='Dificuldade da casa ativa'
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
              aria-valuetext={ariaText}
              tabIndex={0}
              className={cn(
                'relative h-32 w-7 rounded-full bg-slate-100 p-1 shadow-sm ring-1 ring-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
                meterClassName,
              )}
            >
              <div className='flex h-full flex-col-reverse overflow-hidden rounded-full'>
                {SEGMENTS.map((segment) => (
                  <span
                    key={segment.level}
                    aria-hidden='true'
                    className={cn('min-h-0 flex-1 border-t border-white/70 first:border-t-0', segment.className)}
                  />
                ))}
              </div>
              <span
                aria-hidden='true'
                className='absolute left-1/2 h-1.5 w-9 -translate-x-1/2 translate-y-1/2 rounded-full bg-slate-950 shadow-sm ring-1 ring-white/80'
                style={{bottom: `${score}%`}}
              />
            </div>
          </TooltipTrigger>
          {renderDifficultyTooltip({indicator, score, side: 'left'})}
        </Tooltip>
      </div>
    );
  }

  return (
    <div data-testid={testId} className={cn('w-full min-w-0', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role='meter'
            aria-label='Dificuldade da casa'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-valuetext={ariaText}
            tabIndex={0}
            className={cn(
              'relative h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
              meterClassName,
            )}
          >
            <div className='grid h-full grid-cols-4 overflow-hidden rounded-full'>
              {SEGMENTS.map((segment) => (
                <span
                  key={segment.level}
                  aria-hidden='true'
                  className={cn('border-l border-white/70 first:border-l-0', segment.className)}
                />
              ))}
            </div>
            <span
              aria-hidden='true'
              className='absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-sm ring-1 ring-white/80'
              style={{left: `${score}%`}}
            />
          </div>
        </TooltipTrigger>
        {renderDifficultyTooltip({indicator, score, side: 'top'})}
      </Tooltip>
    </div>
  );
}

function renderDifficultyTooltip({
  indicator,
  score,
  side,
}: {
  indicator: HouseDifficultyIndicator;
  score: number;
  side: 'left' | 'top';
}) {
  return (
    <TooltipContent
      side={side}
      className='bg-slate-900 p-2 text-xs text-white'
    >
      <div className='space-y-1'>
        <div className='font-semibold'>{`Dificuldade ${indicator.label}: ${score}/100`}</div>
        <div className='grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5'>
          {SEGMENTS.map((segment) => {
            const active = segment.level === indicator.level;

            return (
              <div key={segment.level} className='contents'>
                <span className={cn(active ? 'font-semibold text-white' : 'text-slate-300')}>
                  {segment.label}
                </span>
                <span className={cn('text-right', active ? 'font-semibold text-white' : 'text-slate-400')}>
                  {segment.range}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipContent>
  );
}
