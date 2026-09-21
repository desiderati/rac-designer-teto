import type {ReactNode} from 'react';

export function FormSectionHeader({
  number,
  title,
  dirty = false,
  children,
}: {
  number: string;
  title: string;
  dirty?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white'>
        {number}
      </span>
      <span role='heading' aria-level={2} className='min-w-0 flex-1 text-left text-base font-semibold text-slate-950'>
        {title}
      </span>
      {dirty ? (
        <span
          data-testid='section-dirty-indicator'
          title='Alterações não salvas'
          aria-label='Alterações não salvas'
          className='mr-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 ring-4 ring-amber-50'
        />
      ) : null}
      {children}
    </>
  );
}
