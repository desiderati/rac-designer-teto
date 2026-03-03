import {FABButton, SubMenuButton} from './ToolbarButtons.tsx';
import {
  ELEMENTS_MENU_CONFIG,
  HOUSE_MENU_CONFIG,
  HouseMenuLimitKey,
  LINES_MENU_CONFIG,
  MAIN_MENU_ICONS,
} from './helpers/toolbar-config.ts';
import type {ToolbarActionMap, ToolbarSubmenu, ToolbarViewCount} from './helpers/toolbar-types.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {TutorialHighlight} from '@/components/rac-editor/lib/tutorial.ts';
import {TOOLBAR_THEME} from '@/shared/config.ts';

interface ToolbarMainMenuProps {
  actions: ToolbarActionMap;
  isDrawing: boolean;
  activeSubmenu: ToolbarSubmenu;
  isMenuOpen: boolean;
  isTutorialActive: boolean;
  tutorialHighlight: TutorialHighlight;
  showZoomControls: boolean;
  houseType: HouseType;
  frontViewCount: ToolbarViewCount;
  backViewCount: ToolbarViewCount;
  side1ViewCount: ToolbarViewCount;
  side2ViewCount: ToolbarViewCount;
}

export function ToolbarMainMenu({
  actions,
  isDrawing,
  activeSubmenu,
  isMenuOpen,
  isTutorialActive,
  tutorialHighlight,
  showZoomControls,
  houseType,
  frontViewCount,
  backViewCount,
  side1ViewCount,
  side2ViewCount,
}: ToolbarMainMenuProps) {
  const houseMenuItems = houseType ? HOUSE_MENU_CONFIG[houseType] : [];
  const isHouseMenuOpen = activeSubmenu === 'house' && !!houseType;

  return (
    <div className='fixed top-5 left-5 z-50 flex flex-col gap-2'>
      <FABButton
        icon={isMenuOpen ? MAIN_MENU_ICONS.close : MAIN_MENU_ICONS.open}
        title={isMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
        onClick={actions.toggleMenu}
        isMain
        className={isMenuOpen ? TOOLBAR_THEME.classes.mainMenuToggleOpenedSurface : ''}
        isPulsing={tutorialHighlight === 'main-fab'}
        hideTooltip={isTutorialActive}
      />

      {isMenuOpen && (
        <div className='flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200'>
          <div className='relative'>
            <FABButton
              icon={MAIN_MENU_ICONS.house}
              title='Casa TETO (Opções)'
              onClick={() => (houseType ? actions.toggleHouseMenu() : actions.openHouseTypeSelector())}
              isActive={activeSubmenu === 'house'}
              isPulsing={tutorialHighlight === 'house'}
              hideTooltip={activeSubmenu === 'house' || isTutorialActive}
            />

            {isHouseMenuOpen && (
              <div className='absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2'>
                {houseMenuItems.map((item) => (
                  <SubMenuButton
                    key={`${houseType}-${item.action}-${item.title}`}
                    icon={item.icon}
                    title={item.title}
                    onClick={actions[item.action]}
                    hideTooltip={isTutorialActive}
                    isAtLimit={resolveLimitState(item.limitKey, {
                      frontViewCount,
                      backViewCount,
                      side1ViewCount,
                      side2ViewCount,
                    })}
                  />
                ))}
              </div>
            )}
          </div>

          <FABButton
            icon={MAIN_MENU_ICONS.unlock}
            title='Desbloquear (Desagrupar) - Out of Service'
            onClick={() => {
            }}
            hideTooltip={isTutorialActive}
            className={TOOLBAR_THEME.classes.disabledActionSurface}
          />

          <FABButton
            icon={MAIN_MENU_ICONS.lock}
            title='Bloquear (Agrupar) - Out of Service'
            onClick={() => {
            }}
            hideTooltip={isTutorialActive}
            className={TOOLBAR_THEME.classes.disabledActionSurface}
          />

          <div className='relative'>
            <FABButton
              icon={MAIN_MENU_ICONS.elements}
              title='Elementos'
              onClick={actions.toggleElementsMenu}
              isActive={activeSubmenu === 'elements'}
              isPulsing={tutorialHighlight === 'elements'}
              hideTooltip={activeSubmenu === 'elements' || isTutorialActive}
            />

            {activeSubmenu === 'elements' && (
              <div className='absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2'>
                {ELEMENTS_MENU_CONFIG.map((item) => (
                  <SubMenuButton
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    onClick={actions[item.action]}
                    isDisabled={item.disabled}
                    hideTooltip={isTutorialActive}
                  />
                ))}
              </div>
            )}
          </div>

          <div className='relative'>
            <FABButton
              icon={MAIN_MENU_ICONS.lines}
              title='Linhas'
              onClick={actions.toggleLinesMenu}
              isActive={activeSubmenu === 'lines'}
              hideTooltip={activeSubmenu === 'lines' || isTutorialActive}
            />

            {activeSubmenu === 'lines' && (
              <div className='absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2'>
                {LINES_MENU_CONFIG.map((item) => (
                  <SubMenuButton
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    onClick={actions[item.action]}
                    hideTooltip={isTutorialActive}
                  />
                ))}
              </div>
            )}
          </div>

          <FABButton
            icon={MAIN_MENU_ICONS.pencil}
            title='Lápis'
            onClick={actions.toggleDrawMode}
            isActive={isDrawing}
            hideTooltip={isTutorialActive}
          />

          <FABButton
            icon={MAIN_MENU_ICONS.text}
            title='Texto Livre'
            onClick={actions.addText}
            hideTooltip={isTutorialActive}
          />

          <FABButton
            icon={MAIN_MENU_ICONS.zoom}
            title={showZoomControls ? 'Esconder Zoom/Minimap' : 'Mostrar Zoom/Minimap'}
            onClick={actions.toggleZoomControls}
            color={showZoomControls ? TOOLBAR_THEME.iconDefaultColor : TOOLBAR_THEME.iconZoomDisabledColor}
            isActive={showZoomControls}
            isPulsing={tutorialHighlight === 'zoom-minimap'}
            hideTooltip={isTutorialActive}
          />

          <FABButton
            icon={MAIN_MENU_ICONS.delete}
            title='Excluir Item'
            onClick={actions.deleteSelection}
            color={TOOLBAR_THEME.iconDeleteColor}
            hideTooltip={isTutorialActive}
          />
        </div>
      )}
    </div>
  );
}

function resolveLimitState(limitKey: HouseMenuLimitKey, limits: {
  frontViewCount: ToolbarViewCount;
  backViewCount: ToolbarViewCount;
  side1ViewCount: ToolbarViewCount;
  side2ViewCount: ToolbarViewCount;
}): boolean {
  if (limitKey === 'front') return limits.frontViewCount.current >= limits.frontViewCount.max;
  if (limitKey === 'back') return limits.backViewCount.current >= limits.backViewCount.max;
  if (limitKey === 'side1') return limits.side1ViewCount.current >= limits.side1ViewCount.max;
  return limits.side2ViewCount.current >= limits.side2ViewCount.max;
}

