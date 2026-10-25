import {useEffect, useRef} from 'react';
import {toast} from './sonner.tsx';

/** Report a failed confirmation through the existing toast owner and duration. */
export function ConfirmationErrorToast({message}: {message?: string | null}) {
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (message && reported.current !== message) toast.error(message);
    reported.current = message ?? null;
  }, [message]);
  return null;
}
