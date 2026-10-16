/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const DEFAULT_FORGE_BASE_URL = "https://forge.butterfly-effect.dev";
let mapsScriptPromise: Promise<void> | null = null;

type MapLoadState = "loading" | "ready" | "error";

function getMapsProxyScriptUrl(): string {
  const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
  const forgeBaseUrl =
    import.meta.env.VITE_FRONTEND_FORGE_API_URL || DEFAULT_FORGE_BASE_URL;

  if (!apiKey) {
    throw new Error("A credencial pública do proxy Google Maps não está disponível.");
  }

  const baseUrl = forgeBaseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({
    key: apiKey,
    v: "weekly",
    libraries: "marker,places,geocoding,geometry",
  });

  return `${baseUrl}/v1/maps/proxy/maps/api/js?${params.toString()}`;
}

function loadMapScript(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.maps?.Map) {
    return Promise.resolve();
  }

  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-manus-google-maps="true"]',
    );
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      if (window.google?.maps?.Map) {
        resolve();
        return;
      }

      reject(new Error("O SDK do Google Maps foi carregado sem disponibilizar a API de mapas."));
    };

    const handleError = () => {
      script.remove();
      reject(new Error("Não foi possível carregar o SDK do Google Maps pelo proxy Manus."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.dataset.manusGoogleMaps = "true";
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

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  markerPosition?: google.maps.LatLngLiteral;
  markerTitle?: string;
  onMapReady?: (map: google.maps.Map) => void;
  onError?: (error: Error) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  markerPosition,
  markerTitle = "Local informado",
  onMapReady,
  onError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const mounted = useRef(true);
  const [loadState, setLoadState] = useState<MapLoadState>("loading");

  const init = usePersistFn(async () => {
    try {
      await loadMapScript();

      if (!mounted.current || !mapContainer.current) return;

      const googleApi = window.google;
      if (!googleApi?.maps?.Map) {
        throw new Error("A API de mapas não está disponível após o carregamento do SDK.");
      }

      const mapInstance = new googleApi.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });

      map.current = mapInstance;

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

      setLoadState("ready");
      onMapReady?.(mapInstance);
    } catch (error) {
      if (!mounted.current) return;
      const normalizedError = toError(error);
      setLoadState("error");
      onError?.(normalizedError);
      console.error("[Google Maps] Falha ao inicializar o mapa:", normalizedError);
    }
  });

  useEffect(() => {
    mounted.current = true;
    void init();

    return () => {
      mounted.current = false;
      marker.current = null;
      map.current = null;
    };
  }, [init]);

  return (
    <div
      ref={mapContainer}
      data-testid="google-maps-map"
      data-map-state={loadState}
      aria-label="Mapa do local informado"
      className={cn("relative h-full min-h-40 w-full overflow-hidden", className)}
    >
      {loadState === "loading" ? (
        <div
          role="status"
          className="absolute inset-0 z-10 grid place-items-center bg-blue-50/90 text-sm font-semibold text-slate-600"
        >
          Carregando mapa...
        </div>
      ) : null}
      {loadState === "error" ? (
        <div
          role="alert"
          className="absolute inset-0 z-10 grid place-items-center bg-blue-50 px-4 text-center text-sm font-semibold text-slate-600"
        >
          Não foi possível carregar o mapa agora.
        </div>
      ) : null}
    </div>
  );
}
