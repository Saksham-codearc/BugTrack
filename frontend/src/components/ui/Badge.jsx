import { cn } from '../../lib/cn';

export default function Badge({ children, className, dot, dotClassName }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        className
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} /> : null}
      {children}
    </span>
  );
}
