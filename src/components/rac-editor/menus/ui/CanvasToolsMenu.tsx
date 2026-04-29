import {PointerEvent, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  ELEMENTS_MENU_CONFIG,
  HOUSE_MENU_CONFIG,
  HouseMenuLimitKey,
  LINES_MENU_CONFIG,
  MAIN_MENU_ICONS,
} from '../lib/menu-config.ts';
import type {
  MenuActionMap,
  MenuSubmenu,
  MenuViewCount,
} from '../lib/menu-types.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {TutorialHighlight} from '@/components/rac-editor/lib/tutorial.ts';

interface CanvasToolsMenuProps {
  actions: MenuActionMap;
  isDrawing: boolean;
  activeSubmenu: MenuSubmenu;
  isTutorialActive: boolean;
  tutorialHighlight: TutorialHighlight;
  houseType: HouseType;
  frontViewCount: MenuViewCount;
  backViewCount: MenuViewCount;
  side1ViewCount: MenuViewCount;
  side2ViewCount: MenuViewCount;
  isMobile: boolean;
}

/**
 * Menu vertical de ferramentas do canvas no estilo glass-pill.
 *
 * On mobile, a thin left-edge handle lets the user collapse or reveal the rail
 * by click/tap or by the expected horizontal drag gesture.
 */
export function CanvasToolsMenu({
  actions,
  isDrawing,
  activeSubmenu,
  isTutorialActive,
  tutorialHighlight,
  houseType,
  frontViewCount,
  backViewCount,
  side1ViewCount,
  side2ViewCount,
  isMobile,
}: CanvasToolsMenuProps) {
  const houseMenuItems = houseType ? HOUSE_MENU_CONFIG[houseType] : [];
  const isHouseMenuOpen = activeSubmenu === 'house' && !!houseType;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const handleHandlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartXRef.current = event.clientX;
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const startX = dragStartXRef.current;
    dragStartXRef.current = null;
    if (startX === null) return;

    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) <= 24) return;

    didDragRef.current = true;
    setIsCollapsed(deltaX < 0);
  };

  const handleHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setIsCollapsed((current) => !current);
  };

  const mobileHandle = isMobile ? (
    <button
      type='button'
      aria-label={isCollapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}
      title={isCollapsed ? 'Abrir menu lateral' : 'Recolher menu lateral'}
      onPointerDown={handleHandlePointerDown}
      onPointerUp={handleHandlePointerUp}
      onClick={handleHandleClick}
      className={cn(
        'fixed top-1/2 -translate-y-1/2 z-50',
        isCollapsed ? 'left-1' : 'left-[4.25rem]',
        'w-5 h-24 flex items-center justify-center touch-none',
        'text-transparent',
      )}
    >
      <span
        className='block h-16 w-1.5 rounded-full bg-slate-400/70 border border-white/70 shadow-sm'
        aria-hidden
      />
    </button>
  ) : null;

  if (isMobile && isCollapsed) {
    return mobileHandle;
  }

  return (
    <>
      {mobileHandle}
      <aside
        role='toolbar'
        className={cn(
          'fixed left-4 top-1/2 -translate-y-1/2 z-40',
          'flex flex-col items-center gap-1 p-1',
          'w-12 rounded-full bg-white/85 backdrop-blur-xl',
          'border border-slate-200 shadow-lg',
        )}
        aria-label='Barra de ferramentas principal'
      >
        <RailItemWithSubmenu
          anchorOpen={isHouseMenuOpen}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.house}
              title='Casa TETO (Opções)'
              onClick={() => (houseType ? actions.toggleHouseMenu() : actions.openHouseTypeSelector())}
              isActive={activeSubmenu === 'house'}
              isPulsing={tutorialHighlight === 'house'}
              hideTooltip={activeSubmenu === 'house' || isTutorialActive}
            />
          )}
          items={houseMenuItems.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
            isAtLimit: resolveLimitState(item.limitKey, {
              frontViewCount,
              backViewCount,
              side1ViewCount,
              side2ViewCount,
            }),
          }))}
          isTutorialActive={isTutorialActive}
        />

        <RailItemWithSubmenu
          anchorOpen={activeSubmenu === 'elements'}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.elements}
              title='Elementos'
              onClick={actions.toggleElementsMenu}
              isActive={activeSubmenu === 'elements'}
              isPulsing={tutorialHighlight === 'elements'}
              hideTooltip={activeSubmenu === 'elements' || isTutorialActive}
            />
          )}
          items={ELEMENTS_MENU_CONFIG.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
            isDisabled: item.disabled,
          }))}
          isTutorialActive={isTutorialActive}
        />

        <RailItemWithSubmenu
          anchorOpen={activeSubmenu === 'lines'}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.lines}
              title='Linhas'
              onClick={actions.toggleLinesMenu}
              isActive={activeSubmenu === 'lines'}
              hideTooltip={activeSubmenu === 'lines' || isTutorialActive}
            />
          )}
          items={LINES_MENU_CONFIG.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
          }))}
          isTutorialActive={isTutorialActive}
        />

        <RailButton
          icon={MAIN_MENU_ICONS.pencil}
          title='Lápis'
          onClick={actions.toggleDrawMode}
          isActive={isDrawing}
          hideTooltip={isTutorialActive}
        />

        <RailButton
          icon={MAIN_MENU_ICONS.text}
          title='Texto Livre'
          onClick={actions.addText}
          hideTooltip={isTutorialActive}
        />

        <RailDivider/>

        <RailButton
          icon={MAIN_MENU_ICONS.delete}
          title='Excluir Item'
          onClick={actions.deleteSelection}
          isDestructive
          hideTooltip={isTutorialActive}
        />
      </aside>
    </>
  );
}

