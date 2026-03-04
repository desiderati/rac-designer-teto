import {describe, expect, it} from 'vitest';
import {buildHouseElementsFromCanvasModel} from '@/components/rac-editor/lib/3d/house-elements-parser.ts';

describe('house-elements-parser.ts', () => {
  it('maps tipo6 front/back faces according to selected front side', () => {
    const elements = buildHouseElementsFromCanvasModel('tipo6', 'bottom', null);
    const frontDoor = elements.find((o) => o.id === 'canvas-front-door');
    const backWindow = elements.find((o) => o.id === 'canvas-back-window');

    expect(frontDoor?.face).toBe('back');
    expect(backWindow?.face).toBe('front');
  });

  it('maps tipo3 open side from assignment with right-side fallback', () => {
    const elements = buildHouseElementsFromCanvasModel('tipo3', null, 'left');

    const door = elements.find((o) => o.type === 'door');
    expect(door?.face).toBe('left');

    const fallback = buildHouseElementsFromCanvasModel('tipo3');
    const fallbackDoor = fallback.find((o) => o.type === 'door');
    expect(fallbackDoor?.face).toBe('right');
  });
});


