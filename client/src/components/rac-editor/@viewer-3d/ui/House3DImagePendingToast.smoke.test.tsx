import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useEffect} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {House3DImageInsertionProvider, useHouse3DImageInsertion, type PendingHouse3DImage} from '@/contexts/House3DImageInsertionContext.tsx';
import {House3DImagePendingToast} from './House3DImagePendingToast.tsx';

function PendingToastHarness({
  registerCanvas = false,
  insertImageSnapshot = vi.fn().mockResolvedValue(true),
  source = 'illustration',
}: {
  registerCanvas?: boolean;
  insertImageSnapshot?: ReturnType<typeof vi.fn>;
  source?: PendingHouse3DImage['source'];
}) {
  const {publishImage, registerCanvasGetter} = useHouse3DImageInsertion();
  const canvas = {
    createSnapshotPort: () => ({insertImageSnapshot}),
  };

  useEffect(() => {
    if (!registerCanvas) return;
    return registerCanvasGetter(() => canvas);
  }, [registerCanvas, registerCanvasGetter]);

  return (
    <>
      <button
        type='button'
        onClick={() => publishImage({
          dataUrl: 'data:image/png;base64,illustrated-house',
          storageUrl: '/manus-storage/temp/house-3d/illustration.png',
          source,
        })}
      >
        preparar imagem
      </button>
      <House3DImagePendingToast/>
    </>
  );
}

describe('House3DImagePendingToast', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mantém a imagem quando Inserir é acionado sem Canvas e mostra orientação no próprio toast', async () => {
    const user = userEvent.setup();
    render(
      <House3DImageInsertionProvider>
        <PendingToastHarness/>
      </House3DImageInsertionProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'preparar imagem'}));
    await user.click(screen.getByRole('button', {name: 'Inserir'}));

    expect(screen.getByText(/Abra o Canvas para habilitar a inserção/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Inserir'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Descartar'})).toBeInTheDocument();
  });

  it('mantém os botões Inserir e Descartar com a mesma largura', async () => {
    const user = userEvent.setup();
    render(
      <House3DImageInsertionProvider>
        <PendingToastHarness/>
      </House3DImageInsertionProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'preparar imagem'}));

    expect(screen.getByRole('button', {name: 'Inserir'})).toHaveClass('w-full');
    expect(screen.getByRole('button', {name: 'Descartar'})).toHaveClass('w-full');
  });

  it('informa que a captura fiel preserva a cor do viewer 3D', async () => {
    const user = userEvent.setup();
    render(
      <House3DImageInsertionProvider>
        <PendingToastHarness source='screenshot'/>
      </House3DImageInsertionProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'preparar imagem'}));

    expect(screen.getByText(/Captura fiel do viewer 3D, com a cor configurada/)).toBeInTheDocument();
  });

  it('insere a imagem no Canvas e remove o toast somente após sucesso', async () => {
    const user = userEvent.setup();
    const insertImageSnapshot = vi.fn().mockResolvedValue(true);
    render(
      <House3DImageInsertionProvider>
        <PendingToastHarness registerCanvas insertImageSnapshot={insertImageSnapshot}/>
      </House3DImageInsertionProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'preparar imagem'}));
    await user.click(screen.getByRole('button', {name: 'Inserir'}));

    await waitFor(() => {
      expect(screen.queryByRole('button', {name: 'Inserir'})).not.toBeInTheDocument();
    });
    expect(insertImageSnapshot).toHaveBeenCalledWith(
      'data:image/png;base64,illustrated-house',
      {storageUrl: '/manus-storage/temp/house-3d/illustration.png'},
    );
  });

  it('descarta a imagem somente quando Descartar é pressionado', async () => {
    const user = userEvent.setup();
    render(
      <House3DImageInsertionProvider>
        <PendingToastHarness/>
      </House3DImageInsertionProvider>,
    );

    await user.click(screen.getByRole('button', {name: 'preparar imagem'}));
    await user.click(screen.getByRole('button', {name: 'Descartar'}));

    expect(screen.queryByRole('status', {name: 'Imagem 3D pendente'})).not.toBeInTheDocument();
  });
});
