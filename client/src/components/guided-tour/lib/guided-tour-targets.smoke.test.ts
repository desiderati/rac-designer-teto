import {beforeEach, describe, expect, it} from 'vitest';
import {getRenderedGuidedTourTarget, getVisibleTargetRect} from '@/components/guided-tour/lib/guided-tour-targets.ts';

function createTarget(attributes: Record<string, string>, visible: boolean): HTMLElement {
  const target = document.createElement('button');
  Object.entries(attributes).forEach(([name, value]) => target.setAttribute(name, value));
  Object.defineProperty(target, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: visible ? 20 : 0,
      top: visible ? 30 : 0,
      right: visible ? 60 : 0,
      bottom: visible ? 70 : 0,
      width: visible ? 40 : 0,
      height: visible ? 40 : 0,
      x: visible ? 20 : 0,
      y: visible ? 30 : 0,
      toJSON: () => ({}),
    }),
  });
  document.body.appendChild(target);
  return target;
}

describe('guided-tour-targets', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('uses a visible alias when the primary target exists but is not visible', () => {
    createTarget({'data-guided-tour-id': 'rac-export-pdf'}, false);
    createTarget({'data-guided-tour-aliases': 'rac-export-pdf rac-view-3d'}, true);

    const rect = getVisibleTargetRect('rac-export-pdf');

    expect(rect).toEqual(expect.objectContaining({left: 20, top: 30, width: 40, height: 40}));
  });

  it('encontra o alvo mobile abaixo da viewport sem confundir com o alvo desktop oculto', () => {
    createTarget({'data-guided-tour-id': 'rac-house-status'}, false);
    const mobile = createTarget({'data-guided-tour-id': 'rac-house-status'}, true);
    Object.defineProperty(mobile, 'getBoundingClientRect', {configurable: true, value: () => new DOMRect(20, window.innerHeight + 100, 40, 40)});
    expect(getVisibleTargetRect('rac-house-status')).toBeNull();
    expect(getRenderedGuidedTourTarget('rac-house-status')).toBe(mobile);
  });
});
