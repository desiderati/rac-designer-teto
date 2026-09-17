import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface UserMenuProps {
  isMobile: boolean;
  showTips: boolean;
  onRestartDrawing: () => void;
  restartDrawingDisabled?: boolean;
  onOpen3DViewer: () => void;
  onSavePDF: () => void;
  canExportPDF: boolean;
  onToggleTips: () => void;
  onOpenSettings: () => void;
  onExit: () => void | Promise<void>;
}

/**
 * Top-right user avatar dropdown with an explicit confirmation before logout.
 */
export function UserMenu({
  isMobile,
  showTips,
  onRestartDrawing,
  restartDrawingDisabled = false,
  onOpen3DViewer,
  onSavePDF,
  canExportPDF,
  onToggleTips,
  onOpenSettings,
  onExit,
}: UserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const confirmLogout = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLogoutPending(true);
    setLogoutError(null);
    try {
      await onExit();
      setLogoutOpen(false);
    } catch {
      setLogoutError('Não foi possível sair agora. Tente novamente.');
    } finally {
      setLogoutPending(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!logoutOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !logoutPending) setLogoutOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logoutOpen, logoutPending]);

  return (
    <>
      <div ref={menuRef} className='relative'>
        <button
          type='button'
          title='Conta'
          aria-label='Abrir menu da conta'
          aria-expanded={menuOpen}
          data-guided-tour-id='rac-user-menu'
          data-guided-tour-aliases={isMobile ? 'rac-export-pdf rac-view-3d' : undefined}
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-white/90 border-2 border-white shadow-sm overflow-hidden',
            'text-slate-500 hover:text-slate-700 hover:border-blue-200 transition-colors',
          )}
        >
          <FontAwesomeIcon icon={TOP_BAR_ICONS.user} className='text-2xl'/>
        </button>

        {menuOpen ? (
          <div
            role='menu'
            aria-label='Menu da conta'
            className='absolute right-0 top-[calc(100%+8px)] z-[60] w-52 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-xl'
          >
            <Item
              icon={TOP_BAR_ICONS.restart}
              label='Reiniciar Desenho'
              onClick={onRestartDrawing}
              disabled={restartDrawingDisabled}
            />
            <Divider/>
            {isMobile ? (
              <>
                <Item
                  icon={TOP_BAR_ICONS.view3d}
                  label='Visualização 3D'
                  onClick={onOpen3DViewer}
                  dataGuidedTourId='rac-view-3d'
                />
                <Item
                  icon={TOP_BAR_ICONS.export}
                  label='Exportar RAC em PDF'
                  onClick={onSavePDF}
                  disabled={!canExportPDF}
                  dataGuidedTourId='rac-export-pdf'
                />
                <Divider/>
              </>
            ) : null}
            <Item
              icon={TOP_BAR_ICONS.tips}
              label='Dicas'
              onClick={onToggleTips}
              rightSlot={showTips ? <ActiveDot/> : undefined}
            />
            <Item
              icon={TOP_BAR_ICONS.guidedTour}
              label='Abrir Tutorial'
              dataGuidedTourStart='rac-editor-intro'
            />
            <Divider/>
            <Item icon={TOP_BAR_ICONS.settings} label='Configurações' onClick={onOpenSettings}/>
            <Divider/>
            <Item
              icon={TOP_BAR_ICONS.exit}
              label='Sair'
              onClick={() => {
                setMenuOpen(false);
                setLogoutError(null);
                setLogoutOpen(true);
              }}
              destructive
            />
          </div>
        ) : null}
      </div>

      {logoutOpen ? (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4' role='presentation'>
          <button
            type='button'
            aria-label='Fechar confirmação de saída'
            className='absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]'
            onClick={() => {
              if (!logoutPending) setLogoutOpen(false);
            }}
          />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='logout-dialog-title'
            aria-describedby='logout-dialog-description'
            className='relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl'
          >
            <div className='space-y-2'>
              <h2 id='logout-dialog-title' className='text-lg font-semibold text-slate-900'>Sair do RAC Designer?</h2>
              <p id='logout-dialog-description' className='text-sm leading-6 text-slate-600'>
                Sua sessão será encerrada. As alterações já sincronizadas continuarão salvas.
              </p>
            </div>
            {logoutError ? <p role='alert' className='mt-4 text-sm font-medium text-red-600'>{logoutError}</p> : null}
            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              <button
                type='button'
                onClick={() => setLogoutOpen(false)}
                disabled={logoutPending}
                className='inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={confirmLogout}
                disabled={logoutPending}
                className='inline-flex min-h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {logoutPending ? 'Saindo…' : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

interface ItemProps {
  icon: typeof TOP_BAR_ICONS[keyof typeof TOP_BAR_ICONS];
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  dataGuidedTourStart?: string;
  dataGuidedTourId?: string;
}

function Item({
  icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
  rightSlot,
  dataGuidedTourStart,
  dataGuidedTourId,
}: ItemProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      data-guided-tour-id={dataGuidedTourId}
      data-guided-tour-start={dataGuidedTourStart}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        'transition-colors',
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : destructive
            ? 'text-red-600 hover:bg-red-50'
            : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <FontAwesomeIcon
        icon={icon}
        className={cn(
          'w-4',
          disabled ? 'text-slate-300' : destructive ? 'text-red-500' : 'text-slate-500',
        )}
      />
      <span className='flex-1 text-left'>{label}</span>
      {rightSlot}
    </button>
  );
}

function ActiveDot() {
  return <span className='w-2 h-2 rounded-full bg-blue-500' aria-hidden/>;
}

function Divider() {
  return <div role='separator' className='h-px bg-slate-100 my-1 mx-2'/>;
}
