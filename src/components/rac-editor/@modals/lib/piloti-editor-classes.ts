interface HeightButtonClassesParams {
  height: number;
  clickedHeight: number | null;
  tempHeight: number;
}

/**
 * Resolve classes do botão de altura do editor de piloti.
 */
export function getPilotiHeightButtonClasses({
  height,
  clickedHeight,
  tempHeight,
}: HeightButtonClassesParams): string {
  const isSelected = clickedHeight === height || (clickedHeight === null && tempHeight === height);
  return isSelected
    ? 'h-16 w-16 rounded-2xl border border-primary bg-primary text-primary-foreground text-lg font-semibold flex items-center justify-center shadow-sm'
    : 'h-16 w-16 rounded-2xl border border-transparent bg-primary/10 text-foreground text-lg font-semibold flex items-center justify-center hover:bg-primary/20';
}

/**
 * Resolve classes do botão de contraventamento do editor de piloti.
 */
export function getPilotiContraventamentoButtonClasses(isActive: boolean, isDisabled: boolean): string {
  const baseClasses =
    'h-12 w-12 shrink-0 rounded-lg border border-transparent p-0 flex items-center justify-center transition-colors';

  if (isDisabled) {
    return `${baseClasses} bg-primary/10 text-muted-foreground opacity-50 cursor-not-allowed`;
  }

  return isActive
    ? `${baseClasses} bg-primary text-primary-foreground hover:bg-primary/90`
    : `${baseClasses} bg-primary/10 text-foreground hover:bg-primary/20`;
}
