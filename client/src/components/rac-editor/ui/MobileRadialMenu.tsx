import {Children, isValidElement, useEffect, useRef, useState, type HTMLAttributes, type ReactNode} from 'react';
import {Menu} from 'lucide-react';
import {useCanvasMobileViewport} from '../lib/use-canvas-mobile-viewport.ts';

/** Mesmo conteúdo e comandos do desktop, com alvos distribuídos para o interior da tela. */
export function MobileRadialMenu({side, children, label, ...desktopProps}: HTMLAttributes<HTMLElement> & {
  side: 'left' | 'right'; label: string; children: ReactNode;
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
  const items = Children.toArray(children).flatMap((child) => isValidElement<{children?: ReactNode; 'data-radial-group'?: boolean}>(child) && child.props['data-radial-group'] ? Children.toArray(child.props.children) : [child]);
  const radius = Math.min(155, Math.max(90, (window.innerHeight - 100) / 2));
  return <div ref={ref} className={`pointer-events-auto fixed top-1/2 z-50 -translate-y-1/2 ${side === 'left' ? 'left-3' : 'right-3'}`}>
    <button type='button' aria-label={label} aria-expanded={open} onClick={() => setOpen((value) => !value)}
      className='relative z-10 grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500'><Menu className='h-6 w-6'/></button>
    {open ? <div role='toolbar' aria-label={label} className='pointer-events-none absolute inset-0'>
      {items.map((child, index) => {
        const angle = -Math.PI / 2 + Math.PI * index / Math.max(1, items.length - 1);
        return <div key={index} className='pointer-events-auto absolute grid min-h-11 min-w-11 place-items-center rounded-full bg-white shadow-sm [&_button]:min-h-11 [&_button]:min-w-11'
          style={{left: 24 + (side === 'left' ? 1 : -1) * Math.cos(angle) * radius, top: 24 + Math.sin(angle) * radius, transform: 'translate(-50%,-50%)'}}>{child}</div>;
      })}
    </div> : null}
  </div>;
}
