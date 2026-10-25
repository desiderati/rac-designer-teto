import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog.tsx';
import {ConfirmationLayout} from '@/components/ui/ConfirmationLayout.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {ConfirmationErrorToast} from '@/components/ui/ConfirmationErrorToast.tsx';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useEffect, useRef, useState, type MouseEvent} from 'react';
import {TOP_BAR_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {APP_BUILD_TIMESTAMP, APP_VERSION} from '@/shared/app-version.ts';

interface UserMenuProps {
  isMobile: boolean;
  showTips: boolean;
  onRestartDrawing: () => void;
  restartDrawingDisabled?: boolean;
  onRedefineHouse?: () => void | Promise<void>;
  redefineHouseDisabled?: boolean;
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
  onRedefineHouse,
  redefineHouseDisabled = false,
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
            className='absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[calc(100dvh-5rem)] w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-xl'
          >
            <Item
              icon={TOP_BAR_ICONS.restart}
              label='Reiniciar Desenho'
              onClick={onRestartDrawing}
              disabled={restartDrawingDisabled}
            />
            {onRedefineHouse ? (
              <Item
                icon={TOP_BAR_ICONS.redefine}
                label='Redefinir Casa'
                onClick={() => void onRedefineHouse()}
                disabled={redefineHouseDisabled}
              />
            ) : null}
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
              rightSlot={(
                <span
                  data-testid='account-app-version'
                  aria-hidden='true'
                  title={`Versão ${formatCompactVersion(APP_VERSION, APP_BUILD_TIMESTAMP)} · Build ${formatBuildTimestamp(APP_BUILD_TIMESTAMP)}`}
                  className='ml-auto pl-2 text-[10px] font-medium tracking-[0.08em] text-slate-400'
                >
                  v{formatCompactVersion(APP_VERSION, APP_BUILD_TIMESTAMP)}
                </span>
              )}
            />
          </div>
        ) : null}
      </div>

      <Dialog open={logoutOpen} onOpenChange={open => {if (!logoutPending) setLogoutOpen(open);}}>
        <DialogContent hideCloseButton className='z-[1001] max-w-md' overlayClassName='z-[1000]'
          onEscapeKeyDown={event => {if (logoutPending) event.preventDefault();}}
          onPointerDownOutside={event => {if (logoutPending) event.preventDefault();}}
          onCloseAutoFocus={event => {event.preventDefault(); menuRef.current?.querySelector<HTMLButtonElement>('[aria-label="Abrir menu da conta"]')?.focus();}}>
          <ConfirmationErrorToast message={logoutError}/>
          <ConfirmationLayout
            title={<DialogTitle>Sair do RAC Designer?</DialogTitle>}
            description={<DialogDescription>Sua sessão será encerrada. As alterações já sincronizadas continuarão salvas.</DialogDescription>}
            actions={<ModalActions
              cancel={<Button data-action='cancel' type='button' variant='outline' onClick={() => setLogoutOpen(false)} disabled={logoutPending}>Cancelar</Button>}
              confirm={<Button type='button' onClick={confirmLogout} disabled={logoutPending} className='bg-red-600 text-white hover:bg-red-700'>{logoutPending ? 'Saindo…' : 'Sair'}</Button>}/>}/>
        </DialogContent>
      </Dialog>
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

function formatBuildTimestamp(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(timestamp);
}

function formatCompactVersion(version: string, timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return version;

  const parts = new Intl.DateTimeFormat('en-GB', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});

  return `${version}.${parts.year ?? '00'}${parts.month ?? '00'}${parts.day ?? '00'}.${parts.hour ?? '00'}${parts.minute ?? '00'}`;
}
