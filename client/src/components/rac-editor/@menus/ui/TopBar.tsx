import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {CircleAlert, CircleCheck, CloudOff, RefreshCw} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {useRemoteSync} from '@/contexts/RemoteSyncContext.tsx';
import {isIsolatedLocalMode} from '@/shared/local-runtime.ts';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {FamilyName} from './FamilyName.tsx';
import {HamburgerMenu} from './HamburgerMenu.tsx';
import {UserMenu} from './UserMenu.tsx';
import {ZoomMenu} from './ZoomMenu.tsx';
import type {CanvasToolMode, MenuActionMap, MenuConstructionGroup} from '../lib/menu-types.ts';
import type {HouseDocumentSaveStatus} from '@/components/rac-editor/ports/HouseDocumentSaveStatus.ts';

interface TopBarProps {
  actions: MenuActionMap;
  constructionGroups: MenuConstructionGroup[];
  familyName: string;
  showTips: boolean;
  zoom: number;
  canvasToolMode: CanvasToolMode;
  isMobile: boolean;
  /** Mantido no contrato do menu durante a migração para o status remoto. */
  documentSaveStatus: HouseDocumentSaveStatus;
  documentTransitioning: boolean;
  canExportPDF: boolean;
  isReadOnly?: boolean;
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
export function TopBar({
  actions,
  constructionGroups,
  familyName,
  showTips,
  zoom,
  canvasToolMode,
  isMobile,
  documentSaveStatus: _documentSaveStatus,
  documentTransitioning,
  canExportPDF,
  isReadOnly = false,
}: TopBarProps) {
  const [showCanvasActionsInAccountMenu, setShowCanvasActionsInAccountMenu] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 740,
  );

  useEffect(() => {
    const updateCanvasActionBreakpoint = () => setShowCanvasActionsInAccountMenu(window.innerWidth < 740);
    updateCanvasActionBreakpoint();
    window.addEventListener('resize', updateCanvasActionBreakpoint);
    return () => window.removeEventListener('resize', updateCanvasActionBreakpoint);
  }, []);

  const exportPDFTitle = canExportPDF
    ? 'Exportar RAC em PDF'
    : 'Insira uma casa no canvas para exportar o RAC em PDF';

