import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {cn} from '@/lib/utils';

interface FabButtonProps {
  icon: IconDefinition;
  title: string;
  onClick: () => void;
  color?: string;
  isActive?: boolean;
  isMain?: boolean;
  className?: string;
  isPulsing?: boolean;
  hideTooltip?: boolean;
  tooltipSide?: 'right' | 'left';
}

export function FABButton({
  icon,
  title,
  onClick,
  color = '#ecf0f1',
  isActive = false,
  isMain = false,
  className = '',
  isPulsing = false,
  hideTooltip = false,
  tooltipSide = 'right',
}: FabButtonProps) {
  const button = (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      className={cn(
        'border-none rounded-xl bg-[#2c3e50] text-[#ecf0f1] cursor-pointer transition-all duration-200 flex justify-center items-center shadow-lg hover:bg-[#0092DD] hover:scale-105 active:scale-95',
        isMain ? 'w-12 h-12 text-xl' : 'w-11 h-11 text-lg',
        isActive && 'bg-[#e67e22] border-2 border-white',
        isPulsing && 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 z-50',
        className
      )}
    >
      <FontAwesomeIcon icon={icon} style={{color}}/>
    </button>
  );

  if (hideTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} className="bg-[#333] text-white">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

interface SubMenuButtonProps {
  icon: IconDefinition;
  title: string;
  onClick: () => void;
  color?: string;
  hideTooltip?: boolean;
  tooltipSide?: 'bottom' | 'left';
  isAtLimit?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
}

export function SubMenuButton({
  icon,
  title,
  onClick,
  color = '#ecf0f1',
  hideTooltip = false,
  tooltipSide = 'bottom',
  isAtLimit = false,
  isActive = false,
  isDisabled = false,
}: SubMenuButtonProps) {
  const button = (
    <button
      onClick={isDisabled ? undefined : onClick}
      aria-label={title}
      title={title}
      className={cn(
        'w-11 h-11 border-none rounded-xl text-lg transition-all duration-200 flex justify-center items-center shadow-md',
        isDisabled
          ? 'opacity-40 cursor-not-allowed bg-[#2c3e50]'
          : isActive ? 'bg-[#e67e22] border-2 border-white cursor-pointer' : 'bg-[#34495e] cursor-pointer',
        !isDisabled &&
          (isAtLimit ? 'hover:bg-gray-500 hover:opacity-60' : 'hover:bg-[#0092DD] hover:scale-105 active:scale-95')
      )}
    >
      <FontAwesomeIcon icon={icon} style={{color}}/>
    </button>
  );

  if (hideTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipSide === 'left' ? 'center' : 'start'}
        className="bg-[#333] text-white"
      >
        {title}
      </TooltipContent>
    </Tooltip>
  );
}
