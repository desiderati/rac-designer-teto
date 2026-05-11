import {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {TOP_BAR_ICONS, MAIN_MENU_ICONS} from '../lib/menu-config.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import type {MenuActionMap, MenuConstructionGroup} from '../lib/menu-types.ts';

interface HamburgerMenuProps {
  actions: Pick<MenuActionMap, 'activateHouse' | 'openConstructionSites'>;
  constructionGroups: MenuConstructionGroup[];
  documentTransitioning?: boolean;
}

/**
 * FAB principal do Canvas. No RAC Editor ele atua como seletor de casas da
 * Construção TETO ativa; ações de arquivo e gestão ficam fora deste menu.
 */
export function HamburgerMenu({actions, constructionGroups, documentTransitioning = false}: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedConstructionIds, setExpandedConstructionIds] = useState<Set<string>>(new Set());

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setExpandedConstructionIds(new Set(constructionGroups.filter((group) => group.active).map((group) => group.id)));
    }
  };

  const toggleConstruction = (constructionId: string) => {
    setExpandedConstructionIds((current) => {
      const next = new Set(current);
      if (next.has(constructionId)) {
        next.delete(constructionId);
      } else {
        next.add(constructionId);
      }
      return next;
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          title='Menu principal'
          aria-label='Abrir menu principal'
          data-guided-tour-id='rac-hamburger'
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
        className='w-[min(14.5rem,calc(100vw-1rem))] p-1 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl'
      >
        <MenuItem
          icon={TOP_BAR_ICONS.constructionSites}
          iconTestId='construction-sites-menu-icon'
          label='Construções TETO'
          onClick={() => {
            actions.openConstructionSites();
            setOpen(false);
          }}
        />

        <div role='separator' className='mx-2 my-1 h-px bg-slate-100'/>

        {constructionGroups.length ? constructionGroups.map((construction) => {
          const expanded = expandedConstructionIds.has(construction.id);
          const constructionLabel = formatConstructionMenuLabel(construction);

          return (
            <div key={construction.id} className='py-0.5'>
              <button
                type='button'
                aria-expanded={expanded}
                onClick={() => toggleConstruction(construction.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold',
                  'transition-colors',
                  construction.active
                    ? 'bg-slate-100 text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <FontAwesomeIcon
                  data-testid='construction-folder-icon'
                  className={cn('w-4', construction.active ? 'text-blue-600' : 'text-slate-500')}
                  icon={expanded ? TOP_BAR_ICONS.workspaceOpen : TOP_BAR_ICONS.workspaceClosed}
                />
                <span className='min-w-0 flex-1 truncate text-left'>{constructionLabel}</span>
              </button>

              {expanded ? (
                <div className='ml-4 mt-0.5 space-y-0.5 border-l border-slate-100 pl-1.5'>
                  {construction.houses.length ? construction.houses.map((house) => (
                    <MenuItem
                      key={house.id}
                      icon={MAIN_MENU_ICONS.house}
                      label={house.label}
                      active={house.active}
                      nested
                      disabled={documentTransitioning}
                      onClick={() => {
                        if (documentTransitioning) return;
                        void actions.activateHouse(construction.id, house.id);
                        setOpen(false);
                      }}
                    />
                  )) : (
                    <p className='px-3 py-2 text-xs font-medium text-slate-400'>Nenhuma casa cadastrada.</p>
                  )}
                </div>
              ) : null}
            </div>
          );
        }) : (
          <p className='px-3 py-3 text-sm text-slate-500'>Nenhuma construção ativa.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function formatConstructionMenuLabel(construction: MenuConstructionGroup): string {
  const code = construction.code.trim() || 'Construção sem código';
  const communityName = construction.communityName?.trim() || 'Sem comunidade';
  return `${code} - ${communityName}`;
}

interface MenuItemProps {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  active?: boolean;
  nested?: boolean;
  iconTestId?: string;
  disabled?: boolean;
}

function MenuItem({icon, label, onClick, active = false, nested = false, iconTestId, disabled = false}: MenuItemProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium',
        'transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        nested ? 'text-xs' : null,
        active
          ? 'bg-blue-50 text-blue-900'
          : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <FontAwesomeIcon
        data-testid={iconTestId}
        className={cn('w-4', active ? 'text-blue-600' : 'text-slate-500')}
        icon={icon}
      />
      <span className='min-w-0 flex-1 truncate text-left'>{label}</span>
    </button>
  );
}
