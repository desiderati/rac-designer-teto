import {CanvasToolsMenu} from './CanvasToolsMenu.tsx';
import {TopBar} from './TopBar.tsx';
import type {RacEditorMenusProps} from '../lib/menu-types.ts';

/**
 * Composition root for RAC editor menus.
 *
 * Layout (Stitch-aligned, see `.stitch/designs/canvas-refined.html`):
 *  - Top bar: hamburger + family name (left), zoom + tools (center),
 *             3D / Exportar / avatar (right).
 *  - Side rail: vertical, always-visible, centered on the left edge.
 *
 * Replaces the previous floating-FAB layout (single hamburger toggling a
 * collapsible main menu + an overflow menu on the right).
 */
export function RacEditorMenus({
  actions,
  constructionGroups,
  isDrawing,
  activeSubmenu,
  showTips,
  houseType,
  frontViewCount = {current: 0, max: 0},
  backViewCount = {current: 0, max: 0},
  side1ViewCount = {current: 0, max: 0},
  side2ViewCount = {current: 0, max: 0},
  familyName,
  zoom,
  canvasToolMode,
  isMobile,
  documentSaveStatus,
  documentTransitioning,
  canExportPDF,
  isReadOnly = false,
}: RacEditorMenusProps) {
  return (
    <>
      <TopBar
        actions={actions}
        constructionGroups={constructionGroups}
        familyName={familyName}
        showTips={showTips}
        zoom={zoom}
        canvasToolMode={canvasToolMode}
        isMobile={isMobile}
        documentSaveStatus={documentSaveStatus}
        documentTransitioning={documentTransitioning}
        canExportPDF={canExportPDF}
        isReadOnly={isReadOnly}
      />

      <CanvasToolsMenu
        actions={actions}
        isDrawing={isDrawing}
        activeSubmenu={activeSubmenu}
        houseType={houseType}
        frontViewCount={frontViewCount}
        backViewCount={backViewCount}
        side1ViewCount={side1ViewCount}
        side2ViewCount={side2ViewCount}
        isMobile={isMobile}
        disabled={isReadOnly}
      />
    </>
  );
}
