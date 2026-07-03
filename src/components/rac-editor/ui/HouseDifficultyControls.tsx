import {type ComponentType, type PointerEvent, type SVGProps, useRef, useState} from 'react';
import {
  Check,
  Droplets,
  Gem,
  Layers,
  type LucideIcon,
  Mountain,
  Pickaxe,
  Ruler,
  UtilityPole,
  Waves,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';
import {HouseDifficultyGauge} from '@/components/rac-editor/ui/HouseDifficultyGauge.tsx';
import type {HouseDifficultyIndicator} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import type {SiteAssessment, SoilProfile} from '@/shared/types/construction-site.ts';

type SiteAssessmentChange = (input: Partial<SiteAssessment>) => void;
type SoilMenuValue = SoilProfile | '';
type ObstacleIcon = ComponentType<SVGProps<SVGSVGElement>>;

function HydraulicObstacleIcon({className, ...props}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      data-icon='hydraulic-pipe'
      viewBox='0 0 512 512'
      fill='currentColor'
      focusable='false'
      className={className}
    >
      <path d='M488.727 232.727h-93.091c-12.853 0-23.273 10.42-23.273 23.273v23.273H232.727V139.636H256c12.853 0 23.273-10.42 23.273-23.273V23.273C279.273 10.42 268.853 0 256 0H23.273C10.42 0 0 10.42 0 23.273v93.091c0 12.853 10.42 23.273 23.273 23.273h23.273v219.415c0 58.77 47.633 106.403 106.403 106.403h219.415v23.273c0 12.853 10.42 23.273 23.273 23.273h93.091C501.58 512 512 501.58 512 488.727V256c0-12.853-10.42-23.273-23.273-23.273zM46.545 46.545h186.182V93.09H46.545V46.545zm106.403 372.364c-33.064 0-59.857-26.794-59.857-59.857V139.636h93.091v162.909c0 12.853 10.42 23.273 23.273 23.273h162.909v93.091H152.948zm312.507 46.546H418.91V279.273h46.545v186.182z'/>
    </svg>
  );
}

interface HouseDifficultyControlsProps {
  indicator: HouseDifficultyIndicator;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: SiteAssessmentChange;
  enableMobileCollapse?: boolean;
  className?: string;
}

const SOIL_PROFILE_OPTIONS: Array<{
  value: SoilMenuValue;
  label: string;
  Icon: LucideIcon;
  iconClassName: string;
}> = [
  {
    value: '',
    label: 'Não informado',
    Icon: Mountain,
    iconClassName: 'text-slate-400',
  },
  {
    value: 'stable_clay',
    label: 'Terreno Estável / Argiloso',
    Icon: Layers,
    iconClassName: 'text-emerald-600',
  },
  {
    value: 'firm_hard',
    label: 'Terreno Firme / Duro',
    Icon: Pickaxe,
    iconClassName: 'text-stone-600',
  },
  {
    value: 'alluvial',
    label: 'Solo Molhado / Lama',
    Icon: Waves,
    iconClassName: 'text-amber-600',
  },
  {
    value: 'water_table',
    label: 'Lençol Freático / Água no Fundo',
    Icon: Droplets,
    iconClassName: 'text-sky-600',
  },
];

const OBSTACLE_OPTIONS: Array<{
  key: keyof Pick<
    SiteAssessment,
    'hasHydraulicObstacles'
    | 'hasUndergroundObstacles'
    | 'hasElevatedObstacles'
    | 'hasNeighborSetbackConstraints'
  >;
  label: string;
  Icon: ObstacleIcon;
  iconClassName?: string;
}> = [
  {
    key: 'hasHydraulicObstacles',
    label: 'Obstáculos hidráulicos',
    Icon: HydraulicObstacleIcon,
    iconClassName: 'h-3.5 w-3.5',
  },
  {
    key: 'hasUndergroundObstacles',
    label: 'Obstáculos subterrâneos',
    Icon: Gem,
  },
  {
    key: 'hasElevatedObstacles',
    label: 'Obstáculos elevados',
    Icon: UtilityPole,
  },
  {
    key: 'hasNeighborSetbackConstraints',
    label: 'Servidões vizinhas',
    Icon: Ruler,
  },
];

