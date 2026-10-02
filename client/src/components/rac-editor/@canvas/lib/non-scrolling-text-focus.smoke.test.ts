import {describe, expect, it, vi} from 'vitest';
import type {IText} from 'fabric';
import {preventTextFocusScroll} from './non-scrolling-text-focus.ts';

describe('foco do texto livre', () => {
  it('foca o textarea interno do Fabric sem deslocar a viewport do navegador', () => {
    const focus = vi.fn();
    const textarea = {focus};
    const text = {
      hiddenTextarea: null,
      initHiddenTextarea() { this.hiddenTextarea = textarea; },
    } as unknown as IText;

    preventTextFocusScroll(text);
    preventTextFocusScroll(text);
    text.initHiddenTextarea();
    text.hiddenTextarea?.focus();

    expect(focus).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({preventScroll: true});
  });
});
