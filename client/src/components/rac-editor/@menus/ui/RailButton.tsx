import type {ReactNode} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface RailButtonProps {
  icon?: IconDefinition;
  children?: ReactNode;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  isDestructive?: boolean;
  isAtLimit?: boolean;
  hideTooltip?: boolean;
  guidedTourId?: string;
  isExpanded?: boolean;
  tooltipSide?: 'right' | 'bottom';
  showLabel?: boolean;
  label?: string;
  labelVariant?: 'rail' | 'submenu';
}

/** Botão compartilhado pela barra e suas cápsulas; rótulos são exclusivos do desktop. */
export function RailButton({
  icon, children, title, onClick, isActive = false, isDisabled = false,
  isDestructive = false, isAtLimit = false, hideTooltip = false, guidedTourId,
  isExpanded, tooltipSide = 'right', showLabel = false, label, labelVariant = 'rail',
}: RailButtonProps) {
  const button = (
    <button type='button' onClick={isDisabled ? undefined : onClick}
      aria-label={title} aria-expanded={isExpanded} disabled={isDisabled}
      data-guided-tour-id={guidedTourId}
      className={cn(
        showLabel
          ? cn('relative flex shrink-0 flex-col items-center justify-center gap-1 px-1 py-1',
            labelVariant === 'submenu' ? 'min-h-[64px] w-[92px] rounded-[14px]' : 'min-h-[60px] w-[76px] rounded-[14px]')
          : 'relative flex shrink-0 items-center justify-center w-10 h-10 rounded-full',
        'transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isDisabled && 'opacity-40 cursor-not-allowed text-slate-400',
        !isDisabled && !isActive && !isDestructive
          && 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
        !isDisabled && isActive && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        !isDisabled && isDestructive && 'text-red-500 hover:text-red-600 hover:bg-red-50',
        isAtLimit && !isDisabled && 'opacity-60',
      )}>
      {children ?? (icon && <FontAwesomeIcon icon={icon} className='h-4 w-4'/>)}
      {showLabel && <span aria-hidden='true' className='line-clamp-2 max-w-full text-center text-[12px] leading-[1.2]'>
        {label ?? title}
      </span>}
    </button>
  );

  if (hideTooltip) return button;

  return <Tooltip>
    <TooltipTrigger asChild>{button}</TooltipTrigger>
    <TooltipContent side={tooltipSide} className='bg-slate-900 text-white text-xs'>
      {title}
    </TooltipContent>
  </Tooltip>;
}
