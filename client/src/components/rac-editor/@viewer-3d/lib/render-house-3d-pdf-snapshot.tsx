import {createElement, createRef} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import {House3DPdfSnapshot} from '@/components/rac-editor/@viewer-3d/ui/House3DPdfSnapshot.tsx';

/** Captura a casa salva sem ativá-la no editor nem exigir que a modal 3D esteja aberta. */
export async function renderHouse3DPdfSnapshotImageDataUrl(
  document: HouseDrawingDocument,
  activeHouseId: string = document.house.id,
): Promise<string | null> {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  const snapshotRef = createRef<House3DPdfSnapshotHandle>();

  try {
    flushSync(() => root.render(createElement(House3DPdfSnapshot, {
      ref: snapshotRef,
      activeHouseId,
      document,
    })));
    return await snapshotRef.current?.captureImageDataUrl() ?? null;
  } finally {
    root.unmount();
    container.remove();
  }
}
