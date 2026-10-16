/** Aguarda o React abrir as seções e renderizar as mensagens antes de focar. */
export function focusFirstInvalidField(form: HTMLFormElement): void {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const field = form.querySelector<HTMLElement>('[aria-invalid="true"]:not([disabled])');
    if (!field) return;
    field.scrollIntoView?.({block: 'center', behavior: 'smooth'});
    field.focus({preventScroll: true});
  }));
}
