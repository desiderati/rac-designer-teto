import {useEffect, useState} from 'react';
export const CANVAS_MOBILE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-height: 600px)';
export function useCanvasMobileViewport() {
  const read = () => ({mobile: window.matchMedia(CANVAS_MOBILE_QUERY).matches, portrait: window.innerHeight > window.innerWidth});
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    window.addEventListener('resize', update);
    const media = window.matchMedia(CANVAS_MOBILE_QUERY);
    media.addEventListener('change', update);
    return () => {window.removeEventListener('resize', update); media.removeEventListener('change', update);};
  }, []);
  return {...viewport, landscape: viewport.mobile && !viewport.portrait};
}
