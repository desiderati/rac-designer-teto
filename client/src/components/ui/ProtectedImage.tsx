import {LoaderCircle} from 'lucide-react';
import {useEffect, useState, type ImgHTMLAttributes, type SyntheticEvent} from 'react';
import {
  getCachedProtectedImageSource,
  isProtectedImageSource,
  resolveProtectedImageSource,
} from '@/shared/lib/protected-image.ts';

const TRANSPARENT_IMAGE_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

/** Mantém imagens privadas compatíveis com sessão por cookie ou Bearer no iframe. */
export function ProtectedImage({src, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState<{source: string; data: string} | null>(null);
  const [nativeLoadFailed, setNativeLoadFailed] = useState(false);
  const [nativeLoaded, setNativeLoaded] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'retrying' | 'loaded' | 'failed'>('loaded');
  const protectedSource = !!src && isProtectedImageSource(src);
  useEffect(() => {
    setNativeLoadFailed(false);
    setNativeLoaded(false);
    setLoaded(null);
    setLoadState(protectedSource ? 'loading' : 'loaded');
    if (!src || !protectedSource) return;

    const cachedSource = getCachedProtectedImageSource(src);
    if (cachedSource) {
      setLoaded({source: src, data: cachedSource});
      setNativeLoaded(true);
      setLoadState('loaded');
      return;
    }

    const controller = new AbortController();
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const retryDelays = [500, 1500, 3000];
    const load = () => {
      setLoadState(attempt === 0 ? 'loading' : 'retrying');
      void resolveProtectedImageSource(src, controller.signal).then((data) => {
        if (!controller.signal.aborted) {
          setLoaded({source: src, data});
          setLoadState('loaded');
        }
      }).catch(() => {
        if (controller.signal.aborted) return;
        if (attempt >= retryDelays.length) {
          setLoadState('failed');
          return;
        }
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
      setLoadState('retrying');
    }
    props.onError?.(event);
  };
  const imageClassName = props.className;
  const isRoundThumbnail = Boolean(imageClassName && /\brounded-full\b/.test(imageClassName));
  const isReconnecting = loadState === 'retrying';
  const showLoadingIndicator = protectedSource && (loadState === 'loading' || isReconnecting);
  const hideUnresolvedProtectedImage = protectedSource && !nativeLoaded && loaded?.source !== src;
  return (
    <span
      data-protected-image='true'
      data-image-load-state={loadState}
      aria-busy={showLoadingIndicator || undefined}
      className={`relative inline-flex min-h-0 min-w-0 ${isRoundThumbnail ? 'overflow-hidden rounded-full' : ''} ${imageClassName ?? ''}`}
    >
      <img {...props} className={`${imageClassName ?? ''} ${hideUnresolvedProtectedImage ? 'opacity-0' : 'transition-opacity duration-150'}`} src={resolved} onError={handleError} onLoad={(event) => {
        setNativeLoaded(true);
        if (protectedSource && loaded?.source !== src) setLoadState('loaded');
        props.onLoad?.(event);
      }}/>
      {showLoadingIndicator ? (
        <span
          data-testid='protected-image-loading-indicator'
          role='status'
          aria-label={isReconnecting ? 'Reconectando imagem' : 'Carregando imagem'}
          className={`pointer-events-none absolute inset-0 z-10 grid place-items-center ${isRoundThumbnail ? 'bg-slate-900/35' : ''}`}
        >
          <span className={isRoundThumbnail
            ? 'inline-flex rounded-full bg-slate-900/55 p-1.5 text-white shadow-sm backdrop-blur-sm'
            : 'inline-flex items-center gap-1 rounded-full bg-slate-900/55 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm'}>
            <LoaderCircle className={isRoundThumbnail ? 'h-4 w-4 animate-spin' : 'h-3 w-3 animate-spin'} aria-hidden='true'/>
            {!isRoundThumbnail ? <span>{isReconnecting ? 'Reconectando…' : 'Carregando…'}</span> : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}
