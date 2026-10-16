import {faHouse, faBuilding, faGripLinesVertical, faDrawPolygon, faDoorOpen, faRoad, faMountainSun,
  faArrowUp, faArrowDown, faArrowLeft, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import type {BuildingDoorSide, SiteElementKey} from '@shared/types/site-element.ts';
import type {MenuActionMap} from '../lib/menu-types.ts';
import {ELEMENTS_MENU_CONFIG} from '../lib/menu-config.ts';
import {SiteElementThumbnail} from './SiteElementThumbnail.tsx';
import type {RadialMenuItem} from '@/components/rac-editor/ui/RadialTreeMenu.tsx';

export const buildingVariants: Array<{side: BuildingDoorSide; name: string; key: SiteElementKey}> = [
  {side: 'top', name: 'Em cima', key: 'buildingTop'},
  {side: 'bottom', name: 'Embaixo', key: 'buildingBottom'},
  {side: 'left', name: 'À esquerda', key: 'buildingLeft'},
  {side: 'right', name: 'À direita', key: 'buildingRight'},
];

export const entryVariants = [
  {name: 'Para cima', key: 'entryUp', icon: faArrowUp},
  {name: 'Para baixo', key: 'entryDown', icon: faArrowDown},
  {name: 'Para a esquerda', key: 'entryLeft', icon: faArrowLeft},
  {name: 'Para a direita', key: 'entryRight', icon: faArrowRight},
] as const;

/** Mesma taxonomia do submenu em cápsulas, apresentada um nível por vez no radial. */
export function getElementsRadialItems(actions: MenuActionMap, disabled: boolean): RadialMenuItem[] {
  const direct = (kind: SiteElementKey) => () => actions.addSiteElement(kind);
  const existing = (title: string): RadialMenuItem => {
    const item = ELEMENTS_MENU_CONFIG.find(candidate => candidate.title === title)!;
    return {id: title, label: title, icon: item.icon, disabled,
      guidedTourId: item.guidedTourId, onSelect: () => actions[item.action]()};
  };
  return [
    {id: 'buildings', label: 'Edificações', icon: faBuilding, disabled, children: [
      {id: 'siteHouse', label: 'Casa', icon: faHouse, disabled, onSelect: direct('siteHouse')},
      {id: 'building', label: 'Construção', icon: faBuilding, disabled, children:
        buildingVariants.map(item => ({id: item.key, label: `Construção com porta ${item.name.toLowerCase()}`,
          content: <SiteElementThumbnail side={item.side}/>, disabled, onSelect: direct(item.key)}))},
    ]},
    {id: 'limits', label: 'Limites e acessos', icon: faDrawPolygon, disabled, children: [
      existing('Muro'),
      {id: 'fence', label: 'Cerca', icon: faGripLinesVertical, disabled, onSelect: direct('fence')},
      {id: 'entry', label: 'Entrada no Terreno', icon: faArrowUp, disabled, children:
        entryVariants.map(item => ({id: item.key, label: `Entrada ${item.name.toLowerCase()}`,
          icon: item.icon, disabled, onSelect: direct(item.key)}))},
      {id: 'gateSwing', label: 'Portão', icon: faDoorOpen, disabled, onSelect: direct('gateSwing')},
    ]},
    {id: 'roads', label: 'Vias', icon: faRoad, disabled,
      children: [existing('Rua Reta'), existing('Estrada de Chão')]},
    {id: 'terrain', label: 'Terreno e entorno', icon: faMountainSun, disabled,
      children: [existing('Árvore'), existing('Água / Rio'), existing('Fossa')]},
  ];
}
