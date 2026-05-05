import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {FamilyName} from './FamilyName.tsx';
import {HamburgerMenu} from './HamburgerMenu.tsx';
import {UserMenu} from './UserMenu.tsx';
import {ZoomMenu} from './ZoomMenu.tsx';
import type {CanvasToolMode, MenuActionMap} from '../lib/menu-types.ts';

interface TopBarProps {
  actions: MenuActionMap;
  familyName: string;
  showTips: boolean;
  zoom: number;
  canvasToolMode: CanvasToolMode;
  isMobile: boolean;
}

/**
 * Floating top bar with three zones (Stitch refined-canvas reference):
 *
 *   ┌---------------------------------------------------------------------┐
 *   |  ☰  TADEU E ODETE       🔍  50%             ⌖  3D  ↑ Exportar  👤  │
 *   └---------------------------------------------------------------------┘
 *
 * - Left:   Hamburger menu + family-name (hover-edit)
 * - Center: Zoom indicator with S/P/F submenu
 * - Right:  3D button + Exportar (PDF) button + Avatar dropdown
 */
export function TopBar({actions, familyName, showTips, zoom, canvasToolMode, isMobile}: TopBarProps) {
  return (
    <>
      {/* Left: Menu + Family */}
      <div className='fixed top-4 left-4 z-50 flex items-center gap-3'>
        <HamburgerMenu actions={actions}/>
        <FamilyName familyName={familyName} onRename={actions.renameFamily}/>
      </div>

      {/* Center: Zoom indicator + canvas-tool submenu */}
      <div className='fixed top-4 left-1/2 -translate-x-1/2 z-50'>
        <ZoomMenu
          zoom={zoom}
          canvasToolMode={canvasToolMode}
          onSetToolMode={actions.setCanvasToolMode}
          onFitToView={actions.fitToView}
          isMobile={isMobile}
        />
      </div>

      {/* Right: 3D / Exportar / Avatar */}
      <div className='fixed top-4 right-4 z-50 flex items-center gap-2'>
        <button
          type='button'
          onClick={actions.open3DViewer}
          data-guided-tour-id='rac-view-3d'
          className={cn(
            'hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium',
            'bg-white/85 backdrop-blur-md border border-slate-200 shadow-sm',
            'hover:bg-slate-50 transition-colors text-slate-700',
          )}
          title='Visualização 3D'
          aria-label='Visualização 3D'
        >
          <FontAwesomeIcon icon={TOP_BAR_ICONS.view3d} className='text-base text-slate-500'/>
          <span>3D</span>
        </button>

        <button
          type='button'
          onClick={actions.savePDF}
          data-guided-tour-id='rac-export-pdf'
          className={cn(
            'hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white',
            'bg-gradient-to-tr from-blue-500 to-blue-300 shadow-md border border-blue-200',
            'hover:scale-[1.03] active:scale-95 transition-transform',
          )}
          title='Exportar RAC em PDF'
          aria-label='Exportar RAC em PDF'
        >
          <FontAwesomeIcon icon={TOP_BAR_ICONS.export} className='text-base'/>
          <span>Exportar</span>
        </button>

        <UserMenu
          isMobile={isMobile}
          showTips={showTips}
          onRestartDrawing={actions.restartDrawing}
          onOpen3DViewer={actions.open3DViewer}
          onSavePDF={actions.savePDF}
          onToggleTips={actions.toggleTips}
          onOpenSettings={() => actions.openSettings?.()}
          onExit={actions.exit}
        />
      </div>
    </>
  );
}
