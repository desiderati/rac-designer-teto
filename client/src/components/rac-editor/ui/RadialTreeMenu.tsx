import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPenRuler} from '@fortawesome/free-solid-svg-icons';
import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';
import {RadialItemLabel} from './RadialItemLabel.tsx';
import {getRadialMenuPositions} from './radial-menu-layout.ts';

export interface RadialMenuItem {
  id: string;
  label: string;
  caption?: string;
  icon?: IconDefinition;
  content?: ReactNode;
  children?: RadialMenuItem[];
  onSelect?: () => void;
  disabled?: boolean;
  active?: boolean;
  pressed?: boolean;
  keepOpenOnSelect?: boolean;
  destructive?: boolean;
  atLimit?: boolean;
  guidedTourId?: string;
}

interface Flight {
  id: number;
  icon?: IconDefinition;
  content?: ReactNode;
  left: number;
  top: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  scale: number;
}

function itemIcon(item: Pick<RadialMenuItem, 'icon' | 'content'>) {
  return item.content ?? (item.icon && <FontAwesomeIcon icon={item.icon} className='h-4 w-4'/>);
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Um nível visível por vez; o item escolhido viaja da órbita ao centro. */
export function RadialTreeMenu({side, label, items, rootIcon = faPenRuler, active,
  testId = 'rac-radial-tools', guidedTourId = 'rac-toolbar'}: {
  side: 'left' | 'right'; label: string; items: RadialMenuItem[]; rootIcon?: IconDefinition; active?: boolean;
  testId?: string; guidedTourId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [flight, setFlight] = useState<Flight | null>(null);
  const flightId = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLButtonElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);

  let level = items;
  const ancestors: RadialMenuItem[] = [];
  for (const id of path) {
    const item = level.find(candidate => candidate.id === id);
    if (!item?.children?.length) break;
    ancestors.push(item);
    level = item.children;
  }
  const current = ancestors[ancestors.length - 1];
  const parentLabel = ancestors.length > 1 ? ancestors[ancestors.length - 2].label : label;
  const levelKey = ancestors.map(item => item.id).join('/') || 'root';

  useEffect(() => {
    if (path.length !== ancestors.length) setPath(path.slice(0, ancestors.length));
  }, [path, ancestors.length]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false); setPath([]); setFlight(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation();
      setFlight(null);
      if (path.length) setPath(previous => previous.slice(0, -1));
      else {setOpen(false); setFlight(null);}
      centerRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open, path.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const reduce = reducedMotion();
    const animations = Array.from(arcRef.current?.querySelectorAll<HTMLElement>('[data-radial-position]') ?? [])
      .map(element => {
        if (!element.animate) return null;
        const x = Number(element.dataset.radialX);
        const y = Number(element.dataset.radialY);
        return element.animate(reduce
          ? [{opacity: 0.55}, {opacity: 1}]
          : [
            {transform: `translate(-50%, -50%) translate(${-x}px, ${-y}px) scale(0.78)`, opacity: 0.45},
            {transform: 'translate(-50%, -50%)', opacity: 1},
          ], {duration: reduce ? 100 : 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)'});
      }).filter((animation): animation is Animation => animation !== null);
    return () => animations.forEach(animation => animation.cancel());
  }, [open, levelKey]);

  useLayoutEffect(() => {
    if (!flight) return;
    const element = flightRef.current;
    if (!element?.animate || reducedMotion()) {setFlight(null); return;}
    const animation = element.animate([
      {transform: 'translate(0, 0) scale(1)'},
      {transform: `translate(${flight.dx}px, ${flight.dy}px) scale(${flight.scale})`},
    ], {duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)'});
    animation.onfinish = () => setFlight(value => value?.id === flight.id ? null : value);
    return () => {animation.onfinish = null; animation.cancel();};
  }, [flight]);

  const close = () => {setOpen(false); setPath([]); setFlight(null);};
  const centerClick = () => {
    setFlight(null);
    if (path.length) {setPath(previous => previous.slice(0, -1)); return;}
    setOpen(value => !value);
  };
  const itemClick = (item: RadialMenuItem, event: MouseEvent<HTMLButtonElement>) => {
    if (!item.keepOpenOnSelect) centerRef.current?.focus();
    if (item.children?.length) {
      const from = event.currentTarget.getBoundingClientRect();
      const to = centerRef.current?.getBoundingClientRect();
      if (to && !reducedMotion()) {
        setFlight({id: ++flightId.current, icon: item.icon, content: item.content,
          left: from.left, top: from.top, width: from.width, height: from.height,
          dx: to.left - from.left, dy: to.top - from.top, scale: to.width / from.width});
      }
      setPath(previous => [...previous, item.id]);
      return;
    }
    if (!item.keepOpenOnSelect) close();
    item.onSelect?.();
  };

  const positions = getRadialMenuPositions(level.length, side, window.innerHeight);
  return <div ref={ref} data-testid={testId} data-guided-tour-id={guidedTourId}
    style={side === 'left' ? {left: 'max(2rem, calc(env(safe-area-inset-left, 0px) + 1rem))'} : {right: 'max(2rem, calc(env(safe-area-inset-right, 0px) + 1rem))'}}
    className='pointer-events-auto fixed top-1/2 z-50 -translate-y-1/2'>
    <button ref={centerRef} type='button' aria-label={current ? `Voltar para ${parentLabel}` : label}
      aria-expanded={open} aria-pressed={current ? current.pressed : active} onClick={centerClick}
      className={`relative z-10 grid h-12 w-12 place-items-center rounded-full border border-slate-200 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${(current ? current.pressed : active) ? 'bg-blue-600 text-white' : current ? 'bg-white text-blue-600' : 'bg-white text-slate-600'}`}>
      <span className={flight ? 'opacity-0' : undefined}>
        {current ? itemIcon(current) : <FontAwesomeIcon icon={rootIcon} className='h-4 w-4'/>}
      </span>
    </button>
    {open && <div ref={arcRef} role='toolbar' aria-label={current ? `Opções de ${current.label}` : label}
      className='pointer-events-none absolute inset-0'>
      {level.map((item, index) => {
        const {x, y, labelOffsetY} = positions[index];
        return <div key={item.id} data-radial-position data-radial-x={x} data-radial-y={y}
          className='pointer-events-auto absolute grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm'
          style={{left: 24 + x, top: 24 + y, transform: 'translate(-50%,-50%)',
            '--radial-label-offset': `${labelOffsetY}px`} as CSSProperties}>
              <button type='button' aria-label={item.label} aria-expanded={item.children?.length ? false : undefined}
                aria-pressed={item.pressed}
                disabled={item.disabled} data-guided-tour-id={item.guidedTourId}
                onClick={event => itemClick(item, event)}
                className={`relative grid h-11 w-11 place-items-center rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${item.disabled ? 'cursor-not-allowed text-slate-400 opacity-40' : item.destructive ? 'text-red-500 hover:bg-red-50' : item.pressed ? 'bg-blue-600 text-white hover:bg-blue-500' : item.active ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'} ${item.atLimit && !item.disabled ? 'opacity-60' : ''}`}>
                {itemIcon(item)}
                <RadialItemLabel side={side}>{item.caption ?? item.label}</RadialItemLabel>
              </button>
        </div>;
      })}
    </div>}
    {flight && createPortal(<div ref={flightRef} aria-hidden='true' data-testid='rac-radial-flight'
      className='pointer-events-none fixed z-[70] grid place-items-center rounded-full bg-white text-blue-600 shadow-sm'
      style={{left: flight.left, top: flight.top, width: flight.width, height: flight.height}}>
      {itemIcon(flight)}
    </div>, document.body)}
  </div>;
}
