import {useEffect, useState, type ImgHTMLAttributes} from 'react';
import {isProtectedImageSource, resolveProtectedImageSource} from '@/shared/lib/protected-image.ts';

/** Mantém imagens privadas compatíveis com sessão por cookie ou Bearer no iframe. */
export function ProtectedImage({src, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState<{source: string; data: string} | null>(null);
  const protectedSource = !!src && isProtectedImageSource(src);
  useEffect(() => {
    if (!src || !protectedSource) return;
    const controller = new AbortController();
    void resolveProtectedImageSource(src, controller.signal).then((data) => {
      if (!controller.signal.aborted) setLoaded({source: src, data});
    }).catch(() => {
      if (!controller.signal.aborted) setLoaded(null);
    });
    return () => controller.abort();
  }, [src, protectedSource]);
  const resolved = protectedSource ? (loaded?.source === src ? loaded.data : undefined) : src;
  return <img {...props} src={resolved}/>;
}
