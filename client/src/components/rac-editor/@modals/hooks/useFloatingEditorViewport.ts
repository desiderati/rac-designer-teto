import {useEffect, useState} from 'react';

function readViewport() {
  const viewport = window.visualViewport;
  return {
    height: viewport?.height ?? window.innerHeight,
    bottom: Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0)),
  };
}

/** A viewport visual encolhe com o teclado mesmo quando a janela mantém sua altura. */
export function useFloatingEditorViewport(isOpen: boolean) {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    if (!isOpen) return;
    const visualViewport = window.visualViewport;
    const update = () => setViewport(readViewport());
    update();
    window.addEventListener('resize', update);
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
    };
  }, [isOpen]);

  return viewport;
}
