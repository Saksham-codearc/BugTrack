import { cn } from '../../lib/cn';

export default function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 text-center',
        compact ? 'py-8' : 'py-16',
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
