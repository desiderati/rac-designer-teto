import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {HOME_TITLE, HOME_DESCRIPTION, NOT_FOUND_TITLE, NOT_FOUND_DESCRIPTION, PUBLIC_APP_URL} from '@shared/public-page-metadata';
export function RouteMetadata() {
  const {pathname} = useLocation();
  useEffect(() => {
    const home = pathname === '/';
    document.title = home ? HOME_TITLE : NOT_FOUND_TITLE;
    document.querySelector('meta[name="description"]')?.setAttribute('content', home ? HOME_DESCRIPTION : NOT_FOUND_DESCRIPTION);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots);}
    robots.content = home ? 'index,follow' : 'noindex,follow';
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (home) {
      if (!canonical) {canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical);}
      canonical.href = PUBLIC_APP_URL;
    } else canonical?.remove();
  }, [pathname]);
  return null;
}
