import {IText} from 'fabric';

const installed = new WeakSet<IText>();

/** Fabric focuses its offscreen textarea when text editing begins. Keep that focus from scrolling the page. */
export function preventTextFocusScroll(text: IText): void {
  if (installed.has(text)) return;
  installed.add(text);
  const initialize = text.initHiddenTextarea.bind(text);
  text.initHiddenTextarea = () => {
    initialize();
    const textarea = text.hiddenTextarea;
    if (!textarea) return;
    const focus = textarea.focus.bind(textarea);
    textarea.focus = () => focus({preventScroll: true});
  };
}
