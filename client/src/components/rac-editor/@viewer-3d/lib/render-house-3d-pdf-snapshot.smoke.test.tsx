import {forwardRef, useImperativeHandle} from 'react';
import {describe, expect, it, vi} from 'vitest';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import {renderHouse3DPdfSnapshotImageDataUrl} from './render-house-3d-pdf-snapshot.tsx';

const capture = vi.hoisted(() => ({props: null as Record<string, unknown> | null}));

vi.mock('@/components/rac-editor/@viewer-3d/ui/House3DPdfSnapshot.tsx', () => ({
  House3DPdfSnapshot: forwardRef((props: Record<string, unknown>, ref) => {
    capture.props = props;
    useImperativeHandle(ref, () => ({captureImageDataUrl: async () => 'data:image/png;base64,house_2'}));
    return <div data-testid='offscreen-snapshot'/>;
  }),
}));

describe('renderHouse3DPdfSnapshotImageDataUrl', () => {
  it('captura o documento solicitado e desmonta o host temporário', async () => {
    const initialChildren = document.body.childElementCount;
    const houseDocument = {house: {id: 'house_2'}} as HouseDrawingDocument;

    await expect(renderHouse3DPdfSnapshotImageDataUrl(houseDocument, 'persisted_house_2'))
      .resolves.toBe('data:image/png;base64,house_2');
    expect(capture.props).toMatchObject({document: houseDocument, activeHouseId: 'persisted_house_2'});
    expect(document.body.childElementCount).toBe(initialChildren);
  });
});
