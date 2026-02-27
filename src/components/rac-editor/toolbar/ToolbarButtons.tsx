import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';
import {cn} from '@/components/lib/utils.ts';
import {TOOLBAR_THEME} from '@/shared/config.ts';

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
  color = TOOLBAR_THEME.iconDefaultColor,
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
        TOOLBAR_THEME.classes.baseButtonShell,
        TOOLBAR_THEME.classes.mainButtonSurface,
        isMain ? 'w-12 h-12 text-xl' : 'w-11 h-11 text-lg',
        isActive && TOOLBAR_THEME.classes.mainButtonActiveSurface,
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
      <TooltipContent side={tooltipSide} className={TOOLBAR_THEME.classes.tooltipSurface}>
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
  color = TOOLBAR_THEME.iconDefaultColor,
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
        TOOLBAR_THEME.classes.baseButtonShell,
        'w-11 h-11 text-lg shadow-md',
        isDisabled
          ? TOOLBAR_THEME.classes.submenuDisabledSurface
          : isActive ? TOOLBAR_THEME.classes.submenuActiveSurface : TOOLBAR_THEME.classes.submenuDefaultSurface,
        !isDisabled &&
        (isAtLimit ? 'hover:bg-gray-500 hover:opacity-60' : TOOLBAR_THEME.classes.submenuAvailableHoverSurface)
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
        className={TOOLBAR_THEME.classes.tooltipSurface}
      >
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

