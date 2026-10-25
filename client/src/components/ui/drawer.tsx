import * as React from 'react';
import {Drawer as DrawerPrimitive} from 'vaul';

import {cn} from '@/components/rac-editor/lib/utils.ts';

const Drawer = ({shouldScaleBackground = true, ...props}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-black/80', className)} {...props} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {appearance?: 'standard' | 'native'}
>(({className, children, appearance = 'standard', ...props}, ref) => (
  <DrawerPortal>
    <DrawerOverlay className={appearance === 'standard' ? 'rac-modal-overlay' : undefined}/>
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        'rac-modal-shell fixed inset-x-0 bottom-0 z-50 flex h-auto min-w-0 flex-col rounded-t-[10px] border bg-background',
        appearance === 'standard' && 'rac-theme rac-standard-modal rac-standard-drawer',
        className,
      )}
      {...props}
      data-rac-modal-shell='drawer'
      data-rac-appearance={appearance}
    >
      <div className={appearance === 'standard' ? 'rac-modal-handle' : 'mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted'} aria-hidden='true'/>
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} data-rac-modal-part='header'/>
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    data-rac-modal-part='title'
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} data-rac-modal-part='description'/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
