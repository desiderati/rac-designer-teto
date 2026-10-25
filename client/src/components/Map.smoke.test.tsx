import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MapView} from './Map.tsx';

describe('MapView', () => {
  beforeEach(() => {
    document.head.querySelector('script[data-manus-google-maps="true"]')?.remove();
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_FRONTEND_FORGE_API_URL', 'https://maps-proxy.example');
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', 'runtime-key');
  });

  afterEach(() => {
    document.head.querySelector('script[data-manus-google-maps="true"]')?.remove();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('exibe erro amigável quando a credencial pública do proxy não está disponível', async () => {
    vi.stubEnv('DEV', false);
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
    const mapInstance = {setCenter: vi.fn(), setOptions: vi.fn()};
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
        markerTitle='Local informado'
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
        ControlPosition: {LEFT_CENTER: 4, RIGHT_CENTER: 8},
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
        controlSize: 40,
        cameraControl: false,
        fullscreenControl: false,
        mapTypeControl: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {position: 8},
      }),
    );
    expect(markerConstructor).toHaveBeenCalledWith({
      map: mapInstance,
      position: {lat: -25.4284, lng: -49.2733},
      title: 'Local informado',
    });
    expect(onMapReady).toHaveBeenCalledWith(mapInstance);
    expect(screen.queryByTitle('Local informado — mapa OpenStreetMap')).not.toBeInTheDocument();
  });

  it('mantém zoom à direita e atalhos removidos ao alternar entre mobile e desktop', async () => {
    const mapConstructor = vi.fn();
    const setOptions = vi.fn();
    const mapInstance = {setCenter: vi.fn(), setOptions};
    let mediaChangeHandler: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
        mediaChangeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));

    class FakeMap {
      constructor(element: HTMLElement, options: Record<string, unknown>) {
        mapConstructor(element, options);
        return mapInstance;
      }
    }

    vi.stubGlobal('google', {
      maps: {
        ControlPosition: {LEFT_CENTER: 4, RIGHT_CENTER: 8},
        Map: FakeMap,
        event: {clearInstanceListeners: vi.fn()},
      },
    });

    render(<MapView/>);
    const script = document.head.querySelector<HTMLScriptElement>('script[data-manus-google-maps="true"]');
    script?.dispatchEvent(new Event('load'));

    await waitFor(() => expect(screen.getByTestId('google-maps-map')).toHaveAttribute('data-map-state', 'ready'));
    expect(mapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        controlSize: 32,
        cameraControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {position: 8},
      }),
    );

    mediaQuery.matches = false;
    mediaChangeHandler?.({matches: false} as MediaQueryListEvent);
    expect(setOptions).toHaveBeenCalledWith({
      cameraControl: false,
      fullscreenControl: false,
      mapTypeControl: true,
      streetViewControl: false,
      zoomControl: true,
      zoomControlOptions: {position: 8},
    });
  });

  it('mantém o fallback React fora do host que o SDK pode reescrever', async () => {
    const mapInstance = {setCenter: vi.fn(), setOptions: vi.fn()};

    class FakeMap {
      constructor(element: HTMLElement) {
        // Simula o comportamento de SDKs imperativos que limpam o host recebido.
        while (element.firstChild) element.removeChild(element.firstChild);
        return mapInstance;
      }
    }

    vi.stubGlobal('google', {
      maps: {
        ControlPosition: {LEFT_CENTER: 4, RIGHT_CENTER: 8},
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

  it('exibe o mapa local com marcador sem carregar o SDK Manus quando não há chave', () => {
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    const onMapReady = vi.fn();
    render(<MapView initialCenter={{lat: 48.8584, lng: 2.2945}} initialZoom={17}
      markerPosition={{lat: 48.8584, lng: 2.2945}} onMapReady={onMapReady}/>);

    const frame = screen.getByTitle('Local informado — mapa OpenStreetMap');
    const url = new URL(frame.getAttribute('src') ?? '');
    expect(url.origin).toBe('https://www.openstreetmap.org');
    expect(url.pathname).toBe('/export/embed.html');
    expect(url.searchParams.get('marker')).toBe('48.8584,2.2945');
    expect(url.searchParams.get('layer')).toBe('mapnik');
    const [west, south, east, north] = (url.searchParams.get('bbox') ?? '').split(',').map(Number);
    expect(west).toBeLessThan(2.2945);
    expect(east).toBeGreaterThan(2.2945);
    expect(south).toBeLessThan(48.8584);
    expect(north).toBeGreaterThan(48.8584);
    expect(east - west).toBeLessThan(0.01);
    expect(document.querySelector('script[data-manus-google-maps]')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando mapa...');

    fireEvent.load(frame);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('openstreetmap-map')).toHaveAttribute('data-map-state', 'ready');
    expect(onMapReady).not.toHaveBeenCalled();
  });

  it('atualiza o ponto e o enquadramento local quando as coordenadas mudam', () => {
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    const {rerender} = render(<MapView initialCenter={{lat: 48.8584, lng: 2.2945}} initialZoom={17}
      markerPosition={{lat: 48.8584, lng: 2.2945}}/>);
    const originalFrame = screen.getByTitle('Local informado — mapa OpenStreetMap');
    fireEvent.load(originalFrame);

    rerender(<MapView initialCenter={{lat: 0, lng: 0}} initialZoom={12} markerPosition={{lat: 0, lng: 0}}/>);
    const frame = screen.getByTitle('Local informado — mapa OpenStreetMap');
    const url = new URL(frame.getAttribute('src') ?? '');
    expect(url.searchParams.get('marker')).toBe('0,0');
    expect(url.searchParams.get('bbox')).not.toContain('48.85');
    expect(frame).not.toBe(originalFrame);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('permite tentar novamente quando o mapa local falha', () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    const onError = vi.fn();
    render(<MapView onError={onError}/>);
    const frame = screen.getByTitle('Local informado — mapa OpenStreetMap');
    const src = frame.getAttribute('src');
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o mapa agora.');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    fireEvent.click(screen.getByRole('button', {name: 'Tentar novamente'}));
    const retriedFrame = screen.getByTitle('Local informado — mapa OpenStreetMap');
    expect(retriedFrame).not.toBe(frame);
    expect(retriedFrame).toHaveAttribute('src', src);
    fireEvent.load(retriedFrame);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('encerra o carregamento local sem resposta e limpa o prazo após carregar', () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    render(<MapView/>);
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Tentar novamente'}));
    fireEvent.load(screen.getByTitle('Local informado — mapa OpenStreetMap'));
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserva o SDK Google já disponível mesmo sem chave local', async () => {
    vi.stubEnv('VITE_FRONTEND_FORGE_API_KEY', '');
    const mapInstance = {setOptions: vi.fn()};
    const onMapReady = vi.fn();
    class FakeMap {
      constructor() { return mapInstance; }
    }
    vi.stubGlobal('google', {maps: {Map: FakeMap, ControlPosition: {RIGHT_CENTER: 8}}});
    render(<MapView onMapReady={onMapReady}/>);
    await waitFor(() => expect(onMapReady).toHaveBeenCalledWith(mapInstance));
    expect(screen.queryByTitle('Local informado — mapa OpenStreetMap')).not.toBeInTheDocument();
  });
});
