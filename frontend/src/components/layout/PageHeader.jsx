import { cn } from '../../lib/cn';
import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, description, actions, breadcrumbs, className, children }) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs ? <div className="mb-3"><Breadcrumbs items={breadcrumbs} /></div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
            {title}
          </h1>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
