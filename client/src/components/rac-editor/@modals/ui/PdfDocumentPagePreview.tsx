import {useEffect, useRef, useState} from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfDocumentPagePreviewProps {
  pdfUrl: string;
  page: number;
  zoom: number;
}

type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;
type PdfRenderTask = {cancel: () => void; promise: Promise<unknown>};

export function PdfDocumentPagePreview({pdfUrl, page, zoom}: PdfDocumentPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const documentRef = useRef<PdfDocument | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', {alpha: false});
    if (!canvas || !context) {
      setErrorMessage('Não foi possível preparar a área de prévia do PDF.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;

    const loadingTask = pdfjs.getDocument({url: pdfUrl});

    void loadingTask.promise
      .then(async (pdfDocument) => {
        if (disposed) {
          await pdfDocument.cleanup();
          return;
        }

        documentRef.current = pdfDocument;
        const pdfPage = await pdfDocument.getPage(page);
        if (disposed) return;

        const devicePixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({scale: (zoom / 100) * devicePixelRatio});
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        canvas.style.width = `${Math.ceil(viewport.width / devicePixelRatio)}px`;
        canvas.style.height = `${Math.ceil(viewport.height / devicePixelRatio)}px`;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderTask = pdfPage.render({canvas, canvasContext: context, viewport});
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!disposed) setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (disposed || (error instanceof Error && error.name === 'RenderingCancelledException')) return;
        console.error('[PdfDocumentPagePreview] Falha ao renderizar página:', error);
        setErrorMessage('Não foi possível renderizar esta página da prévia.');
        setIsLoading(false);
      });

    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      void documentRef.current?.cleanup();
      documentRef.current = null;
      void loadingTask.destroy();
    };
  }, [page, pdfUrl, zoom]);

  return (
    <div
      className='relative flex min-h-[360px] w-full items-start justify-center overflow-auto bg-slate-800 p-4 sm:min-h-[68vh]'
      data-testid='pdf-preview-surface'
      title='Prévia do PDF da RAC'
    >
      <canvas ref={canvasRef} className='block max-w-none bg-white shadow-xl' data-testid='pdf-preview-canvas'/>
      {isLoading ? (
        <div className='absolute inset-0 grid place-items-center bg-slate-800/75 px-6 text-center text-sm font-semibold text-white' data-testid='pdf-preview-loading'>
          Renderizando página {page}…
        </div>
      ) : null}
      {errorMessage ? (
        <div role='alert' className='absolute inset-x-4 top-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
