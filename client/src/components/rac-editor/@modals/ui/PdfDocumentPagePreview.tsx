import {useEffect, useRef, useState} from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfDocumentPagePreviewProps {
  pdfUrl: string;
  pageCount: number;
  zoom: number;
}

type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;
type PdfRenderTask = {cancel: () => void; promise: Promise<unknown>};

export function PdfDocumentPagePreview({pdfUrl, pageCount, zoom}: PdfDocumentPagePreviewProps) {
  const canvasRefs = useRef(new Map<number, HTMLCanvasElement>());
  const documentRef = useRef<PdfDocument | null>(null);
  const renderTasksRef = useRef<PdfRenderTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const safePageCount = Math.max(1, pageCount);

  useEffect(() => {
    let disposed = false;
    setIsLoading(true);
    setErrorMessage(null);
    renderTasksRef.current.forEach((task) => task.cancel());
    renderTasksRef.current = [];

    const loadingTask = pdfjs.getDocument({url: pdfUrl});

    void loadingTask.promise
      .then(async (pdfDocument) => {
        if (disposed) {
          await pdfDocument.cleanup();
          return;
        }

        documentRef.current = pdfDocument;
        const devicePixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= safePageCount; pageNumber += 1) {
          const canvas = canvasRefs.current.get(pageNumber);
          if (!canvas) continue;
          const context = canvas.getContext('2d', {alpha: false});
          if (!context) throw new Error('Não foi possível preparar a área de prévia do PDF.');

          const pdfPage = await pdfDocument.getPage(pageNumber);
          if (disposed) return;

          const viewport = pdfPage.getViewport({scale: (zoom / 100) * devicePixelRatio});
          canvas.width = Math.max(1, Math.ceil(viewport.width));
          canvas.height = Math.max(1, Math.ceil(viewport.height));
          canvas.style.width = `${Math.ceil(viewport.width / devicePixelRatio)}px`;
          canvas.style.height = `${Math.ceil(viewport.height / devicePixelRatio)}px`;
          context.clearRect(0, 0, canvas.width, canvas.height);

          const renderTask = pdfPage.render({canvas, canvasContext: context, viewport});
          renderTasksRef.current.push(renderTask);
          await renderTask.promise;
          if (disposed) return;
        }

        if (!disposed) setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (disposed || (error instanceof Error && error.name === 'RenderingCancelledException')) return;
        console.error('[PdfDocumentPagePreview] Falha ao renderizar prévia:', error);
        setErrorMessage('Não foi possível renderizar a prévia do PDF.');
        setIsLoading(false);
      });

    return () => {
      disposed = true;
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current = [];
      documentRef.current?.cleanup();
      documentRef.current = null;
      void loadingTask.destroy();
    };
  }, [pdfUrl, safePageCount, zoom]);

  return (
    <div
      className='relative flex h-[62vh] min-h-[360px] w-full flex-col items-center gap-4 overflow-auto bg-slate-800 p-4 sm:h-[68vh]'
      data-testid='pdf-preview-surface'
      title='Prévia do PDF da RAC'
    >
      {Array.from({length: safePageCount}, (_, index) => {
        const pageNumber = index + 1;
        return (
          <canvas
            key={pageNumber}
            ref={(element) => {
              if (element) canvasRefs.current.set(pageNumber, element);
              else canvasRefs.current.delete(pageNumber);
            }}
            className='block max-w-none bg-white shadow-xl'
            data-testid={`pdf-preview-canvas-${pageNumber}`}
          />
        );
      })}
      {isLoading ? (
        <div className='absolute inset-0 grid place-items-center bg-slate-800/75 px-6 text-center text-sm font-semibold text-white' data-testid='pdf-preview-loading'>
          Renderizando prévia…
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