interface RailButtonProps {
  icon: IconDefinition;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  isDestructive?: boolean;
  isPulsing?: boolean;
  isAtLimit?: boolean;
  hideTooltip?: boolean;
}

export function RailButton({
  icon,
  title,
  onClick,
  isActive = false,
  isDisabled = false,
  isDestructive = false,
  isPulsing = false,
  isAtLimit = false,
  hideTooltip = false,
}: RailButtonProps) {
  const button = (
    <button
      type='button'
      onClick={isDisabled ? undefined : onClick}
      aria-label={title}
      disabled={isDisabled}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-full',
        'transition-colors text-sm',
        isDisabled && 'opacity-40 cursor-not-allowed text-slate-400',
        !isDisabled && !isActive && !isDestructive
        && 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
        !isDisabled && isActive
        && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        !isDisabled && isDestructive
        && 'text-red-500 hover:text-red-600 hover:bg-red-50',
        isAtLimit && !isDisabled && 'opacity-60',
        isPulsing && 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 z-50',
      )}
    >
      <FontAwesomeIcon icon={icon}/>
    </button>
  );

  if (hideTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side='right' className='bg-slate-900 text-white text-xs'>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

interface RailItemWithSubmenuProps {
  anchorOpen: boolean;
  anchor: React.ReactElement;
  items: Array<{
    icon: IconDefinition;
    title: string;
    onClick: () => void;
    isDisabled?: boolean;
    isAtLimit?: boolean;
  }>;
  isTutorialActive: boolean;
}

function RailItemWithSubmenu({
  anchorOpen,
  anchor,
  items,
  isTutorialActive,
}: RailItemWithSubmenuProps) {
  return (
    <div className='relative'>
      {anchor}
      {anchorOpen && (
        <div
          data-testid='rac-side-rail-submenu'
          className={cn(
            'absolute left-full top-1/2 -translate-y-1/2 ml-2',
            'flex h-12 flex-row items-center gap-1 px-1 py-1',
            'rounded-full bg-white/90 backdrop-blur-xl border border-slate-200 shadow-md',
            'animate-in slide-in-from-left-2 duration-150',
          )}
        >
          {items.map((item) => (
            <RailButton
              key={item.title}
              icon={item.icon}
              title={item.title}
              onClick={item.onClick}
              isDisabled={item.isDisabled}
              isAtLimit={item.isAtLimit}
              hideTooltip={isTutorialActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RailDivider() {
  return <div className='w-6 h-px bg-slate-200 my-0.5' aria-hidden/>;
}

function resolveLimitState(
  limitKey: HouseMenuLimitKey,
  limits: {
    frontViewCount: MenuViewCount;
    backViewCount: MenuViewCount;
    side1ViewCount: MenuViewCount;
    side2ViewCount: MenuViewCount;
  },
): boolean {
  if (limitKey === 'front') return limits.frontViewCount.current >= limits.frontViewCount.max;
  if (limitKey === 'back') return limits.backViewCount.current >= limits.backViewCount.max;
  if (limitKey === 'side1') return limits.side1ViewCount.current >= limits.side1ViewCount.max;
  return limits.side2ViewCount.current >= limits.side2ViewCount.max;
}
