import {expect, it, vi} from 'vitest';
import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {renderHouseDrawingCanvasImageDataUrl} from '@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts';
import {HousePhotoPreviewTrigger} from './HousePhotoPreviewTrigger.tsx';

vi.mock('@/components/rac-editor/@canvas/ui/adapters/render-house-drawing-canvas-image.ts', () => ({
  renderHouseDrawingCanvasImageDataUrl: vi.fn(),
  clearHouseDrawingCanvasImageCache: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}

function drawnHouse(version: number): PersistedHouseRecord {
  return {
    ...house,
    version,
    drawingDocument: {...house.drawingDocument, canvas: {...house.drawingDocument.canvas, objects: [{id: `object-${version}`}]}},
  } as PersistedHouseRecord;
}

const house = {
  id: 'house-1',
  updatedAt: '2026-10-09T16:00:00.000Z',
  drawingDocument: {
    schemaVersion: 1,
    house: null,
    canvas: {schemaVersion: 1, objects: []},
  },
} as PersistedHouseRecord;

it('abre uma prévia ampliada do Canvas ao clicar no thumbnail', () => {
  render(
    <HousePhotoPreviewTrigger
      house={house}
      familyName='Família Silva'
    >
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Desenho indisponível')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Recarregar'})).toBeInTheDocument();
  expect(screen.queryByText('Pré-visualização da casa')).not.toBeInTheDocument();
});

it('unifica ir para o Canvas e fechar modal em um submenu acionado por FAB', () => {
  const onOpenCanvas = vi.fn();
  render(
    <HousePhotoPreviewTrigger
      house={house}
      familyName='Família Silva'
      onOpenCanvas={onOpenCanvas}
    >
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));
  fireEvent.click(screen.getByRole('button', {name: 'Abrir ações da prévia do Canvas'}));

  expect(screen.getByTestId('house-canvas-preview-actions')).toBeVisible();
  expect(screen.getByRole('menuitem', {name: 'Ir pro Canvas'})).toBeVisible();
  expect(screen.getByRole('menuitem', {name: 'Fechar Modal'})).toBeVisible();

  fireEvent.click(screen.getByRole('menuitem', {name: 'Ir pro Canvas'}));
  expect(onOpenCanvas).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('fecha a prévia pelo submenu sem acionar a navegação', () => {
  render(
    <HousePhotoPreviewTrigger house={house} familyName='Família Silva'>
      <span>thumbnail</span>
    </HousePhotoPreviewTrigger>,
  );

  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Família Silva'}));
  fireEvent.click(screen.getByRole('button', {name: 'Abrir ações da prévia do Canvas'}));
  fireEvent.click(screen.getByRole('menuitem', {name: 'Fechar Modal'}));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('atualiza um modal aberto e ignora pixels da versão anterior concluídos fora de ordem', async () => {
  const oldCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
  const currentCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
  vi.mocked(renderHouseDrawingCanvasImageDataUrl).mockReset()
    .mockReturnValueOnce(oldCapture.promise).mockReturnValueOnce(currentCapture.promise);
  const {rerender} = render(<HousePhotoPreviewTrigger house={drawnHouse(1)} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Silva'}));
  expect(within(screen.getByRole('dialog')).getByText('Carregando Canvas…')).toBeVisible();

  // A identidade do documento também invalida a prévia quando a versão ainda não avançou.
  rerender(<HousePhotoPreviewTrigger house={{...drawnHouse(2), version: 1}} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  await waitFor(() => expect(renderHouseDrawingCanvasImageDataUrl).toHaveBeenCalledTimes(2));
  await act(async () => currentCapture.resolve({imageDataUrl: 'data:image/png;base64,new', hasOmittedRasterSources: false}));
  expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,new');

  await act(async () => oldCapture.resolve({imageDataUrl: 'data:image/png;base64,old', hasOmittedRasterSources: false}));
  expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,new');
});

it('não substitui a prévia atual por falha tardia da versão anterior', async () => {
  const oldCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
  const currentCapture = deferred<{imageDataUrl: string; hasOmittedRasterSources: boolean}>();
  vi.mocked(renderHouseDrawingCanvasImageDataUrl).mockReset()
    .mockReturnValueOnce(oldCapture.promise).mockReturnValueOnce(currentCapture.promise);
  const {rerender} = render(<HousePhotoPreviewTrigger house={drawnHouse(1)} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Silva'}));
  rerender(<HousePhotoPreviewTrigger house={drawnHouse(2)} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  await waitFor(() => expect(renderHouseDrawingCanvasImageDataUrl).toHaveBeenCalledTimes(2));
  await act(async () => currentCapture.resolve({imageDataUrl: 'data:image/png;base64,new', hasOmittedRasterSources: false}));
  await act(async () => oldCapture.reject(new Error('prévia antiga indisponível')));

  expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,new');
  expect(within(screen.getByRole('dialog')).queryByText('Não foi possível carregar o Canvas.')).not.toBeInTheDocument();
});

it.each(['version', 'updatedAt'] as const)('atualiza o modal quando apenas %s muda, mantendo o mesmo documento', async (field) => {
  const initialHouse = drawnHouse(1);
  vi.mocked(renderHouseDrawingCanvasImageDataUrl).mockReset()
    .mockResolvedValueOnce({imageDataUrl: 'data:image/png;base64,before', hasOmittedRasterSources: false})
    .mockResolvedValueOnce({imageDataUrl: 'data:image/png;base64,after', hasOmittedRasterSources: false});
  const {rerender} = render(<HousePhotoPreviewTrigger house={initialHouse} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Silva'}));
  await waitFor(() => expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,before'));

  const revisedHouse = {...initialHouse, [field]: field === 'version' ? 2 : '2026-10-24T18:00:00.000Z'};
  rerender(<HousePhotoPreviewTrigger house={revisedHouse} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);

  await waitFor(() => expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,after'));
  expect(renderHouseDrawingCanvasImageDataUrl).toHaveBeenCalledTimes(2);
});

it('reabre a prévia pronta sem descartar a captura da mesma revisão', async () => {
  vi.mocked(renderHouseDrawingCanvasImageDataUrl).mockReset()
    .mockResolvedValue({imageDataUrl: 'data:image/png;base64,cached', hasOmittedRasterSources: false});
  render(<HousePhotoPreviewTrigger house={drawnHouse(1)} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  const trigger = screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Silva'});
  fireEvent.click(trigger);
  await waitFor(() => expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,cached'));
  fireEvent.click(screen.getByRole('button', {name: 'Abrir ações da prévia do Canvas'}));
  fireEvent.click(screen.getByRole('menuitem', {name: 'Fechar Modal'}));
  fireEvent.click(trigger);

  expect(within(screen.getByRole('dialog')).getByAltText('Canvas da casa Silva')).toHaveAttribute('src', 'data:image/png;base64,cached');
  expect(renderHouseDrawingCanvasImageDataUrl).toHaveBeenCalledOnce();
});

it('não repete automaticamente uma captura que falhou', async () => {
  vi.mocked(renderHouseDrawingCanvasImageDataUrl).mockReset().mockRejectedValue(new Error('captura indisponível'));
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  render(<HousePhotoPreviewTrigger house={drawnHouse(1)} familyName='Silva'><span>thumbnail</span></HousePhotoPreviewTrigger>);
  fireEvent.click(screen.getByRole('button', {name: 'Pré-visualizar Canvas da casa Silva'}));

  await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('Não foi possível carregar o Canvas.')).toBeVisible());
  expect(renderHouseDrawingCanvasImageDataUrl).toHaveBeenCalledOnce();
  warning.mockRestore();
});
