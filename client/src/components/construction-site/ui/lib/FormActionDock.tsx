import type {ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';

type FormActionDockProps = {
  /** Stable hook for tests and screen-specific automation. */
  testId: string;
  children: ReactNode;
  /**
   * The house configuration form is a direct child of the outer two-column
   * form; the other forms already render inside their content column.
   */
  desktopPlacement?: 'content-column' | 'form-column';
  /** Keep the existing desktop rhythm of the surrounding form. */
  desktopSpacing?: 'standard' | 'flush';
  /** Short forms can opt out while still sharing the same action-footer API. */
  mobileDocked?: boolean;
  className?: string;
};

const DOCKED_MOBILE_CLASSES =
  'sticky bottom-0 z-20 -mx-2 mt-6 grid w-[calc(100%+1rem)] min-w-0 gap-4 bg-white/95 px-2 py-3 backdrop-blur-sm';
const STATIC_ACTION_CLASSES = 'grid w-full min-w-0 gap-3';
const DOCKED_DESKTOP_CLASSES = 'sm:static sm:mx-0 sm:w-full sm:bg-transparent sm:px-0 sm:py-0 sm:grid-cols-2';

/**
 * Shared action footer for construction-site forms.
 *
 * On mobile, the dock intentionally compensates for the form's -mx-2 edge
 * treatment so the action button reaches the same right edge as the form.
 * Desktop placement remains configurable because some forms are nested inside
 * the right-hand content column while House Configuration is a direct grid
 * child of the outer form.
 */
export function FormActionDock({
  testId,
  children,
  desktopPlacement = 'content-column',
  desktopSpacing = 'standard',
  mobileDocked = true,
  className,
}: FormActionDockProps) {
  const dockedDesktopClasses = cn(
    DOCKED_DESKTOP_CLASSES,
    desktopSpacing === 'flush' ? 'sm:mt-0' : 'sm:mt-4',
    desktopPlacement === 'form-column' ? 'sm:col-start-2' : null,
  );

  if (!mobileDocked) {
    return (
      <div data-testid={testId} className={cn(STATIC_ACTION_CLASSES, className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={cn(DOCKED_MOBILE_CLASSES, dockedDesktopClasses, className)}
    >
      <div className='sm:col-start-2'>
        {children}
      </div>
    </div>
  );
}
