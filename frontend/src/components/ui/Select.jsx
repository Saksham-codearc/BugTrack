import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const Select = forwardRef(function Select(
  { label, error, hint, className, containerClassName, id, children, required, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={selectId} className="label">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'input appearance-none pr-9',
            error && 'border-red-300 focus:border-red-400 focus:ring-red-500/10',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

export default Select;
