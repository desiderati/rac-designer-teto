/** Nome visível junto ao alvo de toque, sem ocupar o botão central do radial. */
export function RadialItemLabel({side, children}: {
  side: 'left' | 'right'; children: string;
}) {
  return <span aria-hidden='true' data-radial-label
    className={`absolute top-1/2 w-max max-w-[13rem] -translate-y-1/2 whitespace-nowrap rounded-md bg-white/95 px-2 py-1 text-xs font-medium leading-4 text-slate-700 ${side === 'left' ? 'left-full ml-2 text-left' : 'right-full mr-2 text-right'}`}
    style={{marginTop: 'var(--radial-label-offset, 0px)'}}>
    {children}
  </span>;
}
