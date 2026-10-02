import {render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PdfDocumentPagePreview} from './PdfDocumentPagePreview.tsx';

const pdfMocks = vi.hoisted(() => ({getDocument: vi.fn()}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {workerSrc: ''},
  getDocument: pdfMocks.getDocument,
}));

describe('PdfDocumentPagePreview', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({clearRect: vi.fn()} as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    pdfMocks.getDocument.mockReset();
  });

  it('reutiliza o documento carregado ao mudar zoom e ajuste, cancelando apenas a renderização anterior', async () => {
    const renderTasks: Array<{cancel: ReturnType<typeof vi.fn>; resolve: () => void}> = [];
    const page = {
      getViewport: vi.fn(() => ({width: 842, height: 595})),
      render: vi.fn(() => {
        let resolve = () => {};
        let reject = (_error: Error) => {};
        const promise = new Promise<void>((complete, fail) => { resolve = complete; reject = fail; });
        const cancel = vi.fn(() => reject(Object.assign(new Error('render cancelado'), {name: 'RenderingCancelledException'})));
        const task = {cancel, resolve};
        renderTasks.push(task);
        return {promise, cancel: task.cancel};
      }),
    };
    const document = {getPage: vi.fn(async () => page)};
    const destroy = vi.fn(async () => {});
    pdfMocks.getDocument.mockReturnValue({promise: Promise.resolve(document), destroy});

    const {rerender, unmount} = render(
      <PdfDocumentPagePreview pdfUrl='blob:rac-preview' pageNumber={1} pageCount={2} zoom={100}/>,
    );
    await waitFor(() => expect(page.render).toHaveBeenCalledTimes(1));

    rerender(<PdfDocumentPagePreview pdfUrl='blob:rac-preview' pageNumber={1} pageCount={2} zoom={110}/>);
    await waitFor(() => expect(page.render).toHaveBeenCalledTimes(2));
    expect(renderTasks[0].cancel).toHaveBeenCalledTimes(1);

    rerender(<PdfDocumentPagePreview pdfUrl='blob:rac-preview' pageNumber={1} pageCount={2} zoom={110} fitToContainer/>);
    expect(pdfMocks.getDocument).toHaveBeenCalledTimes(1);
    expect(page.render).toHaveBeenCalledTimes(2);

    renderTasks[1].resolve();
    await waitFor(() => expect(screen.queryByTestId('pdf-preview-loading')).not.toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
