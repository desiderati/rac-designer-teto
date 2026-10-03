import {useEffect} from 'react';
import {toast as sonnerToast, Toaster as Sonner, useSonner, type ExternalToast} from 'sonner';
import {CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert} from 'lucide-react';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {VIEWPORT} from '@/shared/config.ts';
import {ToastMessage} from './ToastMessage.tsx';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const ERROR_TOAST_DURATION = 30_000;
function responsiveOptions(options?: ExternalToast): ExternalToast | undefined {
  return typeof window !== 'undefined' && window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches
    ? {...options, position: 'top-center'}
    : options;
}

function messageContent(message: Parameters<typeof sonnerToast>[0], options?: ExternalToast) {
  return typeof message === 'string' ? () => <ToastMessage title={message} detail={options?.description}/> : message;
}

function messageOptions(message: Parameters<typeof sonnerToast>[0], options?: ExternalToast) {
  const responsive = responsiveOptions(options);
  return typeof message === 'string' ? {...responsive, description: undefined} : responsive;
}

function neutralContent(message: Parameters<typeof sonnerToast>[0], options?: ExternalToast) {
  return typeof message === 'string'
    ? () => <ToastMessage title={message} detail={options?.description} leadingIcon={<Info className='h-4 w-4'/>}/>
    : message;
}

const toast = Object.assign((message: Parameters<typeof sonnerToast>[0], options?: ExternalToast) => sonnerToast(neutralContent(message, options), messageOptions(message, options)), sonnerToast, {
  success: (message: Parameters<typeof sonnerToast.success>[0], options?: ExternalToast) => sonnerToast.success(messageContent(message, options), messageOptions(message, options)),
  info: (message: Parameters<typeof sonnerToast.info>[0], options?: ExternalToast) => sonnerToast.info(messageContent(message, options), messageOptions(message, options)),
  warning: (message: Parameters<typeof sonnerToast.warning>[0], options?: ExternalToast) => sonnerToast.warning(messageContent(message, options), messageOptions(message, options)),
  loading: (message: Parameters<typeof sonnerToast.loading>[0], options?: ExternalToast) => sonnerToast.loading(messageContent(message, options), messageOptions(message, options)),
  message: (message: Parameters<typeof sonnerToast.message>[0], options?: ExternalToast) => sonnerToast.message(neutralContent(message, options), messageOptions(message, options)),
  custom: (render: Parameters<typeof sonnerToast.custom>[0], options?: ExternalToast) => sonnerToast.custom(render, responsiveOptions(options)),
  error: (message: Parameters<typeof sonnerToast.error>[0], options?: Parameters<typeof sonnerToast.error>[1]) => sonnerToast.error(messageContent(message, options), {
    ...messageOptions(message, options),
    duration: ERROR_TOAST_DURATION,
  }),
});

/** Mantém o mesmo ID durante uma operação e não reabre um aviso dispensado. */
export function beginToastTask(id: string, loadingTitle: Parameters<typeof toast.loading>[0]) {
  let dismissed = false;
  const options = {id, onDismiss: () => { dismissed = true; }};
  toast.loading(loadingTitle, options);
  return {
    success: (title: Parameters<typeof toast.success>[0]) => {
      if (!dismissed) toast.success(title, options);
    },
    error: (title: Parameters<typeof toast.error>[0]) => {
      if (!dismissed) toast.error(title, options);
    },
    dismiss: () => {
      dismissed = true;
      toast.dismiss(id);
    },
  };
}

const Toaster = ({...props}: ToasterProps) => {
  const isMobile = useIsMobile();
  const {toasts} = useSonner();

  useEffect(() => {
    // Promise resolve/reject permanece nativo; só a duração do estado de erro é padronizada.
    for (const {id} of toasts) {
      // Eventos são assíncronos: não reabrir um toast já dispensado nem sobrescrever um sucesso posterior.
      const current = sonnerToast.getToasts().find((entry) => entry.id === id);
      if (current && 'type' in current && current.type === 'error' && current.duration !== ERROR_TOAST_DURATION) {
        sonnerToast.error(current.title, {id, duration: ERROR_TOAST_DURATION, dismissible: current.dismissible});
      }
    }
  }, [toasts]);

  return (
    <Sonner
      style={{'--width': '360px'} as React.CSSProperties}
      closeButton
      position={isMobile ? 'top-center' : 'bottom-right'}
      mobileOffset={{top: 'max(16px, env(safe-area-inset-top))', left: 16, right: 16}}
      visibleToasts={isMobile ? 2 : 3}
      icons={{
        error: <CircleAlert className='h-4 w-4' aria-hidden='true'/>,
        success: <CircleCheck className='h-4 w-4' aria-hidden='true'/>,
        warning: <TriangleAlert className='h-4 w-4' aria-hidden='true'/>,
        info: <Info className='h-4 w-4' aria-hidden='true'/>,
        loading: <LoaderCircle className='h-4 w-4 animate-spin' aria-hidden='true'/>,
      }}
      className='toaster group'
      toastOptions={{
        classNames: {
          toast: 'rac-toast',
          description: 'rac-toast-description',
          actionButton: 'rac-toast-action',
          cancelButton: 'rac-toast-cancel',
          error: 'rac-error-toast',
          success: 'rac-success-toast',
          warning: 'rac-warning-toast',
        },
      }}
      {...props}
      theme='light'
    />
  );
};

export {Toaster, toast};
