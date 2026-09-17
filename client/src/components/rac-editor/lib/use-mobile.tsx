import * as React from 'react';
import {VIEWPORT} from '@/shared/config.ts';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(VIEWPORT.mobileMaxWidthQuery);
    const onChange = () => {
      setIsMobile(window.innerWidth < VIEWPORT.mobileBreakpoint);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < VIEWPORT.mobileBreakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
