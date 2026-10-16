import {useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import {faHouse, faBuilding, faGripLinesVertical, faDrawPolygon, faDoorOpen, faRoad, faMountainSun,
  faArrowUp} from '@fortawesome/free-solid-svg-icons';
import type {SiteElementKey} from '@shared/types/site-element.ts';
import type {MenuActionMap} from '../lib/menu-types.ts';
import {ELEMENTS_MENU_CONFIG} from '../lib/menu-config.ts';
import {RailButton} from './RailButton.tsx';
import {SiteElementThumbnail} from './SiteElementThumbnail.tsx';
import {buildingVariants, entryVariants} from './ElementsRadialItems.tsx';

const groups = [
  {id: 'buildings', name: 'Edificações', icon: faBuilding},
  {id: 'limits', name: 'Limites e acessos', icon: faDrawPolygon},
  {id: 'roads', name: 'Vias', icon: faRoad},
  {id: 'terrain', name: 'Terreno e entorno', icon: faMountainSun},
] as const;
type GroupId = typeof groups[number]['id'];
const pill = 'flex h-12 w-max max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-1 py-1 shadow-md backdrop-blur-xl';
const labeledPill = 'flex h-[76px] w-max max-w-[calc(100vw-8rem)] items-center gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-[24px] border border-slate-200 bg-white/90 px-[5px] py-1 shadow-md backdrop-blur-xl';

export function ElementsSubmenu({actions, disabled, onDismiss, showToolMenuLabels = false}: {
  actions: MenuActionMap; disabled: boolean; onDismiss: () => void; showToolMenuLabels?: boolean;
}) {
  const [group, setGroup] = useState<GroupId | null>(null);
  const [variant, setVariant] = useState<'building' | 'entry' | null>(null);
  const {landscape, mobile} = useCanvasMobileViewport();
  const showLabels = showToolMenuLabels && !mobile;
  const categoriesRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLDivElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const alignSubmenus = () => {
      const categories = categoriesRef.current;
      if (!categories) return;
      const origin = categories.getBoundingClientRect().left;
      const align = (row: HTMLDivElement | null, parent: HTMLDivElement | null) => {
        const anchor = parent?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]');
        const firstItem = row?.querySelector<HTMLButtonElement>('button');
        if (!row || !anchor || !firstItem) return;
        const bounds = row.getBoundingClientRect();
        const inset = firstItem.getBoundingClientRect().left - bounds.left;
        const requested = anchor.getBoundingClientRect().left - inset - origin;
        const available = window.innerWidth - 8 - bounds.width - origin;
        row.style.marginLeft = `${Math.max(0, Math.min(requested, available))}px`;
      };
      // Alinha o primeiro ícone ao botão pai, em ordem para ancorar também o terceiro nível.
      align(elementsRef.current, categories);
      align(variantsRef.current, elementsRef.current);
    };
    alignSubmenus();
    window.addEventListener('resize', alignSubmenus);
    return () => window.removeEventListener('resize', alignSubmenus);
  }, [group, variant, landscape, showLabels]);

  const direct = (key: SiteElementKey) => actions.addSiteElement(key);
  const existing = (title: string, label = title) => {
    const item = ELEMENTS_MENU_CONFIG.find(item => item.title === title)!;
    return <RailButton key={title} title={title} icon={item.icon} isDisabled={disabled}
      guidedTourId={item.guidedTourId} tooltipSide='bottom'
      showLabel={showLabels} label={label} labelVariant='submenu'
      onClick={() => {setVariant(null); actions[item.action]();}}/>;
  };
  const content = <div data-testid='rac-elements-submenu'
    className={landscape
      ? 'fixed left-56 top-8 z-[60] flex max-h-[calc(100dvh-2.5rem)] w-max max-w-[calc(100vw-14rem)] flex-col items-start gap-2 overflow-y-auto p-1'
      : `absolute left-full top-1/2 z-50 ml-2 flex w-max max-w-[calc(100vw-6rem)] flex-col items-start gap-2 ${showLabels ? '-translate-y-[38px]' : '-translate-y-6'}`}
    onPointerDown={event => event.stopPropagation()}
    onClick={event => event.stopPropagation()}
    onKeyDown={event => {if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      document.querySelector<HTMLButtonElement>('button[aria-label="Elementos"]')?.focus();
      onDismiss();
    }}}>
    <div ref={categoriesRef} role='group' aria-label='Categorias de Elementos' data-testid='rac-side-rail-submenu'
      className={showLabels ? labeledPill : pill}>
      {groups.map(item => <RailButton key={item.id} title={item.name} icon={item.icon}
        isActive={group === item.id} isExpanded={group === item.id} isDisabled={disabled}
        tooltipSide='bottom' showLabel={showLabels} labelVariant='submenu'
        onClick={() => {setGroup(group === item.id ? null : item.id); setVariant(null);}}/>)}
    </div>
    {group && <div ref={elementsRef} role='group' aria-label={`Elementos de ${groups.find(item => item.id === group)!.name}`}
      className={showLabels ? labeledPill : pill}>
      {group === 'buildings' && <>
        <RailButton title='Casa' icon={faHouse} isDisabled={disabled} tooltipSide='bottom'
          showLabel={showLabels} labelVariant='submenu'
          onClick={() => {setVariant(null); direct('siteHouse');}}/>
        <RailButton title='Construção' icon={faBuilding} isDisabled={disabled} tooltipSide='bottom'
          isActive={variant === 'building'} isExpanded={variant === 'building'} showLabel={showLabels} labelVariant='submenu'
          onClick={() => setVariant(variant === 'building' ? null : 'building')}/>
      </>}
      {group === 'limits' && <>
        {existing('Muro')}
        <RailButton title='Cerca' icon={faGripLinesVertical} isDisabled={disabled} tooltipSide='bottom'
          showLabel={showLabels} labelVariant='submenu'
          onClick={() => {setVariant(null); direct('fence');}}/>
        <RailButton title='Entrada no Terreno' icon={faArrowUp} isDisabled={disabled} tooltipSide='bottom'
          isActive={variant === 'entry'} isExpanded={variant === 'entry'} showLabel={showLabels}
          label='Entrada' labelVariant='submenu'
          onClick={() => setVariant(variant === 'entry' ? null : 'entry')}/>
        <RailButton title='Portão' icon={faDoorOpen} isDisabled={disabled} tooltipSide='bottom'
          showLabel={showLabels} labelVariant='submenu'
          onClick={() => {setVariant(null); direct('gateSwing');}}/>
      </>}
      {group === 'roads' && <>{existing('Rua Reta')}{existing('Estrada de Chão', 'Estrada')}</>}
      {group === 'terrain' && <>{existing('Árvore')}{existing('Água / Rio')}{existing('Fossa')}</>}
    </div>}
    {variant === 'building' && <div ref={variantsRef} role='group' aria-label='Posição da porta'
      className={showLabels ? labeledPill : pill}>
      {buildingVariants.map(item => <RailButton key={item.key} isDisabled={disabled} tooltipSide='bottom'
        title={`Construção com porta ${item.name.toLowerCase()}`} showLabel={showLabels}
        label={`Porta ${item.name.toLowerCase()}`} labelVariant='submenu' onClick={() => direct(item.key)}>
        <SiteElementThumbnail side={item.side}/>
      </RailButton>)}
    </div>}
    {variant === 'entry' && <div ref={variantsRef} role='group' aria-label='Direção da entrada'
      className={showLabels ? labeledPill : pill}>
      {entryVariants.map(item => <RailButton key={item.key} isDisabled={disabled} tooltipSide='bottom'
        title={`Entrada ${item.name.toLowerCase()}`} label={`Entrada ${item.name.toLowerCase()}`}
        showLabel={showLabels} labelVariant='submenu' icon={item.icon} onClick={() => direct(item.key)}/>)}
    </div>}
  </div>;
  return landscape ? createPortal(content, document.body) : content;
}
