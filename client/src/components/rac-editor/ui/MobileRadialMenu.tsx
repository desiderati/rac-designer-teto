import {Children, isValidElement, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSliders} from '@fortawesome/free-solid-svg-icons';
import {useCanvasMobileViewport} from '../lib/use-canvas-mobile-viewport.ts';
import {RadialTreeMenu, type RadialMenuItem} from './RadialTreeMenu.tsx';
import {getRadialMenuPositions} from './radial-menu-layout.ts';

/** Mesmo conteúdo e comandos do desktop, com alvos distribuídos para o interior da tela. */
export function MobileRadialMenu({side, children, label, items, ...desktopProps}: HTMLAttributes<HTMLElement> & {
  side: 'left' | 'right'; label: string; children: ReactNode; items?: RadialMenuItem[];
}) {
  const {landscape} = useCanvasMobileViewport();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {if (!ref.current?.contains(event.target as Node)) setOpen(false);};
    const escape = (event: KeyboardEvent) => {if (event.key === 'Escape') {setOpen(false); ref.current?.querySelector('button')?.focus();}};
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape);};
  }, [open]);
  if (!landscape) return <aside {...desktopProps}>{children}</aside>;
  if (items) return <RadialTreeMenu side={side} label={label} items={items}/>;
  const legacyItems = Children.toArray(children).flatMap((child) => isValidElement<{children?: ReactNode; 'data-radial-group'?: boolean}>(child) && child.props['data-radial-group'] ? Children.toArray(child.props.children) : [child]);
  const positions = getRadialMenuPositions(legacyItems.length, side, window.innerHeight);
  return <div ref={ref} className={`pointer-events-auto fixed top-1/2 z-40 -translate-y-1/2 ${side === 'left' ? 'left-3' : 'right-3'}`}>
    <button type='button' aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)}
      className='relative z-10 grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500'><FontAwesomeIcon icon={faSliders} className='h-4 w-4'/></button>
    {open ? <div role='toolbar' aria-label={label} className='pointer-events-none absolute inset-0'>
      {legacyItems.map((child, index) => {
        const {x, y, labelOffsetY} = positions[index];
        return <div key={index} className='pointer-events-auto absolute grid min-h-11 min-w-11 place-items-center rounded-full bg-white shadow-sm [&_button]:min-h-11 [&_button]:min-w-11'
          style={{left: 24 + x, top: 24 + y, transform: 'translate(-50%,-50%)',
            '--radial-label-offset': `${labelOffsetY}px`} as CSSProperties}>{child}</div>;
      })}
    </div> : null}
  </div>;
}
