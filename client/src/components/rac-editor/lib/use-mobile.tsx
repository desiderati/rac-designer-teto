import * as React from 'react';
import {VIEWPORT} from '@/shared/config.ts';

export function useIsMobile(breakpoint: number = VIEWPORT.mobileBreakpoint) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const query = breakpoint === VIEWPORT.mobileBreakpoint ? VIEWPORT.mobileMaxWidthQuery : `(max-width: ${breakpoint - 1}px)`;
    const mql = window.matchMedia(query);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < breakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return !!isMobile;
}
