import type {ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';

export type ActionDockSurface = 'form' | 'dialog' | 'drawer';
export type ActionDockPlacement = 'content-column' | 'form-column' | 'full';
export type ActionDockSpacing = 'standard' | 'flush';

export type ActionDockProps = {
  /** Stable hook for tests and screen-specific automation. */
  testId: string;
  children: ReactNode;
  /** The host surface determines the mobile action layout. */
  surface?: ActionDockSurface;
  /** Controls whether the action group is placed in a form's second column. */
  placement?: ActionDockPlacement;
  /** Keep the existing desktop rhythm of the surrounding form or modal. */
  spacing?: ActionDockSpacing;
  /** Set false for short forms that intentionally keep a static action block. */
  mobileDocked?: boolean;
  /** The dock is a direct child of DrawerContent rather than a padded wrapper. */
  edgeToEdge?: boolean;
  className?: string;
};

const SURFACE_CLASSES: Record<ActionDockSurface, { mobile: string; desktop: string }> = {
  form: {
    mobile: 'fixed inset-x-0 bottom-0 z-20 mt-12 grid min-w-[420px] gap-4 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm',
    desktop: 'sm:static sm:mx-0 sm:w-full sm:min-w-0 sm:bg-transparent sm:px-0 sm:py-0 md:grid-cols-2',
  },
  dialog: {
    mobile: 'sticky bottom-0 z-20 -mx-6 mt-4 grid w-[calc(100%+3rem)] min-w-0 gap-3 border-t border-slate-200 bg-background/95 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm',
    desktop: 'min-[768px]:static min-[768px]:mx-0 min-[768px]:w-full min-[768px]:border-0 min-[768px]:bg-transparent min-[768px]:px-0 min-[768px]:py-0',
  },
  drawer: {
    mobile: 'sticky bottom-0 z-20 -mx-4 mt-4 grid w-[calc(100%+2rem)] min-w-0 gap-3 border-t border-slate-200 bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm',
    desktop: 'min-[768px]:static min-[768px]:mx-0 min-[768px]:w-full min-[768px]:border-0 min-[768px]:bg-transparent min-[768px]:px-0 min-[768px]:py-0 min-[768px]:shadow-none',
  },
};

/**
 * Shared action footer for forms, dialogs, and drawers.
 *
 * Full-screen mobile forms use a fixed action footer. Dialogs and drawers
 * retain their sticky footer. When the surrounding form becomes a card at
 * 640px, its action returns to normal flow.
 */
export function ActionDock({
  testId,
  children,
  surface = 'form',
  placement = 'content-column',
  spacing = 'standard',
  mobileDocked = true,
  edgeToEdge = false,
  className,
}: ActionDockProps) {
  const surfaceClasses = SURFACE_CLASSES[surface];
  const desktopClasses = cn(
    surfaceClasses.desktop,
    spacing === 'flush'
      ? surface === 'form' ? 'sm:mt-0' : 'min-[768px]:mt-0'
      : surface === 'form' ? 'sm:mt-8' : 'sm:mt-4',
    surface === 'form' && placement === 'form-column' ? 'sm:col-start-2' : null,
    placement === 'full' ? 'md:grid-cols-1' : null,
  );

  if (!mobileDocked) {
    return (
      <div data-testid={testId} className={cn('grid w-full min-w-0 gap-3', className)}>
        {children}
      </div>
    );
  }

  const innerClassName = cn(
    'min-w-0 w-full',
    surface === 'form' && placement !== 'full' ? 'md:col-start-2' : null,
  );

  return (
    <div
      data-testid={testId}
      className={cn(
        surfaceClasses.mobile,
        desktopClasses,
        edgeToEdge && surface === 'drawer' ? 'mx-0 w-full px-4' : null,
        className,
      )}
    >
      <div className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
