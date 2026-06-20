interface HeightButtonClassesParams {
  height: number;
  clickedHeight: number | null;
  tempHeight: number;
  compact?: boolean;
}

/**
 * Resolve classes do botão de altura do editor de piloti.
 */
export function getPilotiHeightButtonClasses({
  height,
  clickedHeight,
  tempHeight,
  compact = false,
}: HeightButtonClassesParams): string {
  const isSelected = clickedHeight === height || (clickedHeight === null && tempHeight === height);
  const sizeClasses = compact ? 'h-12 w-12 rounded-lg text-base' : 'h-16 w-16 rounded-2xl text-lg';
  return isSelected
    ? `${sizeClasses} border border-primary bg-primary text-primary-foreground font-semibold flex items-center justify-center shadow-sm`
    : `${sizeClasses} border border-transparent bg-primary/10 text-foreground font-semibold flex items-center justify-center hover:bg-primary/20`;
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
