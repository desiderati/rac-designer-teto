import {FABButton, SubMenuButton} from './ToolbarButtons.tsx';
import {MAIN_MENU_ICONS, OverflowActionKey, OVERFLOW_MENU_CONFIG} from './helpers/toolbar-config.ts';
import type {ToolbarActionMap, ToolbarSubmenu} from './helpers/toolbar-types.ts';
import {TutorialHighlight} from "@/components/rac-editor/tutorial/Tutorial.tsx";

interface ToolbarOverflowMenuProps {
  actions: ToolbarActionMap;
  activeSubmenu: ToolbarSubmenu;
  tutorialHighlight: TutorialHighlight;
  isTutorialActive: boolean;
  showTips: boolean;
  onImportClick: () => void;
}

export function ToolbarOverflowMenu({
  actions,
  activeSubmenu,
  tutorialHighlight,
  isTutorialActive,
  showTips,
  onImportClick,
}: ToolbarOverflowMenuProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 items-end">
      <FABButton
        icon={MAIN_MENU_ICONS.overflow}
        title="Mais Opções"
        onClick={actions.toggleOverflowMenu}
        isMain
        isActive={activeSubmenu === 'overflow'}
        isPulsing={tutorialHighlight === 'more-options'}
        hideTooltip={activeSubmenu === 'overflow' || isTutorialActive}
        tooltipSide="left"
      />

      {activeSubmenu === 'overflow' && (
        <div className="flex flex-col gap-1 items-end animate-in slide-in-from-top-2 duration-200">
          {OVERFLOW_MENU_CONFIG.map((item) => {
            if (item.kind === 'import') {
              return (
                <SubMenuButton
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  onClick={onImportClick}
                  color={item.color}
                  hideTooltip={isTutorialActive}
                  tooltipSide="left"
                />
              );
            }

            return (
              <SubMenuButton
                key={item.title}
                icon={item.icon}
                title={item.title}
                onClick={() => runOverflowAction(actions, item.action)}
                color={item.color}
                isActive={item.action === 'toggleTips' && showTips}
                hideTooltip={isTutorialActive}
                tooltipSide="left"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function runOverflowAction(actions: ToolbarActionMap, action: OverflowActionKey) {
  if (action === 'exportJSON') {
    actions.exportJSON();
    return;
  }
  if (action === 'savePDF') {
    actions.savePDF();
    return;
  }
  if (action === 'open3DViewer') {
    actions.open3DViewer();
    return;
  }
  if (action === 'restartTutorial') {
    actions.restartTutorial();
    return;
  }
  if (action === 'toggleTips') {
    actions.toggleTips();
    return;
  }
  if (action === 'openSettings') {
    actions.openSettings?.();
  }
}
