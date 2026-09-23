import type {ReactNode} from 'react';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

type FormActionDockProps = {
  testId: string;
  children: ReactNode;
  /** The house configuration form is a direct child of the outer two-column form. */
  desktopPlacement?: 'content-column' | 'form-column' | 'full';
  /** Keep the existing desktop rhythm of the surrounding form. */
  desktopSpacing?: 'standard' | 'flush';
  /** Short forms can opt out while still sharing the same action-footer API. */
  mobileDocked?: boolean;
  className?: string;
};

export function FormActionDock({
  testId,
  children,
  desktopPlacement = 'content-column',
  desktopSpacing = 'standard',
  mobileDocked = true,
  className,
}: FormActionDockProps) {
  return (
    <ActionDock
      testId={testId}
      surface='form'
      placement={desktopPlacement}
      spacing={desktopSpacing}
      mobileDocked={mobileDocked}
      className={className}
    >
      {children}
    </ActionDock>
  );
}
