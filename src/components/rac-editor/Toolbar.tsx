import {ChangeEvent, useRef} from 'react';
import {ToolbarMainMenu} from './toolbar/ToolbarMainMenu';
import {ToolbarOverflowMenu} from './toolbar/ToolbarOverflowMenu';
import type {ToolbarActionMap, ToolbarProps} from './toolbar/toolbar-types';

export type {ToolbarActionMap};

export function Toolbar({
  actions,
  isDrawing,
  activeSubmenu,
  showTips,
  showZoomControls,
  tutorialHighlight = null,
  isMenuOpen,
  isTutorialActive = false,
  houseType,
  frontViewCount = {current: 0, max: 0},
  backViewCount = {current: 0, max: 0},
  side1ViewCount = {current: 0, max: 0},
  side2ViewCount = {current: 0, max: 0},
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    actions.importJSON(file);
    e.target.value = '';
  };

  return (
    <>
      <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden"/>

      <ToolbarMainMenu
        actions={actions}
        isDrawing={isDrawing}
        activeSubmenu={activeSubmenu}
        isMenuOpen={isMenuOpen}
        isTutorialActive={isTutorialActive}
        tutorialHighlight={tutorialHighlight}
        showZoomControls={showZoomControls}
        houseType={houseType}
        frontViewCount={frontViewCount}
        backViewCount={backViewCount}
        side1ViewCount={side1ViewCount}
        side2ViewCount={side2ViewCount}
      />

      <ToolbarOverflowMenu
        actions={actions}
        activeSubmenu={activeSubmenu}
        tutorialHighlight={tutorialHighlight}
        isTutorialActive={isTutorialActive}
        showTips={showTips}
        onImportClick={() => fileInputRef.current?.click()}
      />
    </>
  );
}
