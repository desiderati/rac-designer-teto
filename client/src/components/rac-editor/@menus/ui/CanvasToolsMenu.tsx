import {ElementsSubmenu} from './ElementsSubmenu.tsx';
import {getElementsRadialItems} from './ElementsRadialItems.tsx';
import {MobileRadialMenu} from '@/components/rac-editor/ui/MobileRadialMenu.tsx';
import type {RadialMenuItem} from '@/components/rac-editor/ui/RadialTreeMenu.tsx';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import {PointerEvent, ReactElement, useEffect, useRef, useState} from 'react';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {RailButton} from './RailButton.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {
  GEOMETRY_MENU_CONFIG,
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

interface CanvasToolsMenuProps {
  actions: MenuActionMap;
  isDrawing: boolean;
  activeSubmenu: MenuSubmenu;
  houseType: HouseType;
  frontViewCount: MenuViewCount;
  backViewCount: MenuViewCount;
  side1ViewCount: MenuViewCount;
  side2ViewCount: MenuViewCount;
  isMobile: boolean;
  disabled?: boolean;
  showToolMenuLabels?: boolean;
}

export function CanvasToolsMenu({
  actions,
  isDrawing,
  activeSubmenu,
  houseType,
  frontViewCount,
  backViewCount,
  side1ViewCount,
  side2ViewCount,
  isMobile,
  disabled = false,
  showToolMenuLabels = false,
}: CanvasToolsMenuProps) {
  const {landscape, mobile} = useCanvasMobileViewport();
  const showLabels = showToolMenuLabels && !mobile;
  const houseMenuItems = houseType ? HOUSE_MENU_CONFIG[houseType] : [];
  const isHouseMenuOpen = activeSubmenu === 'house' && !!houseType;
  const isToolbarCollapseViewport = useToolbarCollapseViewport();
  const shouldDefaultCollapse = usePhoneToolbarCollapseViewport();
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const shouldShowMobileHandle = isMobile && isToolbarCollapseViewport;
  const isCollapsed = !landscape && shouldShowMobileHandle && (collapsedOverride ?? shouldDefaultCollapse);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const radialItems: RadialMenuItem[] = [
    {id: 'house', label: 'Casa TETO (Opções)', caption: 'Casa TETO', icon: MAIN_MENU_ICONS.house, disabled,
      ...(houseType ? {children: houseMenuItems.map(item => ({
        id: item.title, label: item.title, icon: item.icon, disabled,
        atLimit: resolveLimitState(item.limitKey, {
          frontViewCount, backViewCount, side1ViewCount, side2ViewCount,
        }), onSelect: actions[item.action],
      }))} : {onSelect: actions.openHouseTypeSelector})},
    {id: 'elements', label: 'Elementos', icon: MAIN_MENU_ICONS.elements, disabled,
      children: getElementsRadialItems(actions, disabled)},
    {id: 'geometry', label: 'Objetos Geométricos', icon: MAIN_MENU_ICONS.geometry, disabled,
      children: GEOMETRY_MENU_CONFIG.map(item => ({id: item.title, label: item.title,
        icon: item.icon, disabled, onSelect: actions[item.action]}))},
    {id: 'lines', label: 'Linhas', icon: MAIN_MENU_ICONS.lines, disabled,
      children: LINES_MENU_CONFIG.map(item => ({id: item.title, label: item.title,
        icon: item.icon, disabled, guidedTourId: item.guidedTourId, onSelect: actions[item.action]}))},
    {id: 'pencil', label: 'Lápis', icon: MAIN_MENU_ICONS.pencil, disabled, active: isDrawing,
      onSelect: actions.toggleDrawMode},
    {id: 'text', label: 'Texto Livre', icon: MAIN_MENU_ICONS.text, disabled, onSelect: actions.addText},
    {id: 'upload', label: 'Upload de Imagem', icon: MAIN_MENU_ICONS.upload, disabled,
      onSelect: actions.openImageUpload},
    {id: 'delete', label: 'Excluir Item', icon: MAIN_MENU_ICONS.delete, disabled,
      destructive: true, onSelect: actions.deleteSelection},
  ];

  useEffect(() => {
    if (!landscape || !activeSubmenu) return;
    const closeSubmenu = activeSubmenu === 'house' ? actions.toggleHouseMenu
      : activeSubmenu === 'elements' ? actions.toggleElementsMenu
        : activeSubmenu === 'geometry' ? actions.toggleGeometryMenu
          : activeSubmenu === 'lines' ? actions.toggleLinesMenu : undefined;
    closeSubmenu?.();
  }, [landscape, activeSubmenu, actions]);

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
    setCollapsedOverride(deltaX < 0);
  };

  const handleHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setCollapsedOverride((current) => !(current ?? shouldDefaultCollapse));
  };

  const mobileHandle = !landscape && shouldShowMobileHandle ? (
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
        className='block h-16 w-3 rounded-full bg-slate-400/70 border border-white/70 shadow-sm'
        aria-hidden
      />
    </button>
  ) : null;

  if (isCollapsed) {
    return mobileHandle;
  }

  return (
    <>
      {mobileHandle}
      <MobileRadialMenu side='left' label='Ferramentas do Canvas' items={radialItems}
        role='toolbar'
        className={cn(
          'fixed left-4 top-1/2 -translate-y-1/2 z-40',
          showLabels ? 'flex flex-col items-center gap-1 px-[5px] py-[6px]' : 'flex flex-col items-center gap-1 p-1',
          showLabels ? 'w-[88px] rounded-[24px] bg-white/85 backdrop-blur-xl'
            : 'w-12 rounded-full bg-white/85 backdrop-blur-xl',
          'border border-slate-200 shadow-lg',
        )}
        aria-label='Barra de ferramentas principal'
        data-guided-tour-id='rac-toolbar'
        aria-disabled={disabled}
      >
        <RailItemWithSubmenu
          anchorOpen={!disabled && isHouseMenuOpen}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.house}
              title='Casa TETO (Opções)'
              onClick={() => (houseType ? actions.toggleHouseMenu() : actions.openHouseTypeSelector())}
              isActive={activeSubmenu === 'house'}
              isDisabled={disabled}
              hideTooltip={activeSubmenu === 'house'}
              showLabel={showLabels}
              label='Casa TETO'
            />
          )}
          items={houseMenuItems.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
            isDisabled: disabled,
            isAtLimit: resolveLimitState(item.limitKey, {
              frontViewCount,
              backViewCount,
              side1ViewCount,
              side2ViewCount,
            }),
          }))}
          showLabels={showLabels}
        />

        <div className='relative'>
          <RailButton
            icon={MAIN_MENU_ICONS.elements}
            title='Elementos'
            isExpanded={!disabled && activeSubmenu === 'elements'}
            onClick={actions.toggleElementsMenu}
            isActive={activeSubmenu === 'elements'}
            isDisabled={disabled}
            hideTooltip={activeSubmenu === 'elements'}
            showLabel={showLabels}
          />
          {!disabled && activeSubmenu === 'elements' && <ElementsSubmenu
            actions={actions} disabled={disabled} onDismiss={actions.toggleElementsMenu}
            showToolMenuLabels={showLabels}/>}
        </div>

        <RailItemWithSubmenu
          anchorOpen={!disabled && activeSubmenu === 'geometry'}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.geometry}
              title='Objetos Geométricos'
              onClick={actions.toggleGeometryMenu}
              isActive={activeSubmenu === 'geometry'}
              isDisabled={disabled}
              hideTooltip={activeSubmenu === 'geometry'}
              showLabel={showLabels}
              label='Geometria'
            />
          )}
          items={GEOMETRY_MENU_CONFIG.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
            isDisabled: disabled,
          }))}
          showLabels={showLabels}
        />

        <RailItemWithSubmenu
          anchorOpen={!disabled && activeSubmenu === 'lines'}
          anchor={(
            <RailButton
              icon={MAIN_MENU_ICONS.lines}
              title='Linhas'
              onClick={actions.toggleLinesMenu}
              isActive={activeSubmenu === 'lines'}
              isDisabled={disabled}
              hideTooltip={activeSubmenu === 'lines'}
              showLabel={showLabels}
            />
          )}
          items={LINES_MENU_CONFIG.map((item) => ({
            icon: item.icon,
            title: item.title,
            onClick: actions[item.action],
            isDisabled: disabled,
            guidedTourId: item.guidedTourId,
          }))}
          showLabels={showLabels}
        />

        <RailButton
          icon={MAIN_MENU_ICONS.pencil}
          title='Lápis'
          onClick={actions.toggleDrawMode}
          isActive={isDrawing}
          isDisabled={disabled}
          showLabel={showLabels}
        />

        <RailButton
          icon={MAIN_MENU_ICONS.text}
          title='Texto Livre'
          onClick={actions.addText}
          isDisabled={disabled}
          showLabel={showLabels}
          label='Texto'
        />

        <RailButton
          icon={MAIN_MENU_ICONS.upload}
          title='Upload de Imagem'
          onClick={actions.openImageUpload}
          isDisabled={disabled}
          showLabel={showLabels}
          label='Imagem'
        />

        {!landscape ? <RailDivider showLabels={showLabels}/> : null}

        <RailButton
          icon={MAIN_MENU_ICONS.delete}
          title='Excluir Item'
          onClick={actions.deleteSelection}
          isDestructive
          isDisabled={disabled}
          showLabel={showLabels}
          label='Excluir'
        />
      </MobileRadialMenu>
    </>
  );
}