export function HouseDifficultyControls({
  indicator,
  siteAssessment,
  onSiteAssessmentChange,
  enableMobileCollapse = false,
  className,
}: HouseDifficultyControlsProps) {
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const selectedSoil = SOIL_PROFILE_OPTIONS.find((option) => option.value === (siteAssessment?.soilProfile ?? ''))
    ?? SOIL_PROFILE_OPTIONS[0];
  const SoilIcon = selectedSoil.Icon;

  const updateSoilProfile = (soilProfile: SoilMenuValue) => {
    onSiteAssessmentChange?.({soilProfile: soilProfile || undefined});
  };

  const toggleObstacle = (key: (typeof OBSTACLE_OPTIONS)[number]['key']) => {
    onSiteAssessmentChange?.({[key]: !siteAssessment?.[key]});
  };

  const handleMobileHandlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartXRef.current = event.clientX;
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMobileHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const startX = dragStartXRef.current;
    dragStartXRef.current = null;
    if (startX === null) return;

    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) <= 24) return;

    didDragRef.current = true;
    setIsMobileCollapsed(deltaX > 0);
  };

  const handleMobileHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    setIsMobileCollapsed((current) => !current);
  };

  const mobileHandle = enableMobileCollapse ? (
    <button
      type='button'
      aria-label={isMobileCollapsed ? 'Abrir painel de dificuldade' : 'Recolher painel de dificuldade'}
      title={isMobileCollapsed ? 'Abrir painel de dificuldade' : 'Recolher painel de dificuldade'}
      onPointerDown={handleMobileHandlePointerDown}
      onPointerUp={handleMobileHandlePointerUp}
      onClick={handleMobileHandleClick}
      className={cn(
        'pointer-events-auto flex h-24 w-5 touch-none items-center justify-center text-transparent sm:hidden',
      )}
    >
      <span
        className='block h-16 w-1.5 rounded-full border border-white/70 bg-slate-400/70 shadow-sm'
        aria-hidden
      />
    </button>
  ) : null;

  const controls = (
    <div
      data-testid='house-difficulty-controls'
      data-guided-tour-id='rac-house-difficulty-controls'
      role='group'
      aria-label='Fatores da dificuldade da casa'
      className={cn(
        'pointer-events-none flex flex-col items-center gap-2',
        enableMobileCollapse && isMobileCollapsed && 'hidden sm:flex',
        !enableMobileCollapse && className,
      )}
    >
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                aria-label={`Editar perfil do solo. Atual: ${selectedSoil.label}`}
                className={cn(
                  'relative grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200',
                  'pointer-events-auto',
                  onSiteAssessmentChange ? null : 'cursor-not-allowed opacity-60',
                )}
                disabled={!onSiteAssessmentChange}
              >
                <SoilIcon aria-hidden='true' className={cn('h-4 w-4', selectedSoil.iconClassName)}/>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side='left' className='bg-slate-900 text-xs text-white'>
            {`Tipo de solo: ${selectedSoil.label}`}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align='center'
          side='left'
          sideOffset={8}
          className='w-44 rounded-xl border border-slate-200 bg-white/95 p-1 text-slate-700 shadow-xl backdrop-blur-xl'
        >
          {SOIL_PROFILE_OPTIONS.map((option) => {
            const selected = option.value === (siteAssessment?.soilProfile ?? '');
            const OptionIcon = option.Icon;

            return (
              <DropdownMenuItem
                key={option.value || 'unknown'}
                aria-label={`Selecionar solo ${option.label}`}
                onSelect={() => updateSoilProfile(option.value)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold',
                  selected ? 'bg-blue-50 text-blue-900' : 'text-slate-700 focus:bg-slate-100',
                )}
              >
                <OptionIcon aria-hidden='true' className={cn('h-4 w-4 shrink-0', option.iconClassName)}/>
                <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                <Check aria-hidden='true' className={cn('h-3.5 w-3.5 shrink-0', selected ? 'opacity-100' : 'opacity-0')}/>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <HouseDifficultyGauge
        orientation='vertical'
        indicator={indicator}
        meterClassName='pointer-events-auto'
        testId='canvas-house-difficulty-gauge'
      />

      <div className='flex flex-col items-center gap-1.5'>
        {OBSTACLE_OPTIONS.map(({key, label, Icon, iconClassName}) => {
          const checked = Boolean(siteAssessment?.[key]);

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  aria-label={label}
                  aria-pressed={checked}
                  onClick={() => toggleObstacle(key)}
                  disabled={!onSiteAssessmentChange}
                  className={cn(
                    'pointer-events-auto grid h-8 w-8 cursor-pointer place-items-center rounded-full shadow-sm ring-1 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200',
                    checked
                      ? 'bg-blue-600 text-white ring-blue-500 hover:bg-blue-500'
                      : 'bg-white/90 text-slate-500 ring-slate-200 hover:bg-blue-50 hover:text-blue-700',
                    onSiteAssessmentChange ? null : 'cursor-not-allowed opacity-60',
                  )}
                >
                  <Icon aria-hidden='true' className={cn('h-4 w-4', iconClassName)}/>
                </button>
              </TooltipTrigger>
              <TooltipContent side='left' className='bg-slate-900 text-xs text-white'>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );

  if (!enableMobileCollapse) return controls;

  return (
    <div className={cn('pointer-events-none flex items-center gap-1 sm:block', className)}>
      {mobileHandle}
      {controls}
    </div>
  );
}
