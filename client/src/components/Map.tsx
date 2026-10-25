/// <reference types="@types/google.maps" />

import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { usePersistFn } from '@/hooks/usePersistFn';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    google?: typeof google;
  }
}

const DEFAULT_FORGE_BASE_URL = 'https://forge.butterfly-effect.dev';
const COMPACT_MAP_CONTROLS_QUERY = '(max-width: 767px)';
const DEFAULT_MAP_CENTER = {lat: 37.7749, lng: -122.4194};
const DEFAULT_MAP_ZOOM = 12;
let mapsScriptPromise: Promise<void> | null = null;

type MapLoadState = 'loading' | 'ready' | 'error';

function getMapsProxyScriptUrl(): string {
  const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
  const forgeBaseUrl =
    import.meta.env.VITE_FRONTEND_FORGE_API_URL || DEFAULT_FORGE_BASE_URL;

  if (!apiKey) {
    throw new Error('A credencial pública do proxy Google Maps não está disponível.');
  }

  const baseUrl = forgeBaseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({
    key: apiKey,
    v: 'weekly',
    loading: 'async',
    libraries: 'marker,places,geocoding,geometry',
  });

  return `${baseUrl}/v1/maps/proxy/maps/api/js?${params.toString()}`;
}

function loadMapScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return Promise.resolve();
  }

  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-manus-google-maps="true"]',
    );
    const script = existingScript ?? document.createElement('script');

    const handleLoad = () => {
      if (window.google?.maps?.Map) {
        resolve();
        return;
      }

      reject(new Error('O SDK do Google Maps foi carregado sem disponibilizar a API de mapas.'));
    };

    const handleError = () => {
      script.remove();
      reject(new Error('Não foi possível carregar o SDK do Google Maps pelo proxy Manus.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.dataset.manusGoogleMaps = 'true';
      script.src = getMapsProxyScriptUrl();
      document.head.appendChild(script);
    }
  }).catch(error => {
    mapsScriptPromise = null;
    throw error;
  });

  return mapsScriptPromise;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function getCompactMapControls(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(COMPACT_MAP_CONTROLS_QUERY).matches
    : false;
}

function getMapControlsOptions(compact: boolean): Pick<google.maps.MapOptions,
  'cameraControl' | 'fullscreenControl' | 'mapTypeControl' | 'streetViewControl' | 'zoomControl' | 'zoomControlOptions'> {
  return {
    cameraControl: false,
    fullscreenControl: false,
    mapTypeControl: !compact,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
  };
}