interface RailItemWithSubmenuProps {
  anchorOpen: boolean;
  anchor: ReactElement;
  showLabels?: boolean;
  items: Array<{
    icon: IconDefinition;
    title: string;
    label?: string;
    onClick: () => void;
    isDisabled?: boolean;
    isAtLimit?: boolean;
    guidedTourId?: string;
  }>;
}

function RailItemWithSubmenu({
  anchorOpen,
  anchor,
  items,
  showLabels = false,
}: RailItemWithSubmenuProps) {
  return (
    <div className='relative'>
      {anchor}
      {anchorOpen && (
        <div
          data-testid='rac-side-rail-submenu'
          className={cn(
            'absolute left-full top-1/2 -translate-y-1/2 ml-2',
            showLabels ? 'flex h-[76px] max-w-[calc(100vw-8rem)] flex-row items-center gap-1 overflow-x-auto px-[5px] py-1'
              : 'flex h-12 flex-row items-center gap-1 px-1 py-1',
            showLabels ? 'rounded-[24px] bg-white/90 backdrop-blur-xl border border-slate-200 shadow-md'
              : 'rounded-full bg-white/90 backdrop-blur-xl border border-slate-200 shadow-md',
            'animate-in slide-in-from-left-2 duration-150',
          )}
        >
          {items.map((item) => (
            <RailButton
              key={item.title}
              icon={item.icon}
              title={item.title}
              label={item.label}
              showLabel={showLabels}
              labelVariant='submenu'
              onClick={item.onClick}
              isDisabled={item.isDisabled}
              isAtLimit={item.isAtLimit}
              guidedTourId={item.guidedTourId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RailDivider({showLabels = false}: {showLabels?: boolean}) {
  return <div className={showLabels ? 'my-0.5 h-px w-[60px] bg-slate-200' : 'w-6 h-px bg-slate-200 my-0.5'} aria-hidden/>;
}

function useToolbarCollapseViewport() {
  const [isCollapseViewport, setIsCollapseViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 767 : false
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 766px)');
    const syncViewport = () => {
      setIsCollapseViewport(window.innerWidth < 767);
    };

    mediaQuery.addEventListener('change', syncViewport);
    syncViewport();
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  return isCollapseViewport;
}

function usePhoneToolbarCollapseViewport() {
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const syncViewport = () => {
      setIsPhoneViewport(window.innerWidth < 640);
    };

    mediaQuery.addEventListener('change', syncViewport);
    syncViewport();
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  return isPhoneViewport;
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
