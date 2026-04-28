import {SideRail} from './SideRail.tsx';
import {TopBar} from './parts/TopBar.tsx';
import type {ToolbarProps} from './helpers/toolbar-types.ts';

/**
 * Composition root for the refined canvas toolbar.
 *
 * Layout (Stitch-aligned, see `.stitch/designs/canvas-refined.html`):
 *  - Top bar: hamburger + family name (left), zoom + tools (center),
 *             3D / Exportar / avatar (right).
 *  - Side rail: vertical, always-visible, centered on the left edge.
 *
 * Replaces the previous floating-FAB layout (single hamburger toggling a
 * collapsible main menu + an overflow menu on the right).
 */
export function Toolbar({
  actions,
  isDrawing,
  activeSubmenu,
  showTips,
  tutorialHighlight = null,
  isTutorialActive = false,
  houseType,
  frontViewCount = {current: 0, max: 0},
  backViewCount = {current: 0, max: 0},
  side1ViewCount = {current: 0, max: 0},
  side2ViewCount = {current: 0, max: 0},
  familyName,
  zoom,
  canvasToolMode,
  isMobile,
}: ToolbarProps) {
  return (
    <>
      <TopBar
        actions={actions}
        familyName={familyName}
        showTips={showTips}
        zoom={zoom}
        canvasToolMode={canvasToolMode}
        isMobile={isMobile}
      />

      <SideRail
        actions={actions}
        isDrawing={isDrawing}
        activeSubmenu={activeSubmenu}
        isTutorialActive={isTutorialActive}
        tutorialHighlight={tutorialHighlight}
        houseType={houseType}
        frontViewCount={frontViewCount}
        backViewCount={backViewCount}
        side1ViewCount={side1ViewCount}
        side2ViewCount={side2ViewCount}
        isMobile={isMobile}
      />
    </>
  );
}
