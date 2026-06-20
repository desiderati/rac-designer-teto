import {createElement, type ReactNode} from 'react';
import {renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {createEditorPorts, type EditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {RacEditorStoreProvider} from '@/bootstrap/editor-context.tsx';
import type {HouseType, HouseViewType} from '@/shared/types/house.ts';
import {useRacEditorHouseReadModel} from '@/components/rac-editor/hooks/useRacEditorHouseReadModel.ts';

function createWrapper(ports: EditorPorts) {
  return function wrapper({children}: { children: ReactNode }) {
    return createElement(RacEditorStoreProvider, {ports, children});
  };
}

function createPortsWithViewCounts(insertedViews: Partial<Record<HouseViewType, number>>): EditorPorts {
  const defaultPorts = createEditorPorts();
  return {
    ...defaultPorts,
    houseReadPort: {
      ...defaultPorts.houseReadPort,
      getCurrentHouseType: vi.fn((): HouseType => 'tipo6'),
      getFamilyName: vi.fn(() => 'Família Teste'),
      getSelectedPilotiHeights: vi.fn(() => [1, 1.5, 2]),
      getPilotis: vi.fn(() => ({})),
      getViewCount: vi.fn((viewType: HouseViewType) => ({
        current: insertedViews[viewType] ?? 0,
        max: 1,
      })),
    },
  };
}

describe('useRacEditorHouseReadModel.ts', () => {
  it('libera exportação quando existe ao menos uma vista de casa registrada', () => {
    const ports = createPortsWithViewCounts({top: 1});

    const {result} = renderHook(
      () => useRacEditorHouseReadModel(1),
      {wrapper: createWrapper(ports)},
    );

    expect(result.current.currentHouseType).toBe('tipo6');
    expect(result.current.frontViewCount).toEqual({current: 0, max: 1});
    expect(result.current.canExportPDF).toBe(true);
  });

  it('mantém exportação bloqueada quando nenhuma vista de casa foi registrada', () => {
    const ports = createPortsWithViewCounts({});

    const {result} = renderHook(
      () => useRacEditorHouseReadModel(1),
      {wrapper: createWrapper(ports)},
    );

    expect(result.current.canExportPDF).toBe(false);
  });
});
