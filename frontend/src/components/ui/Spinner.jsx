import { Bug, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function FullPageLoader({ label = 'Loading your workspace…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f7fb]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/25">
        <Bug className="h-7 w-7 text-white" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function SectionLoader({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-14 text-sm text-slate-500', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
      {label}
    </div>
  );
}
