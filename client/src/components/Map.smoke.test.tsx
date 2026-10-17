import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {MapView} from './Map.tsx';

describe('MapView', () => {
  beforeEach(() => {
    document.head.querySelector('script[data-manus-google-maps="true"]')?.remove();
    vi.stubEnv('VITE_FRONTEND_FORGE_API_URL', 'https://maps-proxy.example');
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', 'runtime-key');
  });

  afterEach(() => {
    document.head.querySelector('script[data-manus-google-maps="true"]')?.remove();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('exibe erro amigável quando a credencial pública do proxy não está disponível', async () => {
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    const onError = vi.fn();

    render(<MapView onError={onError}/>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o mapa agora.');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      message: 'A credencial pública do proxy Google Maps não está disponível.',
    });
  });

  it('carrega o SDK pelo proxy Manus, cria o mapa e adiciona o marcador', async () => {
    const mapConstructor = vi.fn();
    const markerConstructor = vi.fn();
    const mapInstance = {setCenter: vi.fn()};
    const onMapReady = vi.fn();

    class FakeMap {
      constructor(element: HTMLElement, options: Record<string, unknown>) {
        mapConstructor(element, options);
        return mapInstance;
      }
    }

    class FakeAdvancedMarkerElement {
      constructor(options: Record<string, unknown>) {
        markerConstructor(options);
      }
    }

    render(
      <MapView
        initialCenter={{lat: -25.4284, lng: -49.2733}}
        initialZoom={17}
        markerPosition={{lat: -25.4284, lng: -49.2733}}
        markerTitle="Local informado"
        onMapReady={onMapReady}
      />,
    );

    const script = document.head.querySelector<HTMLScriptElement>('script[data-manus-google-maps="true"]');
    expect(script).not.toBeNull();
    const scriptUrl = new URL(script?.src ?? '');
    expect(scriptUrl.origin).toBe('https://maps-proxy.example');
    expect(scriptUrl.pathname).toBe('/v1/maps/proxy/maps/api/js');
    expect(scriptUrl.searchParams.get('key')).toBe('runtime-key');
    expect(scriptUrl.searchParams.get('loading')).toBe('async');
    expect(scriptUrl.searchParams.get('libraries')).toBe('marker,places,geocoding,geometry');

    vi.stubGlobal('google', {
      maps: {
        Map: FakeMap,
        marker: {AdvancedMarkerElement: FakeAdvancedMarkerElement},
      },
    });
    script?.dispatchEvent(new Event('load'));

    await waitFor(() => expect(screen.getByTestId('google-maps-map')).toHaveAttribute('data-map-state', 'ready'));
    expect(mapConstructor.mock.calls[0]?.[0]).toBe(screen.getByTestId('google-maps-surface'));
    expect(mapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        center: {lat: -25.4284, lng: -49.2733},
        zoom: 17,
      }),
    );
    expect(markerConstructor).toHaveBeenCalledWith({
      map: mapInstance,
      position: {lat: -25.4284, lng: -49.2733},
      title: 'Local informado',
    });
    expect(onMapReady).toHaveBeenCalledWith(mapInstance);
  });

  it('mantém o fallback React fora do host que o SDK pode reescrever', async () => {
    const mapInstance = {setCenter: vi.fn()};

    class FakeMap {
      constructor(element: HTMLElement) {
        // Simula o comportamento de SDKs imperativos que limpam o host recebido.
        while (element.firstChild) element.removeChild(element.firstChild);
        return mapInstance;
      }
    }

    vi.stubGlobal('google', {
      maps: {
        Map: FakeMap,
        event: {clearInstanceListeners: vi.fn()},
      },
    });

    render(<MapView/>);
    const script = document.head.querySelector<HTMLScriptElement>('script[data-manus-google-maps="true"]');
    script?.dispatchEvent(new Event('load'));

    await waitFor(() => expect(screen.getByTestId('google-maps-map')).toHaveAttribute('data-map-state', 'ready'));
    expect(screen.getByTestId('google-maps-surface')).toBeInTheDocument();
    expect(screen.queryByText('Carregando mapa...')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
