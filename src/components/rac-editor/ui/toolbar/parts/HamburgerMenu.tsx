import {ChangeEvent, useRef} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {TOP_BAR_ICONS} from '../helpers/toolbar-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import type {ToolbarActionMap} from '../helpers/toolbar-types.ts';

interface HamburgerMenuProps {
  actions: ToolbarActionMap;
}

/**
 * Top-left hamburger button. Opens a "File" style dropdown holding
 * project-level JSON actions — mirrors Stitch's leading menu placement,
 * but populated with this app's actual primitives.
 */
export function HamburgerMenu({actions}: HamburgerMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    actions.importJSON(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        type='file'
        ref={fileInputRef}
        accept='.json'
        onChange={handleFileChange}
        className='hidden'
      />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type='button'
            title='Menu principal'
            aria-label='Abrir menu principal'
            className={cn(
              'w-12 h-12 flex items-center justify-center rounded-full',
              'bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm',
              'hover:bg-slate-50 transition-colors text-slate-700',
            )}
          >
            <FontAwesomeIcon icon={TOP_BAR_ICONS.hamburger} className='text-lg'/>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align='start'
          sideOffset={8}
          className='w-56 p-1 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl'
        >
          <MenuItem
            icon={TOP_BAR_ICONS.importJson}
            label='Abrir Projeto (JSON)'
            onClick={() => fileInputRef.current?.click()}
          />
          <MenuItem
            icon={TOP_BAR_ICONS.exportJson}
            label='Exportar Projeto (JSON)'
            onClick={actions.exportJSON}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

interface MenuItemProps {
  icon: typeof TOP_BAR_ICONS[keyof typeof TOP_BAR_ICONS];
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function MenuItem({icon, label, onClick, destructive = false}: MenuItemProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        'transition-colors',
        destructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <FontAwesomeIcon icon={icon} className='w-4 text-slate-500'/>
      <span>{label}</span>
    </button>
  );
}