  return (
    <div data-testid='top-bar-layout' className='fixed left-0 top-4 z-50 h-12 min-w-[420px] w-full'>
      {/* Left: Menu + Family */}
      <div className='absolute left-4 top-0 z-50 flex items-center gap-3'>
        <HamburgerMenu
          actions={actions}
          constructionGroups={constructionGroups}
          documentTransitioning={documentTransitioning}
        />
        <FamilyName familyName={familyName} onRename={actions.renameFamily} disabled={isReadOnly}/>
      </div>

      {/* Center: Zoom indicator + canvas-tool submenu */}
      <div className='absolute left-1/2 top-0 z-50 -translate-x-1/2'>
        <ZoomMenu
          zoom={zoom}
          canvasToolMode={canvasToolMode}
          onSetToolMode={actions.setCanvasToolMode}
          onFitToView={actions.fitToView}
          isMobile={isMobile}
        />
      </div>

      {/* Right: 3D / Exportar / Avatar */}
      <div className='absolute right-4 top-0 z-50 flex items-center gap-2'>
        <RemoteSyncIndicator
          isMobile={isMobile}
          documentVersion={constructionGroups.find((group) => group.active)?.documentVersion ?? null}
        />

        <button
          type='button'
          onClick={actions.open3DViewer}
          data-guided-tour-id='rac-view-3d'
          className={cn(
            'hidden min-[740px]:flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium',
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
          disabled={!canExportPDF}
          data-guided-tour-id='rac-export-pdf'
          className={cn(
            'hidden min-[740px]:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold',
            'border transition-transform',
            canExportPDF
              ? 'text-white bg-gradient-to-tr from-blue-500 to-blue-300 shadow-md border-blue-200 hover:scale-[1.03] active:scale-95'
              : 'text-slate-400 bg-slate-200 border-slate-200 shadow-none cursor-not-allowed',
          )}
          title={exportPDFTitle}
          aria-label='Exportar RAC em PDF'
        >
          <FontAwesomeIcon icon={TOP_BAR_ICONS.export} className='text-base'/>
          <span>Exportar</span>
        </button>

        <UserMenu
          isMobile={showCanvasActionsInAccountMenu}
          showTips={showTips}
          onRestartDrawing={actions.restartDrawing}
          restartDrawingDisabled={isReadOnly}
          onOpen3DViewer={actions.open3DViewer}
          onSavePDF={actions.savePDF}
          canExportPDF={canExportPDF}
          onToggleTips={actions.toggleTips}
          onOpenSettings={() => actions.openSettings?.()}
          onExit={actions.exit}
        />
      </div>
    </div>
  );
}

function RemoteSyncIndicator({
  isMobile,
  documentVersion,
}: {
  isMobile: boolean;
  documentVersion: number | null;
}) {
  const sync = useRemoteSync();
  const status = sync.status;
  const labelByStatus = {
    synced: isIsolatedLocalMode ? 'Salvo neste dispositivo' : 'Sincronizado',
    syncing: isIsolatedLocalMode ? 'Salvando neste dispositivo' : 'Sincronizando alterações',
    pending: isIsolatedLocalMode ? 'Salvamento local pendente' : 'Alteração pendente',
    conflict: 'Conflito de sincronização',
    error: isIsolatedLocalMode ? 'Falha ao salvar neste dispositivo — clique para tentar novamente' : 'Falha ao sincronizar — clique para tentar novamente',
  } as const;
  const toneByStatus = {
    synced: 'text-emerald-600',
    syncing: 'text-slate-500',
    pending: 'text-amber-600',
    conflict: 'text-amber-700',
    error: 'text-red-600',
  } as const;
  const canRetry = status === 'error';
  const canShowDetails = status === 'synced';
  const lastSyncedAtLabel = sync.lastSyncedAt ? formatSyncTimestamp(sync.lastSyncedAt) : null;
  const lastSyncDescription = isIsolatedLocalMode ? 'Último salvamento' : 'Última sincronização';
  const title = status === 'synced' && lastSyncedAtLabel
    ? `${labelByStatus[status]} · ${lastSyncDescription}: ${lastSyncedAtLabel}`
    : labelByStatus[status];
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!canShowDetails) setDetailsOpen(false);
  }, [canShowDetails]);

  const syncButton = (
    <button
      type='button'
      aria-label={labelByStatus[status]}
      title={title}
      disabled={!canRetry && !canShowDetails}
      onClick={() => {
        if (canRetry) void sync.retry();
      }}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        'relative transition-colors',
        canRetry
          ? 'cursor-pointer hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200'
          : canShowDetails
            ? 'cursor-pointer hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200'
            : 'pointer-events-none',
        toneByStatus[status],
      )}
    >
      {status === 'synced' ? <CircleCheck className='h-5 w-5' aria-hidden='true'/> : null}
      {status === 'syncing' ? <RefreshCw className='h-5 w-5 animate-spin' aria-hidden='true'/> : null}
      {status === 'pending' ? <CloudOff className='h-5 w-5' aria-hidden='true'/> : null}
      {status === 'conflict' || status === 'error' ? <CircleAlert className='h-5 w-5' aria-hidden='true'/> : null}
    </button>
  );

  if (!canShowDetails) return syncButton;

  return (
    <Popover open={detailsOpen} onOpenChange={setDetailsOpen}>
      <PopoverTrigger asChild>{syncButton}</PopoverTrigger>
      <PopoverContent
        side='bottom'
        align='end'
        sideOffset={8}
        className={cn(
          'z-[80] max-w-[calc(100vw-1rem)] rounded-xl border border-emerald-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-xl',
          isMobile ? 'w-[min(18rem,calc(100vw-1rem))]' : 'w-64',
        )}
      >
        <p className='text-xs font-semibold text-slate-900'>{labelByStatus[status]}</p>
        <p className={cn(
          'mt-1 leading-5 text-slate-600',
          isMobile ? 'whitespace-nowrap text-[11px] tracking-[-0.01em]' : 'text-xs',
        )}>
          {lastSyncedAtLabel
            ? `${lastSyncDescription}: ${lastSyncedAtLabel}`
            : 'Ainda não há horário de sincronização registrado.'}
        </p>
        {documentVersion !== null ? (
          <p className={cn(
            'mt-1 text-slate-500',
            isMobile ? 'text-[11px]' : 'text-xs',
          )}>
            Versão do documento: {documentVersion}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function formatSyncTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'horário indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