function MapFallback({onRetry}: {onRetry?: () => void}) {
  return (
    <div
      role='alert'
      className='absolute inset-0 z-10 grid place-items-center bg-blue-50 px-4 text-center text-sm font-semibold text-slate-600'
    >
      <div className='flex max-w-sm flex-col items-center gap-3'>
        <span className='grid h-10 w-10 place-items-center rounded-full bg-white text-blue-600 shadow-sm'>
          <MapPin className='h-5 w-5' aria-hidden='true'/>
        </span>
        <p>Não foi possível carregar o mapa agora.</p>
        {onRetry ? (
          <button
            type='button'
            onClick={onRetry}
            className='inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <RefreshCw className='h-3.5 w-3.5' aria-hidden='true'/>
            Tentar novamente
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MapLoading() {
  return <div role='status' className='absolute inset-0 z-10 grid place-items-center bg-blue-50/90 text-sm font-semibold text-slate-600'>
    Carregando mapa...
  </div>;
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  markerPosition?: google.maps.LatLngLiteral;
  markerTitle?: string;
  onMapReady?: (map: google.maps.Map) => void;
  onError?: (error: Error) => void;
}

function getOpenStreetMapUrl({initialCenter = DEFAULT_MAP_CENTER, initialZoom = DEFAULT_MAP_ZOOM, markerPosition}: MapViewProps) {
  const validPoint = ({lat, lng}: google.maps.LatLngLiteral) => Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (!validPoint(initialCenter) || (markerPosition && !validPoint(markerPosition))) {
    throw new Error('As coordenadas do mapa local são inválidas.');
  }

  const mercatorLimit = 85.05112878;
  const latitude = Math.max(-mercatorLimit, Math.min(mercatorLimit, initialCenter.lat));
  const zoom = Number.isFinite(initialZoom) ? Math.max(1, Math.min(19, initialZoom)) : DEFAULT_MAP_ZOOM;
  const longitudeRadius = 360 / 2 ** zoom;
  const latitudeRadius = longitudeRadius * Math.cos(latitude * Math.PI / 180) / 2;
  const url = new URL('https://www.openstreetmap.org/export/embed.html');
  url.searchParams.set('bbox', [
    Math.max(-180, initialCenter.lng - longitudeRadius),
    Math.max(-mercatorLimit, latitude - latitudeRadius),
    Math.min(180, initialCenter.lng + longitudeRadius),
    Math.min(mercatorLimit, latitude + latitudeRadius),
  ].join(','));
  url.searchParams.set('layer', 'mapnik');
  if (markerPosition) url.searchParams.set('marker', `${markerPosition.lat},${markerPosition.lng}`);
  return url.toString();
}

function OpenStreetMapFrame({src, className, markerTitle = 'Local informado', onError}: Pick<MapViewProps, 'className' | 'markerTitle' | 'onError'> & {src: string}) {
  const [loadState, setLoadState] = useState<MapLoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const handleError = usePersistFn(() => {
    setLoadState('error');
    onError?.(new Error('Não foi possível carregar o mapa local do OpenStreetMap.'));
  });

  useEffect(() => {
    if (loadState !== 'loading') return;
    // O iframe não expõe falhas HTTP de outra origem. O prazo cobre carga sem resposta.
    const timeout = window.setTimeout(handleError, 15_000);
    return () => window.clearTimeout(timeout);
  }, [handleError, loadState, retryKey]);

  return <div data-testid='openstreetmap-map' data-map-state={loadState} aria-label='Mapa do local informado'
    aria-busy={loadState === 'loading'} className={cn('relative h-full min-h-40 w-full overflow-hidden', className)}>
    {loadState !== 'error' ? <iframe key={retryKey} src={src} title={`${markerTitle} — mapa OpenStreetMap`}
      className='absolute inset-0 h-full w-full border-0' referrerPolicy='strict-origin-when-cross-origin'
      onLoad={() => setLoadState('ready')}/> : null}
    {loadState === 'loading' ? <MapLoading/> : null}
    {loadState === 'error' ? <MapFallback onRetry={() => {
      setLoadState('loading');
      setRetryKey(current => current + 1);
    }}/> : null}
  </div>;
}

function OpenStreetMapView(props: MapViewProps) {
  const src = getOpenStreetMapUrl(props);
  return <OpenStreetMapFrame key={src} src={src} className={props.className} markerTitle={props.markerTitle} onError={props.onError}/>;
}

interface MapViewErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface MapViewErrorBoundaryState {
  error: Error | null;
}

/**
 * O SDK do Maps é uma biblioteca imperativa que pode falhar fora do ciclo React.
 * O boundary mantém essa falha restrita ao card do mapa, sem derrubar o formulário.
 */
class MapViewErrorBoundary extends Component<MapViewErrorBoundaryProps, MapViewErrorBoundaryState> {
  state: MapViewErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): MapViewErrorBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({error: null});
  };

  render() {
    if (this.state.error) {
      return <MapFallback onRetry={this.handleRetry}/>;
    }

    return this.props.children;
  }
}

function MapViewContent({
  className,
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = DEFAULT_MAP_ZOOM,
  markerPosition,
  markerTitle = 'Local informado',
  onMapReady,
  onError,
}: MapViewProps) {
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const mounted = useRef(true);
  const responsiveControlsCleanup = useRef<(() => void) | null>(null);
  const [loadState, setLoadState] = useState<MapLoadState>('loading');
  const [retryKey, setRetryKey] = useState(0);

  const cleanupMap = usePersistFn(() => {
    const currentMarker = marker.current;
    try {
      if (currentMarker) {
        if ('setMap' in currentMarker && typeof currentMarker.setMap === 'function') {
          currentMarker.setMap(null);
        } else if ('map' in currentMarker) {
          currentMarker.map = null;
        }
      }
    } catch {
      // A desmontagem tardia do SDK não pode propagar uma exceção ao formulário.
    }

    const currentMap = map.current;
    if (currentMap) {
      try {
        window.google?.maps?.event?.clearInstanceListeners?.(currentMap);
      } catch {
        // O SDK pode já ter liberado seus listeners durante uma desmontagem.
      }
    }

    marker.current = null;
    map.current = null;
    responsiveControlsCleanup.current?.();
    responsiveControlsCleanup.current = null;
  });

  const init = usePersistFn(async () => {
    try {
      await loadMapScript();

      if (!mounted.current || !mapHost.current) return;

      const googleApi = window.google;
      if (!googleApi?.maps?.Map) {
        throw new Error('A API de mapas não está disponível após o carregamento do SDK.');
      }

      const compactControls = getCompactMapControls();
      const mapInstance = new googleApi.maps.Map(mapHost.current, {
        zoom: initialZoom,
        center: initialCenter,
        // O Maps aceita controlSize somente na criação, não no resize.
        controlSize: compactControls ? 32 : 40,
        ...getMapControlsOptions(compactControls),
        mapId: 'DEMO_MAP_ID',
      });

      map.current = mapInstance;

      if (typeof window.matchMedia === 'function') {
        const mediaQuery = window.matchMedia(COMPACT_MAP_CONTROLS_QUERY);
        const updateControls = () => {
          mapInstance.setOptions(getMapControlsOptions(mediaQuery.matches));
        };
        mediaQuery.addEventListener?.('change', updateControls);
        responsiveControlsCleanup.current = () => mediaQuery.removeEventListener?.('change', updateControls);
      }

      if (markerPosition) {
        const markerApi = googleApi.maps.marker;
        if (markerApi?.AdvancedMarkerElement) {
          marker.current = new markerApi.AdvancedMarkerElement({
            map: mapInstance,
            position: markerPosition,
            title: markerTitle,
          });
        } else if (googleApi.maps.Marker) {
          marker.current = new googleApi.maps.Marker({
            map: mapInstance,
            position: markerPosition,
            title: markerTitle,
          });
        }
      }

      if (!mounted.current) return;
      setLoadState('ready');
      onMapReady?.(mapInstance);
    } catch (error) {
      if (!mounted.current) return;
      const normalizedError = toError(error);
      setLoadState('error');
      onError?.(normalizedError);
      console.error('[Google Maps] Falha ao inicializar o mapa:', normalizedError);
    }
  });

  useEffect(() => {
    mounted.current = true;
    setLoadState('loading');
    void init();

    return () => {
      mounted.current = false;
      cleanupMap();
    };
  }, [cleanupMap, init, retryKey]);

  const handleRetry = () => {
    cleanupMap();
    setLoadState('loading');
    setRetryKey((current) => current + 1);
  };

  return (
    <div
      data-testid='google-maps-map'
      data-map-state={loadState}
      aria-label='Mapa do local informado'
      className={cn('relative h-full min-h-40 w-full overflow-hidden', className)}
    >
      {/* O SDK recebe um host sem filhos React. Ele pode reescrever seu conteúdo sem
          provocar uma remoção duplicada durante o próximo commit do React. */}
      <div
        ref={mapHost}
        data-testid='google-maps-surface'
        className='absolute inset-0'
      />
      {loadState === 'loading' ? <MapLoading/> : null}
      {loadState === 'error' ? <MapFallback onRetry={handleRetry}/> : null}
    </div>
  );
}

export function MapView(props: MapViewProps) {
  // O desenvolvimento sem credencial usa a incorporação oficial. Builds publicados
  // e ambientes com Manus (ou SDK Google já carregado) conservam o caminho original.
  const localMap = import.meta.env.DEV && !import.meta.env.VITE_FRONTEND_FORGE_API_KEY
    && (typeof window === 'undefined' || !window.google?.maps?.Map);
  return (
    <MapViewErrorBoundary onError={props.onError}>
      {localMap ? <OpenStreetMapView {...props}/> : <MapViewContent {...props}/>}
    </MapViewErrorBoundary>
  );
}
