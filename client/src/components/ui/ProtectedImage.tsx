import {useEffect, useState, type ImgHTMLAttributes, type SyntheticEvent} from 'react';
import {isProtectedImageSource, resolveProtectedImageSource} from '@/shared/lib/protected-image.ts';

const TRANSPARENT_IMAGE_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

/** Mantém imagens privadas compatíveis com sessão por cookie ou Bearer no iframe. */
export function ProtectedImage({src, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState<{source: string; data: string} | null>(null);
  const [nativeLoadFailed, setNativeLoadFailed] = useState(false);
  const protectedSource = !!src && isProtectedImageSource(src);
  useEffect(() => {
    setNativeLoadFailed(false);
    setLoaded(null);
    if (!src || !protectedSource) return;
    const controller = new AbortController();
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const retryDelays = [500, 1500, 3000];
    const load = () => {
      void resolveProtectedImageSource(src, controller.signal).then((data) => {
        if (!controller.signal.aborted) setLoaded({source: src, data});
      }).catch(() => {
        if (controller.signal.aborted || attempt >= retryDelays.length) return;
        retryTimer = setTimeout(() => {
          attempt += 1;
          load();
        }, retryDelays[attempt]);
      });
    };
    load();
    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [src, protectedSource]);
  const resolved = protectedSource
    ? loaded?.source === src
      ? loaded.data
      : nativeLoadFailed
        ? TRANSPARENT_IMAGE_DATA_URL
        : src
    : src;
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (protectedSource && event.currentTarget.src !== TRANSPARENT_IMAGE_DATA_URL) {
      setNativeLoadFailed(true);
    }
    props.onError?.(event);
  };
  return <img {...props} src={resolved} onError={handleError}/>;
}
